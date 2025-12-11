-- =====================================================
-- TESTE: RLS POLICIES - TABELA TASKS
-- =====================================================
-- Valida isolamento de tarefas entre usuários
-- Padrão RLS: phone = (SELECT public.get_user_phone_optimized())
--
-- Casos testados:
-- 1. Usuário vê apenas suas tarefas
-- 2. Usuário pode criar tarefas para si mesmo
-- 3. Usuário pode marcar suas tarefas como concluídas
-- 4. Usuário não pode alterar tarefas de outros
-- 5. Teste de constraint de prioridade (enum)
-- 6. Teste de constraint de status (enum)
-- =====================================================

BEGIN;
SELECT plan(8);

-- =====================================================
-- SETUP: Criar usuários e dados de teste
-- =====================================================
SELECT tests.create_supabase_user('task_user1', 'task1@test.com', '5511999999991');
SELECT tests.create_supabase_user('task_user2', 'task2@test.com', '5511999999992');

-- Criar clientes
INSERT INTO public.clientes (phone, auth_user_id, name, email)
VALUES 
  ('5511999999991', tests.get_supabase_uid('task_user1'), 'Task User 1', 'task1@test.com'),
  ('5511999999992', tests.get_supabase_uid('task_user2'), 'Task User 2', 'task2@test.com');

-- Criar tarefas de teste (como service role)
SELECT tests.authenticate_as_service_role();

INSERT INTO public.tasks (phone, title, description, priority, status, category)
VALUES 
  ('5511999999991', 'Task A - User 1', 'High priority task', 'high', 'pending', 'work'),
  ('5511999999991', 'Task B - User 1', 'Medium priority task', 'medium', 'pending', 'personal'),
  ('5511999999992', 'Task C - User 2', 'Low priority task', 'low', 'done', 'work');

-- =====================================================
-- TESTES COMO TASK_USER1
-- =====================================================
SELECT tests.authenticate_as('task_user1');

-- TESTE 1: User 1 vê apenas suas 2 tarefas
SELECT results_eq(
  $$SELECT count(*)::bigint FROM tasks$$,
  ARRAY[2::bigint],
  '✅ Task User 1 should see only their 2 tasks'
);

-- TESTE 2: User 1 pode criar tarefa para si mesmo
SELECT lives_ok(
  $$
    INSERT INTO tasks (phone, title, description, priority, status)
    VALUES ('5511999999991', 'New Task', 'Description', 'medium', 'pending')
  $$,
  '✅ Task User 1 can create tasks for themselves'
);

-- TESTE 3: User 1 pode marcar tarefa como concluída
SELECT lives_ok(
  $$
    UPDATE tasks 
    SET status = 'done', completed_at = NOW()
    WHERE phone = '5511999999991' AND title = 'Task A - User 1'
  $$,
  '✅ Task User 1 can mark their own tasks as done'
);

-- TESTE 4: User 1 NÃO pode criar tarefa para User 2
SELECT throws_ok(
  $$
    INSERT INTO tasks (phone, title, description)
    VALUES ('5511999999992', 'Malicious Task', 'Injected by User 1')
  $$,
  '42501',
  NULL,
  '✅ Task User 1 cannot create tasks for other users'
);

-- TESTE 5: User 1 NÃO pode atualizar tarefas de User 2 (no-op)
SELECT results_eq(
  $$
    UPDATE tasks 
    SET status = 'done'
    WHERE phone = '5511999999992'
    RETURNING 1
  $$,
  $$VALUES(NULL::int)$$,
  '✅ Task User 1 cannot update User 2 tasks'
);

-- =====================================================
-- TESTES COMO TASK_USER2
-- =====================================================
SELECT tests.authenticate_as('task_user2');

-- TESTE 6: User 2 vê apenas sua 1 tarefa
SELECT results_eq(
  $$SELECT count(*)::bigint FROM tasks$$,
  ARRAY[1::bigint],
  '✅ Task User 2 should see only their 1 task'
);

-- =====================================================
-- TESTES DE CONSTRAINTS
-- =====================================================
SELECT tests.authenticate_as('task_user1');

-- TESTE 7: Prioridade inválida não é aceita
SELECT throws_ok(
  $$
    INSERT INTO tasks (phone, title, priority)
    VALUES ('5511999999991', 'Invalid Priority', 'critical')
  $$,
  '22P02', -- invalid_text_representation (enum)
  NULL,
  '✅ Invalid priority enum value is rejected'
);

-- TESTE 8: Status inválido não é aceito
SELECT throws_ok(
  $$
    INSERT INTO tasks (phone, title, status)
    VALUES ('5511999999991', 'Invalid Status', 'cancelled')
  $$,
  '22P02',
  NULL,
  '✅ Invalid status enum value is rejected'
);

SELECT * FROM finish();
ROLLBACK;
