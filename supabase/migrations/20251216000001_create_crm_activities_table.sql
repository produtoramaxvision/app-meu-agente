-- Migration: Create crm_activities table for Activity Timeline feature
-- Descrição: Tabela para registrar histórico de atividades/interações com leads do CRM
-- Data: 2025-12-16
-- Fase 2.2 do Plano de Otimização do CRM

-- ============================================================================
-- TABELA: crm_activities
-- ============================================================================
-- Armazena todas as atividades/interações com leads (mudanças de status, 
-- notas, ligações, reuniões, tarefas, etc.)

CREATE TABLE IF NOT EXISTS public.crm_activities (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  contact_id UUID NOT NULL REFERENCES public.evolution_contacts(id) ON DELETE CASCADE,
  
  -- RLS: phone do usuário (necessário para policies)
  phone TEXT NOT NULL,
  
  -- Tipo de atividade
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'lead_created',           -- Lead criado
    'status_change',          -- Mudança de status no pipeline
    'note_added',             -- Nota adicionada
    'note_updated',           -- Nota atualizada
    'value_updated',          -- Valor estimado atualizado
    'call',                   -- Ligação telefônica
    'email',                  -- Email enviado
    'meeting',                -- Reunião realizada
    'whatsapp_sent',          -- Mensagem WhatsApp enviada
    'task_created',           -- Tarefa criada
    'task_completed',         -- Tarefa completada
    'custom_field_updated',   -- Campo personalizado atualizado
    'loss_reason_set'         -- Motivo de perda definido
  )),
  
  -- Dados da atividade
  title TEXT NOT NULL,
  description TEXT,
  
  -- Para mudanças (ex: status anterior → novo status)
  old_value TEXT,
  new_value TEXT,
  
  -- Metadata adicional (JSONB para flexibilidade)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice para buscar atividades por contato (query mais comum)
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact 
ON public.crm_activities(contact_id);

-- Índice para RLS policies (filtra por phone do usuário)
CREATE INDEX IF NOT EXISTS idx_crm_activities_phone 
ON public.crm_activities(phone);

-- Índice para ordenação por data (DESC = mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_crm_activities_created 
ON public.crm_activities(created_at DESC);

-- Índice composto para query otimizada: buscar atividades de um contato ordenadas por data
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact_created 
ON public.crm_activities(contact_id, created_at DESC);

-- Índice para filtrar por tipo de atividade
CREATE INDEX IF NOT EXISTS idx_crm_activities_type 
ON public.crm_activities(activity_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities FORCE ROW LEVEL SECURITY;

-- Policy: service_role tem acesso total (para background jobs/Edge Functions)
CREATE POLICY "Allow service role full access - crm activities"
  ON public.crm_activities
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: usuários autenticados podem VER apenas suas próprias atividades
CREATE POLICY "Users can view own activities"
  ON public.crm_activities
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (phone = public.get_user_phone_optimized());

-- Policy: usuários autenticados podem INSERIR suas próprias atividades
-- (WITH CHECK garante que o phone seja do usuário atual)
CREATE POLICY "Users can insert own activities"
  ON public.crm_activities
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (phone = public.get_user_phone_optimized());

-- Não permitir UPDATE/DELETE por usuários comuns (histórico é imutável)
-- Apenas service_role pode modificar/deletar via primeira policy

-- ============================================================================
-- COMENTÁRIOS (Documentação)
-- ============================================================================

COMMENT ON TABLE public.crm_activities IS 
'Histórico de atividades/interações com leads do CRM. Registra mudanças de status, notas, ligações, reuniões, tarefas, etc.';

COMMENT ON COLUMN public.crm_activities.id IS 
'UUID único da atividade';

COMMENT ON COLUMN public.crm_activities.contact_id IS 
'UUID do contato relacionado (FK para evolution_contacts)';

COMMENT ON COLUMN public.crm_activities.phone IS 
'Telefone do usuário dono do lead (necessário para RLS policies)';

COMMENT ON COLUMN public.crm_activities.activity_type IS 
'Tipo de atividade: lead_created, status_change, note_updated, call, email, meeting, whatsapp_sent, task_created, task_completed, custom_field_updated, loss_reason_set';

COMMENT ON COLUMN public.crm_activities.title IS 
'Título resumido da atividade (ex: "Status mudou de Novo para Contatado")';

COMMENT ON COLUMN public.crm_activities.description IS 
'Descrição detalhada da atividade (opcional)';

COMMENT ON COLUMN public.crm_activities.old_value IS 
'Valor anterior (para mudanças). Ex: status anterior "novo"';

COMMENT ON COLUMN public.crm_activities.new_value IS 
'Novo valor (para mudanças). Ex: novo status "contatado"';

COMMENT ON COLUMN public.crm_activities.metadata IS 
'Metadata adicional em formato JSON (flexível para diferentes tipos de atividades)';

COMMENT ON COLUMN public.crm_activities.created_at IS 
'Data/hora de criação da atividade';

-- ============================================================================
-- TRIGGER: Registrar criação de lead automaticamente
-- ============================================================================

-- Função trigger para registrar automaticamente quando um lead é criado
CREATE OR REPLACE FUNCTION public.log_lead_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  -- Só registra se o contato foi inserido com crm_lead_status preenchido
  IF NEW.crm_lead_status IS NOT NULL THEN
    INSERT INTO public.crm_activities (
      contact_id,
      phone,
      activity_type,
      title,
      description,
      new_value,
      metadata
    ) VALUES (
      NEW.id,
      NEW.phone,
      'lead_created',
      'Lead criado',
      'Novo lead adicionado ao CRM',
      NEW.crm_lead_status,
      jsonb_build_object(
        'push_name', NEW.push_name,
        'initial_status', NEW.crm_lead_status,
        'estimated_value', COALESCE(NEW.crm_estimated_value, 0)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.log_lead_creation() IS 
'Trigger function: registra automaticamente a criação de um lead na tabela crm_activities';

-- Criar o trigger na tabela evolution_contacts
DROP TRIGGER IF EXISTS trigger_log_lead_creation ON public.evolution_contacts;

CREATE TRIGGER trigger_log_lead_creation
  AFTER INSERT ON public.evolution_contacts
  FOR EACH ROW
  WHEN (NEW.crm_lead_status IS NOT NULL)
  EXECUTE FUNCTION public.log_lead_creation();

COMMENT ON TRIGGER trigger_log_lead_creation ON public.evolution_contacts IS 
'Registra automaticamente a criação de leads na tabela crm_activities';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
