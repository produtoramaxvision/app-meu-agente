import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EvolutionContact } from '@/types/sdr';

// ============================================================================
// TIPOS
// ============================================================================

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  types: {
    status_change: boolean;
    whatsapp_received: boolean;
    email_opened: boolean;
    task_due: boolean;
    lead_hot: boolean;
  };
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  sound: true,
  desktop: false,
  types: {
    status_change: true,
    whatsapp_received: true,
    email_opened: true,
    task_due: true,
    lead_hot: true,
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function playNotificationSound() {
  try {
    // Som sutil de notificação
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjqO1fLTgDQGHm7A7+OYSA0PXbXo7KdXFQlCnuDyvXEfBTmL0/LXfzEGG2u+7uWURA0PWbTn7qRaEw==');
    audio.volume = 0.3;
    audio.play().catch(console.error);
  } catch (error) {
    console.error('Erro ao tocar som:', error);
  }
}

function showBrowserNotification(title: string, body?: string, onClick?: () => void) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'meu-agente-crm',
    });

    if (onClick) {
      notification.onclick = onClick;
    }

    // Auto-close após 5 segundos
    setTimeout(() => notification.close(), 5000);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
}

// ============================================================================
// HOOK: useNotificationSettings
// Gerencia as preferências de notificação do usuário
// ============================================================================

export function useNotificationSettings() {
  const { cliente } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  // Carregar configurações do localStorage
  useEffect(() => {
    if (cliente?.phone) {
      const stored = localStorage.getItem(`notification_settings_${cliente.phone}`);
      if (stored) {
        try {
          setSettings(JSON.parse(stored));
        } catch (error) {
          console.error('Erro ao carregar configurações:', error);
        }
      }
    }
  }, [cliente?.phone]);

  const updateSettings = (updates: Partial<NotificationSettings>) => {
    if (!cliente?.phone) return;

    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem(`notification_settings_${cliente.phone}`, JSON.stringify(newSettings));
  };

  return {
    settings,
    updateSettings,
  };
}

// ============================================================================
// HOOK: useRealtimeNotifications
// Conecta ao Supabase Realtime e dispara notificações
// ============================================================================

export function useRealtimeNotifications() {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();
  const { settings } = useNotificationSettings();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!cliente?.phone || !settings.enabled) {
      setIsConnected(false);
      return;
    }

    console.log('[Realtime] Iniciando conexão para:', cliente.phone);

    // Canal para mudanças nos contatos (evolution_contacts)
    const contactsChannel = supabase
      .channel(`crm-contacts-${cliente.phone}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evolution_contacts',
          filter: `phone=eq.${cliente.phone}`,
        },
        (payload) => {
          console.log('[Realtime] Contato atualizado:', payload);
          
          const oldContact = payload.old as EvolutionContact;
          const newContact = payload.new as EvolutionContact;

          // Notificação de mudança de status
          if (
            settings.types.status_change &&
            oldContact.crm_lead_status !== newContact.crm_lead_status &&
            newContact.crm_lead_status
          ) {
            const message = `${newContact.push_name || 'Lead'} foi movido para ${newContact.crm_lead_status}`;
            
            toast.success(message, {
              description: format(new Date(), 'HH:mm', { locale: ptBR }),
              duration: 6000,
            });

            if (settings.sound) {
              playNotificationSound();
            }

            if (settings.desktop) {
              showBrowserNotification('Status do Lead Alterado', message);
            }
          }

          // Notificação de lead esquentando
          if (
            settings.types.lead_hot &&
            oldContact.crm_lead_score !== newContact.crm_lead_score &&
            newContact.crm_lead_score - (oldContact.crm_lead_score || 0) >= 20
          ) {
            const message = `${newContact.push_name || 'Lead'} está aquecendo! Score: ${newContact.crm_lead_score}`;
            
            toast('🔥 Lead Quente!', {
              description: message,
              duration: 8000,
            });

            if (settings.sound) {
              playNotificationSound();
            }

            if (settings.desktop) {
              showBrowserNotification('Lead Aqueceu!', message);
            }
          }

          // Invalidar cache do React Query
          queryClient.invalidateQueries({ queryKey: ['evolution-contacts'] });
          queryClient.invalidateQueries({ queryKey: ['crm-pipeline'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'evolution_contacts',
          filter: `phone=eq.${cliente.phone}`,
        },
        (payload) => {
          console.log('[Realtime] Novo contato adicionado:', payload);
          
          const newContact = payload.new as EvolutionContact;
          
          toast.info('Novo Lead Adicionado', {
            description: newContact.push_name || newContact.remote_jid,
            duration: 4000,
          });

          if (settings.sound) {
            playNotificationSound();
          }

          queryClient.invalidateQueries({ queryKey: ['evolution-contacts'] });
          queryClient.invalidateQueries({ queryKey: ['crm-pipeline'] });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Status da conexão (WhatsApp/Contatos):', status);
        setIsConnected(status === 'SUBSCRIBED');

        if (status === 'SUBSCRIBED') {
          console.log('✅ Canal de contatos Evolution conectado com sucesso');
          // Toast removido para evitar duplicação com NotificationContext
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro ao conectar canal de contatos');
          toast.error('Erro ao conectar notificações de mensagens', {
            description: 'Contatos do WhatsApp podem não atualizar em tempo real',
          });
          setIsConnected(false);
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Timeout ao conectar canal de contatos');
          toast.error('Timeout ao conectar notificações de mensagens', {
            description: 'Verifique sua conexão com a internet',
          });
          setIsConnected(false);
        }
      });

    // Cleanup ao desmontar
    return () => {
      console.log('[Realtime] Desconectando canal');
      contactsChannel.unsubscribe();
      supabase.removeChannel(contactsChannel);
      setIsConnected(false);
    };
  }, [cliente?.phone, settings, queryClient]);

  return {
    isConnected,
    settings,
  };
}
