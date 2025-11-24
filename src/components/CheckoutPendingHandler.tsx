import { useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStripeCheckout, PlanType } from '@/hooks/useStripeCheckout';
import { toast } from 'sonner';

export function CheckoutPendingHandler() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, cliente, loading: authLoading } = useAuth();
  const { startCheckout, isLoading: isCheckoutLoading } = useStripeCheckout();
  const processedRef = useRef(false);

  // 1. Capture intention from URL
  useEffect(() => {
    const redirectParam = searchParams.get('redirect');
    const planParam = searchParams.get('plan');

    if (redirectParam === 'checkout' && planParam) {
      const normalizedPlan = planParam.toLowerCase();
      if (['basic', 'business', 'premium'].includes(normalizedPlan)) {
        localStorage.setItem('checkout_pending_plan', normalizedPlan);
        localStorage.setItem('checkout_pending_timestamp', Date.now().toString());
        console.log(`Checkout intention captured for plan: ${normalizedPlan}`);
      }
    }
  }, [searchParams]);

  // 2. Process intention when authenticated AND in a protected route
  useEffect(() => {
    // Apenas prosseguir se:
    // - Auth terminou de carregar
    // - Temos usuário logado
    // - Checkout não está em andamento
    // - Ainda não processamos nesta sessão do componente
    if (authLoading || !user || isCheckoutLoading || processedRef.current) return;

    // 🔒 TRAVA DE SEGURANÇA DE ROTA:
    // O checkout só deve iniciar se o usuário estiver em uma rota interna (Dashboard, Perfil, etc).
    // Isso impede que o checkout inicie "por cima" da tela de Login/Signup se houver algum delay no redirecionamento.
    const isProtectedRoute = location.pathname.startsWith('/dashboard') || 
                             location.pathname.startsWith('/perfil') ||
                             location.pathname.startsWith('/agenda') ||
                             location.pathname.startsWith('/tarefas') ||
                             location.pathname.startsWith('/contas') ||
                             location.pathname.startsWith('/metas') ||
                             location.pathname.startsWith('/relatorios') ||
                             location.pathname.startsWith('/notificacoes');

    if (!isProtectedRoute) {
      return;
    }

    const pendingPlan = localStorage.getItem('checkout_pending_plan') as PlanType | null;
    const timestampStr = localStorage.getItem('checkout_pending_timestamp');

    if (pendingPlan && timestampStr) {
      // Check expiration (24 hours)
      const timestamp = parseInt(timestampStr);
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      if (now - timestamp > oneDayMs) {
        localStorage.removeItem('checkout_pending_plan');
        localStorage.removeItem('checkout_pending_timestamp');
        return;
      }

      console.log('Found pending checkout plan:', pendingPlan);

      // Check if we have a valid client record with phone
      if (cliente) {
        processedRef.current = true;
        
        // Adiciona um pequeno delay visual para o usuário perceber que entrou no sistema antes de sair
        setTimeout(() => {
          toast.loading('Redirecionando para o pagamento...', { 
            id: 'checkout-loader',
            duration: 5000
          });
          
          startCheckout(pendingPlan)
            .then(() => {
              localStorage.removeItem('checkout_pending_plan');
              localStorage.removeItem('checkout_pending_timestamp');
              // O toast será dismiss pelo hook ou pela navegação
            })
            .catch((err) => {
              console.error('Failed to start pending checkout', err);
              toast.dismiss('checkout-loader');
              processedRef.current = false;
            });
        }, 1000); // 1 segundo de delay para UX suave

      } else {
         console.warn('User authenticated but no client record found yet.');
      }
    }
  }, [user, cliente, authLoading, startCheckout, isCheckoutLoading, location.pathname]);

  return null;
}
