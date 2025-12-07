// =============================================================================
// Edge Function: connect-evolution-instance
// Busca status de conexão e QR Code/Pairing Code da instância
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface ConnectResponse {
  pairingCode: string;
  code: string;
  base64?: string;
  count: number;
}

interface ConnectionStateResponse {
  instance: {
    instanceName: string;
    state: 'open' | 'close' | 'connecting';
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
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No instance found. Create one first.',
          needsCreate: true,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Verificar estado da conexão na Evolution API
    const stateResponse = await fetch(
      `${evolutionApiUrl}/instance/connectionState/${instance.instance_name}`,
      {
        method: 'GET',
        headers: {
          'apikey': evolutionApiKey,
        },
      }
    )

    let connectionState = 'disconnected'
    
    if (stateResponse.ok) {
      const stateData: ConnectionStateResponse = await stateResponse.json()
      
      // Mapear estado da Evolution para nosso status
      switch (stateData.instance?.state) {
        case 'open':
          connectionState = 'connected'
          break
        case 'connecting':
          connectionState = 'connecting'
          break
        case 'close':
        default:
          connectionState = 'disconnected'
      }
    }

    // Se não está conectado, buscar novo QR Code
    let qrCode = instance.qr_code
    let pairingCode = instance.pairing_code

    if (connectionState !== 'connected') {
      const connectResponse = await fetch(
        `${evolutionApiUrl}/instance/connect/${instance.instance_name}`,
        {
          method: 'GET',
          headers: {
            'apikey': evolutionApiKey,
          },
        }
      )

      if (connectResponse.ok) {
        const connectData: ConnectResponse = await connectResponse.json()
        
        // Log detalhado para debug
        console.log('Evolution API connect response:', JSON.stringify({
          hasPairingCode: !!connectData.pairingCode,
          pairingCodeLength: connectData.pairingCode?.length || 0,
          hasCode: !!connectData.code,
          codeLength: connectData.code?.length || 0,
          hasBase64: !!connectData.base64,
          base64Length: connectData.base64?.length || 0,
          count: connectData.count,
        }))
        
        qrCode = connectData.base64 || null
        pairingCode = connectData.pairingCode || null

        // Atualizar no banco
        await supabase
          .from('evolution_instances')
          .update({
            qr_code: qrCode,
            pairing_code: pairingCode,
            last_qr_update: new Date().toISOString(),
            connection_status: connectionState,
          })
          .eq('id', instance.id)
      }
    } else {
      // Atualizar status como conectado
      await supabase
        .from('evolution_instances')
        .update({
          connection_status: 'connected',
          connected_at: instance.connected_at || new Date().toISOString(),
          qr_code: null, // Limpar QR quando conectado
          pairing_code: null,
        })
        .eq('id', instance.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          id: instance.id,
          instance_name: instance.instance_name,
          connection_status: connectionState,
          whatsapp_number: instance.whatsapp_number,
          qr_code: connectionState !== 'connected' ? qrCode : null,
          pairing_code: connectionState !== 'connected' ? pairingCode : null,
          last_qr_update: instance.last_qr_update,
          connected_at: instance.connected_at,
        },
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
