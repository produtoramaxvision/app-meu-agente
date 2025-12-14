-- ============================================================================
-- Migration: remove_conducao_from_sdr_config
-- Descrição: Remove a seção "conducao" do config_json da tabela sdr_agent_config
-- Autor: GitHub Copilot + MaxVision
-- Data: 2025-12-14
-- ============================================================================

-- Atualiza todos os registros existentes removendo a chave "conducao" do JSONB
UPDATE public.sdr_agent_config
SET config_json = config_json - 'conducao'
WHERE config_json ? 'conducao';

-- Comentário da migration
COMMENT ON TABLE public.sdr_agent_config IS 'Configuração do Agente SDR (atualizado em 2025-12-14: removida seção conducao)';
