import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EvolutionContact } from '@/types/sdr';

interface UseEvolutionContactsOptions {
  instanceId: string;      // UUID da instância no Supabase (para cache)
  instanceName: string;    // Nome da instância na Evolution API (para API requests)
  evolutionApiUrl: string;
  evolutionApiKey: string;
  cacheTtlMinutes?: number; // TTL customizável (padrão: 60 minutos / 1 hora)
  autoRefresh?: boolean; // Auto-refresh quando cache expirar
  onlyContacts?: boolean; // Filtrar apenas contatos (sem grupos)
  refreshOnMount?: boolean; // Força refresh ao montar componente (útil para login)
  loadAllInstances?: boolean; // Carregar contatos de TODAS as instâncias do usuário (para filtro 'all')
}

interface UseEvolutionContactsReturn {
  contacts: EvolutionContact[];
  loading: boolean;
  refreshing: boolean;
  cacheValid: boolean;
  lastSyncedAt: Date | null;
  secondsSinceSync: number | null;
  
  // Actions
  refresh: (force?: boolean) => Promise<void>;
  invalidateCache: () => Promise<void>;
  updateContact: (contactId: string, updates: Partial<EvolutionContact>) => Promise<void>;
}

export function useEvolutionContacts(
  options: UseEvolutionContactsOptions
): UseEvolutionContactsReturn {
  const { 
    instanceId,      // UUID para cache Supabase
    instanceName,    // Nome para Evolution API
    evolutionApiUrl, 
    evolutionApiKey, 
    cacheTtlMinutes = 60, 
    autoRefresh = true, 
    onlyContacts = false, 
    refreshOnMount = true,
    loadAllInstances = false, // Por padrão, carrega apenas da instância especificada
  } = options;
  
  const [contacts, setContacts] = useState<EvolutionContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheValid, setCacheValid] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [secondsSinceSync, setSecondsSinceSync] = useState<number | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  // Resolve o telefone do usuário da tabela clientes (via get_user_phone_optimized)
  // Isso garante consistência com as RLS policies que usam a mesma função
  useEffect(() => {
    const resolveUserPhone = async () => {
      try {
        // Buscar o telefone da tabela clientes usando auth.uid()
        // Isso replica a lógica de get_user_phone_optimized() no frontend
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No authenticated user found');
          return;
        }

        const { data, error } = await supabase
          .from('clientes')
          .select('phone')
          .eq('auth_user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user phone from clientes:', error);
          return;
        }

        if (!data?.phone) {
          console.error('No phone found in clientes for user:', user.id);
          return;
        }

        setUserPhone(data.phone);
      } catch (err) {
        console.error('Error resolving user phone:', err);
      }
    };

    resolveUserPhone();
  }, []);

  // Buscar contatos do cache local (Supabase)
  const loadFromCache = useCallback(async () => {
    try {
      let allData: any[] = [];
      const PAGE_SIZE = 1000;
      let from = 0;
      let to = PAGE_SIZE - 1;
      let fetchMore = true;

      while (fetchMore) {
        let query = supabase
          .from('evolution_contacts_cache')
          .select('*')
          .order('push_name', { ascending: true, nullsFirst: false })
          .range(from, to);

        // Filtro por instância: se loadAllInstances=true, NÃO filtra por instance_id
        if (!loadAllInstances) {
          query = query.eq('instance_id', instanceId);
        }

        // SEMPRE filtrar pelo telefone do usuário (segurança RLS)
        if (userPhone) {
          query = query.eq('phone', userPhone);
        }

        // Filtrar apenas contatos (sem grupos)
        if (onlyContacts) {
          query = query.eq('is_group', false);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          
          if (data.length < PAGE_SIZE) {
            fetchMore = false;
          } else {
            from += PAGE_SIZE;
            to += PAGE_SIZE;
          }
        } else {
          fetchMore = false;
        }

        // Safety break (max 20k contatos)
        if (from > 20000) fetchMore = false;
      }

      if (allData.length > 0) {
        // Normalizar sinalização de grupo para não depender apenas da coluna is_group
        const normalized = (allData as EvolutionContact[]).map((contact) => ({
          ...contact,
          is_group: contact.is_group || contact.remote_jid?.includes('@g.us') || false,
        }));

        setContacts(normalized);
        
        console.log(`✅ Cache carregado: ${normalized.length} contatos`);
        
        // Verificar validade do cache (usa o registro mais antigo como referência)
        const oldestSync = normalized[0];
        const syncDate = new Date(oldestSync.last_synced_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - syncDate.getTime()) / (1000 * 60);
        const valid = diffMinutes < (oldestSync.cache_ttl_minutes || cacheTtlMinutes);
        
        setCacheValid(valid);
        setLastSyncedAt(syncDate);
        setSecondsSinceSync(Math.floor((now.getTime() - syncDate.getTime()) / 1000));
        
        return { hasCache: true, isValid: valid };
      }

      // Limpar contatos quando não há cache
      setContacts([]);
      return { hasCache: false, isValid: false };
    } catch (error) {
      console.error('Error loading from cache:', error);
      return { hasCache: false, isValid: false };
    }
  }, [instanceId, cacheTtlMinutes, onlyContacts, userPhone, loadAllInstances]);

  // Buscar contatos da Evolution API
  const fetchFromEvolutionAPI = useCallback(async (syncSource: 'manual' | 'auto' = 'auto') => {
    try {
      if (!userPhone) {
        throw new Error('Telefone do usuário não encontrado na sessão');
      }

      // Evolution API busca contatos do banco de dados Prisma
      // IMPORTANTE: Usar instanceName (nome), não instanceId (UUID)
      const response = await fetch(
        `${evolutionApiUrl}/chat/findContacts/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'apikey': evolutionApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            where: {}, // Busca todos os contatos (Evolution filtra por instanceName automaticamente)
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
      }

      const evolutionContacts = await response.json();

      // Evolution API retorna array de contatos do banco Prisma
      // 1º FILTRO: Remover broadcast lists (@lid) - não salvamos no cache
      // Mantemos apenas contatos individuais (@s.whatsapp.net) e grupos (@g.us)
      const withoutBroadcastLists = evolutionContacts.filter((c: any) => {
        const remoteJid = c.remoteJid || '';
        return remoteJid.includes('@s.whatsapp.net') || remoteJid.includes('@g.us');
      });

      // 2º FILTRO: Se onlyContacts=true, remove grupos também
      const filteredContacts = onlyContacts
        ? withoutBroadcastLists.filter((c: any) => c.remoteJid?.includes('@s.whatsapp.net'))
        : withoutBroadcastLists;

      // Limpamos o cache anterior desta instância/usuário antes de salvar
      // para evitar que contatos @lid antigos permaneçam e alterem a contagem.
      await supabase
        .from('evolution_contacts_cache')
        .delete()
        .eq('instance_id', instanceId)
        .eq('phone', userPhone);

      // Salvar no cache
      const contactsToCache = filteredContacts.map((contact: any) => ({
        instance_id: instanceId,
        phone: userPhone,
        remote_jid: contact.remoteJid,
        push_name: contact.pushName || null,
        profile_pic_url: contact.profilePicUrl || null,
        is_group: contact.isGroup || contact.remoteJid?.endsWith('@g.us') || false,
        is_saved: contact.isSaved || !!(contact.pushName || contact.profilePicUrl),
        last_synced_at: new Date().toISOString(),
        cache_ttl_minutes: cacheTtlMinutes,
        sync_source: syncSource,
      }));

      // Supabase tem limite de 1000 rows por upsert
      // Se temos mais de 1000 contatos, precisamos fazer em batches
      const BATCH_SIZE = 1000;
      const batches = [];
      
      for (let i = 0; i < contactsToCache.length; i += BATCH_SIZE) {
        batches.push(contactsToCache.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📦 Upsert em ${batches.length} batch(es) (total: ${contactsToCache.length} contatos)`);
      
      for (const [index, batch] of batches.entries()) {
        const { error: upsertError } = await supabase
          .from('evolution_contacts_cache')
          .upsert(batch, {
            onConflict: 'instance_id,remote_jid',
          });

        if (upsertError) {
          console.error(`Erro no batch ${index + 1}/${batches.length}:`, upsertError);
          throw upsertError;
        }
        
        console.log(`✅ Batch ${index + 1}/${batches.length} salvo (${batch.length} contatos)`);
      }

      // Recarregar do cache para atualizar o estado React e o título
      // Isso garante que contacts.length reflita o total salvo
      const cacheResult = await loadFromCache();
      
      console.log(`🔄 Cache recarregado:`, {
        filteredFromAPI: filteredContacts.length,
        savedToDatabase: contactsToCache.length,
        cacheHasData: cacheResult.hasCache,
        cacheValid: cacheResult.isValid
      });

      return filteredContacts.length;
    } catch (error) {
      console.error('Error fetching from Evolution API:', error);
      throw error;
    }
  }, [instanceId, instanceName, evolutionApiUrl, evolutionApiKey, cacheTtlMinutes, loadFromCache, onlyContacts, userPhone]);

  // Refresh (manual ou auto)
  const refresh = useCallback(async (force: boolean = false) => {
    try {
      if (!userPhone) {
        toast.error('Erro ao atualizar', {
          description: 'Telefone do usuário não encontrado na sessão',
        });
        return;
      }

      setRefreshing(true);

      if (force) {
        // Force refresh: busca direto da API
        const count = await fetchFromEvolutionAPI('manual');
        toast.success('Contatos atualizados', {
          description: `${count} contatos sincronizados`,
        });
      } else {
        // Smart refresh: verifica cache primeiro
        const { hasCache, isValid } = await loadFromCache();
        
        if (!hasCache || !isValid) {
          await fetchFromEvolutionAPI('auto');
        }
      }
    } catch (error) {
      toast.error('Erro ao atualizar', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setRefreshing(false);
    }
  }, [loadFromCache, fetchFromEvolutionAPI, userPhone]);

  // Invalidar cache (força próxima busca da API)
  const invalidateCache = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('invalidate_contacts_cache', {
        p_instance_id: instanceId,
      });

      if (error) throw error;

      setCacheValid(false);
      
      // Auto-refresh se habilitado
      if (autoRefresh) {
        await refresh();
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }, [instanceId, autoRefresh, refresh]);

  // Atualizar contato (apenas campos CRM)
  const updateContact = useCallback(async (contactId: string, updates: Partial<EvolutionContact>) => {
    try {
      const { error } = await supabase
        .from('evolution_contacts_cache')
        .update(updates)
        .eq('id', contactId);

      if (error) throw error;

      // Atualizar estado local
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === contactId ? { ...contact, ...updates } : contact
        )
      );

      toast.success('Contato atualizado', {
        description: 'Alterações salvas com sucesso',
      });
    } catch (error) {
      toast.error('Erro ao atualizar', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }, []);

  // Load inicial
  useEffect(() => {
    async function initialize() {
      setLoading(true);
      try {
        const { hasCache, isValid } = await loadFromCache();

        // Se refreshOnMount=true (login), sempre atualiza da API
        // Caso contrário, só atualiza se não tiver cache ou estiver inválido
        if (refreshOnMount) {
          await fetchFromEvolutionAPI('auto');
        } else if (!hasCache || (!isValid && autoRefresh)) {
          await fetchFromEvolutionAPI('auto');
        }
      } catch (error) {
        console.error('Error initializing contacts:', error);
      } finally {
        setLoading(false);
      }
    }

    if (instanceId && userPhone) {
      initialize();
    }
  }, [instanceId, autoRefresh, refreshOnMount, loadFromCache, fetchFromEvolutionAPI, userPhone, loadAllInstances]);

  // Auto-refresh timer (atualiza contador de segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSyncedAt) {
        const now = new Date();
        const seconds = Math.floor((now.getTime() - lastSyncedAt.getTime()) / 1000);
        setSecondsSinceSync(seconds);

        // Verifica se cache expirou
        if (seconds >= cacheTtlMinutes * 60) {
          setCacheValid(false);
          
          // Auto-refresh se habilitado
          if (autoRefresh && !refreshing) {
            refresh();
          }
        }
      }
    }, 1000); // Atualiza a cada 1 segundo

    return () => clearInterval(interval);
  }, [lastSyncedAt, cacheTtlMinutes, autoRefresh, refreshing, refresh]);

  return {
    contacts,
    loading,
    refreshing,
    cacheValid,
    lastSyncedAt,
    secondsSinceSync,
    refresh,
    invalidateCache,
    updateContact,
  };
}
