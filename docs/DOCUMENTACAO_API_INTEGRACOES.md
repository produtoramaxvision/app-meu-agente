# 🔌 DOCUMENTAÇÃO DE API E INTEGRAÇÕES
## Meu Agente Financeiro - APIs, Webhooks e Integrações

---

## 📋 **ÍNDICE**

1. [Visão Geral das APIs](#visão-geral-das-apis)
2. [Autenticação e Segurança](#autenticação-e-segurança)
3. [API do Supabase](#api-do-supabase)
4. [Edge Functions (Stripe)](#edge-functions-stripe)
5. [Webhooks](#webhooks)
6. [Integrações Externas](#integrações-externas)
7. [SDKs e Bibliotecas](#sdks-e-bibliotecas)

---

## 🎯 **VISÃO GERAL DAS APIs**

### **Arquitetura de APIs**

O Meu Agente Financeiro utiliza uma arquitetura híbrida combinando:
- **Supabase APIs**: Backend-as-a-Service para operações CRUD (PostgREST).
- **Edge Functions (Deno)**: Lógica de negócio complexa, especialmente para integração com Stripe.
- **Webhooks**: Sincronização assíncrona com gateways de pagamento.
- **Realtime**: Sincronização de estado do cliente via WebSockets.

---

## 🔐 **AUTENTICAÇÃO E SEGURANÇA**

### **Sistema de Autenticação**
Utiliza Supabase Auth com JWT. O token é passado no header `Authorization: Bearer <token>` para todas as requisições, inclusive Edge Functions.

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
  - Basic
  - Business
  - Premium

---

## 📚 **SDKS E BIBLIOTECAS**

### **Backend (Edge Functions)**
- `stripe` (esm.sh/stripe@16.5.0)
- `@supabase/supabase-js`

### **Frontend**
- `@supabase/supabase-js` (Cliente Auth e Realtime)

---

**Documentação de API atualizada em**: 24/11/2025  
**Versão**: 1.1.0
