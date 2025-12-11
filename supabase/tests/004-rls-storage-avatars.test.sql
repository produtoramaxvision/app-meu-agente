-- =====================================================
-- TESTE: RLS POLICIES - STORAGE.OBJECTS (AVATARS)
-- =====================================================
-- Valida isolamento de arquivos de avatar entre usuários
-- Padrão RLS: (storage.foldername(name))[1] = (SELECT public.get_user_phone_optimized())
--
-- Casos testados:
-- 1. Usuário pode fazer upload do próprio avatar
-- 2. Usuário NÃO pode fazer upload de avatar para outro usuário
-- 3. Usuário pode ler seu próprio avatar
-- 4. Usuário NÃO pode ler avatar de outro usuário
-- 5. Usuário pode atualizar seu próprio avatar
-- 6. Usuário NÃO pode atualizar avatar de outro usuário
-- 7. Usuário pode deletar seu próprio avatar
-- 8. Usuário NÃO pode deletar avatar de outro usuário
-- 9. Anônimo não tem acesso aos avatars
-- =====================================================

BEGIN;
SELECT plan(11);

-- =====================================================
-- SETUP: Criar usuários e bucket avatars
-- =====================================================
SELECT tests.create_supabase_user('storage_user1', 'storage1@test.com', '5511999999991');
SELECT tests.create_supabase_user('storage_user2', 'storage2@test.com', '5511999999992');

-- Criar clientes (necessário para get_user_phone_optimized)
INSERT INTO public.clientes (phone, auth_user_id, name, email)
VALUES 
  ('5511999999991', tests.get_supabase_uid('storage_user1'), 'Storage User 1', 'storage1@test.com'),
  ('5511999999992', tests.get_supabase_uid('storage_user2'), 'Storage User 2', 'storage2@test.com');

-- Criar bucket 'avatars' se não existir (como service role)
SELECT tests.authenticate_as_service_role();

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Criar objetos de teste (avatars)
INSERT INTO storage.objects (bucket_id, name, owner, owner_id, metadata)
VALUES 
  ('avatars', '5511999999991/profile.jpg', tests.get_supabase_uid('storage_user1'), tests.get_supabase_uid('storage_user1'), '{"size": 1024}'::jsonb),
  ('avatars', '5511999999992/profile.jpg', tests.get_supabase_uid('storage_user2'), tests.get_supabase_uid('storage_user2'), '{"size": 2048}'::jsonb);

-- =====================================================
-- TESTES COMO STORAGE_USER1
-- =====================================================
SELECT tests.authenticate_as('storage_user1');

-- TESTE 1: User 1 pode fazer upload do próprio avatar
SELECT lives_ok(
  $$
    INSERT INTO storage.objects (bucket_id, name, owner, owner_id, metadata)
    VALUES (
      'avatars', 
      '5511999999991/avatar_new.png',
      (SELECT auth.uid()),
      (SELECT auth.uid()),
      '{"size": 512}'::jsonb
    )
  $$,
  '✅ Storage User 1 can upload their own avatar'
);

-- TESTE 2: User 1 NÃO pode fazer upload de avatar para User 2
SELECT throws_ok(
  $$
    INSERT INTO storage.objects (bucket_id, name, owner, owner_id, metadata)
    VALUES (
      'avatars', 
      '5511999999992/hacked.jpg',
      (SELECT auth.uid()),
      (SELECT auth.uid()),
      '{"size": 999}'::jsonb
    )
  $$,
  '42501',
  NULL,
  '✅ Storage User 1 cannot upload avatars to other users folders'
);

-- TESTE 3: User 1 pode ler seu próprio avatar
SELECT results_eq(
  $$SELECT count(*)::bigint FROM storage.objects WHERE bucket_id = 'avatars' AND name LIKE '5511999999991/%'$$,
  ARRAY[2::bigint], -- profile.jpg + avatar_new.png
  '✅ Storage User 1 can read their own avatars'
);

-- TESTE 4: User 1 NÃO pode ler avatars de User 2
SELECT results_eq(
  $$SELECT count(*)::bigint FROM storage.objects WHERE bucket_id = 'avatars' AND name LIKE '5511999999992/%'$$,
  ARRAY[0::bigint],
  '✅ Storage User 1 cannot read User 2 avatars'
);

-- TESTE 5: User 1 pode atualizar metadados do próprio avatar
SELECT lives_ok(
  $$
    UPDATE storage.objects 
    SET metadata = '{"size": 2048}'::jsonb
    WHERE bucket_id = 'avatars' AND name = '5511999999991/profile.jpg'
  $$,
  '✅ Storage User 1 can update their own avatar metadata'
);

-- TESTE 6: User 1 NÃO pode atualizar avatar de User 2 (no-op)
SELECT results_eq(
  $$
    UPDATE storage.objects 
    SET metadata = '{"hacked": true}'::jsonb
    WHERE bucket_id = 'avatars' AND name = '5511999999992/profile.jpg'
    RETURNING 1
  $$,
  $$VALUES(NULL::int)$$,
  '✅ Storage User 1 cannot update User 2 avatar'
);

-- TESTE 7: User 1 pode deletar seu próprio avatar
SELECT lives_ok(
  $$
    DELETE FROM storage.objects 
    WHERE bucket_id = 'avatars' AND name = '5511999999991/avatar_new.png'
  $$,
  '✅ Storage User 1 can delete their own avatar'
);

-- TESTE 8: User 1 NÃO pode deletar avatar de User 2 (no-op)
SELECT results_eq(
  $$
    DELETE FROM storage.objects 
    WHERE bucket_id = 'avatars' AND name = '5511999999992/profile.jpg'
    RETURNING 1
  $$,
  $$VALUES(NULL::int)$$,
  '✅ Storage User 1 cannot delete User 2 avatar'
);

-- =====================================================
-- TESTES COMO STORAGE_USER2
-- =====================================================
SELECT tests.authenticate_as('storage_user2');

-- TESTE 9: User 2 vê apenas seu próprio avatar
SELECT results_eq(
  $$SELECT count(*)::bigint FROM storage.objects WHERE bucket_id = 'avatars'$$,
  ARRAY[1::bigint],
  '✅ Storage User 2 sees only their own avatar'
);

-- =====================================================
-- TESTES COMO ANÔNIMO
-- =====================================================
SELECT tests.clear_authentication();

-- TESTE 10: Anônimo não vê nenhum avatar (bucket privado)
SELECT results_eq(
  $$SELECT count(*)::bigint FROM storage.objects WHERE bucket_id = 'avatars'$$,
  ARRAY[0::bigint],
  '✅ Anonymous users cannot see avatars in private bucket'
);

-- TESTE 11: Anônimo não pode fazer upload
SELECT throws_ok(
  $$
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    VALUES ('avatars', 'public/hacker.jpg', NULL, '{}'::jsonb)
  $$,
  '42501',
  NULL,
  '✅ Anonymous users cannot upload avatars'
);

SELECT * FROM finish();
ROLLBACK;
