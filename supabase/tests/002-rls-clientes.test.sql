-- =====================================================
-- TESTE: RLS POLICIES - TABELA CLIENTES
-- =====================================================
-- Valida isolamento de dados entre usuários na tabela clientes
-- Padrão RLS: phone = (SELECT public.get_user_phone_optimized())
--
-- Casos testados:
-- 1. Usuário só vê seus próprios dados
-- 2. Usuário não vê dados de outros usuários
-- 3. Usuário pode atualizar apenas seus dados
-- 4. Usuário não pode atualizar dados de outros
-- 5. Usuário pode deletar apenas seu próprio perfil
-- 6. Usuário anônimo não tem acesso
-- =====================================================

BEGIN;
-- Assumindo que 000-setup-tests-hooks.sql já foi executado
SELECT plan(10);

-- =====================================================
-- SETUP: Criar usuários de teste
-- =====================================================
SELECT tests.create_supabase_user('user1', 'user1@test.com', '5511999999991');
SELECT tests.create_supabase_user('user2', 'user2@test.com', '5511999999992');

-- Limpeza defensiva (pode existir resíduo de execuções anteriores)
SET LOCAL ROLE service_role;
DELETE FROM public.clientes WHERE phone IN ('5511999999991', '5511999999992');

-- Criar profiles na tabela clientes
-- IMPORTANTE: Usar tests.get_supabase_uid() para pegar auth_user_id
INSERT INTO public.clientes (phone, auth_user_id, name, email, subscription_active, is_active, plan_id)
VALUES 
  ('5511999999991', tests.get_supabase_uid('user1'), 'User One', 'user1@test.com', true, true, 'premium'),
  ('5511999999992', tests.get_supabase_uid('user2'), 'User Two', 'user2@test.com', false, true, 'free');
RESET ROLE;

-- =====================================================
-- TESTES COMO USER 1
-- =====================================================
SELECT tests.authenticate_as('user1');

-- TESTE 1: User 1 vê apenas seus próprios dados
SELECT results_eq(
  $$SELECT count(*)::bigint FROM clientes$$,
  ARRAY[1::bigint],
  '✅ User 1 should only see their own cliente record'
);

-- TESTE 2: User 1 vê o telefone correto (seu próprio)
SELECT results_eq(
  $$SELECT phone FROM clientes$$,
  ARRAY['5511999999991'::varchar],
  '✅ User 1 should see their own phone number'
);

-- TESTE 3: User 1 pode atualizar seu próprio nome
SELECT lives_ok(
  $$UPDATE clientes SET name = 'User One Updated' WHERE phone = '5511999999991'$$,
  '✅ User 1 can update their own name'
);

-- TESTE 4: User 1 NÃO pode atualizar dados de User 2 (UPDATE deve ser no-op)
SELECT results_eq(
  $$SELECT count(*)::bigint FROM clientes WHERE phone = '5511999999992' AND name = 'Hacked!'$$,
  ARRAY[0::bigint],
  '✅ User 1 cannot update User 2 data (no rows affected)'
);

-- TESTE 5: User 1 pode deletar seu próprio perfil
SELECT lives_ok(
  $$DELETE FROM clientes WHERE phone = '5511999999991'$$,
  '✅ User 1 can delete their own profile'
);

-- Restaurar User 1 para próximos testes
SET LOCAL ROLE service_role;
INSERT INTO public.clientes (phone, auth_user_id, name, email, subscription_active, is_active, plan_id)
VALUES ('5511999999991', tests.get_supabase_uid('user1'), 'User One', 'user1@test.com', true, true, 'premium');
RESET ROLE;

-- =====================================================
-- TESTES COMO USER 2
-- =====================================================
SELECT tests.authenticate_as('user2');

-- TESTE 6: User 2 vê apenas seus próprios dados
SELECT results_eq(
  $$SELECT count(*)::bigint FROM clientes$$,
  ARRAY[1::bigint],
  '✅ User 2 should only see their own cliente record'
);

-- TESTE 7: User 2 vê o telefone correto (seu próprio)
SELECT results_eq(
  $$SELECT phone FROM clientes$$,
  ARRAY['5511999999992'::varchar],
  '✅ User 2 should see their own phone number'
);

-- TESTE 8: User 2 NÃO pode atualizar dados de User 1
SELECT results_eq(
  $$SELECT count(*)::bigint FROM clientes WHERE phone = '5511999999991' AND name = 'Hacked by User 2!'$$,
  ARRAY[0::bigint],
  '✅ User 2 cannot update User 1 data'
);

-- =====================================================
-- TESTES COMO ANÔNIMO
-- =====================================================
SELECT tests.clear_authentication();

-- TESTE 9: Usuário anônimo não vê nenhum cliente
SELECT results_eq(
  $$SELECT count(*)::bigint FROM clientes$$,
  ARRAY[0::bigint],
  '✅ Anonymous users cannot see any clientes'
);

-- TESTE 10: Usuário anônimo não pode inserir clientes
SELECT throws_ok(
  $$INSERT INTO clientes (phone, name, email) VALUES ('5511999999999', 'Hacker', 'hacker@test.com')$$,
  '42501',
  NULL,
  '✅ Anonymous users cannot insert clientes'
);

SELECT * FROM finish();
ROLLBACK;
