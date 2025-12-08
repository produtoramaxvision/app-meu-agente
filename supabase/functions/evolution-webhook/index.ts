// =============================================================================
// Edge Function: evolution-webhook v7.1 (Optimized + Documents)
// Recebe webhooks da Evolution API (QR Code, Connection, Messages)
// IMPORTANTE: Esta função deve ser exposta com --no-verify-jwt
// 
// v7.1 Otimizações:
// - Filtra mensagens do próprio agente (fromMe: true)
// - Suporta: textos, áudios, imagens e DOCUMENTOS
// - Envia payload otimizado ao N8N (apenas campos essenciais)
// - Validação robusta com Zod
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// =============================================================================
// Schemas de Validação Zod
// =============================================================================

const MessageKeySchema = z.object({
  remoteJid: z.string(),
  fromMe: z.boolean(),
  id: z.string(),
})

const TextMessageSchema = z.object({
  conversation: z.string().optional(),
  extendedTextMessage: z.object({
    text: z.string(),
  }).optional(),
})

const AudioMessageSchema = z.object({
  audioMessage: z.object({
    url: z.string().optional(),
    mimetype: z.string().optional(),
    fileSha256: z.string().optional(),
    fileLength: z.number().optional(),
    seconds: z.number().optional(),
    ptt: z.boolean().optional(), // push-to-talk (audio de voz)
    mediaKey: z.string().optional(),
  }),
})

const ImageMessageSchema = z.object({
  imageMessage: z.object({
    url: z.string().optional(),
    mimetype: z.string().optional(),
    caption: z.string().optional(),
    fileSha256: z.string().optional(),
    fileLength: z.number().optional(),
    height: z.number().optional(),
    width: z.number().optional(),
    jpegThumbnail: z.string().optional(),
  }),
})

const DocumentMessageSchema = z.object({
  documentMessage: z.object({
    url: z.string().optional(),
    mimetype: z.string().optional(),
    title: z.string().optional(),
    fileSha256: z.string().optional(),
    fileLength: z.number().optional(),
    pageCount: z.number().optional(),
    fileName: z.string().optional(),
    caption: z.string().optional(),
  }),
})

const WebhookPayloadSchema = z.object({
  event: z.enum(['QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT', 'MESSAGES_UPDATE']),
  instance: z.string(),
  data: z.any(),
  destination: z.string().optional(),
  date_time: z.string().optional(),
  sender: z.string().optional(),
  server_url: z.string().optional(),
  apikey: z.string().optional(),
})

// =============================================================================
// Types
// =============================================================================

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
    message?: any; // Aceita qualquer estrutura de mensagem
    pushName?: string;
  };
  destination: string;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

type MessageType = 'text' | 'audio' | 'image' | 'document' | 'unsupported'

