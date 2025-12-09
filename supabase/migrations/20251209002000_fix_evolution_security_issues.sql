-- Migration: Fix security issues in evolution_contacts_cache
-- Issues:
-- 1. RLS policies reference user_metadata (insecure - user can modify)
-- 2. Functions missing search_path (security vulnerability)
-- 3. View with SECURITY DEFINER (potential privilege escalation)

BEGIN;

-- ============================================================================
-- 1. FIX RLS POLICIES - Use phone from JWT claim directly instead of user_metadata
-- ============================================================================

-- Drop existing policies that reference user_metadata
DROP POLICY IF EXISTS "Users can view own contacts" ON evolution_contacts_cache;
DROP POLICY IF EXISTS "Users can insert own contacts" ON evolution_contacts_cache;
DROP POLICY IF EXISTS "Users can update own contacts" ON evolution_contacts_cache;
DROP POLICY IF EXISTS "Users can delete own contacts" ON evolution_contacts_cache;

-- Create secure policies using JWT phone claim (NOT user_metadata)
-- Note: The 'phone' column in the table should be set during INSERT from server-side
-- using the authenticated user's phone from auth.users table, not from JWT
CREATE POLICY "Users can view own contacts"
  ON evolution_contacts_cache FOR SELECT
  USING (
    phone = (
      SELECT au.phone 
      FROM auth.users au 
      WHERE au.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own contacts"
  ON evolution_contacts_cache FOR INSERT
  WITH CHECK (
    phone = (
      SELECT au.phone 
      FROM auth.users au 
      WHERE au.id = auth.uid()
    )
  );

CREATE POLICY "Users can update own contacts"
  ON evolution_contacts_cache FOR UPDATE
  USING (
    phone = (
      SELECT au.phone 
      FROM auth.users au 
      WHERE au.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own contacts"
  ON evolution_contacts_cache FOR DELETE
  USING (
    phone = (
      SELECT au.phone 
      FROM auth.users au 
      WHERE au.id = auth.uid()
    )
  );

-- ============================================================================
-- 2. FIX FUNCTIONS - Add search_path to prevent search path attacks
-- ============================================================================

-- Drop and recreate functions with proper search_path
DROP FUNCTION IF EXISTS is_contact_cache_valid(TIMESTAMPTZ, INT);
CREATE OR REPLACE FUNCTION is_contact_cache_valid(
  p_last_sync TIMESTAMPTZ,
  p_ttl_minutes INT
) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN p_last_sync > (NOW() - INTERVAL '1 minute' * p_ttl_minutes);
END;
$$;

DROP FUNCTION IF EXISTS invalidate_contacts_cache(UUID);
CREATE OR REPLACE FUNCTION invalidate_contacts_cache(p_instance_id UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE evolution_contacts_cache
  SET last_synced_at = NOW() - INTERVAL '1 year' -- Força expiração
  WHERE instance_id = p_instance_id;
END;
$$;

DROP FUNCTION IF EXISTS cleanup_expired_contacts_cache();
CREATE OR REPLACE FUNCTION cleanup_expired_contacts_cache()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM evolution_contacts_cache
  WHERE last_synced_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

DROP FUNCTION IF EXISTS update_evolution_contacts_cache_updated_at();
CREATE OR REPLACE FUNCTION update_evolution_contacts_cache_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. FIX VIEW - Remove SECURITY DEFINER from view
-- ============================================================================

-- Drop and recreate view without SECURITY DEFINER
DROP VIEW IF EXISTS evolution_contacts_valid_cache;
CREATE OR REPLACE VIEW evolution_contacts_valid_cache AS
SELECT 
  c.*,
  is_contact_cache_valid(c.last_synced_at, c.cache_ttl_minutes) AS is_cache_valid,
  EXTRACT(EPOCH FROM (NOW() - c.last_synced_at)) AS seconds_since_sync
FROM evolution_contacts_cache c;

-- Add comment explaining the security fix
COMMENT ON VIEW evolution_contacts_valid_cache IS 'View of contacts cache with validity status. No SECURITY DEFINER - inherits caller permissions.';

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION is_contact_cache_valid(TIMESTAMPTZ, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION invalidate_contacts_cache(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_contacts_cache() TO service_role;

-- ============================================================================
-- 5. UPDATE DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE evolution_contacts_cache IS 'Cache de contatos da EvolutionAPI. SECURITY: phone column populated from auth.users, NOT from JWT user_metadata.';
COMMENT ON COLUMN evolution_contacts_cache.phone IS 'Phone from auth.users table (NOT user_metadata). Used for RLS policies.';

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run after migration to verify)
-- ============================================================================

-- Check that policies no longer reference user_metadata
-- SELECT * FROM pg_policies WHERE tablename = 'evolution_contacts_cache';

-- Check that functions have search_path set
-- SELECT proname, proconfig 
-- FROM pg_proc 
-- WHERE proname IN ('is_contact_cache_valid', 'invalidate_contacts_cache', 'cleanup_expired_contacts_cache', 'update_evolution_contacts_cache_updated_at');
