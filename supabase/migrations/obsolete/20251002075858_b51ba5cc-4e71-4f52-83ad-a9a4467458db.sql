-- Remover políticas RLS antigas que usam 'authenticated'
DROP POLICY IF EXISTS "Usuarios autenticados podem ver registros financeiros" ON public.financeiro_registros;
DROP POLICY IF EXISTS "Usuarios autenticados podem inserir registros financeiros" ON public.financeiro_registros;
DROP POLICY IF EXISTS "Usuarios autenticados podem atualizar registros financeiros" ON public.financeiro_registros;
DROP POLICY IF EXISTS "Usuarios autenticados podem deletar registros financeiros" ON public.financeiro_registros;

-- Criar políticas RLS permissivas usando TO public
-- Isso funciona com autenticação customizada (clientes table)
CREATE POLICY "Permitir visualização de registros financeiros"
ON public.financeiro_registros
FOR SELECT
TO public
USING (true);

CREATE POLICY "Permitir inserção de registros financeiros"
ON public.financeiro_registros
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Permitir atualização de registros financeiros"
ON public.financeiro_registros
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir exclusão de registros financeiros"
ON public.financeiro_registros
FOR DELETE
TO public
USING (true);