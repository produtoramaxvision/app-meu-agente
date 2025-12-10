import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  plan_id: 'lite' | 'basic' | 'business' | 'premium';
  success_url: string;
  cancel_url: string;
  locale?: string;
}

// Configuração dos planos com preços REAIS do Stripe
// Preferir configurar via env para evitar usar fallback e impedir preços incorretos
const PLAN_PRICE_IDS = {
  lite: Deno.env.get('STRIPE_PRICE_LITE') || 'price_1SbygeDUMJkQwpuNfKOSWoRL', // Lite mensal R$ 97,90
  basic: Deno.env.get('STRIPE_PRICE_BASIC') || 'price_1SWpI2DUMJkQwpuNYUAcU5ay', // Basic mensal R$ 497,00
  business: Deno.env.get('STRIPE_PRICE_BUSINESS') || 'price_1SWpI3DUMJkQwpuNbd9GWlWK', // Business mensal R$ 997,00
  premium: Deno.env.get('STRIPE_PRICE_PREMIUM') || 'price_1SWpI4DUMJkQwpuN9NfkqZzL', // Premium mensal R$ 1.497,00
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Obter usuário autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { plan_id, success_url, cancel_url, locale = 'pt-BR' } = body;

    // Validar plan_id
    if (!['lite', 'basic', 'business', 'premium'].includes(plan_id)) {
      return new Response(
        JSON.stringify({ error: 'Plano inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do cliente no banco
    const { data: cliente, error: clienteError} = await supabaseClient
      .from('clientes')
      .select('phone, name, email, stripe_customer_id, refund_period_ends_at, subscription_active, plan_id')
      .eq('auth_user_id', user.id)
      .single();

    if (clienteError || !cliente) {
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    let customerId = cliente.stripe_customer_id;

    // Criar ou buscar customer no Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: cliente.email || undefined,
        name: cliente.name,
        phone: cliente.phone,
        metadata: {
          supabase_user_id: user.id,
          phone: cliente.phone,
        },
      });
      customerId = customer.id;

      // Atualizar banco com stripe_customer_id
      await supabaseClient
        .from('clientes')
        .update({ stripe_customer_id: customerId })
        .eq('auth_user_id', user.id);
    }

    // ✅ NOVO CONCEITO: Cliente paga imediatamente e tem 7 dias para cancelar/pedir reembolso
    // NÃO É TRIAL GRATUITO - É PERÍODO DE ARREPENDIMENTO (CDC brasileiro)
    
    // Verificar se já tem assinatura ativa
    if (cliente.subscription_active && cliente.plan_id && cliente.plan_id !== 'free') {
      return new Response(
        JSON.stringify({ 
          error: 'Você já possui uma assinatura ativa. Use o portal do cliente para fazer upgrade.',
          current_plan: cliente.plan_id
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Configurar parâmetros da sessão de checkout
    // Cliente paga IMEDIATAMENTE, mas tem direito de arrependimento de 7 dias
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: PLAN_PRICE_IDS[plan_id],
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
      locale: locale as Stripe.Checkout.SessionCreateParams.Locale,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      payment_method_collection: 'always',
      metadata: {
        supabase_user_id: user.id,
        plan_id: plan_id,
        phone: cliente.phone,
        refund_period_start: new Date().toISOString(), // Registra início do período
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_id: plan_id,
          phone: cliente.phone,
          refund_period_start: new Date().toISOString(),
        },
      },
    };
    
    // ✅ SEM trial_period_days - cliente paga imediatamente
    // Período de arrependimento é gerenciado no banco de dados

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao criar sessão de checkout' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
