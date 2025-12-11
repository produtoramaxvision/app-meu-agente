-- =====================================================
-- TESTE: VERIFICAÇÃO SCHEMA-WIDE RLS ENABLED
-- =====================================================
-- Valida que RLS está habilitado em TODAS as tabelas do schema public
-- CRÍTICO: Tabelas sem RLS são acessíveis publicamente via API
--
-- Baseado em: https://supabase.com/docs/guides/local-development/testing/pgtap-extended
-- =====================================================

SET search_path TO extensions, public;

BEGIN;
SELECT plan(1);

-- =====================================================
-- TESTE 1: RLS habilitado em todas as TABELAS base do schema public
-- =====================================================
-- Ignoramos views, pois RLS não é aplicável a relkind = 'v'.
-- Security Score: CRITICAL (sem RLS = acesso público total)

SELECT is(
	(
		SELECT count(*)::integer
		FROM pg_class pc
		JOIN pg_namespace pn ON pn.oid = pc.relnamespace AND pn.nspname = 'public'
		WHERE pc.relkind = 'r' AND pc.relrowsecurity = FALSE
	),
	0,
	'Todas as tabelas base do schema public devem ter RLS habilitado'
);

SELECT * FROM finish();
ROLLBACK;