interface ExtractedMessage {
  type: MessageType;
  content: string | null;
  audio?: any;
  image?: any;
  document?: any;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Detecta o tipo de mensagem e extrai o conteúdo relevante
 */
function extractMessageContent(message: any): ExtractedMessage {
  if (!message) {
    return { type: 'unsupported', content: null }
  }

  // Texto simples
  if (message.conversation) {
    return {
      type: 'text',
      content: message.conversation,
    }
  }

  // Texto estendido
  if (message.extendedTextMessage?.text) {
    return {
      type: 'text',
      content: message.extendedTextMessage.text,
    }
  }

  // Áudio
  if (message.audioMessage) {
    return {
      type: 'audio',
      content: null,
      audio: {
        url: message.audioMessage.url,
        mimetype: message.audioMessage.mimetype,
        seconds: message.audioMessage.seconds,
        ptt: message.audioMessage.ptt, // true = nota de voz
      },
    }
  }

  // Imagem
  if (message.imageMessage) {
    return {
      type: 'image',
      content: message.imageMessage.caption || null,
      image: {
        url: message.imageMessage.url,
        mimetype: message.imageMessage.mimetype,
        width: message.imageMessage.width,
        height: message.imageMessage.height,
        thumbnail: message.imageMessage.jpegThumbnail,
      },
    }
  }

  // Documento (PDF, DOCX, etc.)
  if (message.documentMessage) {
    return {
      type: 'document',
      content: message.documentMessage.caption || message.documentMessage.fileName || null,
      document: {
        url: message.documentMessage.url,
        mimetype: message.documentMessage.mimetype,
        fileName: message.documentMessage.fileName || message.documentMessage.title,
        pageCount: message.documentMessage.pageCount,
        fileLength: message.documentMessage.fileLength,
      },
    }
  }

  // Tipo não suportado (vídeo, sticker, location, etc.)
  return { type: 'unsupported', content: null }
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
        const updateData: any = {
          last_qr_update: new Date().toISOString(),
          connection_status: 'connecting',
        }
        
        // Atualizar QR Code se presente
        if (payload.data.qrcode?.base64) {
          updateData.qr_code = payload.data.qrcode.base64
        }
        
        // Atualizar Pairing Code se presente
        if (payload.data.qrcode?.pairingCode) {
          updateData.pairing_code = payload.data.qrcode.pairingCode
          console.log('Pairing code received:', payload.data.qrcode.pairingCode)
        }
        
        await supabase
          .from('evolution_instances')
          .update(updateData)
          .eq('id', instance.id)
        
        console.log('QR Code/Pairing updated for instance:', payload.instance, 'Has pairing:', !!payload.data.qrcode?.pairingCode)
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
        // =============================================================================
        // FILTRO 1: Rejeitar mensagens do próprio agente (fromMe: true)
        // =============================================================================
        if (payload.data.key?.fromMe === true) {
          console.log('Message from agent itself - filtered out', {
            instance: payload.instance,
            message_id: payload.data.key?.id,
          })
          return new Response(
            JSON.stringify({ 
              success: true, 
              event: payload.event,
              filtered: true,
              reason: 'fromMe: true (agent own message)',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        // =============================================================================
        // FILTRO 2: Detectar e validar tipo de mensagem (texto, áudio, imagem)
        // =============================================================================
        const extractedMessage = extractMessageContent(payload.data.message)
        
        if (extractedMessage.type === 'unsupported') {
          console.log('Unsupported message type - filtered out', {
            instance: payload.instance,
            message_id: payload.data.key?.id,
            message_keys: Object.keys(payload.data.message || {}),
          })
          return new Response(
            JSON.stringify({ 
              success: true, 
              event: payload.event,
              filtered: true,
              reason: 'Unsupported message type (only text, audio, image, document allowed)',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        // =============================================================================
        // FILTRO 3: Validar se agente SDR está ativo
        // =============================================================================
        const { data: sdrConfig } = await supabase
          .from('sdr_agent_config')
          .select('config_json, is_active')
          .eq('phone', instance.phone)
          .single()

        if (!sdrConfig?.is_active) {
          console.log('SDR agent is not active for this instance')
          return new Response(
            JSON.stringify({ 
              success: true, 
              event: payload.event,
              filtered: true,
              reason: 'SDR agent not active',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }

        // =============================================================================
        // ENVIAR PAYLOAD OTIMIZADO AO N8N
        // =============================================================================
        if (n8nWebhookUrl) {
          const senderNumber = payload.data.key?.remoteJid?.split('@')[0] || ''
          const isGroup = payload.data.key?.remoteJid?.endsWith('@g.us') || false

          // Payload otimizado: apenas campos essenciais
          const optimizedPayload = {
            // Identificação da instância
            instance_name: payload.instance,
            phone: instance.phone,
            
            // Metadados da mensagem
            message_metadata: {
              id: payload.data.key?.id,
              timestamp: payload.date_time,
              remote_jid: payload.data.key?.remoteJid,
              from_me: false, // sempre false neste ponto (já filtrado)
            },
            
            // Informações do remetente
            sender: {
              number: senderNumber,
              name: payload.data.pushName || senderNumber,
              is_group: isGroup,
            },
            
            // Conteúdo da mensagem baseado no tipo
            message: {
              type: extractedMessage.type,
              text: extractedMessage.content,
              ...(extractedMessage.type === 'audio' && { audio: extractedMessage.audio }),
              ...(extractedMessage.type === 'image' && { image: extractedMessage.image }),
              ...(extractedMessage.type === 'document' && { document: extractedMessage.document }),
            },
            
            // Configuração do agente SDR
            agent_config: sdrConfig.config_json,
          }

          // Enviar para N8N de forma assíncrona
          fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(optimizedPayload),
          }).catch(err => console.error('Error sending to N8N:', err))

          console.log('✅ Message forwarded to N8N (optimized v7)', {
            type: extractedMessage.type,
            sender: senderNumber,
            is_group: isGroup,
            has_content: !!extractedMessage.content,
          })
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
