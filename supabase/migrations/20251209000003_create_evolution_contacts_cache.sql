-- Migration: Create evolution_contacts_cache table
-- Descrição: Cache inteligente de contatos da EvolutionAPI com TTL configurável (otimizado para CRM/Vendas)

CREATE TABLE evolution_contacts_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES evolution_instances(id) ON DELETE CASCADE,
  phone TEXT NOT NULL, -- Para RLS
  
  -- Dados do contato (source: Evolution API)
  remote_jid TEXT NOT NULL,
  push_name TEXT,
  profile_pic_url TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  is_saved BOOLEAN DEFAULT FALSE, -- Se tem pushName ou foto de perfil
  
  -- Metadata de cache
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  cache_ttl_minutes INT DEFAULT 60, -- TTL padrão: 1 hora (60 minutos)
  sync_source TEXT DEFAULT 'manual', -- 'manual', 'auto', 'webhook'
  
  -- Dados extras do CRM (seus campos customizados)
  crm_notes TEXT,
  crm_tags TEXT[],
  crm_favorite BOOLEAN DEFAULT FALSE,
  crm_last_interaction_at TIMESTAMPTZ,
  crm_lead_status TEXT, -- 'novo', 'contatado', 'negociando', 'ganho', 'perdido'
  crm_lead_score INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(instance_id, remote_jid)
);

-- RLS Policies
ALTER TABLE evolution_contacts_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts"
  ON evolution_contacts_cache FOR SELECT
  USING (auth.jwt() ->> 'phone' = phone);

CREATE POLICY "Users can insert own contacts"
  ON evolution_contacts_cache FOR INSERT
  WITH CHECK (auth.jwt() ->> 'phone' = phone);

CREATE POLICY "Users can update own contacts"
  ON evolution_contacts_cache FOR UPDATE
  USING (auth.jwt() ->> 'phone' = phone);

CREATE POLICY "Users can delete own contacts"
  ON evolution_contacts_cache FOR DELETE
  USING (auth.jwt() ->> 'phone' = phone);

-- Indexes para performance
CREATE INDEX idx_evolution_contacts_cache_phone ON evolution_contacts_cache(phone);
CREATE INDEX idx_evolution_contacts_cache_instance ON evolution_contacts_cache(instance_id);
CREATE INDEX idx_evolution_contacts_cache_remote_jid ON evolution_contacts_cache(remote_jid);
CREATE INDEX idx_evolution_contacts_cache_synced ON evolution_contacts_cache(last_synced_at DESC);
CREATE INDEX idx_evolution_contacts_cache_lead_status ON evolution_contacts_cache(crm_lead_status) WHERE crm_lead_status IS NOT NULL;
CREATE INDEX idx_evolution_contacts_cache_favorite ON evolution_contacts_cache(crm_favorite) WHERE crm_favorite = TRUE;

-- Função para verificar se cache está válido
CREATE OR REPLACE FUNCTION is_contact_cache_valid(
  p_last_sync TIMESTAMPTZ,
  p_ttl_minutes INT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_last_sync > (NOW() - INTERVAL '1 minute' * p_ttl_minutes);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para invalidar cache de uma instância
CREATE OR REPLACE FUNCTION invalidate_contacts_cache(p_instance_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE evolution_contacts_cache
  SET last_synced_at = NOW() - INTERVAL '1 year' -- Força expiração
  WHERE instance_id = p_instance_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar cache expirado (executar via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_contacts_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM evolution_contacts_cache
  WHERE last_synced_at < NOW() - INTERVAL '7 days'; -- Remove cache > 7 dias
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_evolution_contacts_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_evolution_contacts_cache_updated_at
  BEFORE UPDATE ON evolution_contacts_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_evolution_contacts_cache_updated_at();

-- View para contatos com cache válido
CREATE OR REPLACE VIEW evolution_contacts_valid_cache AS
SELECT 
  c.*,
  is_contact_cache_valid(c.last_synced_at, c.cache_ttl_minutes) AS is_cache_valid,
  EXTRACT(EPOCH FROM (NOW() - c.last_synced_at)) AS seconds_since_sync
FROM evolution_contacts_cache c;

-- Comentários para documentação
COMMENT ON TABLE evolution_contacts_cache IS 'Cache de contatos da EvolutionAPI com TTL de 1 hora (configurável)';
COMMENT ON COLUMN evolution_contacts_cache.cache_ttl_minutes IS 'TTL do cache em minutos. Padrão: 60min (1 hora)';
COMMENT ON COLUMN evolution_contacts_cache.sync_source IS 'Origem da sincronização: manual (botão), auto (load), webhook (real-time)';
COMMENT ON COLUMN evolution_contacts_cache.crm_lead_status IS 'Status do lead: novo, contatado, negociando, ganho, perdido';
COMMENT ON FUNCTION is_contact_cache_valid IS 'Verifica se o cache ainda está dentro do TTL';
COMMENT ON FUNCTION invalidate_contacts_cache IS 'Força expiração do cache de uma instância (útil ao enviar mensagem)';
