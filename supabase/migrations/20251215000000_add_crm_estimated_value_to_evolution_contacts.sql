-- Migration: Add crm_estimated_value and crm_closed_at to evolution_contacts_cache
-- Descrição: Adiciona campos para valor estimado do deal e data de fechamento (necessários para CRM Pipeline)
-- Data: 2025-12-15

-- Adicionar campo crm_estimated_value (valor em reais, tipo NUMERIC para precisão decimal)
ALTER TABLE public.evolution_contacts_cache 
ADD COLUMN IF NOT EXISTS crm_estimated_value NUMERIC(12, 2) DEFAULT 0;

-- Adicionar campo crm_closed_at (data de fechamento do deal - ganho ou perdido)
ALTER TABLE public.evolution_contacts_cache 
ADD COLUMN IF NOT EXISTS crm_closed_at TIMESTAMPTZ;

-- Comentários para documentação
COMMENT ON COLUMN public.evolution_contacts_cache.crm_estimated_value IS 'Valor estimado do deal em reais (ex: 1500.00 para R$ 1.500,00)';
COMMENT ON COLUMN public.evolution_contacts_cache.crm_closed_at IS 'Data de fechamento do deal (quando status mudou para ganho ou perdido)';

-- Índice para facilitar queries de valor total do pipeline
CREATE INDEX IF NOT EXISTS idx_evolution_contacts_cache_estimated_value 
ON public.evolution_contacts_cache(crm_estimated_value) 
WHERE crm_estimated_value > 0;

-- Índice para facilitar queries de leads fechados
CREATE INDEX IF NOT EXISTS idx_evolution_contacts_cache_closed_at 
ON public.evolution_contacts_cache(crm_closed_at) 
WHERE crm_closed_at IS NOT NULL;
