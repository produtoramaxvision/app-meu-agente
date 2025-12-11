-- =====================================================
-- Migration: fix_failing_tests
-- Data: 2025-12-12
-- Objetivo: Corrigir problemas identificados nos testes pgTAP
-- 
-- Problemas corrigidos:
-- 1. [Test 004] Storage avatars - políticas SELECT incorretas (4 testes falharam)
-- 2. [Test 007] SECURITY DEFINER function sem search_path (1 teste falhou)
-- 3. [Test 008] get_authenticated_user_phone() com search_path quebrado
-- 
-- Baseado nas melhores práticas do Supabase:
-- - https://supabase.com/docs/guides/storage/security/access-control
-- - https://supabase.com/docs/guides/database/database-advisors?lint=0011_function_search_path_mutable
-- - https://supabase.com/docs/guides/database/functions
-- =====================================================

BEGIN;

-- =====================================================
-- PARTE 1: CORRIGIR STORAGE RLS POLICIES [CRÍTICO]
-- Problema: Políticas SELECT não permitem ver próprios avatars
-- Solução: Adicionar política SELECT para usuários autenticados
-- =====================================================

-- A política atual "Avatar images are publicly accessible" é para SELECT público
-- Precisamos de uma política específica para authenticated users verem seus próprios avatars

-- Remover política pública de SELECT se existir (conflito com bucket privado)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Criar política SELECT para usuários autenticados verem SEUS próprios avatars
CREATE POLICY "Users can view their own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = (SELECT public.get_user_phone_optimized())
);

-- Manter as políticas existentes de INSERT, UPDATE, DELETE
-- (já estão corretas conforme 20251210100000_fix_security_audit_issues.sql)

-- =====================================================
-- PARTE 2: CORRIGIR get_authenticated_user_phone() [CRÍTICO]
-- Problema: search_path = '' quebra referência a tabela 'clientes'
-- Solução: Usar schema-qualified names (public.clientes, auth.uid)
-- Referência: https://supabase.com/docs/guides/database/database-advisors?lint=0011_function_search_path_mutable
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_authenticated_user_phone()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
DECLARE
  user_phone TEXT;
BEGIN
  -- Usar schema-qualified names: public.clientes e auth.uid()
  SELECT c.phone INTO user_phone
  FROM public.clientes c
  WHERE c.auth_user_id = auth.uid();
  
  RETURN user_phone;
END;
$$;

COMMENT ON FUNCTION public.get_authenticated_user_phone() IS 
'SECURITY DEFINER function com search_path vazio e referências qualificadas.
Retorna o telefone do usuário autenticado atual via auth.uid().
Usado em testes e verificações de segurança.';

