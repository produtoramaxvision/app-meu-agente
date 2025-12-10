-- =============================================================================
-- Migration: fix_security_audit_issues
-- Data: 2025-12-10
-- Objetivo: Corrigir problemas de segurança identificados na auditoria RLS
-- 
-- Problemas corrigidos:
-- 1. [CRÍTICO] Storage avatars - políticas permitem acesso a qualquer telefone
-- 2. [CRÍTICO] Tabela clientes - falta DELETE policy
-- 3. [SECURITY] 3 funções sem SET search_path (is_in_refund_period, refund_period_days_remaining, has_active_subscription)
-- 4. [SECURITY] handle_new_auth_user sem SET search_path
-- 5. [QUALITY] UPDATE policies sem WITH CHECK em evolution tables
-- =============================================================================

BEGIN;

-- =============================================================================
-- PARTE 1: CORRIGIR STORAGE AVATARS RLS [CRÍTICO]
-- Problema: Políticas atuais verificam se phone existe em clientes, mas NÃO
--           verificam se é o phone do usuário autenticado
-- =============================================================================

-- Remover políticas antigas com verificação incorreta
DROP POLICY IF EXISTS "Users can upload avatars by phone" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars by phone" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars by phone" ON storage.objects;

-- Criar políticas seguras que verificam o phone do USUÁRIO AUTENTICADO
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT public.get_user_phone_optimized())
);

CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT public.get_user_phone_optimized())
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT public.get_user_phone_optimized())
);

-- Manter política de visualização pública (avatares são públicos por design)
-- A política "Avatar images are publicly accessible" já existe e está correta

-- =============================================================================
-- PARTE 2: ADICIONAR DELETE POLICY NA TABELA CLIENTES [CRÍTICO]
-- Problema: Usuário não consegue deletar seu próprio perfil diretamente
-- =============================================================================

-- Verificar se a política já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy 
    WHERE polrelid = 'public.clientes'::regclass 
    AND polname = 'Users can delete their own profile via auth_user_id'
  ) THEN
    CREATE POLICY "Users can delete their own profile via auth_user_id"
      ON public.clientes
      FOR DELETE
      TO authenticated
      USING (auth_user_id = auth.uid());
  END IF;
END $$;

-- =============================================================================
-- PARTE 3: CORRIGIR FUNÇÕES SEM search_path [SECURITY ADVISOR]
-- Problema: Funções IMMUTABLE sem SET search_path são vulneráveis
-- =============================================================================

