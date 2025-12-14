-- ============================================================================
-- Migration: multi_instance_support
-- Descrição: Adiciona suporte a múltiplas instâncias WhatsApp por cliente
-- Autor: GitHub Copilot + MaxVision
-- Data: 2025-12-13
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR CAMPO display_name EM evolution_instances
-- ============================================================================

ALTER TABLE public.evolution_instances 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

COMMENT ON COLUMN public.evolution_instances.display_name IS 'Nome amigável da instância (ex: WhatsApp 1, WhatsApp Comercial)';

-- ============================================================================
-- 2. FUNÇÃO PARA GERAR display_name SEQUENCIAL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_instance_display_name(p_phone VARCHAR(20))
RETURNS VARCHAR(100) AS $$
DECLARE
    v_count INT;
BEGIN
    -- Conta quantas instâncias o usuário já tem
    SELECT COUNT(*) INTO v_count
    FROM public.evolution_instances
    WHERE phone = p_phone;
    
    -- Retorna "WhatsApp N+1"
    RETURN 'WhatsApp ' || (v_count + 1)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.generate_instance_display_name IS 'Gera nome sequencial para nova instância WhatsApp (WhatsApp 1, WhatsApp 2, etc.)';

-- ============================================================================
-- 3. FUNÇÃO PARA OBTER LIMITE DE INSTÂNCIAS POR PLANO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_max_instances_for_user(p_phone VARCHAR(20))
RETURNS INT AS $$
DECLARE
    v_plan_id TEXT;
    v_subscription_active BOOLEAN;
BEGIN
    -- Busca o plano do usuário
    SELECT plan_id, subscription_active 
    INTO v_plan_id, v_subscription_active
    FROM public.clientes
    WHERE phone = p_phone;
    
    -- Se não encontrou ou assinatura inativa, retorna 0 (sem acesso ao SDR)
    IF v_plan_id IS NULL OR NOT COALESCE(v_subscription_active, FALSE) THEN
        RETURN 0;
    END IF;
    
    -- Limites por plano
    CASE v_plan_id
        WHEN 'business' THEN RETURN 2;
        WHEN 'premium' THEN RETURN 5;
        ELSE RETURN 0; -- free, lite, basic não têm acesso ao SDR
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.get_max_instances_for_user IS 'Retorna limite de instâncias WhatsApp: Business=2, Premium=5, outros=0';

-- ============================================================================
-- 4. FUNÇÃO PARA VERIFICAR SE PODE CRIAR NOVA INSTÂNCIA
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_create_new_instance(p_phone VARCHAR(20))
RETURNS BOOLEAN AS $$
DECLARE
    v_max_instances INT;
    v_current_count INT;
BEGIN
    -- Obtém limite do plano
    v_max_instances := public.get_max_instances_for_user(p_phone);
    
    -- Se limite é 0, não pode criar
    IF v_max_instances = 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Conta instâncias atuais
    SELECT COUNT(*) INTO v_current_count
    FROM public.evolution_instances
    WHERE phone = p_phone;
    
    -- Retorna se ainda tem espaço
    RETURN v_current_count < v_max_instances;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.can_create_new_instance IS 'Verifica se usuário pode criar nova instância WhatsApp baseado no plano';

-- ============================================================================
-- 5. ATUALIZAR CONSTRAINT DE sdr_agent_config PARA MULTI-INSTÂNCIA
-- ============================================================================

-- Remover constraint antiga (1 config por phone)
ALTER TABLE public.sdr_agent_config 
DROP CONSTRAINT IF EXISTS unique_phone_sdr_config;

-- Adicionar nova constraint (1 config por phone+instance)
ALTER TABLE public.sdr_agent_config 
ADD CONSTRAINT unique_phone_instance_sdr_config UNIQUE (phone, instance_id);

COMMENT ON CONSTRAINT unique_phone_instance_sdr_config ON public.sdr_agent_config 
IS 'Garante uma configuração por combinação de cliente + instância WhatsApp';

-- ============================================================================
-- 6. BACKFILL: Preencher instance_id em configs existentes
-- ============================================================================

-- Atualiza configs existentes que não têm instance_id
-- associando com a primeira instância do mesmo phone
UPDATE public.sdr_agent_config sc
SET instance_id = (
    SELECT ei.id 
    FROM public.evolution_instances ei 
    WHERE ei.phone = sc.phone 
    ORDER BY ei.created_at ASC 
    LIMIT 1
)
WHERE sc.instance_id IS NULL;

-- ============================================================================
-- 7. BACKFILL: Preencher display_name em instâncias existentes
-- ============================================================================

-- Atualiza instâncias existentes sem display_name
WITH numbered_instances AS (
    SELECT 
        id,
        phone,
        ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as row_num
    FROM public.evolution_instances
    WHERE display_name IS NULL
)
UPDATE public.evolution_instances ei
SET display_name = 'WhatsApp ' || ni.row_num::TEXT
FROM numbered_instances ni
WHERE ei.id = ni.id;

-- ============================================================================
-- 8. FUNÇÃO PARA ATUALIZAR display_name
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_instance_display_name(
    p_instance_id UUID,
    p_display_name VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_phone VARCHAR(20);
    v_instance_phone VARCHAR(20);
BEGIN
    -- Obtém telefone do usuário autenticado
    v_user_phone := public.get_user_phone_optimized();
    
    -- Obtém telefone da instância
    SELECT phone INTO v_instance_phone
    FROM public.evolution_instances
    WHERE id = p_instance_id;
    
    -- Verifica se a instância pertence ao usuário
    IF v_instance_phone IS NULL OR v_instance_phone != v_user_phone THEN
        RAISE EXCEPTION 'Acesso negado: instância não encontrada ou não pertence ao usuário';
    END IF;
    
    -- Atualiza o display_name
    UPDATE public.evolution_instances
    SET display_name = p_display_name,
        updated_at = now()
    WHERE id = p_instance_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.update_instance_display_name IS 'Atualiza nome amigável de uma instância WhatsApp';

-- ============================================================================
-- 9. ÍNDICE PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sdr_agent_config_phone_instance 
    ON public.sdr_agent_config(phone, instance_id);

-- ============================================================================
-- LOG
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration multi_instance_support executada com sucesso!';
    RAISE NOTICE '  - Campo display_name adicionado em evolution_instances';
    RAISE NOTICE '  - Função generate_instance_display_name criada';
    RAISE NOTICE '  - Função get_max_instances_for_user criada (Business=2, Premium=5)';
    RAISE NOTICE '  - Função can_create_new_instance criada';
    RAISE NOTICE '  - Constraint alterada para unique(phone, instance_id)';
    RAISE NOTICE '  - Backfill de instance_id e display_name executado';
END $$;
