-- ============================================================================
-- Migration: Move Test Extensions to Extensions Schema
-- Data: 2025-12-18
-- Descrição: Move extensões de teste (supabase-dbdev, basejump-supabase_test_helpers)
--            do schema public para extensions (segurança e organização)
-- ============================================================================

-- ============================================================================
-- PASSO 1: Criar schema extensions (se não existir)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS extensions;

COMMENT ON SCHEMA extensions IS 'Schema para extensões PostgreSQL isoladas do schema public';

-- ============================================================================
-- PASSO 2: Mover supabase-dbdev para extensions
-- ============================================================================
-- Dropar do public e recriar no extensions
DROP EXTENSION IF EXISTS "supabase-dbdev" CASCADE;

-- Reinstalar via pg_tle no schema correto
-- Nota: A instalação via dbdev.install() será feita no arquivo de setup dos testes
-- Aqui apenas preparamos o ambiente

-- ============================================================================
-- PASSO 3: Remover basejump-supabase_test_helpers do public
-- ============================================================================
DROP EXTENSION IF EXISTS "basejump-supabase_test_helpers" CASCADE;

-- ============================================================================
-- PASSO 4: Garantir que pg_tle e http estão disponíveis
-- ============================================================================
-- Estas são necessárias para dbdev funcionar
CREATE EXTENSION IF NOT EXISTS pg_tle;
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON EXTENSION pg_tle IS 'Trusted Language Extensions - necessário para database.dev';
COMMENT ON EXTENSION http IS 'HTTP client para PostgreSQL - usado para instalar dbdev';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
DO $$
DECLARE
  v_extensions_in_public integer;
BEGIN
  -- Contar extensões de teste ainda no public
  SELECT COUNT(*) INTO v_extensions_in_public
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE n.nspname = 'public'
  AND e.extname IN ('supabase-dbdev', 'basejump-supabase_test_helpers');

  RAISE NOTICE '✅ Migration concluída!';
  RAISE NOTICE '   - Schema extensions criado/validado';
  RAISE NOTICE '   - Extensões de teste removidas do public: %', 
    CASE WHEN v_extensions_in_public = 0 THEN '✅ Sim' ELSE '⚠️ Ainda há extensões' END;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANTE: Atualizar supabase/tests/000-setup-tests-hooks.sql';
  RAISE NOTICE '   para instalar extensões no schema extensions';
END $$;
