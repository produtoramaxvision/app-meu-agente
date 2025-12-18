import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import type { EvolutionContact } from '@/types/sdr';

interface UseEvolutionContactsOptions {
  instanceId: string;      // UUID da instância no Supabase
  instanceName: string;    // Nome da instância na Evolution API (para API requests)
  evolutionApiUrl: string;
  evolutionApiKey: string;
  onlyContacts?: boolean; // Filtrar apenas contatos (sem grupos)
  syncOnMount?: boolean; // Sincroniza com API ao montar componente (útil para login)
  loadAllInstances?: boolean; // Carregar contatos de TODAS as instâncias do usuário (para filtro 'all')
}

interface UseEvolutionContactsReturn {
  contacts: EvolutionContact[];
  loading: boolean;
  syncing: boolean;
  lastSyncedAt: Date | null;
  secondsSinceSync: number | null;
  
  // Actions
  syncContacts: () => Promise<void>;
  updateContact: (contactId: string, updates: Partial<EvolutionContact>) => Promise<void>;
}

export function useEvolutionContacts(
  options: UseEvolutionContactsOptions
): UseEvolutionContactsReturn {
  const { 
    instanceId,
    instanceName,
    evolutionApiUrl, 
    evolutionApiKey, 
    onlyContacts = false, 
    syncOnMount = false,
    loadAllInstances = false,
  } = options;
  
  const [contacts, setContacts] = useState<EvolutionContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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

  // Carregar contatos salvos do banco de dados
  const loadContacts = useCallback(async () => {
    try {
      let allData: Record<string, unknown>[] = [];
      const PAGE_SIZE = 1000;
      let from = 0;
      let to = PAGE_SIZE - 1;
      let fetchMore = true;

      while (fetchMore) {
        let query = supabase
          .from('evolution_contacts')
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
        // Normalizar sinalização de grupo - Type cast seguro após validação do DB
        const normalized = allData.map((contact) => {
          const c = contact as unknown as EvolutionContact;
          return {
            ...c,
            is_group: c.is_group || c.remote_jid?.includes('@g.us') || false,
          };
        });

        setContacts(normalized);
        
        console.log(`✅ Contatos carregados: ${normalized.length}`);
        
        // Atualizar metadata de sincronização (do contato mais recente)
        if (normalized[0]?.synced_at) {
          const syncDate = new Date(normalized[0].synced_at);
          setLastSyncedAt(syncDate);
          setSecondsSinceSync(Math.floor((new Date().getTime() - syncDate.getTime()) / 1000));
        }
        
        return true;
      }

      // Limpar se não houver contatos
      setContacts([]);
      setLastSyncedAt(null);
      setSecondsSinceSync(null);
      return false;
    } catch (error) {
      console.error('Error loading contacts:', error);
      return false;
    }
  }, [instanceId, onlyContacts, userPhone, loadAllInstances]);

  // Sincronizar contatos da Evolution API
  const syncContacts = useCallback(async () => {
    try {
      if (!userPhone) {
        throw new Error('Telefone do usuário não encontrado na sessão');
      }

      setSyncing(true);

      // Buscar contatos da Evolution API
      const response = await fetch(
        `${evolutionApiUrl}/chat/findContacts/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'apikey': evolutionApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            where: {},
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
      }

      const evolutionContacts = await response.json() as Record<string, unknown>[];

      // Filtrar: remover broadcast lists (@lid)
      const withoutBroadcastLists = evolutionContacts.filter((c: Record<string, unknown>) => {
        const remoteJid = (c.remoteJid as string) || '';
        return remoteJid.includes('@s.whatsapp.net') || remoteJid.includes('@g.us');
      });

      // Filtrar grupos se necessário
      const filteredContacts = onlyContacts
        ? withoutBroadcastLists.filter((c: Record<string, unknown>) => (c.remoteJid as string)?.includes('@s.whatsapp.net'))
        : withoutBroadcastLists;

      // Limpar contatos antigos desta instância
      await supabase
        .from('evolution_contacts')
        .delete()
        .eq('instance_id', instanceId)
        .eq('phone', userPhone);

      // Preparar dados para salvar
      const contactsToSave = filteredContacts.map((contact: Record<string, unknown>) => ({
        instance_id: instanceId,
        phone: userPhone,
        remote_jid: contact.remoteJid as string,
        push_name: (contact.pushName as string) || null,
        profile_pic_url: (contact.profilePicUrl as string) || null,
        is_group: (contact.isGroup as boolean) || ((contact.remoteJid as string) || '').endsWith('@g.us') || false,
        is_saved: (contact.isSaved as boolean) || !!((contact.pushName as string) || (contact.profilePicUrl as string)),
        synced_at: new Date().toISOString(),
        sync_source: 'manual' as const,
        raw_data: contact as Json,
      }));

      // Salvar em batches (limite de 1000 por request)
      const BATCH_SIZE = 1000;
      const batches = [];
      
      for (let i = 0; i < contactsToSave.length; i += BATCH_SIZE) {
        batches.push(contactsToSave.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📦 Salvando ${batches.length} batch(es) (total: ${contactsToSave.length} contatos)`);
      
      for (const [index, batch] of batches.entries()) {
        const { error: upsertError } = await supabase
          .from('evolution_contacts')
          .upsert(batch, {
            onConflict: 'instance_id,remote_jid',
          });

        if (upsertError) {
          console.error(`Erro no batch ${index + 1}/${batches.length}:`, upsertError);
          throw upsertError;
        }
        
        console.log(`✅ Batch ${index + 1}/${batches.length} salvo (${batch.length} contatos)`);
      }

      // Recarregar contatos
      await loadContacts();
      
      toast.success('Contatos sincronizados', {
        description: `${contactsToSave.length} contatos atualizados`,
      });

      // Função retorna void conforme interface
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast.error('Erro ao sincronizar', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [instanceId, instanceName, evolutionApiUrl, evolutionApiKey, loadContacts, onlyContacts, userPhone]);



  // Atualizar contato (apenas campos CRM)
  const updateContact = useCallback(async (contactId: string, updates: Partial<EvolutionContact>) => {
    // Guardar estado anterior para possível rollback
    const previousContacts = [...contacts];

    // Atualizar estado local PRIMEIRO (atualização otimista)
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === contactId ? { ...contact, ...updates } : contact
      )
    );

    try {
      // Atualizar no banco
      const { error } = await supabase
        .from('evolution_contacts')
        .update(updates)
        .eq('id', contactId);

      if (error) {
        throw error;
      }

      // ✅ Sucesso! Atualização otimista permanece
      // Não recarregamos todos os contatos - a UI já foi atualizada
    } catch (error) {
      // ❌ Erro: reverter para estado anterior (rollback)
      console.error('Error updating contact, rolling back:', error);
      setContacts(previousContacts);
      throw error;
    }
  }, [contacts]);

  // Load inicial
  useEffect(() => {
    async function initialize() {
      setLoading(true);
      try {
        const hasContacts = await loadContacts();

        // Se syncOnMount=true, sincroniza imediatamente
        if (syncOnMount) {
          await syncContacts();
        } else if (!hasContacts) {
          // Se não há contatos salvos, sincroniza automaticamente
          await syncContacts();
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
  }, [instanceId, syncOnMount, loadContacts, syncContacts, userPhone, loadAllInstances]);

  // Timer para atualizar contador de tempo desde última sincronização
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastSyncedAt) {
        const now = new Date();
        const seconds = Math.floor((now.getTime() - lastSyncedAt.getTime()) / 1000);
        setSecondsSinceSync(seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSyncedAt]);

  return {
    contacts,
    loading,
    syncing,
    lastSyncedAt,
    secondsSinceSync,
    syncContacts,
    updateContact,
  };
}
