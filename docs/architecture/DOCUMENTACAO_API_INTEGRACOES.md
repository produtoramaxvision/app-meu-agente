# 🔌 DOCUMENTAÇÃO DE API E INTEGRAÇÕES
## Meu Agente - APIs, Webhooks e Integrações

---

## 📋 **ÍNDICE**

1. [Visão Geral das APIs](#visão-geral-das-apis)
2. [Autenticação e Segurança](#autenticação-e-segurança)
3. [API do Supabase](#api-do-supabase)
4. [Chat com IA (n8n Webhook)](#chat-com-ia-n8n-webhook)
5. [Agente SDR (Evolution API)](#agente-sdr-evolution-api)
6. [Edge Functions (Stripe)](#edge-functions-stripe)
7. [Webhooks](#webhooks)
8. [Integrações Externas](#integrações-externas)
9. [SDKs e Bibliotecas](#sdks-e-bibliotecas)

---

## 🎯 **VISÃO GERAL DAS APIs**

### **Arquitetura de APIs**

O Meu Agente utiliza uma arquitetura híbrida combinando:
- **Supabase APIs**: Backend-as-a-Service para operações CRUD (PostgREST).
- **n8n Webhooks**: Orquestração de agentes de IA para chat conversacional.
- **Evolution API**: Conexão WhatsApp para Agente SDR.
- **Edge Functions (Deno)**: Lógica de negócio complexa, especialmente para integração com Stripe.
- **Webhooks**: Sincronização assíncrona com gateways de pagamento.
- **Realtime**: Sincronização de estado do cliente via WebSockets.

---

## 🔐 **AUTENTICAÇÃO E SEGURANÇA**

### **Sistema de Autenticação**
Utiliza Supabase Auth com JWT. O token é passado no header `Authorization: Bearer <token>` para todas as requisições, inclusive Edge Functions.

---

## 💬 **CHAT COM IA (n8n WEBHOOK)**

### **Visão Geral**
O Chat com IA é integrado via webhook n8n, permitindo que usuários de **TODOS os planos** (incluindo Free) conversem com agentes de IA.

### **Configuração**
```env
# Variável de ambiente
VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/chat-ia
```

### **Endpoint**

#### **POST /webhook/chat-ia**
Envia uma mensagem para o agente de IA e recebe a resposta.

- **URL**: `VITE_N8N_WEBHOOK_URL`
- **Método**: `POST`
- **Headers**:
  ```json
  { "Content-Type": "application/json" }
  ```
- **Body**:
  ```json
  {
    "sessionId": "uuid-da-sessao",
    "message": "Pesquise sobre marketing digital",
    "userId": "uuid-do-usuario",
    "timestamp": "2025-01-15T10:30:00Z"
  }
  ```
- **Resposta**:
  ```json
  {
    "response": "Aqui está um resumo sobre marketing digital...",
    "sources": ["url1", "url2"],
    "metadata": {
      "model": "gpt-4",
      "tokens_used": 150
    }
  }
  ```

### **Fluxo no n8n**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Webhook   │────>│   Parse     │────>│   OpenAI    │────>│   Return    │
│   Trigger   │     │   Request   │     │   Chat      │     │   Response  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### **Armazenamento de Sessões**

As sessões são armazenadas no Supabase para histórico:

```typescript
// src/hooks/useChatAgent.ts
const createSession = async () => {
  const { data, error } = await supabase
    .from('chat_ia_sessions')
    .insert({ cliente_id: user.id, title: 'Nova conversa' })
    .select()
    .single()
  return data
}
```

---

## 🤖 **AGENTE SDR (EVOLUTION API)**

### **Visão Geral**
O Agente SDR usa a Evolution API para conectar ao WhatsApp e qualificar leads automaticamente. Disponível para planos **Business** e **Premium**.

### **Configuração**
```env
# Variáveis de ambiente
VITE_EVOLUTION_API_URL=https://api.evolution-api.com
VITE_EVOLUTION_API_KEY=sua-api-key
```

### **Endpoints da Evolution API**

#### **1. POST /instance/create**
Cria uma nova instância do WhatsApp.

- **Headers**:
  ```json
  { "apikey": "sua-api-key" }
  ```
- **Body**:
  ```json
  {
    "instanceName": "sdr-cliente-123",
    "qrcode": true
  }
  ```
- **Resposta**:
  ```json
  {
    "instance": {
      "instanceName": "sdr-cliente-123",
      "status": "created"
    },
    "qrcode": {
      "base64": "data:image/png;base64,..."
    }
  }
  ```

#### **2. GET /instance/connectionState/{instanceName}**
Verifica o status de conexão da instância.

- **Resposta**:
  ```json
  {
    "state": "open" | "close" | "connecting"
  }
  ```

#### **3. POST /message/sendText/{instanceName}**
Envia uma mensagem de texto.

- **Body**:
  ```json
  {
    "number": "5511999999999",
    "text": "Olá! Como posso ajudar?"
  }
  ```

### **Webhook de Mensagens Recebidas**

O Evolution API pode enviar mensagens recebidas para um webhook:

```json
// POST /n8n/webhook/sdr-messages
{
  "event": "messages.upsert",
  "instance": "sdr-cliente-123",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "Olá, gostaria de saber mais sobre o produto"
    }
  }
}
```

### **Fluxo de Qualificação**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Lead envia msg  │────>│ Evolution recebe│────>│ n8n processa    │
│ no WhatsApp     │     │ e encaminha     │     │ com contexto    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐     ┌────────▼────────┐
│ Lead recebe     │<────│ Evolution envia │<────│ LLM gera        │
│ resposta        │     │ resposta        │     │ resposta        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 🚀 **EDGE FUNCTIONS (STRIPE)**

As Edge Functions são hospedadas no Supabase e executadas em Deno. Elas atuam como backend seguro para operações sensíveis.

### **1. `create-checkout-session`**
Cria uma sessão de checkout no Stripe para upgrade de plano.

- **Método**: `POST`
- **Autenticação**: Requerida (Bearer Token).
- **Body**:
  ```json
  {
    "plan_id": "basic" | "business" | "premium",
    "success_url": "https://...",
    "cancel_url": "https://..."
  }
  ```
- **Resposta**:
  ```json
  { "url": "https://checkout.stripe.com/..." }
  ```
- **Comportamento**: Verifica se o usuário existe, cria/recupera Customer no Stripe, e retorna a URL de redirecionamento.

### **2. `create-portal-session`**
Gera um link para o Portal do Cliente Stripe (para cancelamento, troca de cartão, downgrade).

- **Método**: `POST`
- **Autenticação**: Requerida (Bearer Token).
- **Body**:
  ```json
  { "return_url": "https://..." }
  ```
- **Resposta**:
  ```json
  { "url": "https://billing.stripe.com/..." }
  ```

### **3. `stripe-webhook`**
Endpoint público (protegido por assinatura) que recebe eventos do Stripe.

- **Método**: `POST`
- **Autenticação**: Validação de assinatura `Stripe-Signature`.
- **Eventos Processados**:
  - `checkout.session.completed`: Ativa plano após pagamento inicial.
  - `invoice.payment_succeeded`: Mantém plano ativo em renovações.
  - `customer.subscription.updated`: Processa mudanças de plano.
  - `customer.subscription.deleted`: Processa cancelamentos (reverte para Free).
  - `customer.deleted`: Limpa dados de pagamento do cliente.

---

## 🔗 **WEBHOOKS**

### **Fluxo de Sincronização Stripe -> Supabase**

A integridade dos dados de assinatura é garantida pela combinação do Webhook com Triggers do banco de dados.

1. **Webhook**: Recebe o evento do Stripe e identifica o `plan_id` correspondente (ou 'free' em caso de cancelamento).
2. **Update**: O Webhook executa um `UPDATE clientes SET plan_id = ...` no Supabase.
3. **Trigger (DB)**: Uma trigger PostgreSQL (`enforce_cliente_subscription_flags`) intercepta a mudança e define automaticamente o campo `subscription_active`:
   - Se `plan_id` é pago -> `subscription_active = true`
   - Se `plan_id` é free -> `subscription_active = false`
4. **Realtime**: O cliente conectado recebe o evento `UPDATE` via WebSocket e atualiza a UI imediatamente.

---

## 🌐 **INTEGRAÇÕES EXTERNAS**

### **Stripe**
- **API Version**: 2024-06-20
- **Modo**: Subscription
- **Produtos**:
  - Basic (R$19,90/mês)
  - Business (R$49,90/mês)
  - Premium (R$99,90/mês)

### **n8n (Automação)**
- **Tipo**: Self-hosted ou Cloud
- **Uso**: Orquestração de agentes de IA
- **Webhooks**:
  - Chat IA (`/webhook/chat-ia`)
  - SDR Messages (`/webhook/sdr-messages`)

### **Evolution API (WhatsApp)**
- **Tipo**: Self-hosted ou Cloud
- **Uso**: Conexão WhatsApp para Agente SDR
- **Funcionalidades**:
  - QR Code para conexão
  - Envio/recebimento de mensagens
  - Status de conexão

### **OpenAI / LLMs**
- **Uso**: Processamento de linguagem natural
- **Modelos**: GPT-4, GPT-3.5-turbo
- **Via**: n8n (não direto do frontend)

### **Spline (3D)**
- **Tipo**: CDN
- **Uso**: Animação 3D do robô no Chat
- **Componente**: `@splinetool/react-spline`

---

## 📚 **SDKS E BIBLIOTECAS**

### **Backend (Edge Functions)**
- `stripe` (esm.sh/stripe@16.5.0)
- `@supabase/supabase-js`

### **Frontend**
- `@supabase/supabase-js` (Cliente Auth e Realtime)
- `@splinetool/react-spline` (Animações 3D)
- `framer-motion` (Animações)
- `recharts` (Gráficos)
- `react-query` (@tanstack/react-query)
- `zod` (Validações)
- `date-fns` (Datas)

### **Integrações**
- `n8n` (Webhooks para IA)
- `evolution-api` (WhatsApp)

---

## 🔒 **VARIÁVEIS DE AMBIENTE**

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon

# n8n (Chat IA)
VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/chat-ia

# Evolution API (SDR)
VITE_EVOLUTION_API_URL=https://api.evolution-api.com
VITE_EVOLUTION_API_KEY=sua-api-key

# Stripe (Backend only)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

**Documentação de API atualizada em**: Janeiro 2025  
**Versão**: 2.0.0