-- =====================================================
-- PARTE 3: CORRIGIR get_user_phone_optimized() [CRÍTICO]
-- Problema: Mesma questão de search_path
-- Solução: Garantir schema-qualified names
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_phone_optimized()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = '' 
STABLE
AS $$
BEGIN
  -- Usar schema-qualified names: public.clientes e auth.uid()
  RETURN (
    SELECT c.phone 
    FROM public.clientes c 
    WHERE c.auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$;

COMMENT ON FUNCTION public.get_user_phone_optimized() IS 
'⚠️ FUNÇÃO CRÍTICA: Usada em TODAS as RLS policies do sistema.
SECURITY DEFINER com search_path vazio e referências qualificadas.
Retorna o telefone do usuário autenticado (cache-friendly via STABLE).
Performance otimizada com LIMIT 1.';

-- =====================================================
-- PARTE 4: IDENTIFICAR E CORRIGIR FUNÇÕES SEM search_path
-- Problema: Test 007 identifica função(ões) sem search_path
-- Solução: Adicionar SET search_path = '' em todas SECURITY DEFINER
-- =====================================================

-- Corrigir is_in_refund_period
CREATE OR REPLACE FUNCTION public.is_in_refund_period(subscription_date TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Período de arrependimento: 7 dias
  RETURN subscription_date + INTERVAL '7 days' >= NOW();
END;
$$;

COMMENT ON FUNCTION public.is_in_refund_period(TIMESTAMP WITH TIME ZONE) IS
'Verifica se uma assinatura está dentro do período de arrependimento (7 dias).
SECURITY DEFINER com search_path vazio para segurança.';

-- Corrigir refund_period_days_remaining
CREATE OR REPLACE FUNCTION public.refund_period_days_remaining(subscription_date TIMESTAMP WITH TIME ZONE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  days_remaining INTEGER;
BEGIN
  days_remaining := EXTRACT(DAY FROM (subscription_date + INTERVAL '7 days' - NOW()));
  
  IF days_remaining < 0 THEN
    RETURN 0;
  END IF;
  
  RETURN days_remaining;
END;
$$;

COMMENT ON FUNCTION public.refund_period_days_remaining(TIMESTAMP WITH TIME ZONE) IS
'Calcula quantos dias faltam para o fim do período de arrependimento.
Retorna 0 se o período já expirou.
SECURITY DEFINER com search_path vazio para segurança.';

-- Corrigir has_active_subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.clientes c
    WHERE c.phone = user_phone
      AND c.subscription_status = 'active'
  );
END;
$$;

COMMENT ON FUNCTION public.has_active_subscription(TEXT) IS
'Verifica se um usuário tem assinatura ativa.
SECURITY DEFINER com search_path vazio e referências qualificadas.
Usado para controle de acesso a recursos premium.';

-- =====================================================
-- PARTE 5: VERIFICAR handle_new_auth_user
-- Garantir que trigger function também está segura
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Criar registro em clientes quando novo usuário auth é criado
  INSERT INTO public.clientes (
    auth_user_id,
    phone,
    email,
    name,
    created_at
  ) VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
    NOW()
  ) ON CONFLICT (auth_user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_auth_user() IS
'Trigger function que cria registro em clientes após signup no Supabase Auth.
SECURITY DEFINER com search_path vazio e referências qualificadas.
Executa com privilégios do criador para bypass RLS em clientes.';

-- =====================================================
-- VALIDAÇÃO: Verificar todas SECURITY DEFINER functions
-- =====================================================

DO $$
DECLARE
  missing_search_path RECORD;
  total_vulnerable INT := 0;
BEGIN
  FOR missing_search_path IN
    SELECT 
      n.nspname || '.' || p.proname AS function_name,
      pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.prosecdef = true  -- SECURITY DEFINER
      AND n.nspname = 'public'
      AND NOT (
        pg_get_functiondef(p.oid) LIKE '%SET search_path%'
        OR pg_get_functiondef(p.oid) LIKE '%set search_path%'
      )
  LOOP
    RAISE WARNING 'Função SECURITY DEFINER sem search_path: %', missing_search_path.function_name;
    total_vulnerable := total_vulnerable + 1;
  END LOOP;
  
  IF total_vulnerable > 0 THEN
    RAISE EXCEPTION 'Encontradas % funções SECURITY DEFINER vulneráveis sem search_path!', total_vulnerable;
  ELSE
    RAISE NOTICE '✅ Todas as SECURITY DEFINER functions têm search_path configurado';
  END IF;
END;
$$;

COMMIT;

-- =====================================================
-- RESULTADO ESPERADO:
-- 
-- Test 004 (Storage): 11/11 PASS
-- - Política SELECT agora permite usuários verem seus próprios avatars
-- - Políticas INSERT/UPDATE/DELETE já estavam corretas
-- 
-- Test 007 (Security Definer): 3/3 PASS
-- - Todas funções agora têm SET search_path = ''
-- - is_in_refund_period ✅
-- - refund_period_days_remaining ✅
-- - has_active_subscription ✅
-- 
-- Test 008 (Privacy Settings): PASS
-- - get_authenticated_user_phone() usa schema-qualified names
-- - get_user_phone_optimized() usa schema-qualified names
-- 
-- TOTAL: 58/58 testes passando (100%)
-- =====================================================
