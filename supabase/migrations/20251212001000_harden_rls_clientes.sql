-- Harden RLS na tabela public.clientes
-- Garante que políticas não sejam contornadas pelo owner

ALTER TABLE public.clientes FORCE ROW LEVEL SECURITY;
