import { useEffect, useMemo, useState } from 'react';
import { CRMLayout } from '@/components/crm/CRMLayout';
import { KanbanBoard } from '@/components/crm/KanbanBoard';
import { LeadDetailsSheet } from '@/components/crm/LeadDetailsSheet';
import { EvolutionContact } from '@/types/sdr';
import { useCRMPipeline } from '@/hooks/useCRMPipeline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Loader2, Phone, MessageCircle, Sparkles, ArrowUpRight } from 'lucide-react';
import { ProtectedFeature } from '@/components/ProtectedFeature';
import { useAuth } from '@/contexts/AuthContext';

export default function CRM() {
  const [selectedContact, setSelectedContact] = useState<EvolutionContact | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'lista'>('kanban');
  const [search, setSearch] = useState('');
  const { cliente } = useAuth();
  const { metrics, loading, columns, moveCard } = useCRMPipeline();

  // Persistência por usuário
  useEffect(() => {
    if (!cliente?.phone) return;
    const stored = localStorage.getItem(`crm_view_${cliente.phone}`);
    if (stored === 'kanban' || stored === 'lista') {
      setViewMode(stored);
    }
  }, [cliente?.phone]);

  const handleViewChange = (mode: 'kanban' | 'lista') => {
    setViewMode(mode);
    if (cliente?.phone) {
      localStorage.setItem(`crm_view_${cliente.phone}`, mode);
    }
  };

  const handleCardClick = (contact: EvolutionContact) => {
    setSelectedContact(contact);
    setDetailsOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setDetailsOpen(open);
    if (!open) {
      // Small delay to prevent flashing content while closing
      setTimeout(() => setSelectedContact(null), 300);
    }
  };

  const HeaderStats = () => (
    <div className="hidden lg:flex items-center gap-6 text-sm">
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs">Total Leads</span>
        <span className="font-semibold">{metrics.totalLeads}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs">Valor Total (Est.)</span>
        <span className="font-semibold text-green-600">R$ {metrics.totalValue.toLocaleString('pt-BR')}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs">Taxa de Conversão</span>
        <span className="font-semibold">
          {metrics.totalLeads > 0 
            ? Math.round(((metrics.byStatus['ganho'] || 0) / metrics.totalLeads) * 100) 
            : 0}%
        </span>
      </div>
    </div>
  );

  const listContacts = useMemo(() => {
    return columns.flatMap((col) =>
      col.contacts.map((contact) => ({ ...contact, __status: col.label, __statusId: col.id }))
    );
  }, [columns]);

  const normalizedFilter = search.trim().toLowerCase();

  const filteredColumns = useMemo(() => {
    if (!normalizedFilter) return columns;
    return columns.map((col) => ({
      ...col,
      contacts: col.contacts.filter((c) => {
        const name = (c.push_name || '').toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        return name.includes(normalizedFilter) || phone.includes(normalizedFilter);
      })
    }));
  }, [columns, normalizedFilter]);

  const filteredListContacts = useMemo(() => {
    if (!normalizedFilter) return listContacts;
    return listContacts.filter((c) => {
      const name = (c.push_name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return name.includes(normalizedFilter) || phone.includes(normalizedFilter);
    });
  }, [listContacts, normalizedFilter]);

  return (
    <ProtectedFeature permission="canAccessSDRAgent" featureName="CRM de Vendas">
      <CRMLayout
        headerStats={<HeaderStats />}
        viewMode={viewMode}
        onViewChange={handleViewChange}
        searchValue={search}
        onSearchChange={setSearch}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard onCardClick={handleCardClick} columns={filteredColumns} moveCard={moveCard} />
        ) : (
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
        )}

        <LeadDetailsSheet 
          contact={selectedContact} 
          open={detailsOpen} 
          onOpenChange={handleOpenChange} 
        />
      </CRMLayout>
    </ProtectedFeature>
  );
}

