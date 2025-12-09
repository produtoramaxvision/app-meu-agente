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

const DEFAULT_EVENTS = [
  'MESSAGES_UPSERT',
  'CONNECTION_UPDATE',
  'QRCODE_UPDATED',
]

// =============================================================================
// Helper: Sleep com delay
// =============================================================================
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// =============================================================================
// Helper: Verificar saúde da Evolution API
// =============================================================================
async function checkEvolutionAPIHealth(
  evolutionApiUrl: string,
  evolutionApiKey: string,
  instanceName: string
): Promise<{ healthy: boolean; instanceExists: boolean; error?: string }> {
  try {
    // Verificar se a instância existe
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(
      `${evolutionApiUrl}/instance/connectionState/${instanceName}`,
      {
        method: 'GET',
        headers: {
          'apikey': evolutionApiKey,
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (response.ok) {
      return { healthy: true, instanceExists: true }
    } else if (response.status === 404) {
      return { healthy: true, instanceExists: false, error: 'Instance not found' }
    } else {
      return { healthy: false, instanceExists: false, error: `API returned ${response.status}` }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { healthy: false, instanceExists: false, error: 'API timeout' }
    }
    return { healthy: false, instanceExists: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// =============================================================================
// Helper: Configurar webhook com retry logic
// =============================================================================
async function configureWebhookWithRetry(
  evolutionApiUrl: string,
  evolutionApiKey: string,
  instanceName: string,
  webhookPayload: any,
  maxRetries: number = 3
): Promise<{ success: boolean; data?: any; error?: string; attempts: number }> {
  let lastError = ''
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Webhook configuration attempt ${attempt}/${maxRetries} for instance: ${instanceName}`)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const webhookSetResponse = await fetch(
        `${evolutionApiUrl}/webhook/set/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      if (webhookSetResponse.ok) {
        const webhookData = await webhookSetResponse.json()
        console.log(`Webhook configured successfully on attempt ${attempt}:`, JSON.stringify(webhookData))

        // Validar se webhook foi realmente configurado
        try {
          const verifyResponse = await fetch(
            `${evolutionApiUrl}/webhook/find/${instanceName}`,
            {
              method: 'GET',
              headers: {
                'apikey': evolutionApiKey,
              },
            }
          )

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json()
            console.log('Webhook verification:', JSON.stringify(verifyData))
          }
        } catch (verifyError) {
          console.log('Could not verify webhook config:', verifyError)
        }

        return { success: true, data: webhookData, attempts: attempt }
      } else {
        const errorText = await webhookSetResponse.text()
        const statusCode = webhookSetResponse.status
        lastError = `Status ${statusCode}: ${errorText}`
        console.error(`Attempt ${attempt} failed:`, lastError)

        // Verificar se é um erro temporário (500, 502, 503, 504)
        const isTemporaryError = [500, 502, 503, 504].includes(statusCode)
        
        if (!isTemporaryError || attempt === maxRetries) {
          // Erro definitivo ou última tentativa
          return { success: false, error: lastError, attempts: attempt }
        }

        // Delay exponencial antes da próxima tentativa
        const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
        console.log(`Waiting ${delay}ms before retry...`)
        await sleep(delay)
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = 'Request timeout'
      }

      console.error(`Attempt ${attempt} error:`, lastError)

      if (attempt === maxRetries) {
        return { success: false, error: lastError, attempts: attempt }
      }

      // Delay exponencial antes da próxima tentativa
      const delay = Math.pow(2, attempt - 1) * 1000
      console.log(`Waiting ${delay}ms before retry...`)
      await sleep(delay)
    }
  }

  return { success: false, error: lastError, attempts: maxRetries }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Body opcional para habilitar/desabilitar
    const requestBody = await req.json().catch(() => ({})) as { enabled?: boolean; events?: string[] }
    const enabled = typeof requestBody.enabled === 'boolean' ? requestBody.enabled : true
    const events = Array.isArray(requestBody.events) && requestBody.events.length > 0
      ? requestBody.events
      : DEFAULT_EVENTS

    // Obter variáveis de ambiente
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    // Agora apontamos o webhook diretamente para o N8N
    const webhookUrl = 'https://webhook.meuagente.api.br/webhook/agente-sdr'

    const webhookPayload = {
      enabled,
      url: webhookUrl,
      webhookByEvents: false,
      webhookBase64: true,
      events: enabled ? events : [],
      webhook: {
        enabled,
        url: webhookUrl,
        byEvents: false,
        base64: true,
        events: enabled ? events : [],
      },
    }

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
    console.log('Webhook enabled:', enabled)

    // Verificar saúde da Evolution API e existência da instância
    const healthCheck = await checkEvolutionAPIHealth(
      evolutionApiUrl,
      evolutionApiKey,
      instance.instance_name
    )

    if (!healthCheck.healthy) {
      console.error('Evolution API health check failed:', healthCheck.error)
      throw new Error('Serviço temporariamente indisponível')
    }

    if (!healthCheck.instanceExists) {
      console.error('Instance does not exist:', instance.instance_name)
      throw new Error('Configuração não encontrada')
    }

    // Configurar webhook com retry logic
    const webhookResult = await configureWebhookWithRetry(
      evolutionApiUrl,
      evolutionApiKey,
      instance.instance_name,
      webhookPayload,
      3 // máximo 3 tentativas
    )

    if (!webhookResult.success) {
      console.error('Failed to configure webhook after all retries:', webhookResult.error)
      throw new Error('Falha ao configurar notificações')
    }

    const webhookData = webhookResult.data

    // Persistir estado do toggle sem mexer no billing (clientes.is_active)
    const { error: updateConfigError } = await supabase
      .from('sdr_agent_config')
      .update({ is_active: enabled, updated_at: new Date().toISOString() })
      .eq('phone', cliente.phone)

    if (updateConfigError) {
      console.error('Failed to update sdr_agent_config.is_active:', updateConfigError)
      throw new Error('Webhook configurado, mas não foi possível salvar o status do agente')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: enabled ? 'Webhook enabled successfully' : 'Webhook disabled successfully',
        webhook: webhookData,
        attempts: webhookResult.attempts,
        enabled,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in configure-evolution-webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar solicitação'
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
