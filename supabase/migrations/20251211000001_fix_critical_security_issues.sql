-- =============================================================================
-- Migration: fix_critical_security_issues
-- Objetivo: Corrigir vulnerabilidades críticas identificadas na auditoria
-- Data: 2025-12-11
-- Autor: Cursor Agent (via User)
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. CORREÇÃO CRÍTICA: Tabela privacy_settings [VULNERABILIDADE DE ACESSO]
-- Problema: RLS comparava auth.uid() (UUID) com phone (TEXT). Ninguém acessava.
-- Solução: Usar get_user_phone_optimized()
-- =============================================================================

-- Remover políticas incorretas
DROP POLICY IF EXISTS "Users can view their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can insert their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.privacy_settings;
DROP POLICY IF EXISTS "Users can delete their own privacy settings" ON public.privacy_settings;

-- Criar políticas corretas e seguras
CREATE POLICY "auth_privacy_select"
ON public.privacy_settings
FOR SELECT
TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()));

CREATE POLICY "auth_privacy_insert"
ON public.privacy_settings
FOR INSERT
TO authenticated
WITH CHECK (phone = (SELECT public.get_user_phone_optimized()));

CREATE POLICY "auth_privacy_update"
ON public.privacy_settings
FOR UPDATE
TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()))
WITH CHECK (phone = (SELECT public.get_user_phone_optimized()));

CREATE POLICY "auth_privacy_delete"
ON public.privacy_settings
FOR DELETE
TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()));

-- =============================================================================
-- 2. CORREÇÃO CRÍTICA: Tabela clientes [ENUMERAÇÃO DE USUÁRIOS]
-- Problema: Política pública permitia SELECT * em clientes.
-- Solução: Remover política pública. Manter apenas RPC check_phone_exists.
-- =============================================================================

DROP POLICY IF EXISTS "Allow phone lookup for login" ON public.clientes;

-- Nota: "Allow signup for all users" (INSERT) é necessário para cadastro, mas
-- deve ser restrito se possível. Como o cadastro é público, mantemos INSERT,
-- mas removemos SELECT público.
-- A política "Users can view their own profile via auth_user_id" já existe e é segura.

-- =============================================================================
-- 3. CORREÇÃO DE SEGURANÇA: RPC get_sdr_config_for_n8n [IDOR]
-- Problema: Função SECURITY DEFINER permitia ler config de qualquer telefone.
-- Solução: Adicionar verificação de propriedade (exceto para service_role).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_sdr_config_for_n8n(
    p_phone VARCHAR(20)
) RETURNS JSONB AS $$
DECLARE
    v_config JSONB;
    v_user_phone TEXT;
    v_role TEXT;
BEGIN
    -- Obter role do usuário atual (seguro contra SQL injection pois vem do JWT)
    v_role := current_setting('request.jwt.claim.role', true);

    -- Verificação de segurança:
    -- Se NÃO for service_role (N8N/Admin), o telefone deve pertencer ao usuário.
    -- Se v_role for NULL (ex: chamado via SQL direto sem JWT), assume não-privilegiado
    IF v_role IS NULL OR v_role != 'service_role' THEN
        v_user_phone := (SELECT public.get_user_phone_optimized());
        
        -- Se usuário não autenticado ou telefone não bate, negar acesso
        IF v_user_phone IS NULL OR v_user_phone != p_phone THEN
            RAISE EXCEPTION 'Acesso negado: Você não tem permissão para acessar esta configuração.';
        END IF;
    END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMENT ON FUNCTION public.get_sdr_config_for_n8n IS 'Retorna configuração para N8N. Protegido contra IDOR (auth check) e Privilege Escalation (search_path).';

-- =============================================================================
-- 4. PADRONIZAÇÃO: Tabela evolution_contacts_cache
-- Problema: Usava JWT claims diretamente (inconsistente com resto do sistema).
-- Solução: Migrar para get_user_phone_optimized().
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own contacts" ON public.evolution_contacts_cache;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.evolution_contacts_cache;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.evolution_contacts_cache;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.evolution_contacts_cache;

CREATE POLICY "auth_contacts_cache_select"
ON public.evolution_contacts_cache
FOR SELECT
TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()));

CREATE POLICY "auth_contacts_cache_insert"
ON public.evolution_contacts_cache
FOR INSERT
TO authenticated
WITH CHECK (phone = (SELECT public.get_user_phone_optimized()));

CREATE POLICY "auth_contacts_cache_update"
ON public.evolution_contacts_cache
FOR UPDATE
TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()))
WITH CHECK (phone = (SELECT public.get_user_phone_optimized()));

CREATE POLICY "auth_contacts_cache_delete"
ON public.evolution_contacts_cache
FOR DELETE
TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()));

-- =============================================================================
-- 5. LOG DE AUDITORIA
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Migration: fix_critical_security_issues';
    RAISE NOTICE 'Data: 2025-12-11';
    RAISE NOTICE 'Status: APLICADO COM SUCESSO';
    RAISE NOTICE '-------------------------------------------------------------';
    RAISE NOTICE '1. privacy_settings: RLS corrigido para usar get_user_phone_optimized()';
    RAISE NOTICE '2. clientes: Removida política pública de SELECT (info disclosure)';
    RAISE NOTICE '3. get_sdr_config_for_n8n: Adicionada verificação de dono do telefone';
    RAISE NOTICE '4. evolution_contacts_cache: Padronizado para usar get_user_phone_optimized()';
    RAISE NOTICE '=============================================================';
END $$;

COMMIT;

