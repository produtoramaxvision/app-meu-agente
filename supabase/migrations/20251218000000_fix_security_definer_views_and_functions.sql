-- ============================================================================
-- Migration: Fix Security Definer Views and Mutable Search Path Functions
-- Data: 2025-12-18
-- Descrição: Corrige issues de segurança identificados pelo Supabase Advisor:
--   1. Views SECURITY DEFINER → SECURITY INVOKER (respeita RLS)
--   2. Functions sem search_path → adiciona search_path fixo
-- ============================================================================

-- ============================================================================
-- PASSO 1: Converter vw_evolution_contacts para SECURITY INVOKER
-- ============================================================================
-- Esta view adiciona campos calculados (seconds_since_sync, sync_freshness)
-- Com SECURITY INVOKER, ela respeita as RLS policies de evolution_contacts

DROP VIEW IF EXISTS vw_evolution_contacts;

CREATE VIEW vw_evolution_contacts 
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.instance_id,
  c.phone,
  c.remote_jid,
  c.push_name,
  c.profile_pic_url,
  c.is_group,
  c.is_saved,
  c.synced_at,
  c.sync_source,
  c.crm_notes,
  c.crm_tags,
  c.crm_favorite,
  c.crm_last_interaction_at,
  c.crm_lead_status,
  c.crm_lead_score,
  c.created_at,
  c.updated_at,
  c.crm_estimated_value,
  c.crm_closed_at,
  c.crm_loss_reason,
  c.crm_loss_reason_details,
  c.crm_score_updated_at,
  c.crm_win_probability,
  -- Campos calculados úteis
  EXTRACT(EPOCH FROM (NOW() - c.synced_at)) AS seconds_since_sync,
  CASE 
    WHEN c.synced_at > NOW() - INTERVAL '5 minutes' THEN 'recente'
    WHEN c.synced_at > NOW() - INTERVAL '1 hour' THEN 'atual'
    WHEN c.synced_at > NOW() - INTERVAL '24 hours' THEN 'desatualizado'
    ELSE 'muito_antigo'
  END AS sync_freshness
FROM public.evolution_contacts c;

COMMENT ON VIEW vw_evolution_contacts IS 'View de contatos com campos calculados de freshness. SECURITY INVOKER respeita RLS.';

-- ============================================================================
-- PASSO 2: Converter vw_custom_fields_with_values para SECURITY INVOKER
-- ============================================================================
-- Esta view junta definições com valores de custom fields
-- Com SECURITY INVOKER, respeita as RLS policies das tabelas base

DROP VIEW IF EXISTS vw_custom_fields_with_values;

CREATE VIEW vw_custom_fields_with_values 
WITH (security_invoker = true)
AS
SELECT 
  d.id AS definition_id,
  d.cliente_phone,
  d.field_key,
  d.field_label,
  d.field_type,
  d.options,
  d.required,
  d.show_in_card,
  d.show_in_list,
  d.display_order,
  v.contact_id,
  v.value,
  v.updated_at AS value_updated_at
FROM public.custom_fields_definitions d
LEFT JOIN public.custom_fields_values v ON d.field_key = v.field_key
ORDER BY d.display_order;

COMMENT ON VIEW vw_custom_fields_with_values IS 'View que combina definições com valores de custom fields. SECURITY INVOKER respeita RLS.';

-- ============================================================================
-- PASSO 3: Corrigir funções com search_path mutável
-- ============================================================================
-- Adiciona SET search_path = '' para imunidade contra ataques de search_path

-- 3.1. validate_field_key
CREATE OR REPLACE FUNCTION public.validate_field_key(key text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $function$
BEGIN
  RETURN key ~* '^[a-z][a-z0-9_]*$';
END;
$function$;

COMMENT ON FUNCTION public.validate_field_key(text) IS 'Valida se field_key está em formato snake_case válido.';

-- 3.2. update_custom_fields_definitions_updated_at
CREATE OR REPLACE FUNCTION public.update_custom_fields_definitions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.update_custom_fields_definitions_updated_at() IS 'Trigger function para atualizar updated_at automaticamente.';

-- 3.3. update_evolution_contacts_updated_at
CREATE OR REPLACE FUNCTION public.update_evolution_contacts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.update_evolution_contacts_updated_at() IS 'Trigger function para atualizar updated_at automaticamente.';

-- 3.4. update_custom_fields_values_updated_at
CREATE OR REPLACE FUNCTION public.update_custom_fields_values_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.update_custom_fields_values_updated_at() IS 'Trigger function para atualizar updated_at automaticamente.';

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  v_view_invoker_count integer;
  v_func_search_path_count integer;
BEGIN
  -- Verificar views com security_invoker
  SELECT COUNT(*) INTO v_view_invoker_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' 
  AND c.relkind = 'v'
  AND c.relname IN ('vw_evolution_contacts', 'vw_custom_fields_with_values')
  AND c.reloptions @> ARRAY['security_invoker=true'];

  -- Verificar funções com search_path fixo
  SELECT COUNT(*) INTO v_func_search_path_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN ('validate_field_key', 'update_custom_fields_definitions_updated_at', 
                     'update_evolution_contacts_updated_at', 'update_custom_fields_values_updated_at')
  AND p.proconfig IS NOT NULL
  AND array_to_string(p.proconfig, ',') LIKE '%search_path%';

  RAISE NOTICE '✅ Migration de segurança concluída!';
  RAISE NOTICE '   - Views com SECURITY INVOKER: %/2', v_view_invoker_count;
  RAISE NOTICE '   - Funções com search_path fixo: %/4', v_func_search_path_count;
  
  IF v_view_invoker_count < 2 OR v_func_search_path_count < 4 THEN
    RAISE WARNING '⚠️ Algumas correções podem não ter sido aplicadas corretamente!';
  END IF;
END $$;
