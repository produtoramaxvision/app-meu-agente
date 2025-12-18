# Padrões de Autenticação em Edge Functions

**Data:** Dezembro 2025  
**Status:** ✅ Atualizado com melhores práticas oficiais do Supabase

## 📋 Índice

- [Resumo Executivo](#resumo-executivo)
- [Padrão Oficial Supabase](#padrão-oficial-supabase)
- [Tipos de Edge Functions](#tipos-de-edge-functions)
- [Implementação por Tipo](#implementação-por-tipo)
- [Segurança e Validações](#segurança-e-validações)
- [Checklist de Implementação](#checklist-de-implementação)

---

## 🎯 Resumo Executivo

O método `supabase.auth.getUser(token)` é o **padrão oficial e recomendado** para autenticação em Supabase Edge Functions (2025). Não está deprecado.

### ✅ Método Correto (Atual)
```typescript
const { data: { user }, error } = await supabase.auth.getUser(token);
```

### ❌ Método Incorreto (Nunca use)
```typescript
// NÃO FAZER: Validação manual de JWT sem usar getUser()
const decoded = jwt.verify(token, secret);
```

---

## 📖 Padrão Oficial Supabase

### Fonte da Documentação

- **URL:** https://supabase.com/docs/guides/functions/auth
- **Data de Consulta:** Dezembro 2025
- **Versão Supabase:** 2.x

### Padrão Recomendado

```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Criar cliente Supabase com Service Role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Validar Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Extrair e validar token com getUser()
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Buscar dados do cliente usando o user.id
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (clienteError || !cliente) {
      return new Response(
        JSON.stringify({ error: 'Cliente not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Lógica de negócio
    // ... seu código aqui

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 🔐 Tipos de Edge Functions

### 1. **Funções Autenticadas** (Padrão)

**Características:**
- Requerem JWT válido no header `Authorization`
- `verify_jwt = true` (padrão, não precisa configurar)
- Validam usuário com `auth.getUser(token)`

**Quando usar:**
- Operações de usuário (CRUD)
- Buscar dados específicos do usuário
- Operações sensíveis

**Exemplos no projeto:**
- `create-evolution-instance`
- `send-evolution-text`
- `create-checkout-session`
- `disconnect-evolution-instance`

---

### 2. **Webhooks Externos**

**Características:**
- Recebem requisições de serviços externos (Stripe, Evolution API)
- `verify_jwt = false` (configurar no `config.toml`)
- Validam assinatura própria do serviço

**Quando usar:**
- Webhooks do Stripe
- Webhooks da Evolution API
- Callbacks de serviços externos

**Configuração (`supabase/config.toml`):**
```toml
[functions.stripe-webhook]
verify_jwt = false

[functions.evolution-webhook]
verify_jwt = false
```

**Exemplo:**
```typescript
Deno.serve(async (req) => {
  // Webhook do Stripe valida assinatura própria
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  const event = await stripe.webhooks.constructEventAsync(
    body,
    signature,
    webhookSecret
  );
  
  // Processar evento...
});
```

---

### 3. **Processos Internos (Cron/Triggers)**

**Características:**
- Invocados por `pg_cron`, `pg_net` ou triggers do banco
- `verify_jwt = false`
- Não possuem contexto de usuário

**Quando usar:**
- Processos agendados
- Automações do sistema
- Limpeza de dados

**Configuração:**
```toml
[functions.process-automations]
verify_jwt = false
```

**Exemplo:**
```typescript
Deno.serve(async (req) => {
  // Usar service role para operações administrativas
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Lógica sem contexto de usuário...
});
```

---

## 🛡️ Segurança e Validações

### ✅ Melhores Práticas

#### 1. **Sempre use Service Role Key**
```typescript
// ✅ CORRETO
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// ❌ ERRADO (ANON_KEY não tem permissões admin)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);
```

#### 2. **Valide token antes de prosseguir**
```typescript
// ✅ CORRETO - Para imediatamente se falhar
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
if (authError || !user) {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401 }
  );
}

// ❌ ERRADO - Continua sem validar
const { data: { user } } = await supabase.auth.getUser(token);
// ... usa user sem verificar se existe
```

#### 3. **Extraia token corretamente**
```typescript
// ✅ CORRETO
const authHeader = req.headers.get('Authorization');
if (!authHeader) throw new Error('Missing auth');
const token = authHeader.replace('Bearer ', '');

// ❌ ERRADO - Pode dar erro se header não existir
const token = req.headers.get('Authorization')!.replace('Bearer ', '');
```

#### 4. **Use RLS (Row Level Security) sempre que possível**
```typescript
// ✅ CORRETO - RLS aplica automaticamente
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      headers: { Authorization: req.headers.get('Authorization')! },
    },
  }
);

const { data } = await supabaseClient.from('profiles').select('*');
// RLS garante que só vê seus dados

// ⚠️ CUIDADO - Service role ignora RLS
const { data } = await supabaseAdmin.from('profiles').select('*');
// Retorna TODOS os perfis (use com cuidado!)
```

---

### 🚨 Validações de Segurança

#### Checklist de Validação

```typescript
// 1. Validar Authorization header
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response('Unauthorized', { status: 401 });
}

