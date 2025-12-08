# Fluxo de Webhooks para N8N - Agente SDR

## Visão Geral

Este documento explica o fluxo completo de recebimento de mensagens WhatsApp via Evolution API e encaminhamento para N8N para processamento por IA.

## Atualização Importante (v6)

**Todas as mensagens agora são encaminhadas para o N8N**, incluindo:
- Mensagens enviadas pelo próprio agente (`fromMe: true`)
- Mensagens de grupos (quando `remoteJid` termina com `@g.us`)
- Todos os tipos de mensagens (texto, imagem, áudio, etc.)

A **filtragem deve ser feita no lado do N8N**, permitindo workflows personalizados e lógica de negócio flexível.

## Arquitetura

```
WhatsApp → Evolution API → Supabase Edge Function → N8N → OpenAI → Respostas
                         (evolution-webhook v6)
```

## 1. Evolution API - Webhook de Mensagens

Quando uma mensagem chega no WhatsApp, a Evolution API envia um webhook `MESSAGES_UPSERT` para nossa Edge Function.

### Estrutura do Payload Recebido pela Evolution API

```json
{
  "event": "MESSAGES_UPSERT",
  "instance": "sdragente_5531999887766",
  "data": {
    "key": {
      "remoteJid": "5531988776655@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0XXXXX"
    },
    "message": {
      "conversation": "Olá, tenho interesse no produto X",
      "extendedTextMessage": {
        "text": "Mensagem com formatação ou resposta"
      }
    },
    "pushName": "João Silva",
    "messageTimestamp": "1705318200",
    "status": "SERVER_ACK"
  },
  "destination": "https://seu-projeto.supabase.co/functions/v1/evolution-webhook",
  "date_time": "2024-01-15T10:30:00.000Z",
  "sender": "evolution-api",
  "server_url": "https://evolution.minhaeempresa.com",
  "apikey": "SEU_API_KEY"
}
```

**Campos importantes:**
- `data.key.fromMe`: `true` quando a mensagem foi enviada pelo próprio agente, `false` quando recebida
- `data.key.remoteJid`: Termina com `@s.whatsapp.net` (contato) ou `@g.us` (grupo)
- `data.message.conversation`: Texto simples
- `data.message.extendedTextMessage.text`: Texto formatado ou em resposta

## 2. Edge Function - Processamento Inicial (v6)

A Edge Function `evolution-webhook` processa o webhook:

1. **Validação da Instância**
   - Busca a instância no banco (`evolution_instances`)
   - Valida se existe pelo `instance_name`

2. **Verificação do Agente SDR**
   - Busca configuração em `sdr_agent_config`
   - Verifica se `is_active = true`
   - Se inativo, descarta a mensagem

3. **Encaminhamento Universal** ⚠️ **Novo em v6**
   - **NÃO filtra** mensagens por `fromMe`
   - **NÃO filtra** mensagens sem texto
   - **NÃO filtra** mensagens de grupos
   - Envia **TUDO** para o N8N com payload completo
   - A **filtragem é responsabilidade do workflow N8N**

4. **Prepara Payload para N8N** (Estrutura Completa)

### Payload Enviado para N8N (v6)

```json
{
  "instance_name": "sdragente_5531999887766",
  "phone": "5531999887766",
  
  "evolution_payload": {
    "event": "MESSAGES_UPSERT",
    "instance": "sdragente_5531999887766",
    "data": {
      "key": {
        "remoteJid": "5531988776655@s.whatsapp.net",
        "fromMe": false,
        "id": "3EB0XXXXX"
      },
      "message": {
        "conversation": "Olá, tenho interesse no produto X"
      },
      "pushName": "João Silva",
      "messageTimestamp": "1705318200"
    },
    "destination": "https://seu-projeto.supabase.co/functions/v1/evolution-webhook",
    "date_time": "2024-01-15T10:30:00.000Z",
    "sender": "evolution-api",
    "server_url": "https://evolution.minhaeempresa.com"
  },
  
  "quick_access": {
    "remote_jid": "5531988776655@s.whatsapp.net",
    "from_me": false,
    "message_id": "3EB0XXXXX",
    "sender_number": "5531988776655",
    "sender_name": "João Silva",
    "message_text": "Olá, tenho interesse no produto X",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "is_group": false
  },
  
  "agent_config": {
    "persona": "Vendedor profissional e prestativo",
    "objetivo": "Qualificar leads e agendar demonstrações",
    "tom": "Amigável mas profissional",
    "instrucoes_adicionais": "Sempre pergunte sobre orçamento disponível"
  }
}
```

