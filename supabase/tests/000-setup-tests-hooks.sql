-- =====================================================
-- ARQUIVO DE SETUP GLOBAL PARA TESTES PGTAP
-- =====================================================
-- Este arquivo é executado PRIMEIRO (prefixo 000) antes de todos os testes
-- Configura extensões, helpers e valida o ambiente de testes
--
-- Baseado em: https://supabase.com/docs/guides/local-development/testing/pgtap-extended
-- =====================================================

-- Instalar pgTAP (framework de testes)
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

-- =====================================================
-- INSTALAÇÃO DO DATABASE.DEV (DBDEV)
-- =====================================================
-- Necessário para instalar supabase_test_helpers

-- Requisitos: pg_tle e pgsql-http
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_tle;

-- Limpar instalações anteriores
DROP EXTENSION IF EXISTS "supabase-dbdev";
SELECT pgtle.uninstall_extension_if_exists('supabase-dbdev');

-- Instalar dbdev via HTTP
SELECT
  pgtle.install_extension(
    'supabase-dbdev',
    resp.contents ->> 'version',
    'PostgreSQL package manager',
    resp.contents ->> 'sql'
  )
FROM http(
  (
    'GET',
    'https://api.database.dev/rest/v1/'
    || 'package_versions?select=sql,version'
    || '&package_name=eq.supabase-dbdev'
    || '&order=version.desc'
    || '&limit=1',
    ARRAY[
      ('apiKey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXB0cHBsZnZpaWZyYndtbXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAxMDczNzIsImV4cCI6MTk5NTY4MzM3Mn0.z2CN0mvO2No8wSi46Gw59DFGCTJrzM0AQKsu_5k134s')::http_header
    ],
    NULL,
    NULL
  )
) x,
LATERAL (
  SELECT
    ((row_to_json(x) -> 'content') #>> '{}')::json -> 0
) resp(contents);

CREATE EXTENSION "supabase-dbdev";
SELECT dbdev.install('supabase-dbdev');

-- Recriar para garantir instalação limpa
DROP EXTENSION IF EXISTS "supabase-dbdev";
CREATE EXTENSION "supabase-dbdev";

-- =====================================================
-- INSTALAÇÃO DOS TEST HELPERS
-- =====================================================
SELECT dbdev.install('basejump-supabase_test_helpers');
CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers" VERSION '0.0.6';

-- =====================================================
-- TESTE DE VALIDAÇÃO DO SETUP
-- =====================================================
-- Verifica se tudo foi instalado corretamente

BEGIN;
SELECT plan(1);

SELECT ok(true, '✅ Pre-test hook completed successfully - Environment ready for RLS testing');

SELECT * FROM finish();
ROLLBACK;
