import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useRealtimeFinancialAlerts } from '@/hooks/useRealtimeFinancialAlerts';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const { cliente } = useAuth();
  const { mobileOpen, setMobileOpen, isMobile } = useSidebar();
  const location = useLocation();
  const isCRM = location.pathname.startsWith('/crm');

  // Hook para scroll automático para o topo em mudanças de rota
  useScrollToTop();

  // Hook para alertas financeiros em tempo real
  useRealtimeFinancialAlerts(cliente?.phone);

  return (
    <div className="flex flex-col h-screen w-full bg-[hsl(var(--sidebar-bg))]">
      {/* Main flex container for sidebar + content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Sidebar - Full height within flex container */}
        <div className="hidden md:block h-full">
          <AppSidebar />
        </div>
        
        {/* Mobile Sidebar Overlay with animations */}
        {mobileOpen && isMobile && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop with fade animation */}
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity duration-300 opacity-100"
              onClick={() => setMobileOpen(false)} 
            />
            {/* Sidebar with slide animation - Full height to overlay footer */}
            <div className="fixed left-0 top-0 h-full w-64 transition-transform duration-300 ease-in-out animate-in slide-in-from-left">
              <AppSidebar showCloseButton />
            </div>
          </div>
        )}
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[hsl(var(--sidebar-bg))]">
          <AppHeader />
          {/* Scrollbar grudada na borda da viewport; padding fica dentro do conteúdo */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="w-full">
              <div
                className={`h-full flex flex-col min-w-0 ${
                  isCRM
                    ? 'w-full max-w-none p-0'
                    : 'max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8'
                }`}
              >
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Footer outside flex container - full width */}
      <AppFooter />
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultCollapsed={true}>
      <NotificationProvider>
        <AppLayoutContent>{children}</AppLayoutContent>
      </NotificationProvider>
    </SidebarProvider>
  );
}