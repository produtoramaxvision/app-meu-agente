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
    // Webhook direto para o N8N conforme solicitado
    const webhookUrl = 'https://webhook.meuagente.api.br/webhook/agente-sdr'

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
      // Verificar se a instância ainda existe na Evolution API
      console.log('Found existing instance in DB, checking if it exists in Evolution API...')
      
      const stateResponse = await fetch(
        `${evolutionApiUrl}/instance/connectionState/${existingInstance.instance_name}`,
        {
          method: 'GET',
          headers: {
            'apikey': evolutionApiKey,
          },
        }
      )

      if (stateResponse.status === 404) {
        // Instância foi deletada externamente, limpar registro local
        console.log('Instance not found in Evolution API (404), cleaning local record and creating new one...')
        
        await supabase
          .from('evolution_instances')
          .delete()
          .eq('id', existingInstance.id)
        
        await supabase
          .from('sdr_agent_config')
          .delete()
          .eq('instance_id', existingInstance.id)
        
        // Continuar para criar uma nova instância (não retornar aqui)
      } else {
        // Instância ainda existe, retornar a existente
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
      }),
    })

    if (!evolutionResponse.ok) {
      const errorText = await evolutionResponse.text()
      console.error('Evolution API error:', errorText)
      throw new Error(`Evolution API error: ${evolutionResponse.status}`)
    }

    const evolutionData: EvolutionCreateResponse = await evolutionResponse.json()

    // Configurar webhook explicitamente após criação da instância
    console.log('Configuring webhook for instance:', instanceName)
    console.log('Webhook URL:', webhookUrl)
    
    try {
      // Eventos otimizados: apenas os necessários para o funcionamento
      const events = [
        'MESSAGES_UPSERT',      // Receber mensagens
        'CONNECTION_UPDATE',    // Status da conexão
        'QRCODE_UPDATED',       // Atualização do QR Code
      ]

      const webhookPayload = {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: true,
        events,
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          base64: true,
          events,
        },
      }

      const webhookSetResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify(webhookPayload),
      })

      if (!webhookSetResponse.ok) {
        const errorText = await webhookSetResponse.text()
        console.error('❌ Failed to set webhook:', errorText)
        console.error('Webhook URL attempted:', webhookUrl)
        console.error('Instance:', instanceName)
        // Continua mesmo com erro de webhook
      } else {
        const webhookData = await webhookSetResponse.json()
        console.log('✅ Webhook configured successfully:', JSON.stringify(webhookData))
      }
    } catch (webhookError) {
      console.error('❌ Exception during webhook configuration:', webhookError)
      // Não propaga o erro para não quebrar a criação da instância
    }

    // Log completo da resposta para debug (Evolution API v2.3.7)
    console.log('Evolution API create response (raw):', JSON.stringify(evolutionData, null, 2))
    
    // Log detalhado para debug
    console.log('Evolution API create response (parsed):', JSON.stringify({
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
    
    console.log('Valores extraídos - QR Code:', evolutionData.qrcode?.base64 ? 'PRESENTE' : 'NULL', '| Pairing Code:', evolutionData.qrcode?.pairingCode || 'NULL')

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