// 2. Extrair e validar token
const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return new Response('Invalid token', { status: 401 });
}

// 3. Validar dados do cliente
const { data: cliente, error: clienteError } = await supabase
  .from('clientes')
  .select('*')
  .eq('auth_user_id', user.id)
  .single();

if (clienteError || !cliente) {
  return new Response('Cliente not found', { status: 404 });
}

// 4. Validar permissões/recursos específicos
if (!cliente.subscription_active) {
  return new Response('Subscription required', { status: 403 });
}

// 5. Validar limites de plano (se aplicável)
const { data: instances } = await supabase
  .from('evolution_instances')
  .select('id')
  .eq('phone', cliente.phone);

const maxInstances = await getMaxInstancesForUser(cliente.phone);
if (instances.length >= maxInstances) {
  return new Response('Instance limit reached', { status: 403 });
}
```

---

## 📝 Checklist de Implementação

### Para Edge Functions Autenticadas

- [ ] Importar `createClient` de `jsr:@supabase/supabase-js@2`
- [ ] Configurar CORS headers
- [ ] Adicionar handler para OPTIONS (preflight)
- [ ] Criar cliente com `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Validar `Authorization` header
- [ ] Extrair token com `.replace('Bearer ', '')`
- [ ] Chamar `supabase.auth.getUser(token)`
- [ ] Validar resposta (check `error` e `user`)
- [ ] Buscar dados do cliente via `auth_user_id`
- [ ] Adicionar try-catch para erros
- [ ] Retornar JSON com headers CORS

### Para Webhooks Externos

- [ ] Adicionar `verify_jwt = false` no `config.toml`
- [ ] Validar assinatura do serviço externo (Stripe, Evolution, etc.)
- [ ] Não validar JWT (não há usuário autenticado)
- [ ] Usar `SUPABASE_SERVICE_ROLE_KEY` para operações DB
- [ ] Log eventos importantes
- [ ] Retornar 200 rapidamente para o webhook

### Para Processos Internos

- [ ] Adicionar `verify_jwt = false` no `config.toml`
- [ ] Usar `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Não assumir contexto de usuário
- [ ] Adicionar logs detalhados
- [ ] Implementar retry logic se necessário

---

## 🔍 Debugging e Troubleshooting

### Erros Comuns

#### 1. **401 Unauthorized**
```typescript
// Causa: Token inválido ou expirado
// Solução: Verificar se o token está sendo passado corretamente
const authHeader = req.headers.get('Authorization');
console.log('Auth header:', authHeader); // Debug

const { error } = await supabase.auth.getUser(token);
console.log('Auth error:', error); // Debug
```

#### 2. **404 Cliente não encontrado**
```typescript
// Causa: auth_user_id não corresponde
// Solução: Verificar se o campo auth_user_id está correto
console.log('User ID:', user.id);
console.log('Cliente query:', { auth_user_id: user.id });
```

#### 3. **500 Internal Server Error**
```typescript
// Causa: Erro não tratado
// Solução: Adicionar try-catch e logs
try {
  // código
} catch (error) {
  console.error('Function error:', error);
  return new Response(
    JSON.stringify({ 
      error: error.message,
      stack: error.stack // Apenas em dev!
    }),
    { status: 500 }
  );
}
```

---

## 📚 Referências

### Documentação Oficial

- [Supabase Edge Functions Auth](https://supabase.com/docs/guides/functions/auth)
- [Function Configuration](https://supabase.com/docs/guides/functions/function-configuration)
- [JWT Claims Reference](https://supabase.com/docs/guides/auth/jwt-fields)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### Exemplos no Projeto

#### Autenticação com RLS:
- `src/components/crm/LeadDetailsSheet.tsx` → `send-evolution-text`

#### Service Role + getUser():
- `supabase/functions/create-evolution-instance/index.ts`
- `supabase/functions/send-evolution-text/index.ts`
- `supabase/functions/update-evolution-settings/index.ts`

#### Webhooks sem JWT:
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/evolution-webhook/index.ts`

#### Processos internos:
- `supabase/functions/process-automations/index.ts`

---

## 🔄 Changelog

| Data | Versão | Mudanças |
|------|--------|----------|
| 2025-12-17 | 1.0 | Criação do documento com padrões atualizados |

---

**Última atualização:** 17 de Dezembro de 2025  
**Mantido por:** Equipe Meu Agente  
**Próxima revisão:** Junho de 2026
