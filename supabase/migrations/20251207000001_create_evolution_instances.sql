-- ============================================================================
-- Migration: create_evolution_instances
-- Descrição: Tabela para armazenar instâncias do Evolution API (WhatsApp)
-- Autor: GitHub Copilot + MaxVision
-- Data: 2025-12-07
-- ============================================================================

-- Tabela: evolution_instances
-- Armazena informações de conexão WhatsApp via Evolution API
CREATE TABLE IF NOT EXISTS public.evolution_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL REFERENCES public.clientes(phone) ON DELETE CASCADE,
    instance_name VARCHAR(100) UNIQUE NOT NULL,
    instance_token VARCHAR(255),
    connection_status VARCHAR(20) DEFAULT 'disconnected',
    whatsapp_number VARCHAR(20),
    qr_code TEXT,
    pairing_code VARCHAR(20),
    last_qr_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    connected_at TIMESTAMPTZ,
    
    CONSTRAINT valid_connection_status CHECK (
        connection_status IN ('disconnected', 'connecting', 'connected', 'error')
    )
);

-- Comentários
COMMENT ON TABLE public.evolution_instances IS 'Instâncias de conexão WhatsApp via Evolution API';
COMMENT ON COLUMN public.evolution_instances.phone IS 'Telefone do cliente (FK para clientes)';
COMMENT ON COLUMN public.evolution_instances.instance_name IS 'Nome único da instância na Evolution API';
COMMENT ON COLUMN public.evolution_instances.instance_token IS 'Token de autenticação da instância';
COMMENT ON COLUMN public.evolution_instances.connection_status IS 'Status da conexão: disconnected, connecting, connected, error';
COMMENT ON COLUMN public.evolution_instances.whatsapp_number IS 'Número do WhatsApp conectado';
COMMENT ON COLUMN public.evolution_instances.qr_code IS 'QR Code em Base64 para conexão';
COMMENT ON COLUMN public.evolution_instances.pairing_code IS 'Código de 8 dígitos alternativo ao QR Code';
COMMENT ON COLUMN public.evolution_instances.last_qr_update IS 'Última atualização do QR Code';
COMMENT ON COLUMN public.evolution_instances.connected_at IS 'Data/hora da última conexão bem-sucedida';

-- Índices
CREATE INDEX IF NOT EXISTS idx_evolution_instances_phone 
    ON public.evolution_instances(phone);

CREATE INDEX IF NOT EXISTS idx_evolution_instances_status 
    ON public.evolution_instances(connection_status);

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================

ALTER TABLE public.evolution_instances ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - usuário só vê suas próprias instâncias
CREATE POLICY "evolution_instances_select" 
    ON public.evolution_instances
    FOR SELECT 
    TO authenticated
    USING (phone = (SELECT public.get_user_phone_optimized()));

-- Policy: INSERT - usuário só pode criar instância para si mesmo
CREATE POLICY "evolution_instances_insert" 
    ON public.evolution_instances
    FOR INSERT 
    TO authenticated
    WITH CHECK (phone = (SELECT public.get_user_phone_optimized()));

-- Policy: UPDATE - usuário só pode atualizar suas próprias instâncias
CREATE POLICY "evolution_instances_update" 
    ON public.evolution_instances
    FOR UPDATE 
    TO authenticated
    USING (phone = (SELECT public.get_user_phone_optimized()));

-- Policy: DELETE - usuário só pode deletar suas próprias instâncias
CREATE POLICY "evolution_instances_delete" 
    ON public.evolution_instances
    FOR DELETE 
    TO authenticated
    USING (phone = (SELECT public.get_user_phone_optimized()));

-- ============================================================================
-- Trigger: Atualizar updated_at automaticamente
-- ============================================================================

CREATE TRIGGER set_evolution_instances_updated_at
    BEFORE UPDATE ON public.evolution_instances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Logs
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration create_evolution_instances executada com sucesso!';
END $$;
