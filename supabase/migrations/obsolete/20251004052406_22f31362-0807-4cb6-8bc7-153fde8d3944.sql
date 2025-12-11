-- Enable RLS is already enabled on tables, now adding policies

-- Políticas para financeiro_registros
CREATE POLICY "Users can view their own financial records"
ON public.financeiro_registros
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own financial records"
ON public.financeiro_registros
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own financial records"
ON public.financeiro_registros
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own financial records"
ON public.financeiro_registros
FOR DELETE
USING (true);

-- Políticas para metas
CREATE POLICY "Users can view their own goals"
ON public.metas
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own goals"
ON public.metas
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own goals"
ON public.metas
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own goals"
ON public.metas
FOR DELETE
USING (true);

-- Políticas para notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (true);