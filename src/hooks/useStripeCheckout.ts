import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type PlanType = 'basic' | 'business' | 'premium';

interface CheckoutOptions {
  successUrl?: string;
  cancelUrl?: string;
}

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();

  const startCheckout = async (planId: PlanType, options?: CheckoutOptions) => {
    if (!session) {
      toast.error('Você precisa estar logado para assinar um plano.');
      return;
    }

    setIsLoading(true);

    try {
      // Define default URLs if not provided
      const success_url = options?.successUrl || `${window.location.origin}/dashboard?checkout=success&plan=${planId}`;
      const cancel_url = options?.cancelUrl || `${window.location.origin}/dashboard?checkout=cancel`;

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan_id: planId,
          success_url,
          cancel_url,
          locale: 'pt-BR'
        }
      });

      if (error) {
        console.error('Error invoking create-checkout-session:', error);
        throw new Error('Erro ao comunicar com o servidor de pagamentos.');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida.');
      }

    } catch (err: any) {
      console.error('Checkout error:', err);
      
      let message = 'Erro ao iniciar checkout.';
      
      if (err.message.includes('Cliente não encontrado')) {
        message = 'Cliente não encontrado. Entre em contato com o suporte.';
      } else if (err.message.includes('plano inválido')) {
        message = 'Plano selecionado inválido.';
      }
      
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    startCheckout,
    isLoading
  };
}

