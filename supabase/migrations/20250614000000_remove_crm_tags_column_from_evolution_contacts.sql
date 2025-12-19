-- ============================================================================
-- Migration: Remove deprecated crm_tags column from evolution_contacts
-- Data: 2025-06-14
-- Descrição: Remove a coluna crm_tags (TEXT[]) que foi substituída pelo
--            sistema relacional de tags (tabelas crm_tags + crm_lead_tags).
--
-- IMPORTANTE: Esta migration assume que TODOS os dados foram migrados para
--             o sistema relacional. Verifique antes de executar!
-- ============================================================================

-- ============================================================================
-- PASSO 1: Verificar se ainda há dados não migrados (safety check)
-- ============================================================================

DO $$
DECLARE
  non_migrated_count INT;
BEGIN
  -- Contar contatos com tags no array que NÃO têm correspondência no sistema relacional
  SELECT COUNT(*) INTO non_migrated_count
  FROM public.evolution_contacts ec
  WHERE ec.crm_tags IS NOT NULL 
    AND array_length(ec.crm_tags, 1) > 0
    AND NOT EXISTS (
      SELECT 1 
      FROM public.crm_lead_tags clt 
      WHERE clt.lead_id = ec.id
    );

  IF non_migrated_count > 0 THEN
    RAISE NOTICE '⚠️ Há % contatos com tags no array antigo que podem não ter sido migrados.', non_migrated_count;
    RAISE NOTICE 'Recomenda-se verificar manualmente antes de prosseguir.';
    -- Se quiser BLOQUEAR a migration, descomente a linha abaixo:
    -- RAISE EXCEPTION 'Migration abortada: dados não migrados encontrados.';
  ELSE
    RAISE NOTICE '✅ Nenhum dado não-migrado encontrado. Prosseguindo com remoção.';
  END IF;
END $$;

-- ============================================================================
-- PASSO 2: Atualizar view vw_evolution_contacts (remover crm_tags)
-- ============================================================================

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
  -- crm_tags REMOVIDO - usar sistema relacional (crm_lead_tags)
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

COMMENT ON VIEW vw_evolution_contacts IS 'View de contatos com campos calculados de freshness. Tags via crm_lead_tags.';

-- ============================================================================
-- PASSO 3: Remover coluna crm_tags da tabela evolution_contacts
-- ============================================================================

ALTER TABLE public.evolution_contacts DROP COLUMN IF EXISTS crm_tags;

-- ============================================================================
-- PASSO 4: Verificação final
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration concluída com sucesso!';
  RAISE NOTICE '   - View vw_evolution_contacts atualizada (sem crm_tags)';
  RAISE NOTICE '   - Coluna crm_tags removida de evolution_contacts';
  RAISE NOTICE '   - Tags agora são gerenciadas via crm_tags + crm_lead_tags (sistema relacional)';
END $$;
