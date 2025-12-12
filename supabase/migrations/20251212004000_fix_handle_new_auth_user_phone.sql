-- Corrige handle_new_auth_user para capturar phone do metadata e normalizar
-- Evita falha de NOT NULL/PK em clientes quando signup usa email (NEW.phone = NULL)

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_phone_raw TEXT;
  v_phone_clean TEXT;
  v_name TEXT;
BEGIN
  -- Prioriza NEW.phone; fallback para metadata phone; normaliza para só dígitos
  v_phone_raw := COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', '');
  v_phone_clean := regexp_replace(v_phone_raw, '[^0-9]', '', 'g');

  IF v_phone_clean IS NULL OR length(v_phone_clean) < 10 THEN
    RAISE EXCEPTION 'phone_required'
      USING DETAIL = 'Telefone é obrigatório para cadastro',
            HINT = 'Envie phone em user_metadata ou no campo phone.';
  END IF;

  v_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'Usuário');

  INSERT INTO public.clientes (
    phone,
    auth_user_id,
    email,
    name,
    cpf,
    subscription_active,
    is_active,
    plan_id,
    created_at,
    updated_at
  ) VALUES (
    v_phone_clean,
    NEW.id,
    NEW.email,
    v_name,
    NEW.raw_user_meta_data->>'cpf',
    false,
    true,
    'free',
    NOW(),
    NOW()
  )
  ON CONFLICT (phone) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id,
        email = COALESCE(EXCLUDED.email, clientes.email),
        name = COALESCE(EXCLUDED.name, clientes.name),
        cpf = COALESCE(EXCLUDED.cpf, clientes.cpf),
        updated_at = NOW();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_auth_user() IS
'Trigger que cria/atualiza cliente a partir do signup no Auth.
Captura phone do metadata, normaliza, exige número válido (>=10 dígitos),
e faz UPSERT por phone. Plano inicial: free; subscription_active=false.';
