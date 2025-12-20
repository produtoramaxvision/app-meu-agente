# Especificação Técnica: Normalização de Dados (Meta vs. Evolution)

Esta especificação define os schemas unificados para garantir interoperabilidade entre os dois provedores de WhatsApp.

## 1. Modelo de Dados Unificado (`UnifiedMessage`)

Este é o formato que o sistema interno (Frontend, n8n, Banco de Dados) deve esperar.

```typescript
type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'template' | 'interactive';

interface UnifiedMessage {
  // Identificadores
  id: string;                 // WAMID (Meta) ou ID interno (Evolution)
  remoteJid: string;          // Formato E.164 sem símbolos (ex: 5511999999999)
  pushName?: string;          // Nome de exibição do contato
  
  // Metadados de Envio
  fromMe: boolean;            // true = enviada pelo sistema, false = recebida
  provider: 'meta' | 'evolution';
  instanceId?: string;        // ID da instância Evolution (se aplicável)
  wabaId?: string;            // ID da conta WhatsApp Business (se aplicável)
  
  // Conteúdo
  type: MessageType;
  content: string;            // Texto da mensagem ou Caption da mídia
  mediaUrl?: string;          // URL pública da mídia (se houver)
  mediaType?: string;         // MIME type (ex: image/jpeg)
  fileName?: string;          // Nome do arquivo (para documentos)
  
  // Contexto
  quotedMessageId?: string;   // ID da mensagem respondida
  conversationId?: string;    // ID da conversa/sessão
  
  // Timestamp
  timestamp: number;          // Unix timestamp em segundos
  
  // Status (apenas para atualizações de status)
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  errorCode?: string;         // Código de erro do provedor em caso de falha
}
```

## 2. Mapeamento de Entrada (Webhooks)

### 2.1. Meta Cloud API -> Unified

**Payload Meta (Exemplo Simplificado):**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "5511999999999",
          "id": "wamid.HBgM...",
          "timestamp": "1703030303",
          "text": { "body": "Olá mundo" },
          "type": "text"
        }]
      }
    }]
  }]
}
```

**Transformação:**
```typescript
function normalizeMetaMessage(metaMsg: any): UnifiedMessage {
  return {
    id: metaMsg.id,
    remoteJid: metaMsg.from,
    pushName: metaMsg.contacts?.[0]?.profile?.name,
    fromMe: false,
    provider: 'meta',
    type: metaMsg.type,
    content: metaMsg.text?.body || metaMsg.caption || '',
    timestamp: parseInt(metaMsg.timestamp),
    // ... lógica para extrair mídia baseada no type
  };
}
```

### 2.2. Evolution API -> Unified

**Payload Evolution (Exemplo Simplificado):**
```json
{
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "BAE5..."
    },
    "pushName": "João Silva",
    "message": {
      "conversation": "Olá mundo"
    },
    "messageTimestamp": 1703030303
  },
  "instance": "Instancia 1"
}
```

**Transformação:**
```typescript
function normalizeEvolutionMessage(evoMsg: any): UnifiedMessage {
  const key = evoMsg.data.key;
  const content = evoMsg.data.message?.conversation || evoMsg.data.message?.extendedTextMessage?.text || '';
  
  return {
    id: key.id,
    remoteJid: key.remoteJid.split('@')[0],
    pushName: evoMsg.data.pushName,
    fromMe: key.fromMe,
    provider: 'evolution',
    instanceId: evoMsg.instance, // Nome ou ID da instância
    type: 'text', // Simplificação, requer lógica para detectar tipo real
    content: content,
    timestamp: evoMsg.data.messageTimestamp,
  };
}
```

## 3. Mapeamento de Saída (Envio)

A Edge Function `send-whatsapp-message` receberá um payload padrão e o converterá para o formato específico do provedor escolhido.

**Payload de Entrada da Função:**
```json
{
  "to": "5511999999999",
  "type": "text",
  "content": "Olá, como posso ajudar?",
  "forceProvider": "meta" // opcional
}
```

### 3.1. Para Meta Cloud API
```json
{
  "messaging_product": "whatsapp",
  "to": "5511999999999",
  "type": "text",
  "text": { "body": "Olá, como posso ajudar?" }
}
```

### 3.2. Para Evolution API
```json
{
  "number": "5511999999999",
  "text": "Olá, como posso ajudar?"
}
```

## 4. Tratamento de Mídia

*   **Meta:** Requer upload prévio para obter um `media_id` ou uso de URL pública (suportado nativamente).
*   **Evolution:** Aceita URL pública diretamente ou Base64.
*   **Decisão:** O sistema interno deve priorizar o armazenamento de mídia em um Bucket (Supabase Storage) e passar a URL pública para os provedores. Isso unifica o tratamento de mídia.