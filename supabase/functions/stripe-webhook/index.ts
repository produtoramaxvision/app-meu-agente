import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    // Verificar assinatura do webhook
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );

    console.log('Webhook event received:', event.type);

    // Criar cliente Supabase (service role para ter permissões)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Processar eventos do Stripe
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.supabase_user_id;
        const planId = session.metadata?.plan_id;

        if (!userId || !planId) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // ✅ NOVO: Cliente pagou! Inicia período de arrependimento de 7 dias
        const refundPeriodEnd = new Date();
        refundPeriodEnd.setDate(refundPeriodEnd.getDate() + 7); // 7 dias a partir de agora

        // Atualizar cliente no banco
        const { error: updateError } = await supabaseAdmin
          .from('clientes')
          .update({
            stripe_customer_id: customerId,
            external_subscription_id: subscriptionId,
            subscription_active: true, // ✅ Assinatura ATIVA imediatamente (pagamento aprovado)
            plan_id: planId, // Plano comprado (lite, basic, business ou premium)
            refund_period_ends_at: refundPeriodEnd.toISOString(), // 7 dias para arrependimento
            billing_provider: 'stripe',
            updated_at: new Date().toISOString(),
          })
          .eq('auth_user_id', userId);

        if (updateError) {
          console.error('Error updating cliente:', updateError);
        } else {
          console.log(`✅ Checkout completed: user=${userId}, plan=${planId}, refund_until=${refundPeriodEnd.toISOString()}`);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const planId = subscription.metadata?.plan_id;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          // Tentar buscar pelo stripe_customer_id
          const { data: cliente } = await supabaseAdmin
            .from('clientes')
            .select('auth_user_id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (!cliente) {
            console.error('Could not find user for subscription');
            break;
          }
        }

        const isActive = ['active', 'trialing'].includes(subscription.status);

        const { error: updateError } = await supabaseAdmin
          .from('clientes')
          .update({
            external_subscription_id: subscription.id,
            subscription_active: isActive, // ✅ Ativa se status = active ou trialing
            plan_id: planId || 'basic',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
        } else {
          console.log(`✅ Subscription ${subscription.id} updated: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { error: updateError } = await supabaseAdmin
          .from('clientes')
          .update({
            subscription_active: false,
            plan_id: 'free',
            external_subscription_id: null,
            refund_period_ends_at: null, // ✅ Remove período de arrependimento
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          console.error('Error deleting subscription:', updateError);
        } else {
          console.log(`✅ Subscription ${subscription.id} deleted - moved to FREE plan`);
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        // ✅ Este evento não é mais relevante pois não usamos trial do Stripe
        // O período de arrependimento é gerenciado no banco de dados
        console.log('Event customer.subscription.trial_will_end ignored (not using Stripe trials)');
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          // Garantir que a assinatura está ativa após pagamento bem-sucedido
          const { error: updateError } = await supabaseAdmin
            .from('clientes')
            .update({
              subscription_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
            .eq('external_subscription_id', subscriptionId);

          if (updateError) {
            console.error('Error updating after payment:', updateError);
          } else {
            console.log(`Payment succeeded for customer ${customerId}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Opcional: Enviar notificação de falha de pagamento
        console.log(`Payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Webhook error' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
