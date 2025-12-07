// =============================================================================
// Edge Function: create-evolution-instance
// Cria uma nova instância na Evolution API e salva no banco de dados
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface CreateInstanceRequest {
  instance_name?: string;
}

interface EvolutionCreateResponse {
  instance: {
    instanceName: string;
    instanceId: string;
    status: string;
  };
  hash: string;
  qrcode?: {
    pairingCode: string;
    code: string;
    base64: string;
    count: number;
  };
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
    const webhookUrl = Deno.env.get('SUPABASE_URL') + '/functions/v1/evolution-webhook'

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
      .select('phone, plan_id')
      .eq('auth_user_id', user.id)
      .single()

    if (clienteError || !cliente) {
      throw new Error('Cliente not found')
    }

    // Verificar se é Business ou Premium
    if (!['business', 'premium'].includes(cliente.plan_id || '')) {
      throw new Error('WhatsApp integration requires Business or Premium plan')
    }

    // Verificar se já existe instância
    const { data: existingInstance } = await supabase
      .from('evolution_instances')
      .select('id, instance_name, connection_status')
      .eq('phone', cliente.phone)
      .single()

    if (existingInstance) {
      // Retornar instância existente
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Instance already exists',
          instance: existingInstance,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Parse do body
    const body: CreateInstanceRequest = await req.json().catch(() => ({}))
    
    // Gerar nome da instância
    const instanceName = body.instance_name || 
      `sdr_${cliente.phone.replace(/\D/g, '')}_${Date.now()}`

    // Criar instância na Evolution API
    const evolutionResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        // Configuração específica para habilitar pairing code
        number: cliente.phone.replace(/\D/g, ''),
        mobile: true,
        webhook: {
          url: webhookUrl,
          webhook_by_events: false,
          webhook_base64: true,
          events: [
            'QRCODE_UPDATED',
            'CONNECTION_UPDATE',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
          ],
        },
      }),
    })

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      console.error('Evolution API error:', errorText)
      throw new Error(`Evolution API error: ${evolutionResponse.status}`)
    }

    const evolutionData: EvolutionCreateResponse = await evolutionResponse.json()

    // Log detalhado para debug
    console.log('Evolution API create response:', JSON.stringify({
      instanceName: evolutionData.instance?.instanceName,
      status: evolutionData.instance?.status,
      hasQrcode: !!evolutionData.qrcode,
      hasPairingCode: !!evolutionData.qrcode?.pairingCode,
      pairingCodeValue: evolutionData.qrcode?.pairingCode || 'NULL',
      hasCode: !!evolutionData.qrcode?.code,
      codeLength: evolutionData.qrcode?.code?.length || 0,
      hasBase64: !!evolutionData.qrcode?.base64,
      base64Length: evolutionData.qrcode?.base64?.length || 0,
    }))

    // Salvar no banco de dados
    const { data: newInstance, error: insertError } = await supabase
      .from('evolution_instances')
      .insert({
        phone: cliente.phone,
        instance_name: instanceName,
        instance_token: evolutionData.hash,
        connection_status: 'connecting',
        qr_code: evolutionData.qrcode?.base64 || null,
        pairing_code: evolutionData.qrcode?.pairingCode || null,
        last_qr_update: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      throw new Error('Failed to save instance to database')
    }

    // Criar configuração SDR padrão
    const { error: configError } = await supabase
      .from('sdr_agent_config')
      .insert({
        phone: cliente.phone,
        instance_id: newInstance.id,
        is_active: true,
      })

    if (configError && configError.code !== '23505') { // Ignore duplicate key error
      console.error('Config creation error:', configError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Instance created successfully',
        instance: {
          id: newInstance.id,
          instance_name: instanceName,
          connection_status: 'connecting',
          qr_code: evolutionData.qrcode?.base64,
          pairing_code: evolutionData.qrcode?.pairingCode,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201 
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
