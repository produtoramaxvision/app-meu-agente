-- Harden clientes RLS: remove public-wide SELECT and allow only authenticated/service_role
-- CONTEXT: Login flow uses SECURITY DEFINER RPCs (check_phone_registration, get_user_email_by_phone)
-- which bypass RLS, so this public policy is no longer needed and creates a security vulnerability.
-- IMPACT: Zero breaking changes - all auth flows use RPCs that bypass RLS automatically.

-- Remove overly permissive policy that exposed all client rows
DROP POLICY IF EXISTS "Allow phone lookup for login" ON public.clientes;

-- Ensure service_role retains full access for background jobs/imports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'clientes' AND policyname = 'Service role full access - clientes'
  ) THEN
    CREATE POLICY "Service role full access - clientes"
      ON public.clientes
      AS PERMISSIVE
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;
