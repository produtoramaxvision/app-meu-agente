import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  CrmAutomation, 
  CrmAutomationInsert, 
  CrmAutomationUpdate,
  AutomationTriggerType,
  AutomationActionType,
} from '@/integrations/supabase/types';

// ============================================================================
// CONSTANTS
// ============================================================================

export const TRIGGER_TYPE_LABELS: Record<AutomationTriggerType, string> = {
  status_change: 'Mudança de Status',
  time_in_status: 'Tempo em Status',
  value_threshold: 'Limite de Valor',
  no_interaction: 'Sem Interação',
};

export const ACTION_TYPE_LABELS: Record<AutomationActionType, string> = {
  create_task: 'Criar Tarefa',
  send_notification: 'Enviar Notificação',
  update_field: 'Atualizar Campo',
  send_whatsapp: 'Enviar WhatsApp',
};

export const TRIGGER_TYPE_DESCRIPTIONS: Record<AutomationTriggerType, string> = {
  status_change: 'Dispara quando o status de um lead muda para um valor específico',
  time_in_status: 'Dispara quando um lead permanece em um status por X dias',
  value_threshold: 'Dispara quando um valor atinge um limite definido',
  no_interaction: 'Dispara quando não há interação com o lead por X dias',
};

export const ACTION_TYPE_DESCRIPTIONS: Record<AutomationActionType, string> = {
  create_task: 'Cria uma nova tarefa automaticamente',
  send_notification: 'Envia uma notificação no sistema',
  update_field: 'Atualiza um campo do lead automaticamente',
  send_whatsapp: 'Envia uma mensagem via WhatsApp',
};

// ============================================================================
// HOOK: useAutomations
// ============================================================================

/**
 * Hook para gerenciar automações do CRM.
 * 
 * Features:
 * - Busca automações do usuário
 * - Cria, atualiza e deleta automações
 * - Toggle de ativação/desativação
 * - Realtime subscription para atualizações automáticas
 * 
 * @returns Query state e mutation functions
 * 
 * @example
 * ```tsx
 * const { automations, isLoading, createAutomation, toggleAutomation } = useAutomations();
 * 
 * // Criar automação
 * createAutomation.mutate({
 *   name: 'Follow-up após contato',
 *   trigger_type: 'status_change',
 *   trigger_config: { to_status: 'contatado' },
 *   action_type: 'create_task',
 *   action_config: { title: 'Follow-up', due_days: 3 }
 * });
 * ```
 */
export function useAutomations() {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  // ============================================================================
  // QUERY: Buscar automações do usuário
  // ============================================================================

  const {
    data: automations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['crm-automations', cliente?.phone],
    queryFn: async () => {
      if (!cliente?.phone) return [];

      const { data, error } = await supabase
        .from('crm_automations')
        .select('*')
        .eq('cliente_phone', cliente.phone)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ useAutomations: Erro ao buscar automações:', error);
        throw error;
      }

      return (data || []) as CrmAutomation[];
    },
    enabled: !!cliente?.phone,
    placeholderData: (previousData) => previousData,
  });

  // ============================================================================
  // REALTIME SUBSCRIPTION
  // ============================================================================

  useEffect(() => {
    if (!cliente?.phone) return;

    const realtimeChannel = supabase
      .channel(`automations:${cliente.phone}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_automations',
          filter: `cliente_phone=eq.${cliente.phone}`,
        },
        (payload) => {
          console.log('🔄 useAutomations: Realtime update:', payload);
          
          queryClient.invalidateQueries({ 
            queryKey: ['crm-automations', cliente.phone],
            exact: true,
          });
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [cliente?.phone, queryClient]);

  // ============================================================================
  // MUTATION: Criar automação
  // ============================================================================

  const createAutomation = useMutation({
    mutationFn: async (automationData: Omit<CrmAutomationInsert, 'cliente_phone'>) => {
      if (!cliente?.phone) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('crm_automations')
        .insert({
          ...automationData,
          cliente_phone: cliente.phone,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ useAutomations: Erro ao criar automação:', error);
        throw error;
      }

      console.log('✅ useAutomations: Automação criada:', data);
      return data as CrmAutomation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['crm-automations', cliente?.phone],
      });
    },
  });

  // ============================================================================
  // MUTATION: Atualizar automação
  // ============================================================================

  const updateAutomation = useMutation({
    mutationFn: async ({ 
      id, 
      ...updateData 
    }: CrmAutomationUpdate & { id: string }) => {
      if (!cliente?.phone) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('crm_automations')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('cliente_phone', cliente.phone) // RLS extra safety
        .select()
        .single();

      if (error) {
        console.error('❌ useAutomations: Erro ao atualizar automação:', error);
        throw error;
      }

      console.log('✅ useAutomations: Automação atualizada:', data);
      return data as CrmAutomation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['crm-automations', cliente?.phone],
      });
    },
  });

  // ============================================================================
  // MUTATION: Deletar automação
  // ============================================================================

  const deleteAutomation = useMutation({
    mutationFn: async (id: string) => {
      if (!cliente?.phone) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('crm_automations')
        .delete()
        .eq('id', id)
        .eq('cliente_phone', cliente.phone); // RLS extra safety

      if (error) {
        console.error('❌ useAutomations: Erro ao deletar automação:', error);
        throw error;
      }

      console.log('✅ useAutomations: Automação deletada:', id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['crm-automations', cliente?.phone],
      });
    },
  });

  // ============================================================================
  // HELPERS: Funções de conveniência
  // ============================================================================

  /**
   * Ativa ou desativa uma automação
   */
  const toggleAutomation = (id: string, isActive: boolean) => {
    return updateAutomation.mutateAsync({
      id,
      is_active: isActive,
    });
  };

  /**
   * Retorna estatísticas das automações
   */
  const getStats = () => {
    const total = automations.length;
    const active = automations.filter(a => a.is_active).length;
    const inactive = total - active;
    const totalTriggered = automations.reduce((acc, a) => acc + a.trigger_count, 0);

    return { total, active, inactive, totalTriggered };
  };

  /**
   * Busca automação por ID
   */
  const getAutomationById = (id: string) => {
    return automations.find(a => a.id === id);
  };

  /**
   * Filtra automações por tipo de trigger
   */
  const filterByTriggerType = (triggerType: AutomationTriggerType) => {
    return automations.filter(a => a.trigger_type === triggerType);
  };

  /**
   * Filtra automações por tipo de ação
   */
  const filterByActionType = (actionType: AutomationActionType) => {
    return automations.filter(a => a.action_type === actionType);
  };

  return {
    // Data
    automations,
    isLoading,
    error,
    
    // Mutations
    createAutomation,
    updateAutomation,
    deleteAutomation,
    
    // Helpers
    toggleAutomation,
    getStats,
    getAutomationById,
    filterByTriggerType,
    filterByActionType,
    refetch,
    
    // Realtime channel (for debugging)
    channel,
  };
}
