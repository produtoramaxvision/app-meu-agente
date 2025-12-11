-- Criar políticas RLS permissivas para financeiro_registros
-- Permitir que qualquer usuário autenticado possa fazer operações

-- Política para SELECT
CREATE POLICY "Usuarios autenticados podem ver registros financeiros"
ON public.financeiro_registros
FOR SELECT
TO authenticated
USING (true);

-- Política para INSERT
CREATE POLICY "Usuarios autenticados podem inserir registros financeiros"
ON public.financeiro_registros
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para UPDATE
CREATE POLICY "Usuarios autenticados podem atualizar registros financeiros"
ON public.financeiro_registros
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para DELETE
CREATE POLICY "Usuarios autenticados podem deletar registros financeiros"
ON public.financeiro_registros
FOR DELETE
TO authenticated
USING (true);