-- ============================================================================
-- Migration: create_sdr_agent_config
-- Descrição: Tabela para configuração do Agente SDR com estrutura JSON flexível
-- Autor: GitHub Copilot + MaxVision
-- Data: 2025-12-07
-- ============================================================================

-- Tabela: sdr_agent_config
-- Armazena configurações do Agente SDR em formato JSONB para máxima flexibilidade
CREATE TABLE IF NOT EXISTS public.sdr_agent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL REFERENCES public.clientes(phone) ON DELETE CASCADE,
    instance_id UUID REFERENCES public.evolution_instances(id) ON DELETE SET NULL,
    
    -- Configuração completa do agente em JSON
    -- Schema: AgenteConfigJSON (ver types/sdr.ts)
    config_json JSONB NOT NULL DEFAULT '{
        "identidade": {
            "nome_agente": "Assistente SDR",
            "nome_empresa": "",
            "descricao_empresa": "",
            "missao": "Criar conexão humana e genuína, coletar informações essenciais e agendar reuniões"
        },
        "apresentacao": {
            "modelos": []
        },
        "conducao": {
            "regras": [],
            "usar_reacoes": true,
            "frequencia_reacoes": 3
        },
        "qualificacao": {
            "requisitos_minimos": [],
            "perguntas_mapeamento": []
        },
        "mensagens": {
            "saudacao": null,
            "fallback": "Desculpe, não entendi sua mensagem. Pode reformular?",
            "encerramento": null,
            "fora_horario": null
        },
        "ia_config": {
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "top_p": 0.9,
            "frequency_penalty": 0,
            "presence_penalty": 0,
            "max_tokens": 500
        },
        "comportamento": {
            "horario_atendimento": {
                "inicio": "09:00",
                "fim": "18:00",
                "dias": [1,2,3,4,5]
            },
            "agendamento_automatico": false,
            "link_calendario": null
        },
        "objecoes": {
            "tecnicas": []
        },
        "limitacoes": [
            "Não responda perguntas fora do escopo",
            "Não mostre dados de outros clientes",
            "Nunca recomende concorrentes"
        ]
    }'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT unique_phone_sdr_config UNIQUE (phone)
);

-- Comentários
COMMENT ON TABLE public.sdr_agent_config IS 'Configurações do Agente SDR para cada cliente';
COMMENT ON COLUMN public.sdr_agent_config.phone IS 'Telefone do cliente (FK para clientes)';
COMMENT ON COLUMN public.sdr_agent_config.instance_id IS 'ID da instância Evolution conectada (opcional)';
COMMENT ON COLUMN public.sdr_agent_config.config_json IS 'Configuração completa do agente em formato JSONB';
COMMENT ON COLUMN public.sdr_agent_config.is_active IS 'Se o agente está ativo ou pausado';

-- ============================================================================
-- Índices
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sdr_agent_config_phone 
    ON public.sdr_agent_config(phone);

CREATE INDEX IF NOT EXISTS idx_sdr_agent_config_instance 
    ON public.sdr_agent_config(instance_id);

CREATE INDEX IF NOT EXISTS idx_sdr_agent_config_is_active 
    ON public.sdr_agent_config(is_active);

-- Índice GIN para busca em JSONB (queries performáticas)
CREATE INDEX IF NOT EXISTS idx_sdr_agent_config_json 
    ON public.sdr_agent_config USING GIN (config_json);

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

ALTER TABLE public.sdr_agent_config ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - usuário só vê sua própria configuração
CREATE POLICY "sdr_config_select" 
    ON public.sdr_agent_config
    FOR SELECT 
    TO authenticated
    USING (phone = (SELECT public.get_user_phone_optimized()));

-- Policy: INSERT - usuário só pode criar configuração para si mesmo
CREATE POLICY "sdr_config_insert" 
    ON public.sdr_agent_config
    FOR INSERT 
    TO authenticated
    WITH CHECK (phone = (SELECT public.get_user_phone_optimized()));

