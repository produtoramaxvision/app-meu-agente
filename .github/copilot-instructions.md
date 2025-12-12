# Instruções para agentes (pt_BR)

## Big picture
- App React + Vite + TS; rotas em [../src/App.tsx](../src/App.tsx) (React Router) e páginas protegidas são `lazy()`.
- Camada de dados é TanStack React Query (QueryClient global e defaults em [../src/main.tsx](../src/main.tsx)); hooks em [../src/hooks](../src/hooks).
- Backend é Supabase (DB/Auth/Realtime/Edge Functions). Cliente em [../src/integrations/supabase/client.ts](../src/integrations/supabase/client.ts).

## Comandos (workflow)
- `npm install`
- `npm run dev` (porta 8080 strict; ver [../vite.config.ts](../vite.config.ts))
- `npm run build`, `npm run preview`, `npm run lint`, `npm run lint:css`

## Convenções específicas deste repo
- Auth: além do Supabase Auth, existe entidade de negócio `clientes` vinculada por `auth_user_id` (ver [../src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx)).
- Login: telefone vira email sintético `telefone@meuagente.api.br` (helpers no AuthContext).
- React Query: respeite defaults (sem refetch em foco/mount; retry custom). Em updates otimistas, use `cancelQueries` + `invalidateQueries` (ex.: [../src/hooks/useChatAgent.ts](../src/hooks/useChatAgent.ts)).
- CSRF: o client envia `X-CSRF-Token` em todas as requests (ver [../src/integrations/supabase/client.ts](../src/integrations/supabase/client.ts)); token/armazenamento em [../src/lib/csrf.ts](../src/lib/csrf.ts). Edge Functions geralmente aceitam `x-csrf-token` no CORS.
- UI: Tailwind usa tokens via CSS variables (evitar cores hard-coded). Ver [../tailwind.config.ts](../tailwind.config.ts).

## Integrações e onde mexer
- n8n (Chat IA): `VITE_N8N_WEBHOOK_URL` e fluxo DB (tabelas `chat_ia_sessions`/`chat_ia_messages`) + webhook (ver [../src/hooks/useChatAgent.ts](../src/hooks/useChatAgent.ts)).
- Stripe (assinaturas): UI chama `supabase.functions.invoke('create-checkout-session')` (ver [../src/hooks/useStripeCheckout.ts](../src/hooks/useStripeCheckout.ts)).
  - Edge: [../supabase/functions/create-checkout-session/index.ts](../supabase/functions/create-checkout-session/index.ts) cria Checkout e NÃO usa trial do Stripe; aplica conceito de “período de arrependimento” no DB.
  - Webhook: [../supabase/functions/stripe-webhook/index.ts](../supabase/functions/stripe-webhook/index.ts) atualiza `clientes`.
- Evolution API (SDR/WhatsApp): Edge Functions em [../supabase/functions](../supabase/functions) e UI em [../src/components/sdr](../src/components/sdr).
  - `configure-evolution-webhook` aponta para n8n (ver [../supabase/functions/configure-evolution-webhook/index.ts](../supabase/functions/configure-evolution-webhook/index.ts)).

## Ambiente
- Vite lê `VITE_*` de `.env`, `.env.local`, etc. Use [../.env.example](../.env.example) como base.
- Dev server é sempre `http://localhost:8080` (strictPort); evite assumir outras portas ao configurar callbacks/URLs de integração.
- Edge Functions usam `Deno.env` (ex.: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

## Debug rápido
- Se ProtectedRoute redirecionar cedo, cheque `loading` no AuthContext (ver init em [../src/contexts/AuthContext.tsx](../src/contexts/AuthContext.tsx)).
- Dev permite iframe no server; prod aplica `X-Frame-Options: DENY` (ver [../vite.config.ts](../vite.config.ts)).
- PWA: Workbox cacheia `*.supabase.co` com `NetworkFirst` (ver [../vite.config.ts](../vite.config.ts)).
