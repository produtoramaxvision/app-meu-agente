-- Migration: Otimizar RLS Policies para melhor performance
-- Issue: Auth RLS Initialization Plan warning
-- Fix: Usar (SELECT auth.uid()) ao invés de auth.uid() diretamente
-- Ref: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================================
-- EVOLUTION_CONTACTS: Otimizar policies
-- ============================================================================

-- Dropar policies existentes
DROP POLICY IF EXISTS "Users can view own contacts" ON evolution_contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON evolution_contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON evolution_contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON evolution_contacts;

-- Recriar policies com SELECT otimizado
CREATE POLICY "Users can view own contacts"
  ON evolution_contacts FOR SELECT
  USING (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can insert own contacts"
  ON evolution_contacts FOR INSERT
  WITH CHECK (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can update own contacts"
  ON evolution_contacts FOR UPDATE
  USING (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can delete own contacts"
  ON evolution_contacts FOR DELETE
  USING (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  );

-- ============================================================================
-- SUPPORT_TICKETS: Otimizar policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can create support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;

CREATE POLICY "Users can create support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can view their own tickets"
  ON support_tickets FOR SELECT
  USING (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Users can update their own tickets"
  ON support_tickets FOR UPDATE
  USING (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  );

-- ============================================================================
-- CRM_AUTOMATION_LOGS: Otimizar policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their automation logs" ON crm_automation_logs;

CREATE POLICY "Users can view their automation logs"
  ON crm_automation_logs FOR SELECT
  USING (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  );

-- ============================================================================
-- CRM_LEAD_TAGS: Otimizar policies
-- ============================================================================

DROP POLICY IF EXISTS "crm_lead_tags_insert_policy" ON crm_lead_tags;

CREATE POLICY "crm_lead_tags_insert_policy"
  ON crm_lead_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM evolution_contacts 
      WHERE id = crm_lead_tags.lead_id 
        AND phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
    )
  );

-- ============================================================================
-- CUSTOM_FIELDS_DEFINITIONS: Otimizar policies
-- ============================================================================

DROP POLICY IF EXISTS "Users manage own field definitions" ON custom_fields_definitions;

CREATE POLICY "Users manage own field definitions"
  ON custom_fields_definitions FOR ALL
  USING (
    client_phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    client_phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
  );

-- ============================================================================
-- CUSTOM_FIELDS_VALUES: Otimizar policies
-- ============================================================================

DROP POLICY IF EXISTS "Users manage own field values" ON custom_fields_values;

CREATE POLICY "Users manage own field values"
  ON custom_fields_values FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_fields_definitions cfd
      WHERE cfd.id = custom_fields_values.field_id
        AND cfd.client_phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_fields_definitions cfd
      WHERE cfd.id = custom_fields_values.field_id
        AND cfd.client_phone = (SELECT phone FROM clientes WHERE auth_user_id = (SELECT auth.uid()))
    )
  );

-- ============================================================================
-- Comentário final
-- ============================================================================

COMMENT ON POLICY "Users can view own contacts" ON evolution_contacts IS 
  'Optimized RLS: Uses (SELECT auth.uid()) to avoid re-evaluation per row';
