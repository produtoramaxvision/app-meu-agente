// =============================================================================
// Edge Function: configure-evolution-webhook
// Verifica e reconfigura webhook para uma instância Evolution API existente
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Obter variáveis de ambiente
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const webhookUrl = supabaseUrl + '/functions/v1/evolution-webhook'

    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error('Evolution API credentials not configured')
    }

    // Criar cliente Supabase com service role
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Obter usuário autenticado
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid or expired token')
    }

    // Buscar telefone do usuário
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('phone')
      .eq('auth_user_id', user.id)
      .single()

    if (clienteError || !cliente) {
      throw new Error('Cliente not found')
    }

    // Buscar instância do usuário
    const { data: instance, error: instanceError } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('phone', cliente.phone)
      .single()

    if (instanceError || !instance) {
      throw new Error('No instance found for this user')
    }

    console.log('Configuring webhook for instance:', instance.instance_name)
    console.log('Webhook URL:', webhookUrl)

    // Verificar webhook atual
    let currentWebhook = null
    try {
      const webhookFindResponse = await fetch(
        `${evolutionApiUrl}/webhook/find/${instance.instance_name}`,
        {
          method: 'GET',
          headers: {
            'apikey': evolutionApiKey,
          },
        }
      )

      if (webhookFindResponse.ok) {
        currentWebhook = await webhookFindResponse.json()
        console.log('Current webhook configuration:', JSON.stringify(currentWebhook))
      }
    } catch (findError) {
      console.log('Could not fetch current webhook config (may not exist yet):', findError)
    }

    // Eventos otimizados: apenas os necessários para o funcionamento
    const events = [
      'MESSAGES_UPSERT',      // Receber mensagens
      'CONNECTION_UPDATE',    // Status da conexão
      'QRCODE_UPDATED',       // Atualização do QR Code
    ]

    const webhookPayload = {
      enabled: true,
      url: webhookUrl,
      webhookByEvents: true,
      webhookBase64: true,
      events,
      webhook: {
        enabled: true,
        url: webhookUrl,
        byEvents: true,
        base64: true,
        events,
      },
    }

    // Configurar/Reconfigurar webhook
    const webhookSetResponse = await fetch(
      `${evolutionApiUrl}/webhook/set/${instance.instance_name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify(webhookPayload),
      }
    )

    if (!webhookSetResponse.ok) {
      const errorText = await webhookSetResponse.text()
      console.error('Failed to configure webhook:', errorText)
      throw new Error(`Failed to configure webhook: ${errorText}`)
    }

    const webhookData = await webhookSetResponse.json()
    console.log('Webhook configured successfully:', JSON.stringify(webhookData))

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook configured successfully',
        webhook: webhookData,
        previous_config: currentWebhook,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
