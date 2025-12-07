// =============================================================================
// Edge Function: evolution-webhook
// Recebe webhooks da Evolution API (QR Code, Connection, Messages)
// IMPORTANTE: Esta função deve ser exposta com --no-verify-jwt
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

type WebhookEvent = 
  | 'QRCODE_UPDATED'
  | 'CONNECTION_UPDATE'
  | 'MESSAGES_UPSERT'
  | 'MESSAGES_UPDATE'

interface WebhookPayload {
  event: WebhookEvent;
  instance: string;
  data: {
    // QRCODE_UPDATED
    qrcode?: {
      pairingCode?: string;
      code?: string;
      base64?: string;
      count?: number;
    };
    // CONNECTION_UPDATE
    state?: 'open' | 'close' | 'connecting';
    // MESSAGES_UPSERT
    key?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    pushName?: string;
  };
  destination: string;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const n8nWebhookUrl = Deno.env.get('N8N_SDR_WEBHOOK_URL')

    // Criar cliente Supabase com service role
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

    // Parse do webhook
    const payload: WebhookPayload = await req.json()
    
    console.log(`Webhook received: ${payload.event} for instance: ${payload.instance}`)

    // Buscar instância pelo nome
    const { data: instance, error: instanceError } = await supabase
      .from('evolution_instances')
      .select('id, phone')
      .eq('instance_name', payload.instance)
      .single()

    if (instanceError || !instance) {
      console.error('Instance not found:', payload.instance)
      return new Response(
        JSON.stringify({ success: false, error: 'Instance not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Processar baseado no tipo de evento
    switch (payload.event) {
      case 'QRCODE_UPDATED': {
        // Atualizar QR Code no banco
        await supabase
          .from('evolution_instances')
          .update({
            qr_code: payload.data.qrcode?.base64 || null,
            pairing_code: payload.data.qrcode?.pairingCode || null,
            last_qr_update: new Date().toISOString(),
            connection_status: 'connecting',
          })
          .eq('id', instance.id)
        
        console.log('QR Code updated for instance:', payload.instance)
        break
      }

      case 'CONNECTION_UPDATE': {
        const state = payload.data.state
        let connectionStatus = 'disconnected'
        let connectedAt = null

        if (state === 'open') {
          connectionStatus = 'connected'
          connectedAt = new Date().toISOString()
        } else if (state === 'connecting') {
          connectionStatus = 'connecting'
        }

        await supabase
          .from('evolution_instances')
          .update({
            connection_status: connectionStatus,
            connected_at: connectedAt,
            // Limpar QR quando conectado
            qr_code: state === 'open' ? null : undefined,
            pairing_code: state === 'open' ? null : undefined,
          })
          .eq('id', instance.id)

        console.log(`Connection status updated to ${connectionStatus} for instance:`, payload.instance)
        break
      }

      case 'MESSAGES_UPSERT': {
        // Ignorar mensagens enviadas pelo próprio bot
        if (payload.data.key?.fromMe) {
          console.log('Ignoring outgoing message')
          break
        }

        // Extrair texto da mensagem
        const messageText = 
          payload.data.message?.conversation || 
          payload.data.message?.extendedTextMessage?.text || 
          ''

        if (!messageText) {
          console.log('No text content in message, ignoring')
          break
        }

        // Buscar configuração do agente SDR
        const { data: sdrConfig } = await supabase
          .from('sdr_agent_config')
          .select('config_json, is_active')
          .eq('phone', instance.phone)
          .single()

        if (!sdrConfig?.is_active) {
          console.log('SDR agent is not active for this instance')
          break
        }

        // Se N8N webhook configurado, encaminhar mensagem
        if (n8nWebhookUrl) {
          const n8nPayload = {
            instance_name: payload.instance,
            phone: instance.phone,
            sender: payload.data.key?.remoteJid?.split('@')[0],
            sender_name: payload.data.pushName,
            message: messageText,
            message_id: payload.data.key?.id,
            timestamp: payload.date_time,
            agent_config: sdrConfig.config_json,
          }

          // Enviar para N8N de forma assíncrona (não esperar resposta)
          fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(n8nPayload),
          }).catch(err => console.error('Error sending to N8N:', err))

          console.log('Message forwarded to N8N for processing')
        }
        break
      }

      case 'MESSAGES_UPDATE': {
        // Atualização de status de mensagem (lida, entregue, etc.)
        console.log('Message update received:', payload.data)
        break
      }

      default:
        console.log('Unknown event type:', payload.event)
    }

    return new Response(
      JSON.stringify({ success: true, event: payload.event }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
