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
    state: string;
  };
}

type NormalizedConnectionState = 'connected' | 'connecting' | 'disconnected'

function normalizeEvolutionState(raw: unknown): NormalizedConnectionState {
  const value = typeof raw === 'string' ? raw.toLowerCase().trim() : ''

  // Estados observados em diferentes builds da Evolution
  if (['open', 'connected', 'online', 'ready'].includes(value)) return 'connected'
  if (['connecting', 'qr', 'qrcode', 'pairing', 'init', 'starting'].includes(value)) return 'connecting'
  if (['close', 'closed', 'disconnected', 'offline', 'logout', 'logoff'].includes(value)) return 'disconnected'

  return 'disconnected'
}

function normalizePhoneString(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (!value) return null

  // Caso venha como JID: 5511958157709@s.whatsapp.net
  const jidMatch = value.match(/^([0-9]+)@s\.whatsapp\.net$/i)
  if (jidMatch?.[1]) return jidMatch[1]

  // Caso venha com +
  const digits = value.replace(/\D/g, '')
  if (digits.length >= 10) return digits

  return null
}

// Extrai o número do WhatsApp a partir de diferentes formatos de payload
function extractPhoneFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const candidateList = [
    (payload as any)?.owner,
    (payload as any)?.ownerJid,
    (payload as any)?.owner_id,
    (payload as any)?.ownerId,
    (payload as any)?.phone,
    (payload as any)?.phoneConnected,
    (payload as any)?.wid,
    (payload as any)?.instance?.owner,
    (payload as any)?.instance?.ownerJid,
    (payload as any)?.instance?.owner_id,
    (payload as any)?.instance?.ownerId,
    (payload as any)?.instance?.phone,
    (payload as any)?.instance?.phoneConnected,
    (payload as any)?.instance?.wid,
  ]

  for (const value of candidateList) {
    const normalized = normalizePhoneString(value)
    if (normalized) return normalized
  }

  // Alguns provedores devolvem { instances: [ { instance: {...} } ] }
  const instances = (payload as any)?.instances
  if (Array.isArray(instances)) {
    for (const item of instances) {
      const nested = extractPhoneFromPayload(item)
      if (nested) return nested
    }
  }

  return null
}

