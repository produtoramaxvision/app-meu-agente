import { useEffect, useState, useCallback } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Task {
  id: string;
  phone: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'done' | 'overdue';
  category: string | null;
  completed_at: string | null;
  position: number;
  lead_remote_jid?: string | null; // Added for CRM
  created_at: string;
  updated_at: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  due_date?: Date | null;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  lead_remote_jid?: string; // Added for CRM
}

export function useTasksData(statusFilter?: 'all' | 'pending' | 'done' | 'overdue', searchQuery?: string, leadRemoteJid?: string) {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch tasks - usando configurações globais
  const { data: tasks = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tasks', cliente?.phone, statusFilter, searchQuery, leadRemoteJid],
    queryFn: async () => {
      if (!cliente?.phone) return [];

      console.log('🔍 useTasksData: Buscando tarefas para:', cliente.phone);

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('phone', cliente.phone)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery && searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      if (leadRemoteJid) {
        query = query.eq('lead_remote_jid', leadRemoteJid);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ useTasksData: Erro ao buscar tarefas:', error);
        throw error;
      }

      console.log('✅ useTasksData: Tarefas encontradas:', data?.length || 0);
      return (data as Task[]) || [];
    },
    enabled: !!cliente?.phone,
    /**
     * ✅ CORREÇÃO CRÍTICA - Loop Infinito de v1/tasks
     * 
     * PROBLEMA:
     * - staleTime: 0 + refetchOnMount: true faziam CADA componente fazer sua própria query
     * - QuickActions, UpcomingTasksCard, Tasks = 3 queries simultâneas
     * - Detectado como loop infinito pelos testes Playwright
     * 
     * SOLUÇÃO:
     * - Remover sobrescrições para usar configurações globais (main.tsx):
     *   - staleTime: 5 * 60 * 1000 (5 minutos)
     *   - refetchOnMount: false
     *   - refetchOnWindowFocus: false
     * - React Query compartilha cache entre componentes automaticamente
     * - Realtime subscription garante atualizações em tempo real
     * 
     * REFERÊNCIA:
     * - Context7 TanStack Query: "Sharing queries between components"
     * - Context7 TanStack Query: "Query invalidation with realtime subscriptions"
     * 
     * Data: 2025-01-24
     * Status: ✅ CORRIGIDO
     */
    refetchInterval: false, // Evita refetch automático
    placeholderData: (previousData) => previousData, // Mantém dados anteriores enquanto carrega
    // ✅ Herda configurações globais do main.tsx (staleTime: 5min, refetchOnMount: false)
  });

  // Setup Realtime subscription
  useEffect(() => {
    if (!cliente?.phone) return;

    const realtimeChannel = supabase
      .channel(`tasks:${cliente.phone}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `phone=eq.${cliente.phone}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ 
            queryKey: ['tasks', cliente.phone],
            exact: false // Invalida todas as queries que começam com esse prefixo
          });
        }
      )
      .subscribe();

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
    };
  }, [cliente?.phone, queryClient]);

  // Create task mutation
  const createTask = useMutation({
    mutationFn: async (taskData: TaskFormData) => {
      if (!cliente?.phone) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert({
          phone: cliente.phone,
          title: taskData.title,
          description: taskData.description || null,
          due_date: taskData.due_date?.toISOString() || null,
          priority: taskData.priority,
          category: taskData.category || null,
          status: 'pending',
          position: 0,
          lead_remote_jid: taskData.lead_remote_jid || null,
        });

      if (error) throw error;
      return null;
    },
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', cliente?.phone] });
      const previousTasks = queryClient.getQueryData(['tasks', cliente?.phone]);

      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        phone: cliente?.phone || '',
        title: newTask.title,
        description: newTask.description || null,
        due_date: newTask.due_date?.toISOString() || null,
        priority: newTask.priority,
        status: 'pending',
        category: newTask.category || null,
        completed_at: null,
        position: 0,
        lead_remote_jid: newTask.lead_remote_jid || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData(['tasks', cliente?.phone, 'all', '', leadRemoteJid], (old: Task[] = []) => [optimisticTask, ...old]);
      // Also update generic lists
      queryClient.invalidateQueries({ queryKey: ['tasks', cliente?.phone] });


      return { previousTasks };
    },
    onError: (err, newTask, context) => {
      // Revert is hard with multiple keys, just invalidate
      queryClient.invalidateQueries({ queryKey: ['tasks', cliente?.phone] });
      toast.error('Erro ao criar tarefa');
    },
    onSuccess: () => {
      toast.success('Tarefa criada com sucesso!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', cliente?.phone],
        exact: false // Invalida todas as queries que começam com esse prefixo
      });
    },
  });

  // Update task mutation
  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', cliente?.phone] });
      const previousTasks = queryClient.getQueryData(['tasks', cliente?.phone]);

      // Simple cache update might not be enough if we are filtering, but let's try
      queryClient.setQueryData(['tasks', cliente?.phone], (old: Task[] = []) =>
        old.map((task) => (task.id === id ? { ...task, ...updates } : task))
      );

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', cliente?.phone] });
      toast.error('Erro ao atualizar tarefa');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', cliente?.phone],
        exact: false // Invalida todas as queries que começam com esse prefixo
      });
    },
  });

  // Toggle task completion
  const toggleTaskCompletion = useMutation({
    mutationFn: async (task: Task) => {
      const newStatus = task.status === 'done' ? 'pending' : 'done';
      const completed_at = newStatus === 'done' ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('tasks')
        .update({ status: newStatus, completed_at })
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', cliente?.phone] });
      const previousTasks = queryClient.getQueryData(['tasks', cliente?.phone]);

      const newStatus = task.status === 'done' ? 'pending' : 'done';
      const completed_at = newStatus === 'done' ? new Date().toISOString() : null;

      // Optimistic update
      // Note: This is simplified. Ideally we should update all relevant queries.
      // Since we invalidate on settled, this is just for immediate feedback.
      
      return { previousTasks };
    },
    onError: (err, task, context) => {
       queryClient.invalidateQueries({ queryKey: ['tasks', cliente?.phone] });
      toast.error('Erro ao atualizar tarefa');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', cliente?.phone],
        exact: false // Invalida todas as queries que começam com esse prefixo
      });
    },
  });

  // Delete task mutation
  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', cliente?.phone] });
      
      return { };
    },
    onError: (err, id, context) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', cliente?.phone] });
      toast.error('Erro ao excluir tarefa');
    },
    onSuccess: () => {
      toast.success('Tarefa excluída com sucesso!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', cliente?.phone],
        exact: false // Invalida todas as queries que começam com esse prefixo
      });
    },
  });

  // Duplicate task mutation
  const duplicateTask = useMutation({
    mutationFn: async (task: Task) => {
      if (!cliente?.phone) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          phone: cliente.phone,
          title: `${task.title} (cópia)`,
          description: task.description,
          due_date: task.due_date,
          priority: task.priority,
          category: task.category,
          status: 'pending',
          completed_at: null,
          lead_remote_jid: task.lead_remote_jid // Copy lead association
        })
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => {
      toast.success('Tarefa duplicada com sucesso!');
      queryClient.invalidateQueries({ 
        queryKey: ['tasks', cliente?.phone],
        exact: false // Invalida todas as queries que começam com esse prefixo
      });
    },
    onError: () => {
      toast.error('Erro ao duplicar tarefa');
    },
  });

  // Get task counts
  const getTaskCounts = useCallback(() => {
    const all = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const overdue = tasks.filter((t) => t.status === 'overdue').length;

    return { all, pending, done, overdue };
  }, [tasks]);

  return {
    tasks,
    isLoading,
    error,
    refetch,
    createTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    duplicateTask,
    getTaskCounts,
  };
}
