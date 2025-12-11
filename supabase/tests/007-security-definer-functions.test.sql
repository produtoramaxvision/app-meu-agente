-- =====================================================
-- TESTE: SECURITY DEFINER FUNCTIONS - VALIDAÇÃO
-- =====================================================
-- Valida que TODAS as funções SECURITY DEFINER têm search_path
-- CRÍTICO: Funções sem search_path são vulneráveis a privilege escalation
--
-- Baseado em: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Referência: RELATORIO_AUDITORIA_RLS_COMPLETO_2025_12_10.md
-- =====================================================

BEGIN;
SELECT plan(3);

-- =====================================================
-- TESTE 1: Todas funções SECURITY DEFINER têm search_path
-- =====================================================
-- Verifica que nenhuma função SECURITY DEFINER está sem proteção

SELECT is(
  (
    SELECT COUNT(*)::int
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.prosecdef = true -- SECURITY DEFINER
      AND n.nspname = 'public'
      AND p.proname NOT LIKE 'pg_%'
      AND (
        p.proconfig IS NULL 
        OR NOT EXISTS (
          SELECT 1 
          FROM unnest(p.proconfig) AS config 
          WHERE config LIKE 'search_path=%'
        )
      )
  ),
  0,
  '✅ All SECURITY DEFINER functions have search_path set (prevents privilege escalation)'
);

-- =====================================================
-- TESTE 2: Função get_user_phone_optimized existe e está protegida
-- =====================================================
-- Esta é a função crítica usada em todas as policies RLS

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'get_user_phone_optimized'
      AND p.prosecdef = true -- É SECURITY DEFINER
      AND EXISTS (
        SELECT 1 
        FROM unnest(p.proconfig) AS config 
        WHERE config LIKE 'search_path=%'
      )
  ),
  '✅ get_user_phone_optimized() is SECURITY DEFINER with search_path protection'
);

-- =====================================================
-- TESTE 3: Função get_user_phone_optimized retorna phone correto
-- =====================================================
-- Testa o comportamento da função crítica

-- Criar usuário de teste
SELECT tests.create_supabase_user('function_test_user', 'function@test.com', '5511999999999');

-- Criar cliente
INSERT INTO public.clientes (phone, auth_user_id, name, email)
VALUES ('5511999999999', tests.get_supabase_uid('function_test_user'), 'Function Test', 'function@test.com');

-- Autenticar e testar função
SELECT tests.authenticate_as('function_test_user');

SELECT results_eq(
  $$SELECT public.get_user_phone_optimized()$$,
  ARRAY['5511999999999'::varchar],
  '✅ get_user_phone_optimized() returns correct phone for authenticated user'
);

SELECT * FROM finish();
ROLLBACK;
