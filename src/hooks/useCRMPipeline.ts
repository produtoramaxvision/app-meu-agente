import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCRMContacts } from './useCRMContacts';
import { useSDRAgent } from './useSDRAgent';
import { useAuth } from '@/contexts/AuthContext';
import { EvolutionContact, LeadStatus } from '@/types/sdr';
import { toast } from 'sonner';
import { useActivityLog } from './useActivityLog';
import { calculateLeadScore } from '@/utils/leadScoring';
import { useCustomFieldValues } from './useCustomFields';

export const CRM_COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'novo', label: 'Novo', color: 'bg-blue-500' },
  { id: 'contatado', label: 'Contatado', color: 'bg-indigo-500' },
  { id: 'qualificado', label: 'Qualificado', color: 'bg-purple-500' },
  { id: 'proposta', label: 'Proposta', color: 'bg-amber-500' },
  { id: 'negociando', label: 'Em Negociação', color: 'bg-orange-500' },
  { id: 'ganho', label: 'Ganho', color: 'bg-green-500' },
  { id: 'perdido', label: 'Perdido', color: 'bg-red-500' },
];

export interface PipelineMetrics {
  totalValue: number;
  totalLeads: number;
  byStatus: Record<LeadStatus, number>;
  winRate: number; // Taxa de conversão (%)
  avgDealSize: number; // Ticket médio
  salesVelocity: number; // Dias médios para fechar
  pipelineValue: number; // Valor em aberto (excluindo ganho/perdido)
  qualificationRate: number; // % de qualificação
}

