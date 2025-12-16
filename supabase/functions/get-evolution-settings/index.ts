// =============================================================================
// Edge Function: get-evolution-settings
// Busca configurações atuais da instância na Evolution API
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface EvolutionSettings {
  rejectCall: boolean
  msgCall: string
  groupsIgnore: boolean
  alwaysOnline: boolean
  readMessages: boolean
  readStatus: boolean
}

interface GetSettingsRequest {
  instance_id?: string
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim()
    if (['true', '1', 'yes', 'sim', 'on'].includes(v)) return true
    if (['false', '0', 'no', 'nao', 'off'].includes(v)) return false
  }
  if (typeof value === 'number') return value !== 0
  return fallback
}

function normalizeSettings(raw: unknown): EvolutionSettings {
  // Muitos endpoints devolvem o objeto direto; alguns devolvem dentro de "settings".
  const rawObj = raw as Record<string, unknown>
  const s = (rawObj?.settings as Record<string, unknown>) ?? rawObj ?? {}

  return {
    rejectCall: coerceBoolean(s.rejectCall, true),
    msgCall: typeof s.msgCall === 'string' ? s.msgCall : 'Não aceitamos chamadas. Por favor, envie uma mensagem de texto.',
    groupsIgnore: coerceBoolean(s.groupsIgnore, true),
    alwaysOnline: coerceBoolean(s.alwaysOnline, false),
    readMessages: coerceBoolean(s.readMessages, true),
    readStatus: coerceBoolean(s.readStatus, false),
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error('Evolution API credentials not configured')
    }

    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Authorization header required')

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid or expired token')
    }

    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('phone')
      .eq('auth_user_id', user.id)
      .single()

    if (clienteError || !cliente) {
      throw new Error('Cliente not found')
    }

    const body: GetSettingsRequest = await req.json().catch(() => ({}))

    let instanceQuery = supabase
      .from('evolution_instances')
      .select('*')
      .eq('phone', cliente.phone)

    if (body.instance_id) {
      instanceQuery = instanceQuery.eq('id', body.instance_id)
    } else {
      instanceQuery = instanceQuery.order('created_at', { ascending: true }).limit(1)
    }

    const { data: instances, error: instanceError } = await instanceQuery
    const instance = instances?.[0]

    if (instanceError || !instance) {
      throw new Error('No instance found for this user')
    }

    const candidates = [
      `${evolutionApiUrl}/settings/find/${instance.instance_name}`,
      `${evolutionApiUrl}/settings/get/${instance.instance_name}`,
      `${evolutionApiUrl}/settings/${instance.instance_name}`,
    ]

    let lastErrorText: string | null = null

    for (const url of candidates) {
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': evolutionApiKey,
        },
      })

      if (!resp.ok) {
        lastErrorText = await resp.text().catch(() => null)
        continue
      }

      const json = await resp.json().catch(() => null)
      if (json) {
        return new Response(
          JSON.stringify({
            success: true,
            instance: {
              id: instance.id,
              instance_name: instance.instance_name,
            },
            settings: normalizeSettings(json),
            source_url: url,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
    }

    throw new Error(
      `Failed to fetch settings from Evolution API. Last error: ${lastErrorText || 'unknown'}`
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
        status: 400,
      }
    )
  }
})
