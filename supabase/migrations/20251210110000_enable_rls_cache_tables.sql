-- Enable RLS for cache/status tables and add safe policies
-- Context: pgTAP test 001 fails because these tables had RLS disabled
-- Security posture: clients can only read their own rows (matched by phone);
-- service_role retains full access for background jobs/ingestion.

-- evolution_contacts_valid_cache ------------------------------------------------
ALTER TABLE public.evolution_contacts_valid_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_contacts_valid_cache FORCE ROW LEVEL SECURITY;

-- Allow service role to manage cache data
CREATE POLICY "Allow service role full access - contacts cache"
  ON public.evolution_contacts_valid_cache
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read only their own cache rows (by phone)
CREATE POLICY "Allow authenticated read own contacts cache"
  ON public.evolution_contacts_valid_cache
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (phone = public.get_user_phone_optimized());

-- No client insert/update/delete policies to avoid tampering; service_role covers writes.

-- cliente_subscription_status ----------------------------------------------------
ALTER TABLE public.cliente_subscription_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_subscription_status FORCE ROW LEVEL SECURITY;

-- Allow service role to manage subscription status data
CREATE POLICY "Allow service role full access - subscription status"
  ON public.cliente_subscription_status
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read only their own subscription status (by phone)
CREATE POLICY "Allow authenticated read own subscription status"
  ON public.cliente_subscription_status
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (phone = public.get_user_phone_optimized());

-- No client insert/update/delete policies to avoid tampering; service_role covers writes.
