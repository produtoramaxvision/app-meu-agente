-- Migration: Adicionar período de garantia de 7 dias grátis
-- Data: 2025-12-10
-- Objetivo: Implementar período de garantia de 7 dias grátis em vez de trial

-- ========================================
-- PARTE 1: Reverter mudanças anteriores
-- ========================================

-- Remover funções relacionadas ao "trial" antigo
DROP FUNCTION IF EXISTS public.is_trial_active(TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.has_active_access(TIMESTAMPTZ, BOOLEAN);
DROP FUNCTION IF EXISTS public.expire_trials();

-- Remover view antiga
DROP VIEW IF EXISTS public.cliente_access_status;

-- Remover índices desnecessários
DROP INDEX IF EXISTS idx_clientes_trial_ends_at;
DROP INDEX IF EXISTS idx_clientes_plan_subscription;

-- ========================================
-- PARTE 2: Adicionar campo refund_period_ends_at
-- ========================================

-- Renomear trial_ends_at para refund_period_ends_at (mais semântico)
ALTER TABLE public.clientes 
  RENAME COLUMN trial_ends_at TO refund_period_ends_at;

COMMENT ON COLUMN public.clientes.refund_period_ends_at IS 
'Data e hora em que o período de garantia de 7 dias grátis expira. Durante este período, o cliente pode cancelar a assinatura e receber reembolso total. NULL significa que não está em período de garantia.';

-- ========================================
-- PARTE 3: Funções utilitárias
-- ========================================

-- 1. Verificar se está em período de arrependimento
CREATE OR REPLACE FUNCTION public.is_in_refund_period(refund_end_date TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN refund_end_date IS NOT NULL AND refund_end_date > NOW();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.is_in_refund_period IS 
'Verifica se está dentro do período de garantia de 7 dias grátis (dentro de 7 dias da compra)';

-- 2. Calcular dias restantes do período de arrependimento
CREATE OR REPLACE FUNCTION public.refund_period_days_remaining(refund_end_date TIMESTAMPTZ)
RETURNS INTEGER AS $$
BEGIN
  IF refund_end_date IS NULL OR refund_end_date <= NOW() THEN
    RETURN 0;
  END IF;
  
  RETURN CEIL(EXTRACT(EPOCH FROM (refund_end_date - NOW())) / 86400)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.refund_period_days_remaining IS 
'Calcula quantos dias restam no período de garantia de 7 dias grátis. Retorna 0 se expirado ou NULL.';

-- 3. Verificar se o cliente tem acesso ativo (assinatura paga ativa)
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  p_subscription_active BOOLEAN,
  p_plan_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Tem acesso se subscription_active = true E plan_id não é 'free'
  RETURN p_subscription_active = true AND p_plan_id IS NOT NULL AND p_plan_id != 'free';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.has_active_subscription IS 
'Verifica se o cliente tem uma assinatura paga ativa (não considera período de garantia)';

-- ========================================
-- PARTE 4: Atualizar trigger handle_new_auth_user
-- ========================================

-- Novos usuários NÃO começam com trial - começam com plano Free
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'phone' IS NOT NULL THEN
    INSERT INTO public.clientes (
      phone,
      name,
      email,
      cpf,
      auth_user_id,
      is_active,
      subscription_active,
      plan_id,
      refund_period_ends_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.raw_user_meta_data->>'phone',
      COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
      NEW.email,
      NEW.raw_user_meta_data->>'cpf',
      NEW.id,
      true,
      false,
      'free',  -- Começa com plano FREE (não trial)
      NULL,    -- SEM período de arrependimento (não comprou nada ainda)
      NOW(),
      NOW()
    )
    ON CONFLICT (phone) 
    DO UPDATE SET
      auth_user_id = NEW.id,
      email = NEW.email,
      name = COALESCE(EXCLUDED.name, clientes.name),
      cpf = COALESCE(EXCLUDED.cpf, clientes.cpf),
      plan_id = COALESCE(clientes.plan_id, 'free'),
      subscription_active = COALESCE(clientes.subscription_active, false),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_auth_user IS 
'Trigger que sincroniza novos usuários do Supabase Auth. Atualizado: novos usuários começam com plano FREE (2025-12-10)';

-- ========================================
-- PARTE 5: View para monitoramento
-- ========================================

CREATE OR REPLACE VIEW public.cliente_subscription_status AS
SELECT 
  phone,
  name,
  email,
  plan_id,
  subscription_active,
  refund_period_ends_at,
  public.is_in_refund_period(refund_period_ends_at) as is_in_refund_period,
  public.refund_period_days_remaining(refund_period_ends_at) as refund_days_remaining,
  public.has_active_subscription(subscription_active, plan_id) as has_active_subscription,
  CASE 
    WHEN subscription_active = true AND plan_id != 'free' THEN 'active_paid'
    WHEN subscription_active = false AND plan_id = 'free' THEN 'free_plan'
    WHEN subscription_active = false AND plan_id != 'free' THEN 'subscription_ended'
    ELSE 'unknown'
  END as subscription_status,
  created_at
FROM public.clientes
WHERE is_active = true;

COMMENT ON VIEW public.cliente_subscription_status IS 
'View que mostra o status de assinatura de cada cliente, incluindo período de garantia de 7 dias grátis';

-- ========================================
-- PARTE 6: Índices otimizados
-- ========================================

CREATE INDEX IF NOT EXISTS idx_clientes_refund_period 
ON public.clientes(refund_period_ends_at) 
WHERE refund_period_ends_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_subscription_status 
ON public.clientes(subscription_active, plan_id) 
WHERE is_active = true AND subscription_active = true;

-- ========================================
-- PARTE 7: Atualizar registros existentes (se houver)
-- ========================================

-- Se algum usuário estava com plan_id = 'trial', mover para 'free'
UPDATE public.clientes 
SET 
  plan_id = 'free',
  subscription_active = false,
  refund_period_ends_at = NULL
WHERE plan_id = 'trial' AND subscription_active = false;
