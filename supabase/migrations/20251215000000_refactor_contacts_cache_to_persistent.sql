-- Migration: Refatorar cache temporário para armazenamento persistente
-- Data: 2025-12-15
-- Descrição: Remove conceito de TTL/cache e transforma em tabela persistente simples
-- Rename: evolution_contacts_cache → evolution_contacts

-- ============================================================================
-- PASSO 1: Renomear tabela
-- ============================================================================

ALTER TABLE evolution_contacts_cache RENAME TO evolution_contacts;

-- ============================================================================
-- PASSO 2: Remover campos relacionados a cache/TTL (não mais necessários)
-- ============================================================================

-- Remover coluna cache_ttl_minutes (não mais necessário)
ALTER TABLE evolution_contacts DROP COLUMN IF EXISTS cache_ttl_minutes;

-- Renomear last_synced_at para synced_at (semântica mais clara)
ALTER TABLE evolution_contacts RENAME COLUMN last_synced_at TO synced_at;

-- ============================================================================
-- PASSO 3: Atualizar índices (renomear para novo nome da tabela)
-- ============================================================================

-- Dropar índices antigos
DROP INDEX IF EXISTS idx_evolution_contacts_cache_phone;
DROP INDEX IF EXISTS idx_evolution_contacts_cache_instance;
DROP INDEX IF EXISTS idx_evolution_contacts_cache_remote_jid;
DROP INDEX IF EXISTS idx_evolution_contacts_cache_synced;
DROP INDEX IF EXISTS idx_evolution_contacts_cache_lead_status;
DROP INDEX IF EXISTS idx_evolution_contacts_cache_favorite;

-- Criar novos índices com nome atualizado
CREATE INDEX idx_evolution_contacts_phone ON evolution_contacts(phone);
CREATE INDEX idx_evolution_contacts_instance ON evolution_contacts(instance_id);
CREATE INDEX idx_evolution_contacts_remote_jid ON evolution_contacts(remote_jid);
CREATE INDEX idx_evolution_contacts_synced ON evolution_contacts(synced_at DESC);
CREATE INDEX idx_evolution_contacts_lead_status ON evolution_contacts(crm_lead_status) WHERE crm_lead_status IS NOT NULL;
CREATE INDEX idx_evolution_contacts_favorite ON evolution_contacts(crm_favorite) WHERE crm_favorite = TRUE;

-- ============================================================================
-- PASSO 4: Atualizar policies RLS
-- ============================================================================

-- Dropar policies antigas
DROP POLICY IF EXISTS "Users can view own contacts" ON evolution_contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON evolution_contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON evolution_contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON evolution_contacts;

-- Recriar policies
CREATE POLICY "Users can view own contacts"
  ON evolution_contacts FOR SELECT
  USING (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can insert own contacts"
  ON evolution_contacts FOR INSERT
  WITH CHECK (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update own contacts"
  ON evolution_contacts FOR UPDATE
  USING (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete own contacts"
  ON evolution_contacts FOR DELETE
  USING (
    phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid())
  );

-- ============================================================================
-- PASSO 5: Remover funções relacionadas a TTL/cache (obsoletas)
-- ============================================================================

-- Função de validação de cache (não mais necessária)
DROP FUNCTION IF EXISTS is_contact_cache_valid(TIMESTAMPTZ, INT);

-- Função de invalidação de cache (não mais necessária)
DROP FUNCTION IF EXISTS invalidate_contacts_cache(TEXT);

-- Função de limpeza de cache expirado (não mais necessária)
DROP FUNCTION IF EXISTS cleanup_expired_contacts_cache();

-- ============================================================================
-- PASSO 6: Atualizar trigger de updated_at
-- ============================================================================

-- Dropar trigger antigo
DROP TRIGGER IF EXISTS trigger_update_evolution_contacts_cache_updated_at ON evolution_contacts;

-- Dropar função antiga
DROP FUNCTION IF EXISTS update_evolution_contacts_cache_updated_at();

-- Criar nova função
CREATE OR REPLACE FUNCTION update_evolution_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar novo trigger
CREATE TRIGGER trigger_update_evolution_contacts_updated_at
  BEFORE UPDATE ON evolution_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_evolution_contacts_updated_at();

-- ============================================================================
-- PASSO 7: Atualizar view de contatos
-- ============================================================================

-- Dropar view antiga
DROP VIEW IF EXISTS vw_evolution_contacts_with_cache_status;

-- Criar nova view (sem conceito de cache)
CREATE OR REPLACE VIEW vw_evolution_contacts AS
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
  -- Campos calculados úteis
  EXTRACT(EPOCH FROM (NOW() - c.synced_at)) AS seconds_since_sync,
  CASE 
    WHEN c.synced_at > NOW() - INTERVAL '5 minutes' THEN 'recente'
    WHEN c.synced_at > NOW() - INTERVAL '1 hour' THEN 'atual'
    WHEN c.synced_at > NOW() - INTERVAL '24 hours' THEN 'desatualizado'
    ELSE 'muito_antigo'
  END AS sync_freshness
FROM evolution_contacts c;

-- ============================================================================
-- PASSO 8: Atualizar comentários da tabela
-- ============================================================================

COMMENT ON TABLE evolution_contacts IS 'Contatos sincronizados da Evolution API. Persistência total sem TTL.';
COMMENT ON COLUMN evolution_contacts.synced_at IS 'Data/hora da última sincronização com a Evolution API';
COMMENT ON COLUMN evolution_contacts.sync_source IS 'Origem da sincronização: manual (botão), auto (load), webhook (real-time)';
COMMENT ON COLUMN evolution_contacts.crm_lead_status IS 'Status do lead: novo, contatado, negociando, ganho, perdido';
COMMENT ON COLUMN evolution_contacts.phone IS 'Telefone do usuário dono dos contatos (para RLS)';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Migration concluída com sucesso!';
  RAISE NOTICE '   - Tabela renomeada: evolution_contacts_cache → evolution_contacts';
  RAISE NOTICE '   - Campo TTL removido: cache_ttl_minutes';
  RAISE NOTICE '   - Campo renomeado: last_synced_at → synced_at';
  RAISE NOTICE '   - Funções de cache removidas (is_contact_cache_valid, invalidate_contacts_cache, cleanup_expired_contacts_cache)';
  RAISE NOTICE '   - View atualizada: vw_evolution_contacts';
  RAISE NOTICE '   - Sistema agora usa persistência simples sem conceito de cache/TTL';
END $$;
