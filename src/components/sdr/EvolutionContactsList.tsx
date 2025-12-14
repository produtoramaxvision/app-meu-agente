import { useState, useMemo } from 'react';
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
  instanceId: string;      // UUID da instância no Supabase (para cache)
  instanceName: string;    // Nome da instância na Evolution API (ex: "meu-whatsapp")
  evolutionApiUrl: string;
  evolutionApiKey: string;
  cacheTtlMinutes?: number; // Default: 60 minutos (1 hora)
  onContactClick?: (contact: EvolutionContact) => void;
  // Props para múltiplas instâncias (opcional)
  allInstances?: EvolutionInstance[];  // Todas as instâncias para mostrar badge
  instanceDisplayName?: string;         // Nome de exibição (ex: "WhatsApp 1")
}

export function EvolutionContactsList({
  instanceId,
  instanceName,
  evolutionApiUrl,
  evolutionApiKey,
  cacheTtlMinutes = 2,
  onContactClick,
  allInstances,
  instanceDisplayName,
}: EvolutionContactsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [showGroupsOnly, setShowGroupsOnly] = useState(false);
  const [instanceFilter, setInstanceFilter] = useState<string>('all'); // 'all' ou instance_id

  const {
    contacts,
    loading,
    refreshing,
    cacheValid,
    lastSyncedAt,
    secondsSinceSync,
    refresh,
    updateContact,
  } = useEvolutionContacts({
    instanceId,      // UUID para cache no Supabase
    instanceName,    // Nome para Evolution API
    evolutionApiUrl,
    evolutionApiKey,
    cacheTtlMinutes: cacheTtlMinutes || 60, // Default: 1 hora
    autoRefresh: false, // não atualizar sozinho a cada carga de página
    onlyContacts: false,
    refreshOnMount: false, // só sincroniza em login (nova sessão) ou no botão Atualizar
  });

  // Filtros
  const filteredContacts = contacts.filter((contact) => {
    // Filtro de busca
    const matchesSearch = 
      contact.push_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.remote_jid.includes(searchQuery);

    // Filtro de favoritos
    if (filterFavorites && !contact.crm_favorite) return false;

    // Filtro de grupos x contatos (modo alternância)
    if (showGroupsOnly && !contact.is_group) return false; // mostrar só grupos
    if (!showGroupsOnly && contact.is_group) return false; // mostrar só contatos

    return matchesSearch;
  });

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

  // Status do cache
  const getCacheStatusBadge = () => {
    if (!cacheValid) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Cache expirado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Atualizado há {formatTimeSinceSync(secondsSinceSync)}
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
              Contatos ({filteredContacts.length})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getCacheStatusBadge()}
              <span className="text-xs">
                TTL: {cacheTtlMinutes} min
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de atualização manual */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh(true)}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 pt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar contato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro por Instância (quando há múltiplas) */}
          {allInstances && allInstances.length > 1 && (
            <Select
              value={instanceFilter}
              onValueChange={setInstanceFilter}
            >
              <SelectTrigger className="w-[160px]">
                <div className="flex items-center gap-2">
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

          <Button
            variant={filterFavorites ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterFavorites(!filterFavorites)}
            className="gap-2"
          >
            <Star className={cn('h-4 w-4', filterFavorites && 'fill-current')} />
            Favoritos
          </Button>

          <Button
            variant={showGroupsOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowGroupsOnly(!showGroupsOnly)}
            className="gap-2 min-w-[110px]"
          >
            {showGroupsOnly ? (
              <User className="h-4 w-4" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            {showGroupsOnly ? 'Contatos' : 'Grupos'}
          </Button>
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
                    {/* Badge de instância (quando há múltiplas) */}
                    {allInstances && allInstances.length > 1 && (
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-primary/5 border-primary/30 text-primary"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        {allInstances.find(i => i.id === contact.instance_id)?.display_name 
                          || instanceDisplayName 
                          || 'WhatsApp'}
                      </Badge>
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
                Total: {contacts.length} contatos
              </span>
              <span>
                Grupos: {contacts.filter(c => c.is_group).length}
              </span>
              <span>
                Favoritos: {contacts.filter(c => c.crm_favorite).length}
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
