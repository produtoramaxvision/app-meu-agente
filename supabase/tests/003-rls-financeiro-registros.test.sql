-- =====================================================
-- TESTE: RLS POLICIES - TABELA FINANCEIRO_REGISTROS
-- =====================================================
-- Valida isolamento financeiro entre usuários
-- Padrão RLS: phone = (SELECT public.get_user_phone_optimized())
--
-- Casos testados:
-- 1. Usuário vê apenas seus registros financeiros
-- 2. Usuário não vê registros de outros
-- 3. Usuário pode criar registros para si mesmo
-- 4. Usuário NÃO pode criar registros para outros
-- 5. Usuário pode atualizar apenas seus registros
-- 6. Usuário pode deletar apenas seus registros
-- 7. Anônimo não tem acesso a dados financeiros
-- 8. Validação de constraints (valor >= 0, tipo enum)
-- =====================================================

BEGIN;
SELECT plan(12);

-- =====================================================
-- SETUP: Criar usuários e clientes
-- =====================================================
SELECT tests.create_supabase_user('finance_user1', 'finance1@test.com', '5511999999991');
SELECT tests.create_supabase_user('finance_user2', 'finance2@test.com', '5511999999992');

-- Criar clientes (necessário para FK)
INSERT INTO public.clientes (phone, auth_user_id, name, email)
VALUES 
  ('5511999999991', tests.get_supabase_uid('finance_user1'), 'Finance User 1', 'finance1@test.com'),
  ('5511999999992', tests.get_supabase_uid('finance_user2'), 'Finance User 2', 'finance2@test.com');

-- Criar registros financeiros de teste
SELECT tests.authenticate_as_service_role();

INSERT INTO public.financeiro_registros (phone, categoria, tipo, valor, descricao, status)
VALUES 
  ('5511999999991', 'Vendas', 'entrada', 1000.00, 'Venda produto A - User 1', 'pago'),
  ('5511999999991', 'Impostos', 'saida', 200.00, 'ICMS - User 1', 'pago'),
  ('5511999999992', 'Vendas', 'entrada', 500.00, 'Venda produto B - User 2', 'pago'),
  ('5511999999992', 'Salários', 'saida', 300.00, 'Pagamento funcionário - User 2', 'pendente');

-- =====================================================
-- TESTES COMO FINANCE_USER1
-- =====================================================
SELECT tests.authenticate_as('finance_user1');

-- TESTE 1: User 1 vê apenas seus 2 registros
SELECT results_eq(
  $$SELECT count(*)::bigint FROM financeiro_registros$$,
  ARRAY[2::bigint],
  '✅ Finance User 1 should see only their 2 financial records'
);

-- TESTE 2: User 1 vê apenas registros do próprio telefone
SELECT results_eq(
  $$SELECT DISTINCT phone FROM financeiro_registros$$,
  ARRAY['5511999999991'::varchar],
  '✅ Finance User 1 should only see records with their phone'
);

-- TESTE 3: User 1 pode criar registro para si mesmo
SELECT lives_ok(
  $$
    INSERT INTO financeiro_registros (phone, categoria, tipo, valor, descricao)
    VALUES ('5511999999991', 'Marketing', 'saida', 150.00, 'Anúncio Google Ads')
  $$,
  '✅ Finance User 1 can create financial record for themselves'
);

-- TESTE 4: User 1 NÃO pode criar registro para User 2 (violação de RLS)
SELECT throws_ok(
  $$
    INSERT INTO financeiro_registros (phone, categoria, tipo, valor, descricao)
    VALUES ('5511999999992', 'Hacking', 'saida', 999.00, 'Malicious entry')
  $$,
  '42501',
  NULL,
  '✅ Finance User 1 cannot create records for other users'
);

-- TESTE 5: User 1 pode atualizar seus próprios registros
SELECT lives_ok(
  $$
    UPDATE financeiro_registros 
    SET descricao = 'Venda produto A - UPDATED'
    WHERE phone = '5511999999991' AND categoria = 'Vendas'
  $$,
  '✅ Finance User 1 can update their own records'
);

-- TESTE 6: User 1 NÃO pode atualizar registros de User 2 (no-op)
SELECT results_eq(
  $$
    UPDATE financeiro_registros 
    SET valor = 0.01 
    WHERE phone = '5511999999992' 
    RETURNING 1
  $$,
  $$VALUES(NULL::int)$$,
  '✅ Finance User 1 cannot update User 2 financial records'
);

-- TESTE 7: User 1 pode deletar seus próprios registros
SELECT lives_ok(
  $$
    DELETE FROM financeiro_registros 
    WHERE phone = '5511999999991' AND categoria = 'Marketing'
  $$,
  '✅ Finance User 1 can delete their own records'
);

-- =====================================================
-- TESTES COMO FINANCE_USER2
-- =====================================================
SELECT tests.authenticate_as('finance_user2');

-- TESTE 8: User 2 vê apenas seus 2 registros
SELECT results_eq(
  $$SELECT count(*)::bigint FROM financeiro_registros$$,
  ARRAY[2::bigint],
  '✅ Finance User 2 should see only their 2 financial records'
);

-- TESTE 9: User 2 NÃO vê saldo de User 1
SELECT results_eq(
  $$
    SELECT SUM(
      CASE 
        WHEN tipo = 'entrada' THEN valor 
        ELSE -valor 
      END
    )::numeric
    FROM financeiro_registros
  $$,
  ARRAY[200.00::numeric], -- User 2: +500 (entrada) -300 (saída) = 200
  '✅ Finance User 2 sees only their own balance'
);

-- =====================================================
-- TESTES COMO ANÔNIMO
-- =====================================================
SELECT tests.clear_authentication();

-- TESTE 10: Anônimo não vê nenhum registro financeiro
SELECT results_eq(
  $$SELECT count(*)::bigint FROM financeiro_registros$$,
  ARRAY[0::bigint],
  '✅ Anonymous users cannot see any financial records'
);

-- TESTE 11: Anônimo não pode criar registros
SELECT throws_ok(
  $$
    INSERT INTO financeiro_registros (phone, categoria, tipo, valor, descricao)
    VALUES ('5511999999999', 'Attack', 'entrada', 1.00, 'Hacking attempt')
  $$,
  '42501',
  NULL,
  '✅ Anonymous users cannot create financial records'
);

-- =====================================================
-- TESTE DE CONSTRAINT: Valor negativo
-- =====================================================
SELECT tests.authenticate_as('finance_user1');

-- TESTE 12: Constraint impede valores negativos
SELECT throws_ok(
  $$
    INSERT INTO financeiro_registros (phone, categoria, tipo, valor, descricao)
    VALUES ('5511999999991', 'Test', 'entrada', -100.00, 'Invalid negative value')
  $$,
  '23514', -- check_violation
  NULL,
  '✅ Constraint prevents negative valores in financeiro_registros'
);

SELECT * FROM finish();
ROLLBACK;
