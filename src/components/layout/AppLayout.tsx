import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useRealtimeFinancialAlerts } from '@/hooks/useRealtimeFinancialAlerts';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { cliente } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Hook para scroll automático para o topo em mudanças de rota
  useScrollToTop();

  // Hook para alertas financeiros em tempo real
  useRealtimeFinancialAlerts(cliente?.phone);

  // Handle sidebar close with animation
  const handleSidebarClose = () => {
    setIsClosing(true);
    // Delay the actual close to allow exit animation
    setTimeout(() => {
      setSidebarOpen(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  // Handle sidebar open with animation
  const handleSidebarOpen = () => {
    setSidebarOpen(true);
    setIsClosing(false);
  };

  // Handle sidebar toggle (for mobile menu button)
  const handleSidebarToggle = () => {
    if (sidebarOpen) {
      handleSidebarClose();
    } else {
      handleSidebarOpen();
    }
  };

  return (
    <NotificationProvider>
      <div className="flex h-screen w-full bg-bg overflow-x-visible">
        {/* Desktop Sidebar - Height to stop exactly at footer line */}
        <div className="hidden md:block h-[calc(100vh-2.6rem)]">
          <AppSidebar 
            collapsed={sidebarCollapsed} 
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />
        </div>
        
        {/* Mobile Sidebar Overlay with animations */}
        {(sidebarOpen || isClosing) && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop with fade animation */}
            <div 
              className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${
                isClosing ? 'opacity-0' : 'opacity-100'
              }`}
              onClick={handleSidebarClose} 
            />
            {/* Sidebar with slide animation - Full height to overlay footer */}
            <div className={`fixed left-0 top-0 h-full w-64 transition-transform duration-300 ease-in-out ${
              isClosing ? 'animate-out slide-out-to-left' : 'animate-in slide-in-from-left'
            }`}>
              <AppSidebar 
                collapsed={false} 
                onToggle={handleSidebarClose} 
                showCloseButton={true}
              />
            </div>
          </div>
        )}
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <AppHeader 
            onMenuClick={handleSidebarToggle} 
            isMenuOpen={sidebarOpen}
          />
          {/* Scrollbar grudada na borda da viewport; padding fica dentro do conteúdo */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="w-full">
              <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col min-w-0">
                {children}
              </div>
            </div>
          </main>
          <AppFooter />
        </div>
      </div>
    </NotificationProvider>
  );
}