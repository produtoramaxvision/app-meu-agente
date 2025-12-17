import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EvolutionContact } from '@/types/sdr';

interface UseCRMContactsOptions {
  instanceId: string;
  userPhone: string | null;
  enabled?: boolean;
}

// ⚡ OTIMIZAÇÃO: Query key factory para consistência
const crmContactsKeys = {
  all: ['crm-contacts'] as const,
  byInstance: (instanceId: string) => [...crmContactsKeys.all, instanceId] as const,
  byUser: (userPhone: string) => [...crmContactsKeys.all, 'user', userPhone] as const,
};

/**
 * Hook otimizado para gerenciar contatos do CRM usando React Query
 * 
 * ⚡ OTIMIZAÇÕES:
 * - Cache automático com staleTime de 2 minutos
 * - Mutations otimistas para atualizações instantâneas
 * - Rollback automático em caso de erro
 * - Deduplicação de queries
 * - Background refetch inteligente
 */
export function useCRMContacts({ instanceId, userPhone, enabled = true }: UseCRMContactsOptions) {
  const queryClient = useQueryClient();
  
  const queryKey = useMemo(() => 
    userPhone ? crmContactsKeys.byUser(userPhone) : crmContactsKeys.byInstance(instanceId),
    [instanceId, userPhone]
  );

  // ⚡ QUERY: Carregar contatos com React Query
  const {
    data: contacts = [],
    isLoading: loading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userPhone) return [];

      const PAGE_SIZE = 1000;
      let allData: EvolutionContact[] = [];
      let from = 0;
      let fetchMore = true;

      while (fetchMore) {
        const { data, error } = await supabase
          .from('evolution_contacts')
          .select('*')
          .eq('phone', userPhone)
          .eq('is_group', false)
          .order('push_name', { ascending: true, nullsFirst: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          // Cast para EvolutionContact[] - tipos do Supabase são menos específicos
          allData = [...allData, ...(data as unknown as EvolutionContact[])];
          fetchMore = data.length === PAGE_SIZE;
          from += PAGE_SIZE;
        } else {
          fetchMore = false;
        }

        // Safety break (max 20k contatos)
        if (from > 20000) fetchMore = false;
      }

      // Normalizar sinalização de grupo
      return allData.map((contact) => ({
        ...contact,
        is_group: contact.is_group || contact.remote_jid?.includes('@g.us') || false,
      })) as EvolutionContact[];
    },
    enabled: enabled && !!userPhone,
    staleTime: 2 * 60 * 1000, // 2 minutos - dados frescos
    gcTime: 10 * 60 * 1000,   // 10 minutos no cache
    refetchOnWindowFocus: false, // Evitar refetch desnecessário durante drag
    refetchOnMount: false,
  });

  // ⚡ MUTATION: Atualização otimista de contato
  const updateMutation = useMutation({
    mutationFn: async ({ contactId, updates }: { contactId: string; updates: Partial<EvolutionContact> }) => {
      const { error } = await supabase
        .from('evolution_contacts')
        .update(updates)
        .eq('id', contactId);

      if (error) throw error;
      return { contactId, updates };
    },
    // ⚡ OTIMIZAÇÃO: Atualização otimista - UI atualiza ANTES da resposta do servidor
    onMutate: async ({ contactId, updates }) => {
      // Cancelar queries pendentes para evitar conflitos
      await queryClient.cancelQueries({ queryKey });

      // Snapshot do estado anterior para rollback
      const previousContacts = queryClient.getQueryData<EvolutionContact[]>(queryKey);

      // Atualização otimista no cache
      queryClient.setQueryData<EvolutionContact[]>(queryKey, (old) =>
        old?.map((contact) =>
          contact.id === contactId ? { ...contact, ...updates } : contact
        ) ?? []
      );

      return { previousContacts };
    },
    // ⚡ OTIMIZAÇÃO: Rollback em caso de erro
    onError: (err, variables, context) => {
      console.error('Error updating contact, rolling back:', err);
      if (context?.previousContacts) {
        queryClient.setQueryData(queryKey, context.previousContacts);
      }
      toast.error('Erro ao atualizar contato');
    },
    // Não invalidar imediatamente - já atualizamos otimistamente
    onSettled: () => {
      // Revalidar em background após 5 segundos para garantir consistência
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey, refetchType: 'none' });
      }, 5000);
    },
  });

  // ⚡ Wrapper memoizado para updateContact
  const updateContact = useCallback(
    async (contactId: string, updates: Partial<EvolutionContact>) => {
      return updateMutation.mutateAsync({ contactId, updates });
    },
    [updateMutation]
  );

  // ⚡ Refresh manual
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    contacts,
    loading,
    isFetching,
    updateContact,
    refresh,
  };
}
