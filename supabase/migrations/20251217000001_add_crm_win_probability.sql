-- Adiciona coluna de probabilidade de fechamento personalizada
-- Se NULL, usa probabilidade padrão do status (definida no frontend)
-- Permite override manual para refinar forecasts

ALTER TABLE evolution_contacts 
ADD COLUMN IF NOT EXISTS crm_win_probability INTEGER 
  CHECK (crm_win_probability >= 0 AND crm_win_probability <= 100);

-- Adicionar comentário para documentação
COMMENT ON COLUMN evolution_contacts.crm_win_probability IS 
  'Probabilidade de fechamento (0-100%). Se NULL, usa default do status: novo=10%, contatado=20%, qualificado=40%, proposta=60%, negociando=80%, ganho=100%, perdido=0%.';

-- Índice para queries de forecast (opcional mas recomendado)
CREATE INDEX IF NOT EXISTS idx_evolution_contacts_win_probability 
  ON evolution_contacts(crm_win_probability) 
  WHERE crm_win_probability IS NOT NULL;

-- Nota: Não precisamos atualizar RLS pois a coluna pertence à tabela evolution_contacts
-- que já possui políticas RLS ativas baseadas em phone