-- 3.1 Recriar is_in_refund_period com search_path
DROP FUNCTION IF EXISTS public.is_in_refund_period(TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION public.is_in_refund_period(refund_end_date TIMESTAMPTZ)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  RETURN refund_end_date IS NOT NULL AND refund_end_date > NOW();
END;
$$;

COMMENT ON FUNCTION public.is_in_refund_period IS 
'Verifica se está dentro do período de garantia de 7 dias grátis (dentro de 7 dias da compra). SECURITY: search_path fixed.';

-- 3.2 Recriar refund_period_days_remaining com search_path
DROP FUNCTION IF EXISTS public.refund_period_days_remaining(TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION public.refund_period_days_remaining(refund_end_date TIMESTAMPTZ)
RETURNS INTEGER 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  IF refund_end_date IS NULL OR refund_end_date <= NOW() THEN
    RETURN 0;
  END IF;
  
  RETURN CEIL(EXTRACT(EPOCH FROM (refund_end_date - NOW())) / 86400)::INTEGER;
END;
$$;

COMMENT ON FUNCTION public.refund_period_days_remaining IS 
'Calcula quantos dias restam no período de garantia de 7 dias grátis. SECURITY: search_path fixed.';

-- 3.3 Recriar has_active_subscription com search_path
DROP FUNCTION IF EXISTS public.has_active_subscription(BOOLEAN, TEXT);
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  p_subscription_active BOOLEAN,
  p_plan_id TEXT
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
  -- Tem acesso se subscription_active = true E plan_id não é 'free'
  RETURN p_subscription_active = true AND p_plan_id IS NOT NULL AND p_plan_id != 'free';
END;
$$;

COMMENT ON FUNCTION public.has_active_subscription IS 
'Verifica se o cliente tem uma assinatura paga ativa. SECURITY: search_path fixed.';

-- 3.4 Recriar handle_new_auth_user com search_path
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
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
      name = COALESCE(EXCLUDED.name, public.clientes.name),
      cpf = COALESCE(EXCLUDED.cpf, public.clientes.cpf),
      plan_id = COALESCE(public.clientes.plan_id, 'free'),
      subscription_active = COALESCE(public.clientes.subscription_active, false),
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_auth_user IS 
'Trigger que sincroniza novos usuários do Supabase Auth. SECURITY: search_path fixed (2025-12-10).';

-- =============================================================================
-- PARTE 4: CORRIGIR UPDATE POLICIES SEM WITH CHECK [QUALITY]
-- Problema: Políticas UPDATE devem ter WITH CHECK para prevenir modificações maliciosas
-- =============================================================================

-- 4.1 evolution_contacts_cache UPDATE
DROP POLICY IF EXISTS "Users can update own contacts" ON public.evolution_contacts_cache;
CREATE POLICY "Users can update own contacts"
ON public.evolution_contacts_cache
FOR UPDATE
TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()))
WITH CHECK (phone = (SELECT public.get_user_phone_optimized()));

-- 4.2 evolution_instances UPDATE
DROP POLICY IF EXISTS "evolution_instances_update" ON public.evolution_instances;
CREATE POLICY "evolution_instances_update"
ON public.evolution_instances
FOR UPDATE
TO authenticated
USING ((phone)::text = (SELECT public.get_user_phone_optimized()))
WITH CHECK ((phone)::text = (SELECT public.get_user_phone_optimized()));

-- 4.3 sdr_agent_config UPDATE
DROP POLICY IF EXISTS "sdr_config_update" ON public.sdr_agent_config;
CREATE POLICY "sdr_config_update"
ON public.sdr_agent_config
FOR UPDATE
TO authenticated
USING ((phone)::text = (SELECT public.get_user_phone_optimized()))
WITH CHECK ((phone)::text = (SELECT public.get_user_phone_optimized()));

-- =============================================================================
-- PARTE 5: RECRIAR VIEW AFETADA PELAS FUNÇÕES
-- =============================================================================

-- A view cliente_subscription_status precisa ser recriada porque as funções foram dropadas
DROP VIEW IF EXISTS public.cliente_subscription_status;
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
'View que mostra o status de assinatura de cada cliente. SECURITY: funções atualizadas com search_path (2025-12-10).';

-- =============================================================================
-- PARTE 6: LOG DE AUDITORIA
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Migration: fix_security_audit_issues';
    RAISE NOTICE 'Data: 2025-12-10';
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Correções aplicadas:';
    RAISE NOTICE '  [CRÍTICO] Storage avatars RLS - Corrigido';
    RAISE NOTICE '  [CRÍTICO] Clientes DELETE policy - Adicionada';
    RAISE NOTICE '  [SECURITY] is_in_refund_period - search_path fixed';
    RAISE NOTICE '  [SECURITY] refund_period_days_remaining - search_path fixed';
    RAISE NOTICE '  [SECURITY] has_active_subscription - search_path fixed';
    RAISE NOTICE '  [SECURITY] handle_new_auth_user - search_path fixed';
    RAISE NOTICE '  [QUALITY] evolution_contacts_cache UPDATE - WITH CHECK added';
    RAISE NOTICE '  [QUALITY] evolution_instances UPDATE - WITH CHECK added';
    RAISE NOTICE '  [QUALITY] sdr_agent_config UPDATE - WITH CHECK added';
    RAISE NOTICE '=============================================================';
END $$;

COMMIT;
