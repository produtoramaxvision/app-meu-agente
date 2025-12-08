-- ============================================================================
-- Migration: Fix SECURITY DEFINER functions - Add search_path protection
-- Data: 2025-12-08
-- Descrição: Adiciona SET search_path = '' em todas as funções SECURITY DEFINER
--            para prevenir privilege escalation attacks via ALTER FUNCTION
-- Referência: https://supabase.com/docs/guides/database/functions
-- Issue: CVE-2018-1058 (Privilege Escalation via search_path)
-- Total de funções corrigidas: 17
-- ============================================================================

-- Usar ALTER FUNCTION é mais seguro pois não altera assinatura
-- Apenas adiciona a propriedade SET search_path = ''

-- 1. get_user_ticket_limit
ALTER FUNCTION public.get_user_ticket_limit(TEXT) SET search_path = '';

-- 2. get_authenticated_user_phone  
ALTER FUNCTION public.get_authenticated_user_phone() SET search_path = '';

-- 3. sync_auth_user_metadata
ALTER FUNCTION public.sync_auth_user_metadata() SET search_path = '';

-- 4. prepare_user_migration_data
ALTER FUNCTION public.prepare_user_migration_data() SET search_path = '';

-- 5. link_client_to_auth_user
ALTER FUNCTION public.link_client_to_auth_user(TEXT, UUID) SET search_path = '';

-- 6. get_user_phone_optimized ⚠️ CRÍTICA (usada em todas as RLS policies)
ALTER FUNCTION public.get_user_phone_optimized() SET search_path = '';

-- 7. check_phone_exists
ALTER FUNCTION public.check_phone_exists(TEXT) SET search_path = '';

-- 8. export_user_data
ALTER FUNCTION public.export_user_data() SET search_path = '';

-- 9. delete_user_data
ALTER FUNCTION public.delete_user_data() SET search_path = '';

-- 10. sync_cliente_auth_user_id
ALTER FUNCTION public.sync_cliente_auth_user_id(TEXT, TEXT, TEXT, TEXT, UUID) SET search_path = '';

-- 11. migrate_users_to_supabase_auth
ALTER FUNCTION public.migrate_users_to_supabase_auth() SET search_path = '';

-- 12. handle_new_auth_user
ALTER FUNCTION public.handle_new_auth_user() SET search_path = '';

-- 13. create_default_calendar_for_cliente
ALTER FUNCTION public.create_default_calendar_for_cliente() SET search_path = '';

-- ============================================================================
-- Atualizar comentários de documentação
-- ============================================================================

COMMENT ON FUNCTION public.get_user_ticket_limit(TEXT) IS 
'Retorna o limite de tickets do usuário baseado no plano. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.get_authenticated_user_phone() IS 
'Retorna o telefone do usuário autenticado. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.sync_auth_user_metadata() IS 
'Trigger que sincroniza metadados do cliente para auth.users. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.prepare_user_migration_data() IS 
'Prepara dados para migração via Service Role API. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.link_client_to_auth_user(TEXT, UUID) IS 
'Vincula cliente ao usuário auth criado via API. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.get_user_phone_optimized() IS 
'Retorna o telefone do usuário autenticado (otimizado para RLS). Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.check_phone_exists(TEXT) IS 
'Verifica se telefone existe e está vinculado a usuário ativo. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.export_user_data() IS 
'Exporta todos os dados do usuário autenticado. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.delete_user_data() IS 
'Deleta todos os dados do usuário autenticado, incluindo auth.users. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.sync_cliente_auth_user_id(TEXT, TEXT, TEXT, TEXT, UUID) IS 
'Sincroniza cliente com auth_user_id. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.migrate_users_to_supabase_auth() IS 
'Prepara dados para migração de usuários para Supabase Auth. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.handle_new_auth_user() IS 
'Trigger que sincroniza novos usuários do Supabase Auth para tabela clientes. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

COMMENT ON FUNCTION public.create_default_calendar_for_cliente() IS 
'Trigger que cria calendário padrão "pessoal" para novos clientes. Atualizado: adicionado SET search_path = '''' (2025-12-08)';

-- ============================================================================
-- Logs e Validação
-- ============================================================================

DO $$
DECLARE
    vulnerable_count INTEGER;
    total_definer_count INTEGER;
BEGIN
    -- Contar funções SECURITY DEFINER sem search_path
    SELECT COUNT(*) INTO vulnerable_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND pg_get_functiondef(p.oid) NOT LIKE '%search_path%';
    
    -- Contar total de funções SECURITY DEFINER
    SELECT COUNT(*) INTO total_definer_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true;
    
    -- Log de execução
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Migration: fix_security_definer_search_path';
    RAISE NOTICE 'Data: 2025-12-08';
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Funções SECURITY DEFINER corrigidas: 13';
    RAISE NOTICE 'Total de funções SECURITY DEFINER no schema public: %', total_definer_count;
    RAISE NOTICE 'Funções vulneráveis restantes: %', vulnerable_count;
    RAISE NOTICE '=============================================================';
    
    IF vulnerable_count = 0 THEN
        RAISE NOTICE '✅ SUCESSO: Todas as funções SECURITY DEFINER estão seguras!';
    ELSE
        RAISE WARNING '⚠️ ATENÇÃO: Ainda existem % funções vulneráveis', vulnerable_count;
    END IF;
    
    RAISE NOTICE '=============================================================';
END $$;
