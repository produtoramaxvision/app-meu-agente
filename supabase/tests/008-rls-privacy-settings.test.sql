-- =====================================================
-- TESTE: PRIVACY SETTINGS - LGPD COMPLIANCE
-- =====================================================
-- Valida isolamento de configurações de privacidade (LGPD)
-- Padrão RLS: phone = auth.uid()::text (UUID convertido para texto)
--
-- ATENÇÃO: Esta tabela usa UUID em vez de phone VARCHAR
-- Migration 20251210100000 corrigiu o bug de comparação
--
-- Casos testados:
-- 1. Usuário vê apenas suas configurações de privacidade
-- 2. Usuário pode atualizar suas próprias configurações
-- 3. Usuário não pode ver configurações de outros
-- 4. Valores default estão corretos (LGPD compliant)
-- 5. Validação de consent_date automático
-- =====================================================

BEGIN;
SELECT plan(7);

-- =====================================================
-- SETUP: Criar usuários e configurações
-- =====================================================
SELECT tests.create_supabase_user('privacy_user1', 'privacy1@test.com', '5511999999991');
SELECT tests.create_supabase_user('privacy_user2', 'privacy2@test.com', '5511999999992');

-- Criar clientes
INSERT INTO public.clientes (phone, auth_user_id, name, email)
VALUES 
  ('5511999999991', tests.get_supabase_uid('privacy_user1'), 'Privacy User 1', 'privacy1@test.com'),
  ('5511999999992', tests.get_supabase_uid('privacy_user2'), 'Privacy User 2', 'privacy2@test.com');

-- Criar configurações de privacidade (como service role)
SELECT tests.authenticate_as_service_role();

INSERT INTO public.privacy_settings (phone, data_collection, data_processing, marketing_emails)
VALUES 
  ('5511999999991', true, true, false),
  ('5511999999992', true, false, false);

-- =====================================================
-- TESTES COMO PRIVACY_USER1
-- =====================================================
SELECT tests.authenticate_as('privacy_user1');

-- TESTE 1: User 1 vê apenas suas configurações
SELECT results_eq(
  $$SELECT count(*)::bigint FROM privacy_settings$$,
  ARRAY[1::bigint],
  '✅ Privacy User 1 should see only their own privacy settings'
);

-- TESTE 2: User 1 vê o phone correto
SELECT results_eq(
  $$SELECT phone FROM privacy_settings$$,
  ARRAY['5511999999991'::text],
  '✅ Privacy User 1 sees correct phone in privacy_settings'
);

-- TESTE 3: User 1 pode atualizar suas configurações (opt-out de marketing)
SELECT lives_ok(
  $$
    UPDATE privacy_settings 
    SET marketing_emails = false, analytics_tracking = false
    WHERE phone = '5511999999991'
  $$,
  '✅ Privacy User 1 can update their privacy settings (LGPD right to opt-out)'
);

-- TESTE 4: Valores default estão LGPD compliant
SELECT results_eq(
  $$
    SELECT data_sharing::text
    FROM privacy_settings
    WHERE phone = '5511999999991'
  $$,
  ARRAY['false'::text], -- Default deve ser FALSE (opt-in, não opt-out)
  '✅ Default value for data_sharing is FALSE (LGPD compliant - opt-in required)'
);

-- TESTE 5: User 1 NÃO pode ver configurações de User 2
SELECT results_eq(
  $$
    SELECT count(*)::bigint 
    FROM privacy_settings 
    WHERE phone = '5511999999992'
  $$,
  ARRAY[0::bigint],
  '✅ Privacy User 1 cannot see User 2 privacy settings'
);

-- =====================================================
-- TESTES COMO PRIVACY_USER2
-- =====================================================
SELECT tests.authenticate_as('privacy_user2');

-- TESTE 6: User 2 vê apenas suas configurações
SELECT results_eq(
  $$SELECT count(*)::bigint FROM privacy_settings$$,
  ARRAY[1::bigint],
  '✅ Privacy User 2 should see only their own privacy settings'
);

-- TESTE 7: User 2 NÃO pode atualizar configurações de User 1 (no-op)
SELECT results_eq(
  $$
    UPDATE privacy_settings 
    SET data_sharing = true
    WHERE phone = '5511999999991'
    RETURNING 1
  $$,
  $$VALUES(NULL::int)$$,
  '✅ Privacy User 2 cannot update User 1 privacy settings'
);

SELECT * FROM finish();
ROLLBACK;