// Baseado na documentação oficial Evolution API v2.3+
// Endpoint: GET /instance/fetchInstances
// Retorna: array com objetos { instance: { instanceName, owner, ... } }
// Campo "owner" contém o JID completo: "5511999999999@s.whatsapp.net"
async function fetchInstanceOwnerJid(
  evolutionApiUrl: string,
  evolutionApiKey: string,
  instanceName: string,
): Promise<string | null> {
  try {
    // Endpoint oficial documentado
    const response = await fetch(`${evolutionApiUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': evolutionApiKey,
      },
    })

    if (!response.ok) {
      console.error(`fetchInstances failed: ${response.status}`)
      return null
    }

    const data = await response.json()
    console.log('fetchInstances response:', JSON.stringify(data, null, 2))

    const matchesInstance = (payload: any) => {
      const nameCandidates = [
        payload?.instanceName,
        payload?.instance?.instanceName,
        payload?.instance?.name,
        payload?.name,
        payload?.instance_id,
        payload?.instanceId,
      ]
      const found = nameCandidates.find((value) => typeof value === 'string' && value.trim())
      if (!found) return true // se não há nome, não bloqueia
      return String(found).trim() === instanceName
    }

    const tryExtract = (payload: any): string | null => {
      if (!matchesInstance(payload)) return null
      return extractPhoneFromPayload(payload)
    }

    // Tenta extrair direto do payload raiz
    const rootPhone = tryExtract(data)
    if (rootPhone) {
      console.log(`Found owner phone (root): ${rootPhone}`)
      return rootPhone
    }

    // Se vier como array de instâncias
    if (Array.isArray(data) && data.length > 0) {
      for (const item of data) {
        const phone = tryExtract(item)
        if (phone) {
          console.log(`Found owner phone (array item): ${phone}`)
          return phone
        }
      }
    }

    // Se vier como objeto contendo "instances" ou "data"
    const instances = (data as any)?.instances || (data as any)?.data
    if (Array.isArray(instances)) {
      for (const item of instances) {
        const phone = tryExtract(item)
        if (phone) {
          console.log(`Found owner phone (instances): ${phone}`)
          return phone
        }
      }
    }

    console.warn('No owner found in fetchInstances response')
    return null
  } catch (error) {
    console.error('Error fetching instance owner:', error)
    return null
  }
}

interface ConnectRequest {
  instance_id?: string;
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

    // Parse do body para obter instance_id (opcional)
    const body: ConnectRequest = await req.json().catch(() => ({}))
    const requestedInstanceId = body.instance_id

    // Buscar instância do usuário
    let instanceQuery = supabase
      .from('evolution_instances')
      .select('*')
      .eq('phone', cliente.phone)

    // Se instance_id foi fornecido, buscar especificamente
    if (requestedInstanceId) {
      instanceQuery = instanceQuery.eq('id', requestedInstanceId)
    } else {
      // Caso contrário, pegar a primeira (ordem de criação)
      instanceQuery = instanceQuery.order('created_at', { ascending: true }).limit(1)
    }

    const { data: instances, error: instanceError } = await instanceQuery
    const instance = instances?.[0]

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

    let connectionState: NormalizedConnectionState = 'disconnected'
    let connectionStateData: any = null
    
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
      connectionStateData = await stateResponse.json()

      // Alguns retornos podem vir como { instance: { state } }, outros como { state }, ou { instance: { status } }
      const rawState = connectionStateData?.instance?.state ?? connectionStateData?.state ?? connectionStateData?.instance?.status
      connectionState = normalizeEvolutionState(rawState)
    }

    // Derivar número do WhatsApp a partir do estado (se já conectado e ainda não salvo)
    let derivedWhatsAppNumber: string | null = instance.whatsapp_number
    if (!derivedWhatsAppNumber) {
      const phoneFromState = extractPhoneFromPayload(connectionStateData)
      if (phoneFromState) {
        derivedWhatsAppNumber = phoneFromState
        console.log(`Found whatsapp_number in connectionState response: ${derivedWhatsAppNumber}`)
      }
    }

    // Se não está conectado, buscar novo QR Code / Pairing Code
    // Mantemos os valores atuais como fallback e só sobrescrevemos quando a API devolver algo
    let qrCode = instance.qr_code
    let pairingCode = instance.pairing_code
    let responseWhatsAppNumber: string | null = derivedWhatsAppNumber || instance.whatsapp_number
    let responseConnectionStatus: NormalizedConnectionState = connectionState

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
        
        // Tenta extrair o número a partir da resposta do connect (alguns providers retornam ownerJid)
        if (!derivedWhatsAppNumber) {
          const phoneFromConnect = extractPhoneFromPayload(connectData)
          if (phoneFromConnect) {
            derivedWhatsAppNumber = phoneFromConnect
            responseWhatsAppNumber = phoneFromConnect
            console.log(`Found whatsapp_number in connect response: ${phoneFromConnect}`)
          }
        }

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
        const nextStatus: NormalizedConnectionState =
          connectionState === 'disconnected' && (qrCode || pairingCode)
            ? 'connecting'
            : connectionState

        responseConnectionStatus = nextStatus

        await supabase
          .from('evolution_instances')
          .update({
            qr_code: qrCode,
            pairing_code: pairingCode,
            last_qr_update: new Date().toISOString(),
            connection_status: nextStatus,
            ...(derivedWhatsAppNumber ? { whatsapp_number: derivedWhatsAppNumber } : {}),
          })
          .eq('id', instance.id)
      }
    } else {
      // Atualizar status como conectado
      // Buscar número usando endpoint oficial da Evolution API
      if (!derivedWhatsAppNumber) {
        console.log(`Fetching owner JID for instance: ${instance.instance_name}`)
        derivedWhatsAppNumber = await fetchInstanceOwnerJid(
          evolutionApiUrl,
          evolutionApiKey,
          instance.instance_name,
        )
        
        if (derivedWhatsAppNumber) {
          console.log(`✅ Successfully fetched whatsapp_number: ${derivedWhatsAppNumber}`)
        } else {
          console.warn(`⚠️ Could not fetch whatsapp_number for instance: ${instance.instance_name}`)
        }
      }

      const connectedAt = instance.connected_at || new Date().toISOString()

      await supabase
        .from('evolution_instances')
        .update({
          connection_status: 'connected',
          connected_at: connectedAt,
          qr_code: null, // Limpar QR quando conectado
          pairing_code: null,
          ...(derivedWhatsAppNumber ? { whatsapp_number: derivedWhatsAppNumber } : {}),
        })
        .eq('id', instance.id)

      responseConnectionStatus = 'connected'
      if (derivedWhatsAppNumber) {
        responseWhatsAppNumber = derivedWhatsAppNumber
      }
      
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
          connection_status: responseConnectionStatus,
          whatsapp_number: responseWhatsAppNumber,
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
