import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_phone: string;
  ticket_number: string;
  type: 'support' | 'bug' | 'suggestion';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachments: string[];
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketData {
  type: 'support' | 'bug' | 'suggestion';
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: File[];
}

export interface TicketLimit {
  remaining: number;
  limit: number;
  isUnlimited: boolean;
}

export interface SupportSLA {
  responseTime: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  channels: ('form' | 'email')[];
  description: string;
}

export interface SupportPlanInfo {
  planId: string;
  sla: SupportSLA;
  ticketLimit: TicketLimit;
}

// Função para obter SLA por plano
export function getSupportSLA(planId: string): SupportSLA {
  switch (planId) {
    case 'free':
      return {
        responseTime: '72 horas',
        priority: 'low',
        channels: ['form'],
        description: 'Suporte básico via formulário'
      };
    case 'basic':
      return {
        responseTime: '24 horas',
        priority: 'medium',
        channels: ['form', 'email'],
        description: 'Suporte via formulário e email'
      };
    case 'business':
      return {
        responseTime: '4 horas',
        priority: 'high',
        channels: ['form', 'email'],
        description: 'Suporte prioritário via formulário e email'
      };
    case 'premium':
      return {
        responseTime: '1 hora',
        priority: 'critical',
        channels: ['form', 'email'],
        description: 'Suporte crítico via formulário e email'
      };
    default:
      return {
        responseTime: '72 horas',
        priority: 'low',
        channels: ['form'],
        description: 'Suporte básico via formulário'
      };
  }
}

export function useSupportTickets() {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();

  // Get user's tickets
  const getTickets = useQuery({
    queryKey: ['support-tickets', cliente?.phone],
    queryFn: async (): Promise<SupportTicket[]> => {
      if (!cliente?.phone) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_phone', cliente.phone)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar tickets: ${error.message}`);
      }

      return data || [];
    },
    enabled: !!cliente?.phone,
  });

  // Get user's ticket limit
  const getTicketLimit = useQuery({
    queryKey: ['ticket-limit', cliente?.phone],
    queryFn: async (): Promise<TicketLimit> => {
      if (!cliente?.phone) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .rpc('get_user_ticket_limit', { user_phone_param: cliente.phone });

      if (error) {
        throw new Error(`Erro ao verificar limite: ${error.message}`);
      }

      const remaining = data as number;
      
      return {
        remaining: remaining === -1 ? -1 : remaining,
        limit: remaining === -1 ? -1 : (remaining + (getTickets.data?.length || 0)),
        isUnlimited: remaining === -1
      };
    },
    enabled: !!cliente?.phone,
  });

  // Get complete support plan info
  const getSupportPlanInfo = useQuery({
    queryKey: ['support-plan-info', cliente?.phone],
    queryFn: async (): Promise<SupportPlanInfo> => {
      if (!cliente?.phone) {
        throw new Error('Usuário não autenticado');
      }

      const planId = cliente.plan_id || 'free';
      const sla = getSupportSLA(planId);
      
      // Get ticket limit
      const { data: limitData, error: limitError } = await supabase
        .rpc('get_user_ticket_limit', { user_phone_param: cliente.phone });

      if (limitError) {
        throw new Error(`Erro ao verificar limite: ${limitError.message}`);
      }

      const remaining = limitData as number;
      const ticketLimit: TicketLimit = {
        remaining: remaining === -1 ? -1 : remaining,
        limit: remaining === -1 ? -1 : (remaining + (getTickets.data?.length || 0)),
        isUnlimited: remaining === -1
      };

      return {
        planId,
        sla,
        ticketLimit
      };
    },
    enabled: !!cliente?.phone,
  });

  // Create new ticket
  const createTicket = useMutation({
    mutationFn: async (ticketData: CreateTicketData): Promise<SupportTicket> => {
      if (!cliente?.phone) {
        throw new Error('Usuário não autenticado');
      }

      // Check ticket limit first
      const limitData = await supabase
        .rpc('get_user_ticket_limit', { user_phone_param: cliente.phone });

      if (limitData.error) {
        throw new Error(`Erro ao verificar limite: ${limitData.error.message}`);
      }

      const remaining = limitData.data as number;
      if (remaining === 0) {
        throw new Error('Você atingiu o limite de tickets para este mês. Faça upgrade do seu plano para criar mais tickets.');
      }

      // Prepare ticket data
      const ticketPayload = {
        user_phone: cliente.phone,
        type: ticketData.type,
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        attachments: ticketData.attachments ? [] : [], // TODO: Implement file upload
      };

      const { data, error } = await supabase
        .from('support_tickets')
        .insert(ticketPayload)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar ticket: ${error.message}`);
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch tickets
      queryClient.invalidateQueries({ queryKey: ['support-tickets', cliente?.phone] });
      queryClient.invalidateQueries({ queryKey: ['ticket-limit', cliente?.phone] });
      
      toast.success('Ticket criado com sucesso!', {
        description: `Seu ticket ${data.ticket_number} foi criado e nossa equipe entrará em contato em breve.`,
      });
    },
    onError: (error) => {
      toast.error('Erro ao criar ticket', {
        description: error.message,
      });
    },
  });

  // Update ticket status (for user feedback)
  const updateTicket = useMutation({
    mutationFn: async ({ 
      ticketId, 
      updates 
    }: { 
      ticketId: string; 
      updates: Partial<Pick<SupportTicket, 'subject' | 'description' | 'priority'>> 
    }): Promise<SupportTicket> => {
      if (!cliente?.phone) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId)
        .eq('user_phone', cliente.phone) // Ensure user can only update their own tickets
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar ticket: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', cliente?.phone] });
      toast.success('Ticket atualizado!', {
        description: 'Suas alterações foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar ticket', {
        description: error.message,
      });
    },
  });

  return {
    // Queries
    tickets: getTickets.data || [],
    isLoadingTickets: getTickets.isLoading,
    ticketsError: getTickets.error,
    
    ticketLimit: getTicketLimit.data,
    isLoadingLimit: getTicketLimit.isLoading,
    limitError: getTicketLimit.error,
    
    supportPlanInfo: getSupportPlanInfo.data,
    isLoadingPlanInfo: getSupportPlanInfo.isLoading,
    planInfoError: getSupportPlanInfo.error,
    
    // Mutations
    createTicket: createTicket.mutate,
    isCreatingTicket: createTicket.isPending,
    createTicketError: createTicket.error,
    
    updateTicket: updateTicket.mutate,
    isUpdatingTicket: updateTicket.isPending,
    updateTicketError: updateTicket.error,
    
    // Utils
    refetchTickets: getTickets.refetch,
    refetchLimit: getTicketLimit.refetch,
    refetchPlanInfo: getSupportPlanInfo.refetch,
  };
}
