-- Ajusta has_active_subscription para usar apenas tabela clientes
-- Lógica: assinatura ativa quando subscription_active = true e plan_id != 'free'

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.phone = user_phone
      AND c.subscription_active = true
      AND c.plan_id IS NOT NULL
      AND c.plan_id <> 'free'
      AND c.is_active = true
  );
END;
$$;

COMMENT ON FUNCTION public.has_active_subscription(TEXT) IS
'Verifica se um usuário tem assinatura ativa apenas via tabela clientes.
Critérios: subscription_active = true, plan_id != free, is_active = true.
SECURITY DEFINER com search_path vazio.';
