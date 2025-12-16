import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  phone: string;
  tipo: 'pagamento' | 'aviso' | 'problema' | 'atualizacao';
  titulo: string;
  mensagem: string;
  lida: boolean;
  data: Record<string, unknown> | null;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { cliente } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (phone: string) => {
    console.log('📥 Buscando notificações para:', phone);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('phone', phone)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar notificações:', error);
        throw error;
      }

      const typedData = data as Notification[];
      const unreadNotifications = typedData?.filter(n => !n.lida) || [];
      
      console.log('📊 Notificações encontradas:', typedData?.length || 0);
      console.log('🔴 Não lidas:', unreadNotifications.length);
      
      setNotifications(typedData || []);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      toast.error('Erro ao buscar notificações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cliente?.phone) {
      fetchNotifications(cliente.phone);
    }
  }, [cliente?.phone, fetchNotifications]);

  useEffect(() => {
    if (!cliente?.phone) return;

    // Configurar autenticação Realtime antes da subscrição
    const setupRealtime = async () => {
      try {
        // Garantir que a autenticação Realtime está configurada
        await supabase.realtime.setAuth();
        
        const channel: RealtimeChannel = supabase.channel(`notifications:${cliente.phone}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: `phone=eq.${cliente.phone}` 
          },
            (payload) => {
              console.log('🔔 Nova notificação recebida:', payload);
              const newNotification = payload.new as Notification;
              
              // Atualizar estado
              setNotifications(current => [newNotification, ...current]);
              setUnreadCount(current => current + 1);
              
              // Mostrar toast
              toast.info(newNotification.titulo, {
                description: newNotification.mensagem,
                duration: 5000,
              });
            }
          )
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `phone=eq.${cliente.phone}`
          }, (payload) => {
            console.log('📝 Notificação atualizada:', payload);
            const updatedNotification = payload.new as Notification;
            
            // Atualizar notificação local
            setNotifications(current =>
              current.map(n => 
                n.id === updatedNotification.id 
                  ? updatedNotification
                  : n
              )
            );
            
            // Recalcular contagem de não lidas
            setNotifications(prev => {
              const unread = prev.filter(n => !n.lida).length;
              setUnreadCount(unread);
              return prev;
            });
          })
          .on('system', {}, (status) => {
            console.log('📡 Status Realtime:', status);
          })
          .subscribe((status) => {
            console.log('🔌 Canal de notificações:', status);
            if (status === 'SUBSCRIBED') {
              console.log('✅ Conectado ao canal de notificações em tempo real');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Erro no canal de notificações');
            }
          });

        return channel;
      } catch (error) {
        console.error('❌ Erro ao configurar Realtime:', error);
        toast.error('Erro ao conectar notificações em tempo real');
        return null;
      }
    };

    let channel: RealtimeChannel | null = null;
    
    setupRealtime().then((ch) => {
      channel = ch;
    });

    return () => {
      if (channel) {
        console.log('🔌 Desconectando canal de notificações');
        supabase.removeChannel(channel);
      }
    };
  }, [cliente?.phone]);

  const markAsRead = useCallback(async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.lida) return;

    console.log('📖 Marcando notificação como lida:', id);

    // Atualização otimista
    setNotifications(current =>
      current.map(n => (n.id === id ? { ...n, lida: true } : n))
    );
    setUnreadCount(current => Math.max(0, current - 1));

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ lida: true })
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao marcar como lida:', error);
        throw error;
      }

      console.log('✅ Notificação marcada como lida com sucesso');
      toast.success('Notificação marcada como lida');
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      
      // Reverter atualização otimista em caso de erro
      setNotifications(current =>
        current.map(n => (n.id === id ? { ...n, lida: false } : n))
      );
      setUnreadCount(current => current + 1);
      
      toast.error('Erro ao marcar notificação como lida.');
    }
  }, [notifications, setNotifications, setUnreadCount]);

  const markAsUnread = useCallback(async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || !notification.lida) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ lida: false })
        .eq('id', id);

      if (error) throw error;

      setNotifications(current =>
        current.map(n => (n.id === id ? { ...n, lida: false } : n))
      );
      setUnreadCount(current => current + 1);
      
      toast.success('Notificação marcada como não lida');
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      toast.error('Erro ao marcar notificação como não lida.');
    }
  }, [notifications, setNotifications, setUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    if (!cliente?.phone || unreadCount === 0) return;

    console.log('📖 Marcando todas as notificações como lidas:', unreadCount);

    // Atualização otimista
    setNotifications(current => current.map(n => ({ ...n, lida: true })));
    const previousUnreadCount = unreadCount;
    setUnreadCount(0);

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ lida: true })
        .eq('phone', cliente.phone)
        .eq('lida', false);

      if (error) {
        console.error('❌ Erro ao marcar todas como lidas:', error);
        throw error;
      }

      console.log('✅ Todas as notificações marcadas como lidas com sucesso');
      toast.success(`${previousUnreadCount} notificação(ões) marcada(s) como lida(s)`);
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      
      // Reverter atualização otimista em caso de erro
      setNotifications(current => current.map(n => ({ ...n, lida: false })));
      setUnreadCount(previousUnreadCount);
      
      toast.error('Erro ao marcar todas as notificações como lidas.');
    }
  }, [cliente?.phone, unreadCount, setNotifications, setUnreadCount]);

  const deleteNotification = useCallback(async (id: string) => {
    console.log('🗑️ Excluindo notificação:', id);
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir notificação:', error);
        throw error;
      }

      const wasUnread = notifications.find(n => n.id === id)?.lida === false;
      setNotifications(current => current.filter(n => n.id !== id));
      if (wasUnread) {
        setUnreadCount(current => Math.max(0, current - 1));
      }
      
      console.log('✅ Notificação excluída com sucesso');
      toast.success('Notificação excluída.');
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      toast.error('Erro ao excluir notificação.');
    }
  }, [notifications, setNotifications, setUnreadCount]);

  const refetch = useCallback(() => {
    if (cliente?.phone) {
      return fetchNotifications(cliente.phone);
    }
    return Promise.resolve();
  }, [cliente?.phone, fetchNotifications]);

  // ✅ OTIMIZAÇÃO: Memoizar value do context (padrão React.dev)
  const contextValue = useMemo<NotificationContextType>(() => ({
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    refetch,
  }), [notifications, loading, unreadCount, markAsRead, markAsUnread, markAllAsRead, deleteNotification, refetch]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
