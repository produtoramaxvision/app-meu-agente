import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useNotificationsData } from '@/hooks/useNotificationsData';
import { NotificationsDropdown } from './NotificationsDropdown';

export function NotificationBell() {
  const { unreadCount } = useNotificationsData();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 group overflow-hidden rounded-lg p-2 transition-all duration-200 hover:scale-105 hover:bg-surface/50"
        >
          <span className="relative z-10">
            <Bell className="h-5 w-5 text-text" />
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="end">
        <NotificationsDropdown />
      </PopoverContent>
    </Popover>
  );
}