**Estrutura do Payload:**

1. **Metadados da Instância:**
   - `instance_name`: Nome da instância Evolution
   - `phone`: Telefone do agente SDR

2. **`evolution_payload`** (Dados Originais Completos):
   - Contém TODOS os dados enviados pela Evolution API
   - Use para acessar campos específicos não extraídos em `quick_access`
   - Estrutura inalterada da Evolution API v2.3.7

3. **`quick_access`** (Campos Extraídos):
   - Facilita acesso rápido aos campos mais usados
   - `from_me`: crucial para filtrar mensagens enviadas vs recebidas
   - `is_group`: identifica se é mensagem de grupo
   - `message_text`: texto extraído de `conversation` ou `extendedTextMessage.text`

4. **`agent_config`** (Configuração do Agente):
   - Configuração completa do SDR (persona, objetivo, tom, etc.)
   - Use para instruir o modelo de IA

## 3. Workflow N8N

### 3.1. Webhook Node (Entrada)

Configure um **Webhook node** para receber os dados:

- **HTTP Method:** POST
- **Path:** `/webhook/sdr-agent` (exemplo)
- **Authentication:** None (ou configure Bearer Token se preferir)
- **Response Mode:** Respond Immediately (não espera processamento)

### 3.2. Switch Node (Filtragem Inicial) ⚠️ **Recomendado em v6**

Como agora recebemos TODAS as mensagens, adicione um **Switch node** para filtrar:

```javascript
// Regra 1: Ignorar mensagens próprias
if ($json.quick_access.from_me === true) {
  return { routeIndex: 0 }; // Saída "Ignorar"
}

// Regra 2: Ignorar mensagens de grupo (opcional)
if ($json.quick_access.is_group === true) {
  return { routeIndex: 0 }; // Saída "Ignorar"
}

// Regra 3: Processar apenas mensagens com texto (opcional)
if (!$json.quick_access.message_text || $json.quick_access.message_text.trim() === '') {
  return { routeIndex: 0 }; // Saída "Ignorar"
}

// Regra 4: Processar mensagem
return { routeIndex: 1 }; // Saída "Processar"
```

**Outputs:**
- Output 0: Ignorar (conectar a um **No Operation** node)
- Output 1: Processar (continuar workflow)

### 3.3. Function Node (Prepara Context)

Extraia e formate os dados para a IA (acesso aos novos campos):

```javascript
const data = $input.first().json;

return {
  json: {
    sender: data.quick_access.sender_name || data.quick_access.sender_number,
    message: data.quick_access.message_text,
    context: {
      persona: data.agent_config.persona,
      objetivo: data.agent_config.objetivo,
      tom: data.agent_config.tom,
      instrucoes: data.agent_config.instrucoes_adicionais
    },
    metadata: {
      instance: data.instance_name,
      phone: data.phone,
      remote_jid: data.quick_access.remote_jid,
      message_id: data.quick_access.message_id,
      timestamp: data.quick_access.timestamp,
      from_me: data.quick_access.from_me,
      is_group: data.quick_access.is_group
    },
    // Acesso ao payload completo da Evolution (se necessário)
    evolution_raw: data.evolution_payload
  }
}
```

### 3.4. OpenAI Node (Gerar Resposta)

Configure o **OpenAI node** para gerar a resposta:

- **Operation:** Create a Completion
- **Model:** gpt-4-turbo ou gpt-3.5-turbo
- **Prompt:**

```
Você é {{ $json.context.persona }}.
Seu objetivo: {{ $json.context.objetivo }}
Tom de voz: {{ $json.context.tom }}

Instruções adicionais: {{ $json.context.instrucoes }}

---
Mensagem do cliente ({{ $json.sender }}):
{{ $json.message }}

Responda de forma natural e profissional.
```

### 3.5. HTTP Request Node (Enviar Resposta)

Configure um **HTTP Request node** para enviar a resposta via Evolution API:

