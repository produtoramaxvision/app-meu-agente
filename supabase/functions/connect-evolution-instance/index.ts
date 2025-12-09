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

// Evolution API v2.3.7 retorna resposta no nível raiz (não aninhada)
interface ConnectResponse {
  pairingCode?: string;  // Código de pareamento de 8 dígitos (ex: "WZYEH1YY")
  code?: string;         // Código longo para geração do QR Code
  base64?: string;       // QR Code em formato base64 (imagem)
  count?: number;        // Contador de tentativas
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
    // Webhook direto para o N8N
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
    
    // Se a instância foi deletada externamente (404), limpar registro local
    if (stateResponse.status === 404) {
      console.log('Instance not found in Evolution API (404), cleaning local record...')
      
      // Deletar registro do banco local
      await supabase
        .from('evolution_instances')
        .delete()
        .eq('id', instance.id)
      
      // Também deletar configuração SDR associada
      await supabase
        .from('sdr_agent_config')
        .delete()
        .eq('instance_id', instance.id)

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Instance was deleted externally',
          needsCreate: true,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }
    
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

    // Se não está conectado, buscar novo QR Code / Pairing Code
    // Mantemos os valores atuais como fallback e só sobrescrevemos quando a API devolver algo
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

      // Se o connect também retornar 404, a instância foi deletada
      if (connectResponse.status === 404) {
        console.log('Connect endpoint returned 404, cleaning local record...')
        
        await supabase
          .from('evolution_instances')
          .delete()
          .eq('id', instance.id)
        
        await supabase
          .from('sdr_agent_config')
          .delete()
          .eq('instance_id', instance.id)

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Instance not found in Evolution API',
            needsCreate: true,
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        )
      }

      if (connectResponse.ok) {
        const connectData: ConnectResponse = await connectResponse.json()
        
        // Log detalhado para debug (Evolution API v2.3.7)
        console.log('Evolution API connect response (raw):', JSON.stringify(connectData, null, 2))
        console.log('Evolution API connect response (parsed):', JSON.stringify({
          hasPairingCode: !!connectData.pairingCode,
          pairingCodeValue: connectData.pairingCode || 'NULL',
          pairingCodeLength: connectData.pairingCode?.length || 0,
          hasCode: !!connectData.code,
          codeLength: connectData.code?.length || 0,
          hasBase64: !!connectData.base64,
          base64Length: connectData.base64?.length || 0,
          count: connectData.count,
        }))
        
        // Evolution API v2.3.7 retorna no nível raiz. Alguns provedores devolvem apenas "code"
        // (string que pode ser usada para gerar o QR) em vez de "base64".
        // Só sobrescrevemos se houver valor novo para não perder o pairing/QR que já temos no banco.
        const newQrCode = connectData.base64 || connectData.code || null
        if (newQrCode) {
          qrCode = newQrCode
        }

        const newPairingCode = connectData.pairingCode?.trim() || null
        if (newPairingCode) {
          pairingCode = newPairingCode
        }
        
        console.log('Valores extraídos - QR Code:', qrCode ? 'PRESENTE' : 'NULL', '| Pairing Code:', pairingCode || 'NULL')

        // Atualizar no banco
        await supabase
          .from('evolution_instances')
          .update({
            qr_code: qrCode,
            pairing_code: pairingCode,
            last_qr_update: new Date().toISOString(),
            // Se recebemos códigos, consideramos estado "connecting" para forçar o front a exibir
            // os valores mais recentes até confirmar conexão.
            connection_status: connectionState === 'connected' ? 'connected' : 'connecting',
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
      
      // Limpar valores quando conectado
      qrCode = null
      pairingCode = null
    }

    // =====================================================
    // CORREÇÃO CRÍTICA: Configurar webhook quando conectado
    // =====================================================
    if (connectionState === 'connected') {
      console.log('Configuring webhook for connected instance:', instance.instance_name)
      
      // Eventos otimizados: apenas os necessários para o funcionamento
      const events = [
        'MESSAGES_UPSERT',      // Receber mensagens
        'CONNECTION_UPDATE',    // Status da conexão
        'QRCODE_UPDATED',       // Atualização do QR Code
      ]

      // Evolution API (algumas builds) exige a propriedade "webhook" no payload.
      // Enviamos ambos formatos (aninhado e plano) para compatibilidade.
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

      try {
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
          // Não lança erro para não quebrar o fluxo, mas loga o problema
        } else {
          const webhookData = await webhookSetResponse.json()
          console.log('✅ Webhook configured successfully:', webhookData)
        }
      } catch (webhookError) {
        console.error('Error configuring webhook:', webhookError)
        // Não propaga o erro para não quebrar a conexão
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        instance: {
          id: instance.id,
          instance_name: instance.instance_name,
          connection_status: connectionState,
          whatsapp_number: instance.whatsapp_number,
          qr_code: qrCode, // Usar valores atualizados
          pairing_code: pairingCode, // Usar valores atualizados
          last_qr_update: connectionState !== 'connected' ? new Date().toISOString() : instance.last_qr_update,
          connected_at: connectionState === 'connected' ? (instance.connected_at || new Date().toISOString()) : instance.connected_at,
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
