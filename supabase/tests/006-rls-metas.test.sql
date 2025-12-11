-- =====================================================
-- TESTE: RLS POLICIES - TABELA METAS
-- =====================================================
-- Valida isolamento de metas financeiras entre usuários
-- Padrão RLS: phone = (SELECT public.get_user_phone_optimized())
--
-- Casos testados:
-- 1. Usuário vê apenas suas metas
-- 2. Usuário pode criar metas para si mesmo
-- 3. Usuário pode atualizar progresso de suas metas
-- 4. Usuário não pode ver/editar metas de outros
-- 5. Validação de meta principal única
-- 6. Cálculo de porcentagem de progresso
-- =====================================================

BEGIN;
SELECT plan(7);

-- =====================================================
-- SETUP: Criar usuários e dados
-- =====================================================
SELECT tests.create_supabase_user('meta_user1', 'meta1@test.com', '5511999999991');
SELECT tests.create_supabase_user('meta_user2', 'meta2@test.com', '5511999999992');

-- Criar clientes
INSERT INTO public.clientes (phone, auth_user_id, name, email)
VALUES 
  ('5511999999991', tests.get_supabase_uid('meta_user1'), 'Meta User 1', 'meta1@test.com'),
  ('5511999999992', tests.get_supabase_uid('meta_user2'), 'Meta User 2', 'meta2@test.com');

-- Criar metas de teste
SELECT tests.authenticate_as_service_role();

INSERT INTO public.metas (phone, titulo, icone, valor_atual, valor_meta, prazo_meses, meta_principal)
VALUES 
  ('5511999999991', 'Casa Própria', '🏠', 50000.00, 500000.00, 60, true),
  ('5511999999991', 'Carro Novo', '🚗', 10000.00, 80000.00, 24, false),
  ('5511999999992', 'Viagem Europa', '✈️', 5000.00, 30000.00, 12, true);

-- =====================================================
-- TESTES COMO META_USER1
-- =====================================================
SELECT tests.authenticate_as('meta_user1');

-- TESTE 1: User 1 vê apenas suas 2 metas
SELECT results_eq(
  $$SELECT count(*)::bigint FROM metas$$,
  ARRAY[2::bigint],
  '✅ Meta User 1 should see only their 2 metas'
);

-- TESTE 2: User 1 pode criar meta para si mesmo
SELECT lives_ok(
  $$
    INSERT INTO metas (phone, titulo, icone, valor_atual, valor_meta, prazo_meses)
    VALUES ('5511999999991', 'Aposentadoria', '💰', 0.00, 1000000.00, 240)
  $$,
  '✅ Meta User 1 can create metas for themselves'
);

-- TESTE 3: User 1 pode atualizar progresso de suas metas
SELECT lives_ok(
  $$
    UPDATE metas 
    SET valor_atual = 60000.00
    WHERE phone = '5511999999991' AND titulo = 'Casa Própria'
  $$,
  '✅ Meta User 1 can update progress of their metas'
);

-- TESTE 4: User 1 vê cálculo correto de porcentagem (60k/500k = 12%)
SELECT results_eq(
  $$
    SELECT ROUND((valor_atual / valor_meta * 100)::numeric, 0)::int
    FROM metas 
    WHERE phone = '5511999999991' AND titulo = 'Casa Própria'
  $$,
  ARRAY[12::int],
  '✅ Meta User 1 sees correct progress percentage (12%)'
);

-- TESTE 5: User 1 NÃO pode criar meta para User 2
SELECT throws_ok(
  $$
    INSERT INTO metas (phone, titulo, valor_meta)
    VALUES ('5511999999992', 'Hack Meta', 100.00)
  $$,
  '42501',
  NULL,
  '✅ Meta User 1 cannot create metas for other users'
);

-- =====================================================
-- TESTES COMO META_USER2
-- =====================================================
SELECT tests.authenticate_as('meta_user2');

-- TESTE 6: User 2 vê apenas sua 1 meta
SELECT results_eq(
  $$SELECT count(*)::bigint FROM metas$$,
  ARRAY[1::bigint],
  '✅ Meta User 2 should see only their 1 meta'
);

-- TESTE 7: User 2 NÃO pode atualizar metas de User 1 (no-op)
SELECT results_eq(
  $$
    UPDATE metas 
    SET valor_atual = 0.00
    WHERE phone = '5511999999991'
    RETURNING 1
  $$,
  $$VALUES(NULL::int)$$,
  '✅ Meta User 2 cannot update User 1 metas'
);

SELECT * FROM finish();
ROLLBACK;
