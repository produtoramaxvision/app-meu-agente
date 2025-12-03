import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage, SendMessagePayload, WebhookResponse } from '@/types/chat';

// Webhook URL from environment variable
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

// LocalStorage key for chat history
const CHAT_STORAGE_KEY = 'meu_agente_chat_history';
const MAX_STORED_MESSAGES = 100;

// Generate unique ID for messages
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Parse stored messages (handle Date conversion)
const parseStoredMessages = (stored: string): ChatMessage[] => {
  try {
    const parsed = JSON.parse(stored);
    return parsed.map((msg: ChatMessage & { timestamp: string }) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch {
    return [];
  }
};

// Load messages from localStorage
const loadFromLocalStorage = (userId: string): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(`${CHAT_STORAGE_KEY}_${userId}`);
    if (!stored) return [];
    return parseStoredMessages(stored);
  } catch (error) {
    console.warn('Failed to load chat history from localStorage:', error);
    return [];
  }
};

// Save messages to localStorage
const saveToLocalStorage = (userId: string, messages: ChatMessage[]) => {
  try {
    // Keep only the last MAX_STORED_MESSAGES messages
    const messagesToStore = messages.slice(-MAX_STORED_MESSAGES);
    localStorage.setItem(
      `${CHAT_STORAGE_KEY}_${userId}`,
      JSON.stringify(messagesToStore)
    );
  } catch (error) {
    console.warn('Failed to save chat history to localStorage:', error);
  }
};

// Clear chat history from localStorage
const clearLocalStorage = (userId: string) => {
  try {
    localStorage.removeItem(`${CHAT_STORAGE_KEY}_${userId}`);
  } catch (error) {
    console.warn('Failed to clear chat history:', error);
  }
};

export function useChatAgent() {
  const { cliente } = useAuth();
  const userId = cliente?.phone || 'anonymous';
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    if (userId && !isInitialized) {
      const storedMessages = loadFromLocalStorage(userId);
      setMessages(storedMessages);
      setIsInitialized(true);
    }
  }, [userId, isInitialized]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (isInitialized && userId) {
      saveToLocalStorage(userId, messages);
    }
  }, [messages, userId, isInitialized]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (payload: SendMessagePayload): Promise<WebhookResponse> => {
      if (!N8N_WEBHOOK_URL) {
        throw new Error('Webhook URL não configurada. Configure VITE_N8N_WEBHOOK_URL no arquivo .env');
      }

      console.log('🚀 Enviando para webhook:', N8N_WEBHOOK_URL);
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));

      try {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log('📥 Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response error:', errorText);
          throw new Error(`Erro na comunicação com o agente: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Response data:', data);
        return data;
      } catch (error) {
        // Detectar erro de CORS
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.error('� Erro de CORS ou rede:', error);
          throw new Error('NetworkError when attempting to fetch resource. Verifique se o CORS está habilitado no n8n e se o workflow está ativo.');
        }
        throw error;
      }
    },
    onError: (error: Error) => {
      console.error('Chat webhook error:', error);
      toast.error('Erro ao enviar mensagem', {
        description: error.message || 'Não foi possível se comunicar com o agente. Tente novamente.',
      });
    },
  });

  // Add a user message and send to webhook
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessageId = generateId();
    const userMessage: ChatMessage = {
      id: userMessageId,
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    // Add user message optimistically
    setMessages(prev => [...prev, userMessage]);

    try {
      // Montar payload com todas as informações do cliente
      const payload: SendMessagePayload = {
        message: content.trim(),
        timestamp: new Date().toISOString(),
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

      const response = await sendMessageMutation.mutateAsync(payload);

      // Update user message status to sent
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessageId ? { ...msg, status: 'sent' as const } : msg
        )
      );

      // Add assistant response
      if (response.success && response.data?.response) {
        const assistantMessage: ChatMessage = {
          id: generateId(),
          content: response.data.response,
          role: 'assistant',
          timestamp: new Date(),
          status: 'sent',
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      // Update user message status to error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === userMessageId ? { ...msg, status: 'error' as const } : msg
        )
      );
    }
  }, [userId, sendMessageMutation]);

  // Retry sending a failed message
  const retryMessage = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.status !== 'error') return;

    // Remove the failed message
    setMessages(prev => prev.filter(m => m.id !== messageId));
    
    // Resend
    await sendMessage(message.content);
  }, [messages, sendMessage]);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    clearLocalStorage(userId);
    toast.success('Histórico de chat limpo');
  }, [userId]);

  return {
    messages,
    sendMessage,
    retryMessage,
    clearMessages,
    isLoading: sendMessageMutation.isPending,
    messagesEndRef,
    isWebhookConfigured: !!N8N_WEBHOOK_URL,
  };
}
