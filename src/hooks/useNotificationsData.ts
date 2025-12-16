import { useNotifications } from '@/contexts/NotificationContext';

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

export function useNotificationsData() {
  return useNotifications();
}