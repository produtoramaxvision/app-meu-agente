# 🚀 Como Aplicar a Migration do Período de Garantia

A migration está pronta no arquivo:
`supabase/migrations/20251210000001_fix_trial_to_refund_period.sql`

## Opção 1: Via Supabase Dashboard (RECOMENDADO) ✅

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie e cole o conteúdo completo do arquivo `20251210000001_fix_trial_to_refund_period.sql`
6. Clique em **Run** (ou pressione Ctrl+Enter)

## Opção 2: Via Supabase CLI

```powershell
cd "c:\Users\MaxVision\Desktop\cursor-oficial\app-meu-agente"
supabase db push
```

## Opção 3: Via Migration Link (mais rápido)

Execute este comando no PowerShell:

```powershell
cd "c:\Users\MaxVision\Desktop\cursor-oficial\app-meu-agente"
supabase migration up
```

## ✅ O que a Migration Faz

1. **Remove** funções antigas relacionadas ao "trial"
2. **Renomeia** coluna `trial_ends_at` → `refund_period_ends_at`
3. **Cria** 3 funções utilitárias:
   - `is_in_refund_period()` - Verifica se está em período de garantia
   - `refund_period_days_remaining()` - Calcula dias restantes
   - `has_active_subscription()` - Verifica assinatura ativa
4. **Atualiza** trigger `handle_new_auth_user` para novos usuários começarem com plano FREE
5. **Cria** view `cliente_subscription_status` para monitoramento
6. **Adiciona** índices otimizados
7. **Limpa** registros antigos com `plan_id = 'trial'`

## 🎨 Mudanças no Frontend (JÁ APLICADAS)

✅ Todos os textos foram atualizados para **"7 dias grátis"** ao invés de "CDC":

- `src/contexts/AuthContext.tsx` - Interface Cliente
- `src/components/TrialBanner.tsx` - Banner de garantia
- `src/components/PlansSection.tsx` - Cards dos planos

**Badges atualizados:**
- ❌ Antes: "Garantia CDC"
- ✅ Agora: "7 Dias Grátis"

**Descrições atualizadas:**
- ❌ Antes: "🛡️ 7 dias de garantia (CDC)"
- ✅ Agora: "🎁 7 dias grátis de garantia"

## 🔍 Como Verificar se Funcionou

Após aplicar a migration, execute no SQL Editor:

```sql
-- Verificar se a coluna foi renomeada
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND column_name = 'refund_period_ends_at';

-- Verificar se as funções foram criadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_in_refund_period', 'refund_period_days_remaining', 'has_active_subscription');

-- Verificar se a view foi criada
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'cliente_subscription_status';
```

Deve retornar:
- 1 coluna `refund_period_ends_at`
- 3 funções
- 1 view

## ⚠️ IMPORTANTE

- **Backup**: A migration renomeia uma coluna (não deleta dados)
- **Tempo**: ~5 segundos para executar
- **Reversível**: Sim, podemos reverter se necessário
- **Edge Functions**: Não afetadas (não usam este campo)

---

**Status Atual:**
- ✅ Migration preparada
- ✅ Frontend atualizado com "7 dias grátis"
- ⏳ Aguardando aplicação no banco de dados
