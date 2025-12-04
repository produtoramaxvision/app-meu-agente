import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, User, LogOut, Wallet, Target, Bell, CheckSquare, CalendarDays, X, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationsData } from '@/hooks/useNotificationsData';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { QuickActions } from '@/components/QuickActions';
import { HelpAndSupport } from '@/components/HelpAndSupport';

const navigation = [
  { name: 'Chat IA', href: '/chat', icon: MessageCircle },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Agenda', href: '/agenda', icon: CalendarDays },
  { name: 'Contas', href: '/contas', icon: Wallet },
  { name: 'Metas', href: '/metas', icon: Target },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
  { name: 'Notificações', href: '/notificacoes', icon: Bell },
  { name: 'Perfil', href: '/perfil', icon: User },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  showCloseButton?: boolean;
}

export function AppSidebar({ collapsed, onToggle, showCloseButton = false }: AppSidebarProps) {
  const { logout, isLoggingOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount } = useNotificationsData();

  const handleLogout = async () => {
    /**
     * CORREÇÃO DO LOGOUT - FASE 2
     * Adicionando tratamento de erro robusto
     * Data: 2025-01-16
     */
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: navegar manualmente se logout falhar
      navigate('/auth/login');
    }
  };

  return (
    <aside
      onClick={(e) => {
        const target = e.target as HTMLElement;
        
        // CORREÇÃO CRÍTICA - Melhorar detecção de elementos interativos
        // Problema: onClick do aside interferia com NavLinks causando múltiplos cliques
        // Solução: Detecção mais precisa de elementos interativos
        // Data: 2025-01-16
        
        // Verificar se o clique foi em um elemento interativo
        const isInteractive = target.closest(`
          a, button, input, textarea, select, 
          [role="button"], [role="link"], [role="menuitem"], [role="tab"],
          [data-radix-portal], [role="dialog"], [data-state],
          .group, [class*="hover:"], [class*="transition"]
        `);
        
        // Verificar se o clique foi especificamente em um NavLink
        const isNavLink = target.closest('a[href]');
        
        // Verificar se há algum modal/dialog aberto (incluindo popovers)
        const hasOpenModal = document.querySelector('[role="dialog"][data-state="open"]');
        const hasOpenPopover = document.querySelector('[data-radix-popper-content-wrapper]');
        const hasOpenTooltip = document.querySelector('[data-radix-tooltip-content]');
        
        // Verificar se o clique foi em uma área vazia (background do sidebar)
        const isInEmptyArea = target === e.currentTarget || 
          (target.classList.contains('relative') && 
          !target.closest('nav, button, a, [role="button"]'));
        
        // Permitir toggle apenas quando colapsado, em áreas vazias e sem elementos interativos
        const shouldToggle = collapsed && 
                           !isInteractive && 
                           !isNavLink && 
                           !hasOpenModal && 
                           !hasOpenPopover && 
                           !hasOpenTooltip &&
                           isInEmptyArea;
        
        if (shouldToggle) {
          onToggle();
        }
      }}
      className={cn(
        'relative flex flex-col border-r transition-all duration-300 flex-shrink-0 h-full',
        'bg-[hsl(var(--sidebar-bg))] border-[hsl(var(--sidebar-border))]',
        collapsed ? 'w-16 cursor-pointer' : 'w-64'
      )}
    >
      {/* Mobile Header with X button and Logo */}
      {showCloseButton && (
        <div className="flex items-center justify-between p-4 md:hidden border-b border-[hsl(var(--sidebar-border))]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-2 rounded-md hover:bg-[hsl(var(--sidebar-hover))] transition-colors"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5 text-[hsl(var(--sidebar-text))]" />
          </button>
          <NavLink 
            to="/chat" 
            onClick={(e) => e.stopPropagation()}
            className="transition-transform hover:scale-105"
          >
            <Logo showText={true} size="md" />
          </NavLink>
        </div>
      )}

      {/* Desktop Logo */}
      {!showCloseButton && (
        <div className={cn(
          "flex h-16 items-center border-b border-[hsl(var(--sidebar-border))] transition-all",
          collapsed ? 'px-2 justify-center' : 'px-6'
        )}>
          <NavLink 
            to="/chat" 
            onClick={(e) => e.stopPropagation()}
            className="transition-transform hover:scale-105"
          >
            <Logo showText={!collapsed} size={collapsed ? 'sm' : 'md'} />
          </NavLink>
          
          {/* Área clicável para expandir quando colapsado */}
          {collapsed && (
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              title="Clique para expandir sidebar"
            />
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-b border-[hsl(var(--sidebar-border))] py-4">
        <QuickActions collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1 transition-all relative", collapsed ? 'p-2' : 'p-4')}>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const isNotifications = item.name === 'Notificações';
          return (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] text-white shadow-lg'
                : 'text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))] hover:shadow-md',
              collapsed && 'justify-center'
            )}
          >
            <div className="relative z-10 transition-transform duration-200 group-hover:scale-110">
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-white')} />
              {isNotifications && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2 z-20">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>
            {!collapsed && <span className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5">{item.name}</span>}
          </NavLink>
          );
        })}
        
        {/* Área clicável para expandir quando colapsado */}
        {collapsed && (
          <div 
            className="absolute inset-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            title="Clique para expandir sidebar"
          />
        )}
      </nav>

      {/* Help and Logout Section */}
      <div className="mt-auto">
        {/* Help */}
        <div className={cn("transition-all", collapsed ? 'p-2' : 'p-4')}>
          <HelpAndSupport collapsed={collapsed} mode="sidebar" />
        </div>

        {/* Logout */}
        <div className={cn("border-t border-[hsl(var(--sidebar-border))] transition-all", collapsed ? 'p-2' : 'p-4')}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            disabled={isLoggingOut}
            className={cn(
              "group relative overflow-hidden flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              'text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))] hover:scale-105 hover:shadow-lg',
              'disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100',
              collapsed && 'justify-center'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            {isLoggingOut ? (
              <Loader2 className="h-5 w-5 flex-shrink-0 relative z-10 animate-spin" />
            ) : (
              <LogOut className="h-5 w-5 flex-shrink-0 relative z-10 transition-transform group-hover:scale-110" />
            )}
            {!collapsed && (
              <span className="relative z-10">
                {isLoggingOut ? 'Saindo...' : 'Sair'}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}