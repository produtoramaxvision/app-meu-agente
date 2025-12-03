import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ChatMessage, 
  ChatSession,
  SendMessagePayload, 
  WebhookResponse 
} from '@/types/chat';

// Webhook URL from environment variable
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

// Generate unique ID for optimistic messages
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function useChatAgent() {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();
  const phone = cliente?.phone || '';
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // =====================================================
  // Query: Buscar sessão ativa ou criar uma nova
  // =====================================================
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ['chat-session', phone],
    queryFn: async (): Promise<ChatSession | null> => {
      if (!phone) return null;

      // Buscar sessão mais recente do usuário
      const { data: sessions, error } = await supabase
        .from('chat_ia_sessions')
        .select('*')
        .eq('phone', phone)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching session:', error);
        throw error;
      }

      if (sessions && sessions.length > 0) {
        const dbSession = sessions[0];
        setCurrentSessionId(dbSession.id);
        return {
          id: dbSession.id,
          phone: dbSession.phone,
          title: dbSession.title,
          messages: [],
          createdAt: new Date(dbSession.created_at || Date.now()),
          updatedAt: new Date(dbSession.updated_at || Date.now()),
        };
      }

      return null;
    },
    enabled: !!phone,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // =====================================================
  // Query: Buscar mensagens da sessão atual
  // =====================================================
  const { data: dbMessages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat-messages', currentSessionId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!currentSessionId) return [];

      const { data, error } = await supabase
        .from('chat_ia_messages')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      return (data || []).map((msg) => ({
        id: msg.id,
        sessionId: msg.session_id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        timestamp: new Date(msg.created_at || Date.now()),
        status: msg.status as 'sending' | 'sent' | 'error',
        metadata: msg.metadata as Record<string, unknown> | undefined,
      }));
    },
    enabled: !!currentSessionId,
    staleTime: 1000 * 30, // 30 segundos
  });

  // Combinar mensagens do banco com otimistas
  // Filtra mensagens otimistas que já existem no banco (comparando por conteúdo e role)
  const messages = [...dbMessages, ...optimisticMessages.filter(
    om => !dbMessages.some(dm => 
      dm.content === om.content && 
      dm.role === om.role &&
      // Considera duplicada se foi criada nos últimos 30 segundos
      Math.abs(new Date(dm.timestamp).getTime() - om.timestamp.getTime()) < 30000
    )
  )];

  // =====================================================
  // Mutation: Criar nova sessão
  // =====================================================
  const createSessionMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      const { data, error } = await supabase
        .from('chat_ia_sessions')
        .insert({ phone })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: (sessionId) => {
      setCurrentSessionId(sessionId);
      queryClient.invalidateQueries({ queryKey: ['chat-session', phone] });
    },
    onError: (error) => {
      console.error('Error creating session:', error);
      toast.error('Erro ao criar sessão de chat');
    },
  });

  // =====================================================
  // Mutation: Enviar mensagem
  // =====================================================
  const sendMessageMutation = useMutation({
    mutationFn: async ({ 
      content, 
      sessionId 
    }: { 
      content: string; 
      sessionId: string;
    }): Promise<{ userMessageId: string; assistantResponse: string }> => {
      // Cancelar queries pendentes para evitar race conditions
      await queryClient.cancelQueries({ queryKey: ['chat-messages', sessionId] });

      // 1. Inserir mensagem do usuário no banco
      const { data: userMsg, error: userError } = await supabase
        .from('chat_ia_messages')
        .insert({
          session_id: sessionId,
          phone,
          role: 'user',
          content,
          status: 'sent',
        })
        .select('id')
        .single();

      if (userError) throw userError;

      // Limpar mensagem otimista do usuário imediatamente após inserir no banco
      setOptimisticMessages(prev => prev.filter(m => m.content !== content || m.role !== 'user'));

      // 2. Chamar webhook do n8n
      if (!N8N_WEBHOOK_URL) {
        throw new Error('Webhook URL não configurada');
      }

      const payload: SendMessagePayload = {
        message: content,
        timestamp: new Date().toISOString(),
        sessionId,
        cliente: {
          phone: cliente?.phone || '',
          name: cliente?.name || '',
          email: cliente?.email,
          cpf: cliente?.cpf,
          avatar_url: cliente?.avatar_url,
          subscription_active: cliente?.subscription_active || false,
          is_active: cliente?.is_active || false,
          plan_id: cliente?.plan_id,
          created_at: cliente?.created_at,
        },
      };

      console.log('🚀 Enviando para webhook:', N8N_WEBHOOK_URL);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erro na comunicação com o agente: ${response.status}`);
      }

      const data: WebhookResponse = await response.json();
      console.log('✅ Response data:', data);

      if (!data.success || !data.data?.response) {
        throw new Error(data.error || 'Resposta inválida do agente');
      }

      // 3. Inserir resposta do assistente no banco
      const { error: assistantError } = await supabase
        .from('chat_ia_messages')
        .insert({
          session_id: sessionId,
          phone,
          role: 'assistant',
          content: data.data.response,
          status: 'sent',
          metadata: data.data.metadata || {},
        });

      if (assistantError) {
        console.error('Error saving assistant message:', assistantError);
      }

      return {
        userMessageId: userMsg.id,
        assistantResponse: data.data.response,
      };
    },
    onSuccess: () => {
      // Limpar mensagens otimistas e recarregar do banco
      setOptimisticMessages([]);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', currentSessionId] });
    },
    onError: (error: Error, variables) => {
      console.error('Chat error:', error);
      
      // Atualizar mensagem otimista para status de erro
      setOptimisticMessages(prev => 
        prev.map(msg => 
          msg.content === variables.content 
            ? { ...msg, status: 'error' as const }
            : msg
        )
      );

      toast.error('Erro ao enviar mensagem', {
        description: error.message || 'Não foi possível se comunicar com o agente.',
      });
    },
  });

  // =====================================================
  // Mutation: Limpar histórico
  // =====================================================
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!currentSessionId) return;

      // Deletar todas as mensagens da sessão
      const { error: messagesError } = await supabase
        .from('chat_ia_messages')
        .delete()
        .eq('session_id', currentSessionId);

      if (messagesError) throw messagesError;

      // Deletar a sessão
      const { error: sessionError } = await supabase
        .from('chat_ia_sessions')
        .delete()
        .eq('id', currentSessionId);

      if (sessionError) throw sessionError;
    },
    onSuccess: () => {
      setCurrentSessionId(null);
      setOptimisticMessages([]);
      queryClient.invalidateQueries({ queryKey: ['chat-session', phone] });
      queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
      toast.success('Histórico de chat limpo');
    },
    onError: (error) => {
      console.error('Error clearing history:', error);
      toast.error('Erro ao limpar histórico');
    },
  });

  // =====================================================
  // Scroll automático para novas mensagens
  // =====================================================
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // =====================================================
  // Realtime subscription para mensagens
  // =====================================================
  useEffect(() => {
    if (!currentSessionId) return;

    const channel = supabase
      .channel(`chat_messages_${currentSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_ia_messages',
          filter: `session_id=eq.${currentSessionId}`,
        },
        () => {
          // Recarregar mensagens quando houver nova inserção
          queryClient.invalidateQueries({ queryKey: ['chat-messages', currentSessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSessionId, queryClient]);

  // =====================================================
  // Funções públicas
  // =====================================================

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !phone) return;

    let sessionId = currentSessionId;

    // Criar sessão se não existir
    if (!sessionId) {
      try {
        sessionId = await createSessionMutation.mutateAsync();
      } catch {
        return;
      }
    }

    // Adicionar mensagem otimista
    const tempMessage: ChatMessage = {
      id: generateTempId(),
      sessionId: sessionId!,
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setOptimisticMessages(prev => [...prev, tempMessage]);

    // Enviar para o servidor
    await sendMessageMutation.mutateAsync({
      content: content.trim(),
      sessionId: sessionId!,
    });
  }, [phone, currentSessionId, createSessionMutation, sendMessageMutation]);

  const retryMessage = useCallback(async (messageId: string) => {
    // Buscar a mensagem com erro
    const errorMessage = optimisticMessages.find(m => m.id === messageId && m.status === 'error');
    if (!errorMessage) return;

    // Remover a mensagem com erro
    setOptimisticMessages(prev => prev.filter(m => m.id !== messageId));

    // Reenviar
    await sendMessage(errorMessage.content);
  }, [optimisticMessages, sendMessage]);

  const clearMessages = useCallback(() => {
    clearHistoryMutation.mutate();
  }, [clearHistoryMutation]);

  // =====================================================
  // Retorno do hook
  // =====================================================

  return {
    messages,
    session,
    sendMessage,
    retryMessage,
    clearMessages,
    isLoading: sendMessageMutation.isPending || isLoadingSession || isLoadingMessages,
    messagesEndRef,
    isWebhookConfigured: !!N8N_WEBHOOK_URL,
    currentSessionId,
  };
}
