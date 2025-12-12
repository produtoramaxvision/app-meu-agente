-- Remoção definitiva de cliente_subscription_status para usar apenas public.clientes
-- Contexto: tabela/visão redundante; status de assinatura agora vive em public.clientes.
-- Segurança: remove RLS/policies associadas antes de dropar a relação.

DO $$
DECLARE
  relkind CHAR;
BEGIN
  SELECT c.relkind
  INTO relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'cliente_subscription_status';

  -- Se era view (relkind v/m), drop view; se era tabela (relkind r/p), drop policies e tabela.
  IF relkind = 'v' OR relkind = 'm' THEN
    EXECUTE 'DROP VIEW IF EXISTS public.cliente_subscription_status CASCADE';
  ELSIF relkind = 'r' OR relkind = 'p' THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated read own subscription status" ON public.cliente_subscription_status';
    EXECUTE 'DROP POLICY IF EXISTS "Allow service role full access - subscription status" ON public.cliente_subscription_status';
    EXECUTE 'ALTER TABLE IF EXISTS public.cliente_subscription_status DISABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP TABLE IF EXISTS public.cliente_subscription_status CASCADE';
  END IF;
END $$;

COMMENT ON SCHEMA public IS 'Status de assinatura unificado em public.clientes; cliente_subscription_status removida.';