- **Method:** POST
- **URL:** `https://evolution.minhaeempresa.com/message/sendText/{{ $('Webhook').item.json.instance_name }}`
- **Authentication:** Header Auth
  - Name: `apikey`
  - Value: `SEU_API_KEY_EVOLUTION`
- **Body (JSON):**

```json
{
  "number": "{{ $('Webhook').item.json.quick_access.sender_number }}",
  "text": "{{ $json.choices[0].message.content }}"
}
```

## 4. Variáveis de Ambiente

### Supabase Edge Function

Configure no Supabase Dashboard → Edge Functions → Secrets:

```bash
N8N_SDR_WEBHOOK_URL=https://seu-n8n.com/webhook/sdr-agent
```

### Evolution API

Configure os webhooks da instância para apontar para:

```
https://seu-projeto.supabase.co/functions/v1/evolution-webhook
```

## 5. Segurança

### Verificação JWT (Importante)

⚠️ A Edge Function `evolution-webhook` está configurada com `verify_jwt = false` no `config.toml` para permitir receber webhooks da Evolution API sem autenticação JWT.

**Recomendações:**
1. Use HTTPS sempre
2. Configure IP allowlist na Evolution API se possível
3. Valide o campo `apikey` do webhook contra uma lista conhecida
4. Monitore logs para atividades suspeitas

## 6. Monitoramento e Debug

### Logs da Edge Function

```bash
supabase functions logs evolution-webhook --follow
```

Procure por:
- `Message forwarded to N8N for processing` - sucesso
- `SDR agent is not active` - agente desativado
- `Instance not found` - instância inexistente

### Logs do N8N

Verifique o webhook node para ver payloads recebidos e erros de processamento.

### Campos de Debug no Payload

O log agora inclui:
```json
{
  "from_me": false,
  "has_text": true,
  "is_group": false
}
```

## 7. Casos de Uso Avançados

### 7.1. Diferentes Workflows por Tipo de Mensagem

Use o campo `evolution_payload.data.message` para rotear:

```javascript
const message = $json.evolution_payload.data.message;

if (message.imageMessage) {
  return { routeIndex: 0 }; // Workflow para imagens
}
if (message.audioMessage) {
  return { routeIndex: 1 }; // Workflow para áudios
}
if (message.conversation || message.extendedTextMessage) {
  return { routeIndex: 2 }; // Workflow para texto
}
```

### 7.2. Análise de Sentimento

Use campos extras do `evolution_payload` para análise contextual:

```javascript
const timestamp = $json.evolution_payload.data.messageTimestamp;
const now = Math.floor(Date.now() / 1000);
const ageInMinutes = (now - timestamp) / 60;

if (ageInMinutes < 5) {
  // Mensagem muito recente - resposta urgente
  return { priority: 'high' };
}
```

### 7.3. Integração com CRM

Combine com HTTP Request para criar/atualizar leads:

```javascript
// Após receber mensagem, atualizar CRM
{
  "contact": $json.quick_access.sender_number,
  "name": $json.quick_access.sender_name,
  "last_message": $json.quick_access.message_text,
  "last_contact": $json.quick_access.timestamp
}
```

## 8. Troubleshooting

### Mensagens não chegam no N8N

1. Verifique se `N8N_SDR_WEBHOOK_URL` está configurado
2. Teste o webhook diretamente com curl:
```bash
curl -X POST https://seu-n8n.com/webhook/sdr-agent \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```
3. Verifique logs da Edge Function para erros de fetch

### Respostas não são enviadas

1. Verifique se o API Key da Evolution está correto
2. Teste o endpoint de envio diretamente
3. Verifique formato do número (com código do país)

### Filtragem não funciona

1. Verifique se o Switch node está antes do processamento
2. Teste cada condição isoladamente
3. Use console.log no Function node para debug:
```javascript
console.log('from_me:', $json.quick_access.from_me);
console.log('is_group:', $json.quick_access.is_group);
```

## 9. Próximos Passos

- [ ] Implementar rate limiting no N8N
- [ ] Adicionar banco de dados de conversas (context memory)
- [ ] Criar dashboard de métricas
- [ ] Implementar A/B testing de prompts
- [ ] Adicionar suporte a multi-idiomas
- [ ] Integrar com sistemas de pagamento

## 10. Referências

- [Evolution API v2.3.7 Documentation](https://doc.evolution-api.com/v2/)
- [N8N Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
