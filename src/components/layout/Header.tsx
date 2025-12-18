import { Bell, Menu, Search, Settings, User, LogOut, Sun, Moon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/components/ui/sidebar';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotificationsData } from '@/hooks/useNotificationsData';
import { NotificationItem } from '../NotificationItem';
import { ScrollArea } from '../ui/scroll-area';
import { Link, useNavigate } from 'react-router-dom';

export function Header() {
  const { cliente, logout, isLoggingOut } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAsUnread, deleteNotification } = useNotificationsData();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    /**
     * CORREÇÃO DO LOGOUT - FASE 2
     * Removendo navegação dupla - AuthContext já navega
     * Data: 2025-01-16
     */
    await logout(); // AuthContext já navega para /auth/login
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-surface border-b border-border sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
          <Menu className="h-6 w-6" />
        </Button>
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
          <Input placeholder="Pesquisar..." className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-surface-2" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => toggleTheme()}>
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2 z-20">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[320px] md:w-[384px] max-w-[calc(100vw-2rem)] p-2 overflow-hidden">
            <div className="px-2 py-3 border-b border-border">
              <h4 className="font-medium">Notificações</h4>
            </div>
            <ScrollArea className="max-h-[calc(100vh-10rem)] overflow-x-hidden">
              <div className="px-1 py-2 space-y-2">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={markAsRead}
                      onMarkUnread={markAsUnread}
                      onDelete={deleteNotification}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <p>Nenhuma notificação nova.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="px-2 py-2 border-t border-border">
              <Link to="/notifications">
                <Button variant="outline" className="w-full" size="sm">
                  Ver todas as notificações
                </Button>
              </Link>
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <img
                src={cliente?.avatar_url || `https://ui-avatars.com/api/?name=${cliente?.name}&background=random`}
                alt="Avatar"
                className="h-8 w-8 rounded-full"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="data-[disabled]:opacity-50 data-[disabled]:pointer-events-none"
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              <span>{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}