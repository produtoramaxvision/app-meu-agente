// =============================================================================
// Edge Function: update-evolution-settings
// Atualiza configurações da instância na Evolution API (Settings + Webhook Events)
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface EvolutionSettings {
  rejectCall?: boolean;
  msgCall?: string;
  groupsIgnore?: boolean;
  alwaysOnline?: boolean;
  readMessages?: boolean;
  readStatus?: boolean;
  syncFullHistory?: boolean;
}

interface WebhookSettings {
  enabled?: boolean;
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  events?: string[];
}

interface UpdateSettingsRequest {
  settings?: EvolutionSettings;
  webhook?: WebhookSettings;
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

    // Parse do body
    const body: UpdateSettingsRequest = await req.json().catch(() => ({}))
    
    const results: Record<string, unknown> = {}

    // Atualizar Settings da instância
    if (body.settings) {
      console.log('Updating instance settings:', JSON.stringify(body.settings))
      
      const settingsResponse = await fetch(
        `${evolutionApiUrl}/settings/set/${instance.instance_name}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionApiKey,
          },
          body: JSON.stringify({
            rejectCall: body.settings.rejectCall ?? false,
            msgCall: body.settings.msgCall ?? '',
            groupsIgnore: body.settings.groupsIgnore ?? false,
            alwaysOnline: body.settings.alwaysOnline ?? false,
            readMessages: body.settings.readMessages ?? false,
            readStatus: body.settings.readStatus ?? false,
            syncFullHistory: body.settings.syncFullHistory ?? false,
          }),
        }
      )

      if (!settingsResponse.ok) {
        const errorText = await settingsResponse.text()
        console.error('Failed to update settings:', errorText)
        results.settingsError = errorText
      } else {
        const settingsData = await settingsResponse.json()
        console.log('✅ Settings updated successfully:', JSON.stringify(settingsData))
        results.settings = settingsData
      }
    }

    // Atualizar Webhook
    if (body.webhook) {
      console.log('Updating webhook settings:', JSON.stringify(body.webhook))
      
      // Eventos padrão otimizados
      const defaultEvents = [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
      ]

      const events = body.webhook.events || defaultEvents

      const webhookPayload = {
        enabled: body.webhook.enabled ?? true,
        url: webhookUrl,
        webhookByEvents: body.webhook.webhookByEvents ?? false,
        webhookBase64: body.webhook.webhookBase64 ?? true,
        events,
        webhook: {
          enabled: body.webhook.enabled ?? true,
          url: webhookUrl,
          byEvents: body.webhook.webhookByEvents ?? false,
          base64: body.webhook.webhookBase64 ?? true,
          events,
        },
      }

      const webhookResponse = await fetch(
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

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text()
        console.error('Failed to update webhook:', errorText)
        results.webhookError = errorText
      } else {
        const webhookData = await webhookResponse.json()
        console.log('✅ Webhook updated successfully:', JSON.stringify(webhookData))
        results.webhook = webhookData
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Settings updated successfully',
        results,
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
