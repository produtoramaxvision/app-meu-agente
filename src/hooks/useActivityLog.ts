import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

type CrmActivity = Tables<'crm_activities'>;

type ActivityInsert = {
  contact_id: string;
  activity_type: CrmActivity['activity_type'];
  title: string;
  description?: string;
  old_value?: string;
  new_value?: string;
  metadata?: Record<string, unknown>;
};

// ============================================================================
// HOOK: useActivityLog
// ============================================================================

/**
 * Hook para gerenciar atividades (histórico) de leads do CRM.
 * 
 * Features:
 * - Busca atividades de um contato específico
 * - Registra novas atividades
 * - Realtime subscription para atualizações automáticas
 * - Invalidação granular de cache
 * 
 * @param contactId - UUID do contato (evolution_contacts)
 * @returns Query state e mutation functions
 * 
 * @example
 * ```tsx
 * const { activities, isLoading, logActivity } = useActivityLog(contact.id);
 * 
 * // Registrar atividade de mudança de status
 * logActivity.mutate({
 *   contact_id: contact.id,
 *   activity_type: 'status_change',
 *   title: 'Status mudou de Novo para Contatado',
 *   old_value: 'novo',
 *   new_value: 'contatado'
 * });
 * ```
 */
export function useActivityLog(contactId: string | undefined) {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  // ============================================================================
  // QUERY: Buscar atividades do contato
  // ============================================================================

  const {
    data: activities = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['activities', contactId],
    queryFn: async () => {
      if (!contactId) return [];

      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false }); // Mais recentes primeiro

      if (error) {
        console.error('❌ useActivityLog: Erro ao buscar atividades:', error);
        throw error;
      }

      return (data || []) as CrmActivity[];
    },
    enabled: !!contactId && !!cliente?.phone,
    // ✅ Herda configurações globais do main.tsx (staleTime: 5min, refetchOnMount: false)
    placeholderData: (previousData) => previousData,
  });

  // ============================================================================
  // REALTIME SUBSCRIPTION
  // ============================================================================

  useEffect(() => {
    if (!contactId || !cliente?.phone) return;

    // Subscription para atividades deste contato específico
    const realtimeChannel = supabase
      .channel(`activities:${contactId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_activities',
          filter: `contact_id=eq.${contactId}`,
        },
        (payload) => {
          console.log('🔄 useActivityLog: Realtime update:', payload);
          
          // Invalidar cache para atualizar lista
          queryClient.invalidateQueries({ 
            queryKey: ['activities', contactId],
            exact: true,
          });
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [contactId, cliente?.phone, queryClient]);

  // ============================================================================
  // MUTATION: Registrar nova atividade
  // ============================================================================

  const logActivity = useMutation({
    mutationFn: async (activityData: ActivityInsert) => {
      if (!cliente?.phone) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('crm_activities')
        .insert({
          ...activityData,
          phone: cliente.phone, // RLS
          metadata: activityData.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('❌ useActivityLog: Erro ao registrar atividade:', error);
        throw error;
      }

      console.log('✅ useActivityLog: Atividade registrada:', data);
      return data as CrmActivity;
    },
    onSuccess: (data) => {
      // Invalidar cache das atividades deste contato
      queryClient.invalidateQueries({ 
        queryKey: ['activities', data.contact_id],
        exact: true,
      });
    },
  });

  // ============================================================================
  // HELPERS: Funções de conveniência para tipos específicos
  // ============================================================================

  /**
   * Registra mudança de status do lead
   */
  const logStatusChange = (contactId: string, oldStatus: string, newStatus: string) => {
    return logActivity.mutateAsync({
      contact_id: contactId,
      activity_type: 'status_change',
      title: `Status mudou de "${oldStatus}" para "${newStatus}"`,
      old_value: oldStatus,
      new_value: newStatus,
    });
  };

  /**
   * Registra atualização de nota
   */
  const logNoteUpdate = (contactId: string, oldNote: string | null, newNote: string) => {
    return logActivity.mutateAsync({
      contact_id: contactId,
      activity_type: 'note_updated',
      title: 'Nota atualizada',
      old_value: oldNote || '',
      new_value: newNote,
    });
  };

  /**
   * Registra atualização de valor estimado
   */
  const logValueUpdate = (contactId: string, oldValue: number, newValue: number) => {
    return logActivity.mutateAsync({
      contact_id: contactId,
      activity_type: 'value_updated',
      title: 'Valor estimado atualizado',
      old_value: oldValue.toString(),
      new_value: newValue.toString(),
      metadata: {
        old_value_formatted: `R$ ${oldValue.toFixed(2)}`,
        new_value_formatted: `R$ ${newValue.toFixed(2)}`,
      },
    });
  };

  /**
   * Registra campo personalizado atualizado
   */
  const logCustomFieldUpdate = (
    contactId: string, 
    fieldLabel: string, 
    oldValue: unknown, 
    newValue: unknown
  ) => {
    return logActivity.mutateAsync({
      contact_id: contactId,
      activity_type: 'custom_field_updated',
      title: `Campo "${fieldLabel}" atualizado`,
      old_value: JSON.stringify(oldValue),
      new_value: JSON.stringify(newValue),
      metadata: {
        field_label: fieldLabel,
      },
    });
  };

  /**
   * Registra tarefa criada
   */
  const logTaskCreated = (contactId: string, taskTitle: string) => {
    return logActivity.mutateAsync({
      contact_id: contactId,
      activity_type: 'task_created',
      title: 'Tarefa criada',
      description: taskTitle,
    });
  };

  /**
   * Registra tarefa completada
   */
  const logTaskCompleted = (contactId: string, taskTitle: string) => {
    return logActivity.mutateAsync({
      contact_id: contactId,
      activity_type: 'task_completed',
      title: 'Tarefa completada',
      description: taskTitle,
    });
  };

  /**
   * Registra mensagem WhatsApp enviada
   */
  const logWhatsAppSent = (contactId: string, messagePreview: string) => {
    return logActivity.mutateAsync({
      contact_id: contactId,
      activity_type: 'whatsapp_sent',
      title: 'Mensagem WhatsApp enviada',
      description: messagePreview,
    });
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Query state
    activities,
    isLoading,
    error,
    
    // Mutation
    logActivity,
    isLoggingActivity: logActivity.isPending,
    
    // Helper functions
    logStatusChange,
    logNoteUpdate,
    logValueUpdate,
    logCustomFieldUpdate,
    logTaskCreated,
    logTaskCompleted,
    logWhatsAppSent,
  };
}
