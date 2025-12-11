-- Corrigir políticas RLS para garantir isolamento por usuário
-- Esta migração substitui as políticas genéricas por políticas específicas por usuário

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own financial records" ON public.financeiro_registros;
DROP POLICY IF EXISTS "Users can insert their own financial records" ON public.financeiro_registros;
DROP POLICY IF EXISTS "Users can update their own financial records" ON public.financeiro_registros;
DROP POLICY IF EXISTS "Users can delete their own financial records" ON public.financeiro_registros;

DROP POLICY IF EXISTS "Users can view their own goals" ON public.metas;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.metas;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.metas;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.metas;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Criar políticas RLS corretas para financeiro_registros
CREATE POLICY "Users can view their own financial records"
ON public.financeiro_registros
FOR SELECT
USING (auth.uid()::text = telefone_usuario);

CREATE POLICY "Users can insert their own financial records"
ON public.financeiro_registros
FOR INSERT
WITH CHECK (auth.uid()::text = telefone_usuario);

CREATE POLICY "Users can update their own financial records"
ON public.financeiro_registros
FOR UPDATE
USING (auth.uid()::text = telefone_usuario)
WITH CHECK (auth.uid()::text = telefone_usuario);

CREATE POLICY "Users can delete their own financial records"
ON public.financeiro_registros
FOR DELETE
USING (auth.uid()::text = telefone_usuario);

-- Criar políticas RLS corretas para metas
CREATE POLICY "Users can view their own goals"
ON public.metas
FOR SELECT
USING (auth.uid()::text = telefone_usuario);

CREATE POLICY "Users can insert their own goals"
ON public.metas
FOR INSERT
WITH CHECK (auth.uid()::text = telefone_usuario);

CREATE POLICY "Users can update their own goals"
ON public.metas
FOR UPDATE
USING (auth.uid()::text = telefone_usuario)
WITH CHECK (auth.uid()::text = telefone_usuario);

CREATE POLICY "Users can delete their own goals"
ON public.metas
FOR DELETE
USING (auth.uid()::text = telefone_usuario);

-- Criar políticas RLS corretas para notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid()::text = telefone_usuario);

CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid()::text = telefone_usuario);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid()::text = telefone_usuario)
WITH CHECK (auth.uid()::text = telefone_usuario);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid()::text = telefone_usuario);

-- Criar políticas RLS para tasks (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
        -- Remover políticas existentes de tasks se existirem
        DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
        DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
        DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
        DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

        -- Criar políticas RLS corretas para tasks
        CREATE POLICY "Users can view their own tasks"
        ON public.tasks
        FOR SELECT
        USING (auth.uid()::text = telefone_usuario);

        CREATE POLICY "Users can insert their own tasks"
        ON public.tasks
        FOR INSERT
        WITH CHECK (auth.uid()::text = telefone_usuario);

        CREATE POLICY "Users can update their own tasks"
        ON public.tasks
        FOR UPDATE
        USING (auth.uid()::text = telefone_usuario)
        WITH CHECK (auth.uid()::text = telefone_usuario);

        CREATE POLICY "Users can delete their own tasks"
        ON public.tasks
        FOR DELETE
        USING (auth.uid()::text = telefone_usuario);
    END IF;
END $$;

-- Criar políticas RLS para agenda_events (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agenda_events') THEN
        -- Remover políticas existentes de agenda_events se existirem
        DROP POLICY IF EXISTS "Users can view their own agenda events" ON public.agenda_events;
        DROP POLICY IF EXISTS "Users can insert their own agenda events" ON public.agenda_events;
        DROP POLICY IF EXISTS "Users can update their own agenda events" ON public.agenda_events;
        DROP POLICY IF EXISTS "Users can delete their own agenda events" ON public.agenda_events;

        -- Criar políticas RLS corretas para agenda_events
        CREATE POLICY "Users can view their own agenda events"
        ON public.agenda_events
        FOR SELECT
        USING (auth.uid()::text = telefone_usuario);

        CREATE POLICY "Users can insert their own agenda events"
        ON public.agenda_events
        FOR INSERT
        WITH CHECK (auth.uid()::text = telefone_usuario);

        CREATE POLICY "Users can update their own agenda events"
        ON public.agenda_events
        FOR UPDATE
        USING (auth.uid()::text = telefone_usuario)
        WITH CHECK (auth.uid()::text = telefone_usuario);

        CREATE POLICY "Users can delete their own agenda events"
        ON public.agenda_events
        FOR DELETE
        USING (auth.uid()::text = telefone_usuario);
    END IF;
END $$;

-- Criar políticas RLS para privacy_settings (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'privacy_settings') THEN
        -- Remover políticas existentes de privacy_settings se existirem
        DROP POLICY IF EXISTS "Users can view their own privacy settings" ON public.privacy_settings;
        DROP POLICY IF EXISTS "Users can insert their own privacy settings" ON public.privacy_settings;
        DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.privacy_settings;
        DROP POLICY IF EXISTS "Users can delete their own privacy settings" ON public.privacy_settings;

        -- Criar políticas RLS corretas para privacy_settings
        CREATE POLICY "Users can view their own privacy settings"
        ON public.privacy_settings
        FOR SELECT
        USING (auth.uid()::text = telefone_usuario);

        CREATE POLICY "Users can insert their own privacy settings"
        ON public.privacy_settings
        FOR INSERT
        WITH CHECK (auth.uid()::text = telefone_usuario);

        CREATE POLICY "Users can update their own privacy settings"
        ON public.privacy_settings
        FOR UPDATE
        USING (auth.uid()::text = telefone_usuario)
        WITH CHECK (auth.uid()::text = telefone_usuario);

        CREATE POLICY "Users can delete their own privacy settings"
        ON public.privacy_settings
        FOR DELETE
        USING (auth.uid()::text = telefone_usuario);
    END IF;
END $$;
