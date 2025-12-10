# 🎁 Documentação de Implantação: Trial Gratuito de 7 Dias

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Mudanças Implementadas](#mudanças-implementadas)
3. [Configuração do Stripe](#configuração-do-stripe)
4. [Deploy das Edge Functions](#deploy-das-edge-functions)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Configuração do Webhook](#configuração-do-webhook)
7. [Testes](#testes)
8. [Monitoramento](#monitoramento)

---

## 🎯 Visão Geral

O sistema de trial gratuito oferece:
- ✅ **7 dias de teste grátis** em todos os planos pagos (Basic, Business, Premium)
- ✅ **Conversão automática** para plano Free após expiração do trial (se não houver pagamento)
- ✅ **Banner visual** no Dashboard mostrando dias restantes
- ✅ **Webhook do Stripe** para sincronização automática de status
- ✅ **Edge Functions Supabase** para checkout e gerenciamento de assinaturas

---

## 🔧 Mudanças Implementadas

### 1. **Banco de Dados (Migration)**
- ✅ **Função `is_trial_active()`**: Verifica se o trial está ativo
- ✅ **Função `has_active_access()`**: Verifica acesso (trial OU assinatura)
- ✅ **Função `expire_trials()`**: Expira trials automaticamente
- ✅ **View `cliente_access_status`**: Visão consolidada do status de acesso
- ✅ **Trigger `handle_new_auth_user`**: Inicia trial de 7 dias automaticamente
- ✅ **Índices otimizados**: Para queries de trial

**Arquivo:** `supabase/migrations/20251210000000_add_trial_support_to_clientes.sql`

### 2. **Edge Functions Supabase**

#### `create-checkout-session`
- Cria sessão de checkout no Stripe
- **Lógica do trial:**
  - Se o usuário **nunca teve trial**: adiciona `trial_period_days: 7`
  - Se o usuário **já teve trial**: checkout direto sem trial
  - Se o usuário **está em trial ativo**: não adiciona novo trial

**Arquivo:** `supabase/functions/create-checkout-session/index.ts`

#### `stripe-webhook`
- Recebe eventos do Stripe e atualiza banco de dados
- **Eventos tratados:**
  - `checkout.session.completed`: Atualiza status após checkout
  - `customer.subscription.created/updated`: Sincroniza status da assinatura
  - `customer.subscription.deleted`: Move para plano Free
  - `customer.subscription.trial_will_end`: Notificação de fim de trial
  - `invoice.payment_succeeded`: Confirma pagamento
  - `invoice.payment_failed`: Registra falha

**Arquivo:** `supabase/functions/stripe-webhook/index.ts`

#### `create-portal-session`
- Cria sessão do portal do cliente Stripe
- Permite que o usuário gerencie sua assinatura

**Arquivo:** `supabase/functions/create-portal-session/index.ts`

### 3. **Frontend**

#### `usePlanInfo.ts` (Hook)
- ✅ Atualizado para detectar trial ativo
- ✅ Novo método `getTrialPlanInfo()`
- ✅ Propriedades adicionadas:
  - `isInActiveTrial`: boolean
  - `isTrialPlan`: boolean
  - `trialEndsAt`: string | null
  - `trialDaysRemaining`: number

#### `TrialBanner.tsx` (Componente)
- Banner visual no topo do Dashboard
- Mostra dias restantes do trial
- Barra de progresso
- Botão "Fazer Upgrade"

#### `PlansSection.tsx`
- Atualizado para mostrar "🎁 7 dias grátis" em todos os planos pagos
- Badge "Trial 7 dias"

#### `AuthContext.tsx`
- Interface `Cliente` atualizada com `trial_ends_at`

---

## 💳 Configuração do Stripe

### 1. **Criar Produtos e Preços no Stripe**

Acesse: https://dashboard.stripe.com/products

```bash
# Basic - R$ 497,00/mês
Produto: "Plano Básico"
Preço: R$ 497,00 (recurring/monthly)
ID do Preço: price_basic_monthly

# Business - R$ 997,00/mês
Produto: "Plano Business"
Preço: R$ 997,00 (recurring/monthly)
ID do Preço: price_business_monthly

# Premium - R$ 1.497,00/mês
Produto: "Plano Premium"
Preço: R$ 1.497,00 (recurring/monthly)
ID do Preço: price_premium_monthly
```

### 2. **Configurar Moeda BRL**

No Stripe Dashboard → Settings → Payment methods:
- ✅ Habilitar **BRL (Real Brasileiro)**
- ✅ Configurar métodos de pagamento locais (Pix, Boleto, Cartão)

---

## 🚀 Deploy das Edge Functions

### 1. **Fazer login no Supabase CLI**

```powershell
supabase login
```

### 2. **Linkar ao projeto**

```powershell
supabase link --project-ref SEU_PROJECT_REF
```

### 3. **Deploy das funções**

```powershell
# Deploy create-checkout-session
supabase functions deploy create-checkout-session

# Deploy stripe-webhook
supabase functions deploy stripe-webhook

# Deploy create-portal-session
supabase functions deploy create-portal-session
```

### 4. **Verificar deploy**

```powershell
supabase functions list
```

---

## 🔐 Variáveis de Ambiente

### 1. **Variáveis no Supabase**

Acesse: https://supabase.com/dashboard/project/SEU_PROJECT/settings/functions

Configure os seguintes secrets:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# IDs dos preços
STRIPE_PRICE_BASIC=price_basic_monthly
STRIPE_PRICE_BUSINESS=price_business_monthly
STRIPE_PRICE_PREMIUM=price_premium_monthly

# Supabase (já existem)
SUPABASE_URL=https://SEU_PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

**Comandos para configurar:**

```powershell
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_BASIC=price_basic_monthly
supabase secrets set STRIPE_PRICE_BUSINESS=price_business_monthly
supabase secrets set STRIPE_PRICE_PREMIUM=price_premium_monthly
```

---

## 🔔 Configuração do Webhook

### 1. **Obter URL do Webhook**

Após deploy da função `stripe-webhook`:

```
https://SEU_PROJECT.supabase.co/functions/v1/stripe-webhook
```

### 2. **Configurar no Stripe**

Acesse: https://dashboard.stripe.com/webhooks

1. Clique em **"Add endpoint"**
2. Cole a URL: `https://SEU_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Selecione os eventos:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `customer.subscription.trial_will_end`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
4. Clique em **"Add endpoint"**

### 3. **Copiar Webhook Secret**

Após criar o webhook, copie o **Signing secret** (`whsec_...`) e configure:

```powershell
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## ✅ Testes

### 1. **Teste de Trial (Modo Teste Stripe)**

1. **Criar usuário novo no app**
2. **Verificar no banco:**
   ```sql
   SELECT phone, plan_id, trial_ends_at, subscription_active 
   FROM clientes 
   WHERE phone = '+5511999999999';
   ```
   - Deve ter: `plan_id = 'trial'`, `trial_ends_at` = 7 dias no futuro

3. **Iniciar checkout de um plano:**
   - Usar cartão de teste: `4242 4242 4242 4242`
   - Verificar que o trial de 7 dias é aplicado

4. **Verificar webhook:**
   - Checar logs no Supabase: Functions → stripe-webhook → Logs
   - Verificar se `checkout.session.completed` foi recebido

### 2. **Teste de Expiração do Trial**

Para testar sem esperar 7 dias:

```sql
-- Simular expiração (mudar trial_ends_at para ontem)
UPDATE clientes 
SET trial_ends_at = NOW() - INTERVAL '1 day'
WHERE phone = '+5511999999999';

-- Executar função de expiração
SELECT expire_trials();

-- Verificar resultado
SELECT phone, plan_id, subscription_active 
FROM clientes 
WHERE phone = '+5511999999999';
-- Deve ter: plan_id = 'free'
```

### 3. **Teste de Conversão (Trial → Paid)**

1. Durante o trial, complete o pagamento no Stripe
2. Webhook `invoice.payment_succeeded` deve atualizar:
   - `subscription_active = true`
   - `plan_id = 'basic'` (ou outro plano)
   - `trial_ends_at = NULL`

---

## 📊 Monitoramento

### 1. **View de Status de Acesso**

```sql
-- Ver todos os clientes e seus status
SELECT * FROM cliente_access_status;
```

Campos úteis:
- `access_status`: 'paid_subscription', 'active_trial', 'trial_expired', 'no_trial'
- `trial_days_remaining`: Dias restantes do trial

### 2. **Logs do Stripe**

- Acesse: https://dashboard.stripe.com/logs
- Filtrar por eventos relacionados ao trial

### 3. **Logs das Edge Functions**

```powershell
# Ver logs em tempo real
supabase functions logs stripe-webhook --follow
```

### 4. **Dashboards Supabase**

- Acesse: https://supabase.com/dashboard/project/SEU_PROJECT
- Functions → Invocations
- Auth → Users

---

## 🔄 Cron Job para Expiração Automática

**Opcional:** Configure um cron job para expirar trials automaticamente.

### Usando pg_cron (Supabase)

```sql
-- Criar extensão pg_cron (se não existir)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar expiração diária às 00:00
SELECT cron.schedule(
  'expire-trials-daily',
  '0 0 * * *',
  'SELECT public.expire_trials();'
);

-- Verificar jobs
SELECT * FROM cron.job;
```

### Alternativa: GitHub Actions

Crie `.github/workflows/expire-trials.yml`:

```yaml
name: Expire Trials Daily

on:
  schedule:
    - cron: '0 0 * * *' # Todo dia às 00:00 UTC

jobs:
  expire-trials:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            https://SEU_PROJECT.supabase.co/rest/v1/rpc/expire_trials \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

---

## 🎉 Checklist Final

Antes de ir para produção:

- [ ] Migration aplicada no banco
- [ ] Edge Functions deployed
- [ ] Variáveis de ambiente configuradas
- [ ] Webhook do Stripe configurado
- [ ] Produtos e preços criados no Stripe
- [ ] Testes realizados com cartão de teste
- [ ] Banner de trial aparece no Dashboard
- [ ] Expiração de trial funciona corretamente
- [ ] Logs das funções não mostram erros
- [ ] Cron job de expiração configurado (opcional)

---

## 🆘 Troubleshooting

### Problema: Webhook não está sendo recebido
**Solução:**
1. Verificar URL do webhook no Stripe
2. Checar logs da função: `supabase functions logs stripe-webhook`
3. Testar webhook manualmente no Stripe Dashboard

### Problema: Trial não inicia automaticamente
**Solução:**
1. Verificar trigger `handle_new_auth_user`
2. Checar logs de signup no Supabase Auth
3. Executar manualmente:
   ```sql
   UPDATE clientes 
   SET plan_id = 'trial', 
       trial_ends_at = NOW() + INTERVAL '7 days'
   WHERE phone = '+5511999999999';
   ```

### Problema: Banner de trial não aparece
**Solução:**
1. Verificar `usePlanInfo()` hook
2. Checar se `trial_ends_at` está definido no banco
3. Inspecionar console do navegador para erros

---

## 📝 Notas Importantes

1. **Teste primeiro em modo sandbox do Stripe** antes de ir para produção
2. **Backup do banco** antes de aplicar a migration
3. **Monitorar logs** nas primeiras semanas após deploy
4. **Comunicar usuários** sobre o novo período de trial
5. **Atualizar termos de serviço** se necessário

---

## 📞 Suporte

- Documentação do Stripe: https://stripe.com/docs
- Documentação do Supabase: https://supabase.com/docs
- Discord do Stripe: https://stripe.com/go/developer-chat

---

**Data de implantação:** 10/12/2025
**Versão:** 1.0.0
**Status:** ✅ Pronto para deploy
