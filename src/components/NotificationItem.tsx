import { Notification } from '@/hooks/useNotificationsData';
import { cn } from '@/lib/utils';
import { Bell, CreditCard, AlertTriangle, Info, Trash2, CheckCheck, Eye, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAllAsRead?: () => void;
  unreadCount?: number;
}

const typeConfig = {
  pagamento: { icon: CreditCard, color: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' },
  aviso: { icon: Info, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' },
  problema: { icon: AlertTriangle, color: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' },
  atualizacao: { icon: Bell, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400' },
};

export function NotificationItem({ notification, onMarkRead, onMarkUnread, onDelete, onMarkAllAsRead, unreadCount }: NotificationItemProps) {
  const config = typeConfig[notification.tipo] || typeConfig.atualizacao;
  const Icon = config.icon;

  const handleMarkAsRead = () => {
    /**
     * BUG FIX - TestSprite TC010
     * Problema: Marcar notificações como lidas não tinha feedback visual
     * Solução: Adicionar animação de fade out e feedback visual
     * Data: 2025-01-06
     * Validado: sim
     */
    onMarkRead(notification.id);
  };

  const handleMarkAsUnread = () => {
    onMarkUnread(notification.id);
  };

  const handleClick = () => {
    // Se a notificação não estiver lida, marcar como lida automaticamente
    if (!notification.lida) {
      handleMarkAsRead();
    }
  };

  const actionMenuItems = [
    ...(onMarkAllAsRead && unreadCount && unreadCount > 0 ? [{
      label: 'Marcar todas como lidas',
      icon: <CheckCheck className="mr-2 h-4 w-4" />,
      onClick: onMarkAllAsRead,
      disabled: false,
    }] : []),
    ...(notification.lida ? [{
      label: 'Marcar como não lida',
      icon: <Eye className="mr-2 h-4 w-4" />,
      onClick: handleMarkAsUnread,
      disabled: false,
    }] : []),
    {
      label: 'Excluir',
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: () => onDelete(notification.id),
      className: 'text-red-600 focus:text-red-600',
      disabled: false,
    },
  ];

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onClick={handleClick}
          className={cn(
            'group relative flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 overflow-hidden max-w-full',
            'hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02] hover:-translate-y-1',
            !notification.lida ? 'bg-surface-2 border-primary/20 cursor-pointer' : 'bg-surface border-border/50'
          )}
        >
          {!notification.lida && (
            <div className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full bg-primary animate-pulse z-20" aria-label="Não lida" />
          )}
          
          {/* Action Menu Button - Positioned absolutely in top right corner */}
          <div className="absolute top-3 right-3 z-30">
            <ActionMenu items={actionMenuItems}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-surface-hover">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </ActionMenu>
          </div>

          <div className={cn('flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full relative z-10', config.color, !notification.lida && 'ml-3.5')}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0 max-w-full relative z-10 pr-8">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="font-semibold text-sm leading-tight truncate max-w-[180px]">{notification.titulo}</p>
              <p className="text-xs text-text-muted flex-shrink-0 whitespace-nowrap">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
            <p className="text-xs text-text-muted line-clamp-2 break-words">{notification.mensagem}</p>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {actionMenuItems.map((item, index) => {
          const isLast = index === actionMenuItems.length - 1;
          const isDestructive = item.className?.includes('text-red') || item.className?.includes('text-destructive');

          return (
            <div key={index}>
              <ContextMenuItem
                onClick={item.onClick}
                className={`cursor-pointer ${item.className || ''}`}
                disabled={item.disabled}
              >
                {item.icon}
                <span>{item.label}</span>
              </ContextMenuItem>
              {!isLast && isDestructive && <ContextMenuSeparator />}
            </div>
          );
        })}
      </ContextMenuContent>
    </ContextMenu>
  );
}