-- Policy: UPDATE - usuário só pode atualizar sua própria configuração
CREATE POLICY "sdr_config_update" 
    ON public.sdr_agent_config
    FOR UPDATE 
    TO authenticated
    USING (phone = (SELECT public.get_user_phone_optimized()));

-- Policy: DELETE - usuário só pode deletar sua própria configuração
CREATE POLICY "sdr_config_delete" 
    ON public.sdr_agent_config
    FOR DELETE 
    TO authenticated
    USING (phone = (SELECT public.get_user_phone_optimized()));

-- ============================================================================
-- Trigger: Atualizar updated_at automaticamente
-- ============================================================================

CREATE TRIGGER set_sdr_agent_config_updated_at
    BEFORE UPDATE ON public.sdr_agent_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Funções Auxiliares para Manipulação do JSON
-- ============================================================================

-- Função: Atualizar seção específica do config_json
CREATE OR REPLACE FUNCTION public.update_sdr_config_section(
    p_phone VARCHAR(20),
    p_section TEXT,
    p_data JSONB
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Verifica se o usuário autenticado tem permissão
    IF p_phone != (SELECT public.get_user_phone_optimized()) THEN
        RAISE EXCEPTION 'Acesso negado: você só pode atualizar sua própria configuração';
    END IF;

    UPDATE public.sdr_agent_config
    SET config_json = jsonb_set(config_json, ARRAY[p_section], p_data),
        updated_at = now()
    WHERE phone = p_phone
    RETURNING config_json INTO v_result;
    
    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Configuração não encontrada para o telefone: %', p_phone;
    END IF;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_sdr_config_section IS 'Atualiza uma seção específica do config_json do agente SDR';

-- Função: Obter configuração completa para N8N
CREATE OR REPLACE FUNCTION public.get_sdr_config_for_n8n(
    p_phone VARCHAR(20)
) RETURNS JSONB AS $$
DECLARE
    v_config JSONB;
BEGIN
    SELECT jsonb_build_object(
        'agente_config', config_json,
        'metadata', jsonb_build_object(
            'versao', '1.0',
            'atualizado_em', updated_at,
            'ativo', is_active
        )
    )
    INTO v_config
    FROM public.sdr_agent_config
    WHERE phone = p_phone AND is_active = true;
    
    RETURN COALESCE(v_config, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_sdr_config_for_n8n IS 'Retorna a configuração completa do agente SDR formatada para o N8N';

-- Função: Atualizar configuração de IA (sliders)
CREATE OR REPLACE FUNCTION public.update_sdr_ia_config(
    p_phone VARCHAR(20),
    p_model VARCHAR(50),
    p_temperature DECIMAL(3,2),
    p_top_p DECIMAL(3,2),
    p_frequency_penalty DECIMAL(3,2),
    p_presence_penalty DECIMAL(3,2),
    p_max_tokens INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_ia_config JSONB;
BEGIN
    -- Verifica se o usuário autenticado tem permissão
    IF p_phone != (SELECT public.get_user_phone_optimized()) THEN
        RAISE EXCEPTION 'Acesso negado: você só pode atualizar sua própria configuração';
    END IF;

    -- Monta o objeto JSON de configuração de IA
    v_ia_config := jsonb_build_object(
        'model', p_model,
        'temperature', p_temperature,
        'top_p', p_top_p,
        'frequency_penalty', p_frequency_penalty,
        'presence_penalty', p_presence_penalty,
        'max_tokens', p_max_tokens
    );

    -- Atualiza a configuração
    RETURN public.update_sdr_config_section(p_phone, 'ia_config', v_ia_config);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_sdr_ia_config IS 'Atualiza as configurações de IA (temperature, top_p, etc.) do agente SDR';

-- ============================================================================
-- Logs
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration create_sdr_agent_config executada com sucesso!';
END $$;
