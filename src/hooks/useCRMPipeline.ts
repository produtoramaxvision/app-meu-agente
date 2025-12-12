import { useState, useMemo, useCallback } from 'react';
import { useEvolutionContacts } from './useEvolutionContacts';
import { useSDRAgent } from './useSDRAgent';
import { EvolutionContact, LeadStatus } from '@/types/sdr';
import { toast } from 'sonner';

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
}

export function useCRMPipeline() {
  const { instance } = useSDRAgent();
  
  const { 
    contacts, 
    loading, 
    updateContact, 
    refresh 
  } = useEvolutionContacts({
    instanceId: instance?.id || '',
    instanceName: instance?.instance_name || '',
    evolutionApiUrl: import.meta.env.VITE_EVOLUTION_API_URL || 'https://evolution-api.com',
    evolutionApiKey: import.meta.env.VITE_EVOLUTION_API_KEY || '',
    onlyContacts: true,
    autoRefresh: true
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

    return {
      totalValue: 0, // TODO: Adicionar campo de valor ao contato no futuro
      totalLeads: pipelineContacts.length,
      byStatus
    };
  }, [pipelineContacts]);

  const moveCard = useCallback(async (contactId: string, newStatus: LeadStatus) => {
    // Otimisticamente atualizar UI (será tratado pelo updateContact que atualiza estado local)
    try {
      await updateContact(contactId, { crm_lead_status: newStatus });
      
      // Se moveu para 'ganho', poderia disparar confetes ou algo assim (retornar flag)
      if (newStatus === 'ganho') {
        toast.success('Lead marcado como Ganho! 🎉');
      }
    } catch (error) {
      console.error('Erro ao mover card:', error);
      toast.error('Erro ao atualizar status do lead');
    }
  }, [updateContact]);

  return {
    columns,
    metrics,
    loading,
    moveCard,
    refresh
  };
}