export function useCRMPipeline() {
  const { instance } = useSDRAgent();
  const { cliente } = useAuth();
  
  // Hook para registrar atividades (sem contactId específico)
  const { logStatusChange } = useActivityLog(null);
  
  // ⚡ OTIMIZAÇÃO: Usar novo hook com React Query
  const { 
    contacts, 
    loading, 
    updateContact, 
    refresh 
  } = useCRMContacts({
    instanceId: instance?.id || '',
    userPhone: cliente?.phone || null,
    enabled: !!instance?.id && !!cliente?.phone,
  });

  // Filtrar apenas contatos que têm status ou assumir 'novo' para todos?
  // Por enquanto, vamos assumir que se não tem status, é 'novo' se tiver alguma interação ou se quisermos mostrar todos.
  // Mas para o Kanban, geralmente queremos apenas os que estão no pipeline.
  // Vamos considerar 'novo' como default para contatos sem status definido.
  
  const pipelineContacts = useMemo(() => {
    return contacts.map(c => ({
      ...c,
      crm_lead_status: c.crm_lead_status || 'novo'
    }));
  }, [contacts]);

  const columns = useMemo(() => {
    const grouped = pipelineContacts.reduce((acc, contact) => {
      const status = contact.crm_lead_status as LeadStatus;
      if (!acc[status]) acc[status] = [];
      acc[status].push(contact);
      return acc;
    }, {} as Record<LeadStatus, EvolutionContact[]>);

    return CRM_COLUMNS.map(col => ({
      ...col,
      contacts: grouped[col.id] || []
    }));
  }, [pipelineContacts]);

  const metrics = useMemo<PipelineMetrics>(() => {
    const byStatus = pipelineContacts.reduce((acc, c) => {
      const status = c.crm_lead_status as LeadStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<LeadStatus, number>);

    // Cálculos avançados
    const ganhos = byStatus['ganho'] || 0;
    const perdidos = byStatus['perdido'] || 0;
    const finalizados = ganhos + perdidos;
    const winRate = finalizados > 0 ? Math.round((ganhos / finalizados) * 100) : 0;

    // Valor total estimado
    const totalValue = pipelineContacts.reduce((sum, c) => sum + (c.crm_estimated_value || 0), 0);

    // Valor do pipeline (leads em aberto)
    const pipelineValue = pipelineContacts
      .filter(c => !['ganho', 'perdido'].includes(c.crm_lead_status || ''))
      .reduce((sum, c) => sum + (c.crm_estimated_value || 0), 0);

    // Ticket médio dos deals ganhos
    const ganhosComValor = pipelineContacts.filter(c => c.crm_lead_status === 'ganho' && c.crm_estimated_value > 0);
    const avgDealSize = ganhosComValor.length > 0 
      ? Math.round(ganhosComValor.reduce((sum, c) => sum + (c.crm_estimated_value || 0), 0) / ganhosComValor.length)
      : 0;

    // Taxa de qualificação (% que passou de novo para qualificado ou além)
    const qualificados = (byStatus['qualificado'] || 0) + (byStatus['proposta'] || 0) + 
                         (byStatus['negociando'] || 0) + ganhos;
    const qualificationRate = pipelineContacts.length > 0 
      ? Math.round((qualificados / pipelineContacts.length) * 100) 
      : 0;

    // Sales Velocity: tempo médio entre created_at e crm_closed_at para leads fechados
    const leadsFechados = pipelineContacts.filter(c => 
      ['ganho', 'perdido'].includes(c.crm_lead_status || '') && c.crm_closed_at
    );
    
    let salesVelocity = 0;
    if (leadsFechados.length > 0) {
      const totalDias = leadsFechados.reduce((sum, c) => {
        const created = new Date(c.created_at);
        const closed = new Date(c.crm_closed_at!);
        const diffMs = closed.getTime() - created.getTime();
        const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        return sum + diffDays;
      }, 0);
      salesVelocity = Math.round(totalDias / leadsFechados.length);
    }

    return {
      totalValue,
      totalLeads: pipelineContacts.length,
      byStatus,
      winRate,
      avgDealSize,
      salesVelocity,
      pipelineValue,
      qualificationRate
    };
  }, [pipelineContacts]);

  const moveCard = useCallback(async (
    contactId: string, 
    newStatus: LeadStatus,
    lossReason?: string,
    lossReasonDetails?: string
  ) => {
    // Obter status anterior para registrar no log
    const contact = pipelineContacts.find(c => c.id === contactId);
    const oldStatus = contact?.crm_lead_status || 'novo';
    
    try {
      // Preparar atualização com lógica de crm_closed_at
      const updateData: Partial<EvolutionContact> = { 
        crm_lead_status: newStatus 
      };

      // Se moveu para ganho ou perdido, registrar data de fechamento
      if (newStatus === 'ganho' || newStatus === 'perdido') {
        updateData.crm_closed_at = new Date().toISOString();
        
        // Se for perdido e tiver motivo, adicionar
        if (newStatus === 'perdido' && lossReason) {
          updateData.crm_loss_reason = lossReason;
          updateData.crm_loss_reason_details = lossReasonDetails || null;
        }
      } 
      // Se estava em ganho/perdido e voltou para outro status, limpar data de fechamento e motivo de perda
      else {
        updateData.crm_closed_at = null;
        updateData.crm_loss_reason = null;
        updateData.crm_loss_reason_details = null;
      }

      // ⚡ NOVO: Calcular score atualizado após mudança de status
      // Nota: Não temos acesso aos custom fields aqui, então passamos 0
      // O score será recalculado mais precisamente quando custom fields mudarem
      if (contact) {
        const updatedContact = { ...contact, ...updateData };
        const newScore = calculateLeadScore(updatedContact, 0);
        updateData.crm_lead_score = newScore;
        (updateData as Record<string, unknown>).crm_score_updated_at = new Date().toISOString();
      }

      // ⚡ NOVO (Fase 3.5): Auto-setar probabilidade de fechamento se não houver valor customizado
      // Se o contato não tem probabilidade customizada (null), setar default do novo status
      if (contact && contact.crm_win_probability === null) {
        const DEFAULT_WIN_PROBABILITY: Record<LeadStatus, number> = {
          novo: 10,
          contatado: 20,
          qualificado: 40,
          proposta: 60,
          negociando: 80,
          ganho: 100,
          perdido: 0,
        };
        updateData.crm_win_probability = DEFAULT_WIN_PROBABILITY[newStatus];
      }

      await updateContact(contactId, updateData);
      
      // Registrar atividade de mudança de status
      await logStatusChange(contactId, oldStatus, newStatus);
      
      // Feedback visual
      if (newStatus === 'ganho') {
        toast.success('Lead marcado como Ganho! 🎉');
      } else if (newStatus === 'perdido') {
        toast.error('Lead marcado como Perdido');
      }
    } catch (error) {
      console.error('Erro ao mover card:', error);
      toast.error('Erro ao atualizar status do lead');
    }
  }, [updateContact, logStatusChange, pipelineContacts]);

  return {
    columns,
    metrics,
    loading,
    moveCard,
    refresh,
    updateContact,
  };
}

