-- Adjust RLS to accept phone in either JWT phone claim or user_metadata.phone (handles blank phone claim)
BEGIN;

DROP POLICY IF EXISTS "Users can view own contacts" ON evolution_contacts_cache;
DROP POLICY IF EXISTS "Users can insert own contacts" ON evolution_contacts_cache;
DROP POLICY IF EXISTS "Users can update own contacts" ON evolution_contacts_cache;
DROP POLICY IF EXISTS "Users can delete own contacts" ON evolution_contacts_cache;

CREATE POLICY "Users can view own contacts"
  ON evolution_contacts_cache FOR SELECT
  USING (phone = COALESCE(NULLIF(auth.jwt() ->> 'phone', ''), auth.jwt() -> 'user_metadata' ->> 'phone'));

CREATE POLICY "Users can insert own contacts"
  ON evolution_contacts_cache FOR INSERT
  WITH CHECK (phone = COALESCE(NULLIF(auth.jwt() ->> 'phone', ''), auth.jwt() -> 'user_metadata' ->> 'phone'));

CREATE POLICY "Users can update own contacts"
  ON evolution_contacts_cache FOR UPDATE
  USING (phone = COALESCE(NULLIF(auth.jwt() ->> 'phone', ''), auth.jwt() -> 'user_metadata' ->> 'phone'));

CREATE POLICY "Users can delete own contacts"
  ON evolution_contacts_cache FOR DELETE
  USING (phone = COALESCE(NULLIF(auth.jwt() ->> 'phone', ''), auth.jwt() -> 'user_metadata' ->> 'phone'));

COMMIT;
