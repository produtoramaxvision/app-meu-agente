import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  RefreshCw, 
  Search, 
  Star, 
  StarOff, 
  MessageSquare, 
  Clock,
  AlertCircle,
  Users,
  User,
  Phone,
} from 'lucide-react';
import { useEvolutionContacts } from '@/hooks/useEvolutionContacts';
import type { EvolutionContact, EvolutionInstance } from '@/types/sdr';
import { cn } from '@/lib/utils';

interface EvolutionContactsListProps {
  instanceId: string;
  instanceName: string;
  evolutionApiUrl: string;
  evolutionApiKey: string;
  onContactClick?: (contact: EvolutionContact) => void;
  allInstances?: EvolutionInstance[];
  instanceDisplayName?: string;
}

export function EvolutionContactsList({
  instanceId,
  instanceName,
  evolutionApiUrl,
  evolutionApiKey,
  onContactClick,
  allInstances,
  instanceDisplayName,
}: EvolutionContactsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [showGroupsOnly, setShowGroupsOnly] = useState(false);
  // instanceFilter: controla qual instância está sendo visualizada
  // 'all' = mostra contatos de todas as instâncias
  // UUID = mostra contatos apenas dessa instância específica
  const [instanceFilter, setInstanceFilter] = useState<string>(instanceId);

  // Sincronizar instanceFilter quando instanceId (prop) mudar
  // Isso garante que ao trocar a instância no header, o filtro também mude
  useEffect(() => {
    setInstanceFilter(instanceId);
  }, [instanceId]);

  // Determina qual instanceId passar para o hook
  // Se instanceFilter === 'all', passamos a instância atual como base para API calls
  // mas sinalizamos que queremos todos os contatos do cache
  const activeInstanceId = instanceFilter === 'all' ? instanceId : instanceFilter;
  const activeInstance = allInstances?.find(i => i.id === activeInstanceId);

  const {
    contacts,
    loading,
    syncing,
    lastSyncedAt,
    secondsSinceSync,
    syncContacts,
    updateContact,
  } = useEvolutionContacts({
    instanceId: activeInstanceId,
    instanceName: activeInstance?.instance_name || instanceName,
    evolutionApiUrl,
    evolutionApiKey,
    onlyContacts: false,
    syncOnMount: false,
    loadAllInstances: instanceFilter === 'all',
  });

  // Interface para contatos mesclados (quando "Todas conexões" está ativo)
  interface MergedContact extends EvolutionContact {
    instance_ids: string[]; // Array de instance_ids onde este contato existe
  }

  // Mesclar contatos com mesmo remote_jid de diferentes instâncias
  // Isso evita duplicação visual e mostra múltiplos badges
  // ATUALIZAÇÃO: Removida a mesclagem para exibir o total real de contatos de cada instância
  // conforme solicitado (ex: 147 + 10 = 157, não 115)
  const mergedContacts = useMemo((): MergedContact[] => {
    // Retorna todos os contatos separadamente, mantendo a compatibilidade de tipo
    return contacts.map(c => ({ ...c, instance_ids: [c.instance_id] }));
  }, [contacts]);

  // Filtros aplicados sobre contatos mesclados
  const filteredContacts = useMemo(() => {
    return mergedContacts.filter((contact) => {
      // Filtro de busca
      const matchesSearch = 
        contact.push_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.remote_jid.includes(searchQuery);

      // Filtro por instância (quando não é 'all')
      // Nota: quando instanceFilter !== 'all', o hook já filtra por instância
      // mas mantemos esta verificação para garantir consistência visual
      if (instanceFilter !== 'all' && contact.instance_id !== instanceFilter) {
        return false;
      }

      // Filtro de favoritos
      if (filterFavorites && !contact.crm_favorite) return false;

      // Filtro de grupos x contatos (modo alternância)
      // Quando showGroupsOnly=true, mostra apenas grupos; caso contrário, exibe ambos
      if (showGroupsOnly && !contact.is_group) return false;

      return matchesSearch;
    });
  }, [mergedContacts, searchQuery, instanceFilter, filterFavorites, showGroupsOnly]);

  const statistics = useMemo(() => {
    const contactsOnly = filteredContacts.filter((c) => !c.is_group).length;
    const groupsOnly = filteredContacts.filter((c) => c.is_group).length;

    return {
      displayedContacts: filteredContacts.length,
      contactsOnly,
      groupsOnly,
    };
  }, [filteredContacts]);

  const footerStatistics = useMemo(() => {
    const contactsOnly = mergedContacts.filter((c) => !c.is_group).length;
    const groupsOnly = mergedContacts.filter((c) => c.is_group).length;
    const favoritesOnly = mergedContacts.filter((c) => c.crm_favorite).length;

    return {
      contactsOnly,
      groupsOnly,
      favoritesOnly,
    };
  }, [mergedContacts]);

  // Formatar tempo desde última sincronização
  const formatTimeSinceSync = (seconds: number | null) => {
    if (seconds === null) return 'Nunca';
    if (seconds < 60) return `${seconds}s atrás`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min atrás`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h atrás`;
  };

  // Toggle favorito
  const toggleFavorite = async (contact: EvolutionContact, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateContact(contact.id, {
      crm_favorite: !contact.crm_favorite,
    });
  };

  // Status da sincronização
  const getSyncStatusBadge = () => {
    if (!lastSyncedAt) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Nunca sincronizado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Sincronizado há {formatTimeSinceSync(secondsSinceSync)}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {showGroupsOnly ? 'Grupos' : 'Contatos'} (
              {showGroupsOnly ? statistics.groupsOnly : statistics.contactsOnly})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getSyncStatusBadge()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={syncContacts}
              disabled={syncing}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 pt-4">
          {/* Campo de busca: ocupa 100% no mobile */}
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar contato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          {/* Linha de filtros e botões: no mobile fica em colunas de largura total */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {/* Filtro por Instância (quando há múltiplas) */}
            {allInstances && allInstances.length > 1 && (
              <Select
                value={instanceFilter}
                onValueChange={setInstanceFilter}
              >
                {/* Dropdown com mesma largura do campo de busca no mobile; largura fixa no desktop */}
                <SelectTrigger className="w-full sm:w-[200px] justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Phone className="h-4 w-4" />
                    <SelectValue placeholder="Todas conexões" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas conexões</SelectItem>
                  {allInstances.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.display_name || 'WhatsApp'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Botões: mobile ocupa 100% com colunas 50/50; desktop volta ao automático */}
            <div className="grid grid-cols-2 w-full sm:w-auto sm:flex sm:grid-cols-1 gap-2">
              <Button
                variant={filterFavorites ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterFavorites(!filterFavorites)}
                className="w-full sm:w-auto sm:flex-none gap-2"
              >
                <Star className={cn('h-4 w-4', filterFavorites && 'fill-current')} />
                Favoritos
              </Button>

              <Button
                variant={showGroupsOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowGroupsOnly(!showGroupsOnly)}
                className="w-full sm:w-auto sm:flex-none gap-2"
              >
                {showGroupsOnly ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                {showGroupsOnly ? (
                  <>
                    <span className="hidden sm:inline">Contatos</span>
                    <span className="sm:hidden">Ctos</span>
                  </>
                ) : (
                  "Grupos"
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="font-medium">Nenhum contato encontrado</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'Tente ajustar sua busca' : 'Aguarde mensagens para sincronizar contatos'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                onClick={() => onContactClick?.(contact)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                  'hover:bg-accent cursor-pointer',
                  contact.crm_favorite && 'border-yellow-500/50 bg-yellow-500/5'
                )}
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.profile_pic_url || undefined} />
                  <AvatarFallback>
                    {contact.is_group ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate">
                      {contact.push_name || 'Sem nome'}
                    </p>
                    {contact.is_group && (
                      <Badge variant="secondary" className="text-xs">
                        Grupo
                      </Badge>
                    )}
                    {contact.crm_lead_status && (
                      <Badge variant="outline" className="text-xs">
                        {contact.crm_lead_status}
                      </Badge>
                    )}
                    {/* Badges de instâncias (múltiplos quando contato existe em várias) */}
                    {allInstances && allInstances.length > 1 && 'instance_ids' in contact && (
                      <>
                        {(contact as { instance_ids: string[] }).instance_ids.map((instId) => {
                          const inst = allInstances.find(i => i.id === instId);
                          return (
                            <Badge 
                              key={instId}
                              variant="outline" 
                              className="text-xs bg-primary/5 border-primary/30 text-primary"
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              {inst?.display_name || instanceDisplayName || 'WhatsApp'}
                            </Badge>
                          );
                        })}
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {contact.remote_jid.split('@')[0]}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Lead Score */}
                  {contact.crm_lead_score > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {contact.crm_lead_score} pts
                    </Badge>
                  )}

                  {/* Favorito */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => toggleFavorite(contact, e)}
                    className="h-8 w-8 p-0"
                  >
                    {contact.crm_favorite ? (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>

                  {/* Mensagem rápida */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Abrir chat
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer com stats */}
        {!loading && filteredContacts.length > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>
                Total: {footerStatistics.contactsOnly} contatos
              </span>
              <span>
                Grupos: {footerStatistics.groupsOnly}
              </span>
              <span>
                Favoritos: {footerStatistics.favoritesOnly}
              </span>
            </div>
            <div>
              Última atualização: {lastSyncedAt?.toLocaleTimeString('pt-BR') || 'Nunca'}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
