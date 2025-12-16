-- Migration: Create Custom Fields Tables
-- Data: 2025-12-16
-- Descrição: Tabelas para campos personalizáveis no CRM (Custom Fields)
-- Permite que cada cliente crie campos extras para qualificar leads

-- ============================================================================
-- TABELA: custom_fields_definitions
-- Descrição: Define os campos personalizados que cada cliente configura
-- ============================================================================

CREATE TABLE custom_fields_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_phone TEXT NOT NULL,
  field_key TEXT NOT NULL, -- "num_funcionarios" (snake_case, sem espaços)
  field_label TEXT NOT NULL, -- "Número de Funcionários" (display name)
  field_type TEXT CHECK (field_type IN (
    'text',       -- Texto livre
    'number',     -- Número
    'boolean',    -- Sim/Não
    'date',       -- Data
    'select',     -- Lista de opções (single select)
    'multiselect',-- Lista de opções (multiple select)
    'currency',   -- Valor monetário
    'url'         -- URL
  )) NOT NULL,
  options JSONB, -- Para tipo 'select'/'multiselect': ["1-10", "11-50", "51-200", "200+"]
  required BOOLEAN DEFAULT false,
  show_in_card BOOLEAN DEFAULT false, -- Exibir no card do Kanban
  show_in_list BOOLEAN DEFAULT true, -- Exibir na view de lista
  display_order INTEGER DEFAULT 0, -- Ordem de exibição
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Cada cliente pode ter apenas 1 campo com essa chave
  UNIQUE (cliente_phone, field_key),
  
  -- Foreign key para clientes
  CONSTRAINT fk_custom_fields_cliente
    FOREIGN KEY (cliente_phone) 
    REFERENCES clientes(phone) 
    ON DELETE CASCADE
);

-- ============================================================================
-- TABELA: custom_fields_values
-- Descrição: Armazena os valores dos campos personalizados para cada contato
-- ============================================================================

CREATE TABLE custom_fields_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL,
  field_key TEXT NOT NULL,
  value JSONB NOT NULL, -- Flexível: string, number, boolean, array (para multiselect)
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Cada contato pode ter apenas 1 valor por campo
  UNIQUE (contact_id, field_key),
  
  -- Foreign key para evolution_contacts
  CONSTRAINT fk_custom_fields_contact
    FOREIGN KEY (contact_id) 
    REFERENCES evolution_contacts(id) 
    ON DELETE CASCADE
);

-- ============================================================================
-- ÍNDICES para Performance
-- ============================================================================

-- Índice para buscar definições de um cliente
CREATE INDEX idx_custom_defs_client ON custom_fields_definitions(cliente_phone);

-- Índice para buscar valores de um contato
CREATE INDEX idx_custom_values_contact ON custom_fields_values(contact_id);

-- Índice para buscar valores por campo
CREATE INDEX idx_custom_values_key ON custom_fields_values(field_key);

-- Índice para ordenação
CREATE INDEX idx_custom_defs_order ON custom_fields_definitions(cliente_phone, display_order);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE custom_fields_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields_values ENABLE ROW LEVEL SECURITY;

-- Policies para custom_fields_definitions
-- Usuário pode gerenciar (SELECT, INSERT, UPDATE, DELETE) apenas suas próprias definições

CREATE POLICY "Users manage own field definitions"
ON custom_fields_definitions
FOR ALL
USING (
  cliente_phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid())
);

-- Policies para custom_fields_values
-- Usuário pode gerenciar apenas valores de contatos que pertencem a ele

CREATE POLICY "Users manage own field values"
ON custom_fields_values
FOR ALL
USING (
  contact_id IN (
    SELECT id FROM evolution_contacts 
    WHERE phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid())
  )
);

-- ============================================================================
-- TRIGGERS para atualizar updated_at automaticamente
-- ============================================================================

-- Trigger para custom_fields_definitions
CREATE OR REPLACE FUNCTION update_custom_fields_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_fields_definitions_updated_at
  BEFORE UPDATE ON custom_fields_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_fields_definitions_updated_at();

-- Trigger para custom_fields_values
CREATE OR REPLACE FUNCTION update_custom_fields_values_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_fields_values_updated_at
  BEFORE UPDATE ON custom_fields_values
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_fields_values_updated_at();

-- ============================================================================
-- FUNÇÕES HELPER
-- ============================================================================

-- Função para validar se field_key está em formato snake_case
CREATE OR REPLACE FUNCTION validate_field_key(key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Deve conter apenas letras minúsculas, números e underscores
  -- Não pode começar com número
  RETURN key ~* '^[a-z][a-z0-9_]*$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Constraint para validar field_key
ALTER TABLE custom_fields_definitions 
ADD CONSTRAINT check_field_key_format 
CHECK (validate_field_key(field_key));

-- ============================================================================
-- VIEW HELPER para consultas
-- ============================================================================

-- View que combina definições com valores para facilitar consultas
CREATE OR REPLACE VIEW vw_custom_fields_with_values AS
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
FROM custom_fields_definitions d
LEFT JOIN custom_fields_values v ON d.field_key = v.field_key
ORDER BY d.display_order;

-- ============================================================================
-- COMENTÁRIOS para Documentação
-- ============================================================================

COMMENT ON TABLE custom_fields_definitions IS 'Definições de campos personalizados configurados por cada cliente para o CRM';
COMMENT ON TABLE custom_fields_values IS 'Valores dos campos personalizados para cada contato';

COMMENT ON COLUMN custom_fields_definitions.field_key IS 'Chave única do campo em snake_case (ex: num_funcionarios)';
COMMENT ON COLUMN custom_fields_definitions.field_label IS 'Nome amigável exibido na UI (ex: Número de Funcionários)';
COMMENT ON COLUMN custom_fields_definitions.field_type IS 'Tipo do campo: text, number, boolean, date, select, multiselect, currency, url';
COMMENT ON COLUMN custom_fields_definitions.options IS 'Opções para campos select/multiselect em formato JSON array';
COMMENT ON COLUMN custom_fields_definitions.show_in_card IS 'Se true, campo aparece no card do Kanban';
COMMENT ON COLUMN custom_fields_definitions.show_in_list IS 'Se true, campo aparece na view de lista';

COMMENT ON COLUMN custom_fields_values.value IS 'Valor do campo em formato JSON flexível (string, number, boolean, array)';

-- ============================================================================
-- DADOS DE EXEMPLO (apenas para desenvolvimento/testes)
-- ============================================================================

-- Estes dados serão automaticamente isolados por RLS
-- Descomentar apenas em ambiente de DEV

/*
-- Exemplo: Cliente com phone '11999999999' cria campo "Orçamento"
INSERT INTO custom_fields_definitions (cliente_phone, field_key, field_label, field_type, required, show_in_card)
VALUES ('11999999999', 'orcamento', 'Orçamento Disponível', 'currency', true, true);

-- Exemplo: Cliente cria campo "Tamanho da Empresa"
INSERT INTO custom_fields_definitions (cliente_phone, field_key, field_label, field_type, options, show_in_list)
VALUES (
  '11999999999', 
  'tamanho_empresa', 
  'Tamanho da Empresa', 
  'select', 
  '["1-10", "11-50", "51-200", "200+"]'::jsonb,
  true
);
*/
