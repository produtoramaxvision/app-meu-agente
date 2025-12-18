import { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { CRMLayout } from '@/components/crm/CRMLayout';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { DashboardView } from '@/components/crm/DashboardView';
import { LeadDetailsSheet } from '@/components/crm/LeadDetailsSheet';
import { CreateLeadDialog } from '@/components/crm/CreateLeadDialog';
import { LossReasonDialog, type LossReasonId } from '@/components/crm/LossReasonDialog';
import { SendWhatsAppDialog } from '@/components/crm/SendWhatsAppDialog';
import { EvolutionContact, LeadStatus } from '@/types/sdr';
import { useCRMPipeline } from '@/hooks/useCRMPipeline';
import { useLeadFilters, type LeadFilters } from '@/hooks/useLeadFilters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Loader2, MessageCircle, Sparkles, ArrowUpRight } from 'lucide-react';
import { ProtectedFeature } from '@/components/ProtectedFeature';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// ⚡ OTIMIZAÇÃO: HeaderStats extraído como componente separado com memo
interface HeaderStatsProps {
  metrics: {
    totalLeads: number;
    winRate: number;
    pipelineValue: number;
    salesVelocity: number;
    qualificationRate: number;
  };
}

const HeaderStats = memo(function HeaderStats({ metrics }: HeaderStatsProps) {
  // Cores baseadas em benchmarks da indústria
  const getWinRateColor = (rate: number) => {
    if (rate >= 40) return 'text-green-600';
    if (rate >= 20) return 'text-amber-600';
    return 'text-red-600';
  };

  const getQualificationColor = (rate: number) => {
    if (rate >= 50) return 'text-green-600';
    if (rate >= 30) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="hidden lg:flex items-center gap-3 text-sm">
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs">Total de leads</span>
        <span className="font-semibold">{metrics.totalLeads}</span>
      </div>
      <Separator orientation="vertical" className="h-8" />
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs">Taxa de ganho</span>
        <span className={cn('font-semibold', getWinRateColor(metrics.winRate))}>
          {metrics.winRate}%
        </span>
      </div>
      <Separator orientation="vertical" className="h-8" />
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs">Valor do pipeline</span>
        <span className="font-semibold text-blue-600">
          R$ {(metrics.pipelineValue / 1000).toFixed(1)}k
        </span>
      </div>
      <Separator orientation="vertical" className="h-8" />
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs">Velocidade de vendas</span>
        <span className="font-semibold">{metrics.salesVelocity} dias</span>
      </div>
      <Separator orientation="vertical" className="h-8" />
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs">Taxa de qualificação</span>
        <span className={cn('font-semibold', getQualificationColor(metrics.qualificationRate))}>
          {metrics.qualificationRate}%
        </span>
      </div>
    </div>
  );
});

export default function CRM() {
  const [selectedContact, setSelectedContact] = useState<EvolutionContact | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'lista' | 'dashboard'>('kanban');
  const [search, setSearch] = useState('');
  const [lossReasonDialogOpen, setLossReasonDialogOpen] = useState(false);
  const [pendingLossMove, setPendingLossMove] = useState<{ contactId: string; contact: EvolutionContact } | null>(null);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [whatsappContact, setWhatsappContact] = useState<EvolutionContact | null>(null);
  const { cliente } = useAuth();
  const { metrics, loading, columns, moveCard, updateContact, refresh } = useCRMPipeline();
  const { filters, setFilter, clearFilters, applyPreset, activeFiltersCount, hasActiveFilters } = useLeadFilters();

  // Persistência por usuário
  useEffect(() => {
    if (!cliente?.phone) return;
    const stored = localStorage.getItem(`crm_view_${cliente.phone}`);
    if (stored === 'kanban' || stored === 'lista' || stored === 'dashboard') {
      setViewMode(stored);
    }
  }, [cliente?.phone]);

  // ⚡ OTIMIZAÇÃO: useCallback estabiliza referências de handlers
  const handleViewChange = useCallback((mode: 'kanban' | 'lista' | 'dashboard') => {
    setViewMode(mode);
    if (cliente?.phone) {
      localStorage.setItem(`crm_view_${cliente.phone}`, mode);
    }
  }, [cliente?.phone]);

  const recordInteraction = useCallback(async (contact: EvolutionContact) => {
    try {
      await updateContact(contact.id, {}, { recordInteraction: true });
    } catch (error) {
      console.error('Erro ao registrar interação do lead:', error);
    }
  }, [updateContact]);

  const handleCardClick = useCallback((contact: EvolutionContact) => {
    setSelectedContact(contact);
    setDetailsOpen(true);
    void recordInteraction(contact);
  }, [recordInteraction]);

  const handleCardEdit = useCallback((contact: EvolutionContact) => {
    // Por enquanto, abre o details sheet (que permite edição)
    // Futuramente pode abrir um dialog específico de edição
    setSelectedContact(contact);
    setDetailsOpen(true);
    toast.info('Modo de edição', {
      description: 'Edite os campos e clique em "Salvar" para atualizar o lead.',
    });
  }, []);

  const handleCardInteraction = useCallback((contact: EvolutionContact, type: 'message' | 'call') => {
    void recordInteraction(contact);
    
    if (type === 'message') {
      // Abrir dialog de enviar mensagem via WhatsApp
      setWhatsappContact(contact);
      setWhatsappDialogOpen(true);
    } else if (type === 'call') {
      // Futuramente pode abrir dialog de ligação ou iniciar chamada
      toast.info('Funcionalidade de chamada em breve!');
    }
  }, [recordInteraction]);

  const handleCardDelete = useCallback(async (contact: EvolutionContact) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o lead "${contact.push_name || contact.phone}"?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('evolution_contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;

      toast.success('Lead excluído', {
        description: `${contact.push_name || contact.phone} foi removido do CRM.`,
      });

      // Refresh para atualizar a lista
      await refresh();
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      toast.error('Erro ao excluir lead', {
        description: 'Não foi possível excluir o lead. Tente novamente.',
      });
    }
  }, [refresh]);

  const handleOpenChange = useCallback((open: boolean) => {
    setDetailsOpen(open);
    if (!open) {
      // Small delay to prevent flashing content while closing
      setTimeout(() => setSelectedContact(null), 300);
    }
  }, []);

  const handleOpenCreateLead = useCallback(() => {
    setCreateLeadOpen(true);
  }, []);

  // Interceptar movimento para "perdido" para coletar motivo
  const handleMoveCard = useCallback(async (contactId: string, newStatus: LeadStatus) => {
    const contact = columns.flatMap(c => c.contacts).find(c => c.id === contactId);
    
    if (newStatus === 'perdido' && contact) {
      // Abrir dialog para coletar motivo
      setPendingLossMove({ contactId, contact });
      setLossReasonDialogOpen(true);
    } else {
      // Movimento normal
      await moveCard(contactId, newStatus);
    }
  }, [columns, moveCard]);

  // Confirmar perda com motivo
  const handleConfirmLoss = useCallback(async (reason: LossReasonId, details?: string) => {
    if (!pendingLossMove) return;
    
    await moveCard(pendingLossMove.contactId, 'perdido', reason, details);
    setPendingLossMove(null);
  }, [pendingLossMove, moveCard]);

  // ⚡ OTIMIZAÇÃO: useCallback para handler de criação de lead
  const handleCreateLead = useCallback(async (data: {
    name?: string;
    phone?: string;
    email?: string;
    estimatedValue?: string;
    status?: LeadStatus;
    notes?: string;
  }) => {
    try {
      if (!data.name || !data.phone) {
        throw new Error('Nome e telefone são obrigatórios');
      }
      
      if (!cliente?.phone) {
        throw new Error('Telefone do usuário não encontrado');
      }

      // Buscar a instância ativa do usuário
      const { data: instances, error: instanceError } = await supabase
        .from('evolution_instances')
        .select('id')
        .eq('phone', cliente.phone)
        .eq('connection_status', 'connected')
        .limit(1)
        .single();

      if (instanceError || !instances) {
        throw new Error('Nenhuma instância conectada encontrada');
      }

      // Normalizar telefone (remover caracteres especiais)
      const normalizedPhone = data.phone.replace(/[^0-9]/g, '');
      const remoteJid = `${normalizedPhone}@s.whatsapp.net`;

      // Criar contato na tabela evolution_contacts
      const newContact = {
        instance_id: instances.id,
        phone: cliente.phone,
        remote_jid: remoteJid,
        push_name: data.name,
        profile_pic_url: null,
        is_group: false,
        is_saved: false,
        synced_at: new Date().toISOString(),
        sync_source: 'manual' as const,
        crm_notes: data.notes || null,
        crm_tags: [],
        crm_favorite: false,
        crm_last_interaction_at: new Date().toISOString(),
        crm_lead_status: data.status,
        crm_lead_score: 10, // Score inicial para leads manuais
        crm_estimated_value: data.estimatedValue ? parseFloat(data.estimatedValue) : null,
        crm_closed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('evolution_contacts')
        .insert([newContact]);

      if (insertError) {
        console.error('Error inserting contact:', insertError);
        throw insertError;
      }

      toast.success('Lead criado com sucesso!', {
        description: `${data.name} foi adicionado ao pipeline`,
      });

      // Recarregar dados do CRM
      if (refresh) {
        await refresh();
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Erro ao criar lead', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      throw error;
    }
  }, [cliente?.phone, refresh]);

  // ⚡ OTIMIZAÇÃO: useCallback para handler de exportação
  const handleExportCSV = useCallback(() => {
    try {
      // Preparar dados para exportação
      const dataToExport = columns.flatMap(col => 
        col.contacts.map(contact => ({
          'Nome': contact.push_name || contact.remote_jid.split('@')[0],
          'Telefone': contact.phone || '',
          'Status': col.label,
          'Score': contact.crm_lead_score || 0,
          'Valor Estimado (R$)': contact.crm_estimated_value 
            ? contact.crm_estimated_value.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            : '0,00',
          'Data de Fechamento': contact.crm_closed_at 
            ? format(new Date(contact.crm_closed_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
            : '',
          'Criado em': contact.created_at 
            ? format(new Date(contact.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
            : ''
        }))
      );

      // Criar CSV
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row] || '';
            // Escapar vírgulas e aspas
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `crm_pipeline_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Pipeline exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar pipeline');
    }
  }, [columns]);

  const listContacts = useMemo(() => {
    return columns.flatMap((col) =>
      col.contacts.map((contact) => ({ ...contact, __status: col.label, __statusId: col.id }))
    );
  }, [columns]);

  // Todos os contatos para métricas temporais (sem metadata extra)
  const allContacts = useMemo(() => {
    return columns.flatMap((col) => col.contacts);
  }, [columns]);

  const normalizedFilter = search.trim().toLowerCase();

  const filteredColumns = useMemo(() => {
    // Aplicar filtro de busca + filtros avançados
    const filtered = columns.map((col) => ({
      ...col,
      contacts: col.contacts.filter((c) => {
        // 1. Filtro de busca (nome ou telefone)
        const name = (c.push_name || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        const matchesSearch = !normalizedFilter || name.includes(normalizedFilter) || phone.includes(normalizedFilter);
        
        if (!matchesSearch) return false;

        // 2. Filtro de status (múltiplo)
        if (hasActiveFilters && filters.status.length > 0) {
          if (!filters.status.includes(c.crm_lead_status as LeadStatus)) return false;
        }

        // 3. Filtro de score (range)
        if (hasActiveFilters && (filters.scoreRange[0] !== 0 || filters.scoreRange[1] !== 100)) {
          const score = c.crm_lead_score || 0;
          if (score < filters.scoreRange[0] || score > filters.scoreRange[1]) return false;
        }

        // 4. Filtro de valor estimado (range em centavos)
        if (hasActiveFilters && (filters.valueRange[0] !== 0 || filters.valueRange[1] !== 1000000000)) {
          const value = c.crm_estimated_value || 0;
          if (value < filters.valueRange[0] || value > filters.valueRange[1]) return false;
        }

        // 5. Filtro de data de criação (range)
        if (hasActiveFilters && (filters.dateRange.from || filters.dateRange.to)) {
          const createdAt = new Date(c.created_at);
          if (filters.dateRange.from && createdAt < filters.dateRange.from) return false;
          if (filters.dateRange.to) {
            const endOfDay = new Date(filters.dateRange.to);
            endOfDay.setHours(23, 59, 59, 999);
            if (createdAt > endOfDay) return false;
          }
        }

        // 6. Filtro de tags (múltiplo)
        if (hasActiveFilters && filters.tags.length > 0) {
          const contactTags = c.crm_tags || [];
          const hasMatchingTag = filters.tags.some(tag => contactTags.includes(tag));
          if (!hasMatchingTag) return false;
        }

        // TODO: 7. Filtro de campos customizados (implementar quando necessário)
        // if (hasActiveFilters && Object.keys(filters.customFields).length > 0) {
        //   // Lógica de filtragem por custom fields
        // }

        return true;
      })
    }));

    return filtered;
  }, [columns, normalizedFilter, filters, hasActiveFilters]);

  const filteredListContacts = useMemo(() => {
    return listContacts.filter((c) => {
      // 1. Filtro de busca
      const name = (c.push_name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const matchesSearch = !normalizedFilter || name.includes(normalizedFilter) || phone.includes(normalizedFilter);
      
      if (!matchesSearch) return false;

      // 2. Aplicar mesmos filtros do Kanban
      if (hasActiveFilters && filters.status.length > 0) {
        if (!filters.status.includes(c.crm_lead_status as LeadStatus)) return false;
      }

      if (hasActiveFilters && (filters.scoreRange[0] !== 0 || filters.scoreRange[1] !== 100)) {
        const score = c.crm_lead_score || 0;
        if (score < filters.scoreRange[0] || score > filters.scoreRange[1]) return false;
      }

      if (hasActiveFilters && (filters.valueRange[0] !== 0 || filters.valueRange[1] !== 1000000000)) {
        const value = c.crm_estimated_value || 0;
        if (value < filters.valueRange[0] || value > filters.valueRange[1]) return false;
      }

      if (hasActiveFilters && (filters.dateRange.from || filters.dateRange.to)) {
        const createdAt = new Date(c.created_at);
        if (filters.dateRange.from && createdAt < filters.dateRange.from) return false;
        if (filters.dateRange.to) {
          const endOfDay = new Date(filters.dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (createdAt > endOfDay) return false;
        }
      }

      if (hasActiveFilters && filters.tags.length > 0) {
        const contactTags = c.crm_tags || [];
        const hasMatchingTag = filters.tags.some(tag => contactTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [listContacts, normalizedFilter, filters, hasActiveFilters]);

  // ⚡ OTIMIZAÇÃO: Memoizar referência do HeaderStats para evitar re-renders
  const headerStatsElement = useMemo(() => <HeaderStats metrics={metrics} />, [metrics]);

  return (
    <ProtectedFeature permission="canAccessSDRAgent" featureName="CRM de Vendas">
      <CRMLayout
        headerStats={headerStatsElement}
        viewMode={viewMode}
        onViewChange={handleViewChange}
        searchValue={search}
        onSearchChange={setSearch}
        onExport={handleExportCSV}
        onNewLead={handleOpenCreateLead}
        filters={filters}
        onFiltersChange={(newFilters) => {
          // Atualizar filtros um por um (setFilter espera chave-valor individual)
          Object.entries(newFilters).forEach(([key, value]) => {
            setFilter(key as keyof LeadFilters, value as LeadFilters[keyof LeadFilters]);
          });
        }}
        onClearFilters={clearFilters}
        onApplyPreset={applyPreset}
        activeFiltersCount={activeFiltersCount}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* ⚡ OTIMIZAÇÃO: Removido AnimatePresence - causa layout thrashing durante drag */}
            {viewMode === 'dashboard' && (
              <div className="h-full animate-in fade-in duration-200">
                <DashboardView metrics={metrics} contacts={allContacts} />
              </div>
            )}
            {viewMode === 'kanban' && (
              <div className="h-full">
                <KanbanBoard 
                  onCardClick={handleCardClick} 
                  onCardEdit={handleCardEdit}
                  onCardDelete={handleCardDelete}
                  columns={filteredColumns} 
                  moveCard={handleMoveCard}
                  onCardInteraction={handleCardInteraction}
                />
              </div>
            )}
            {viewMode === 'lista' && (
              <div className="h-full animate-in fade-in duration-200">
                <div className="p-6 h-full overflow-y-auto">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredListContacts.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Nenhum lead encontrado.
                  </CardContent>
                </Card>
              )}
              {filteredListContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-border/60 hover:border-primary/40 bg-gradient-to-br from-background to-muted/30"
                  onClick={() => handleCardClick(contact)}
                >
                  <CardHeader className="pb-2 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                          <AvatarImage src={contact.profile_pic_url || undefined} />
                          <AvatarFallback>{contact.push_name?.slice(0, 2).toUpperCase() || '??'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="flex items-center gap-2 text-base leading-tight">
                            <span className="truncate">{contact.push_name || contact.remote_jid.split('@')[0]}</span>
                            <Sparkles className="h-4 w-4 text-amber-500 opacity-70" />
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
                              {contact.__status}
                            </Badge>
                            <span className="truncate text-muted-foreground">{contact.phone}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[11px] h-6 px-2">
                        Score {contact.crm_lead_score || 0}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      <span className="truncate">
                        {contact.crm_tags?.slice(0, 3).join(', ') || 'Sem tags'}
                      </span>
                    </div>
                    <Separator className="opacity-60" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="h-6 px-2 text-[11px]">
                          Última interação
                        </Badge>
                        <span className="truncate">
                          {contact.crm_last_interaction_at
                            ? new Date(contact.crm_last_interaction_at).toLocaleDateString('pt-BR')
                            : 'Sem registro'}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary transition" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
                </div>
              </div>
            )}
          </>
        )}

        <LeadDetailsSheet 
          contact={selectedContact} 
          open={detailsOpen} 
          onOpenChange={handleOpenChange}
          onUpdateContact={updateContact}
        />

        <CreateLeadDialog 
          open={createLeadOpen}
          onOpenChange={setCreateLeadOpen}
          onCreateLead={handleCreateLead}
        />

        <LossReasonDialog
          open={lossReasonDialogOpen}
          onOpenChange={setLossReasonDialogOpen}
          leadName={pendingLossMove?.contact.push_name || 'este lead'}
          onConfirm={handleConfirmLoss}
        />

        <SendWhatsAppDialog
          open={whatsappDialogOpen}
          onOpenChange={setWhatsappDialogOpen}
          contactName={whatsappContact?.push_name || whatsappContact?.remote_jid.split('@')[0] || ''}
          contactPhone={whatsappContact?.phone || ''}
          contactRemoteJid={whatsappContact?.remote_jid || ''}
        />
      </CRMLayout>
    </ProtectedFeature>
  );
}
