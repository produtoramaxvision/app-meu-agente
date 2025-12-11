# Plano de Ação — Auditoria RLS Supabase

## Objetivo
Consolidar problemas e otimizações de RLS/segurança e definir passos para correção em todas as tabelas/schemas do Supabase.

## Achados críticos
- Policies PUBLIC sensíveis:
  - `public.clientes`: policy “Allow phone lookup for login” expõe leitura geral.
  - `public.support_tickets`: policies PUBLIC de create/read/update baseadas só em `request.jwt.claims.phone`.
  - `storage.objects`: leitura pública de avatars.
- force_rls desativado em todas as tabelas sensíveis (clientes, billing_events, chat*, events*, tasks, financeiro, support_tickets, storage.objects etc.).
- RLS on sem policies (deny-all implícito) em `auth.*` e em objetos de `storage` (buckets, prefixes, s3_*); também deny-all explícito em `billing_events`, `bd_ativo`.
- Schemas sem RLS: `realtime.*`, `vault.secrets`, `supabase_migrations.schema_migrations`.
- Inconsistência de funções de contexto (uso misto de `get_user_phone_optimized` vs `get_authenticated_user_phone`); necessidade de revisar search_path das funções security definer.
- Dependência de claim `phone` do JWT: confirmar que é emitido server-side e não editável pelo cliente; caso contrário, migrar para auth.uid() + lookup em `clientes`.

## Ações prioritárias
1) Remover/restringir policies PUBLIC sensíveis:
   - `public.clientes`: remover policy pública; mover lookup para RPC com filtro estrito ou policy com phone = claim validado.
   - `public.support_tickets`: remover policies PUBLIC; manter apenas authenticated + `auth.uid()` + `user_phone = get_authenticated_user_phone()` + guard de status.
   - `storage.objects`: confirmar requisito; se avatars não forem públicos, remover policy pública e usar signed URLs/bucket privado.
2) Habilitar `FORCE RLS` em tabelas de dados de usuário e storage.objects.
3) Criar/ajustar policies de serviço onde necessário:
   - `billing_events` (leitura por backend) em vez de deny-all.
   - `subscriptions` (se houver writes via backend).
   - `bd_ativo` (ou remover tabela se legacy).
   - Objetos de `storage` sem policies (buckets, prefixes, s3_*) — ao menos deny-all explícito ou policies por bucket.
4) Padronizar função de contexto:
   - Escolher entre `get_authenticated_user_phone` e `get_user_phone_optimized` (preferir a mais segura).
   - Garantir search_path fixo em funções de segurança.
5) Suporte/enumeração:
   - Limpar duplicidades em `support_tickets`; manter um conjunto único de policies com autenticação e status guard.
6) Chat/calendário/tarefas/metas/notificações:
   - Manter owner-por-phone, mas aplicar force_rls e padronizar função de contexto.
   - Nos chats com `session_id LIKE phone||'%'`, avaliar troca para coluna phone explícita para evitar adivinhação de prefixo.
7) Armazenamento:
   - Revisar verificação de pasta (`storage.foldername(name)[1]`) para garantir normalização/caso.
8) Schemas especiais:
   - `vault.secrets`: considerar habilitar RLS/force_rls ou restringir acesso a role de serviço.
   - `realtime.*`: ok sem RLS se não houver dados sensíveis; confirmar.
   - `supabase_migrations`: manter sem RLS.

## Checklist sugerido (ordem de execução)
1) Políticas PUBLIC: remover/ajustar (clientes, support_tickets, storage.objects).
2) force_rls: aplicar em todas as tabelas sensíveis e storage.objects.
3) Função de contexto: padronizar e revisar search_path de funções security definer.
4) Policies de serviço: billing_events, subscriptions (se preciso), bd_ativo (ou drop), objetos de storage sem policies.
5) Revisar avatars: público vs signed URL; ajustar policies conforme decisão.
6) Limpar duplicidades em support_tickets e garantir guards de status.
7) Ajustar chat session_id (se necessário) e validar owner checks em recursos/calendário/eventos.
8) Revisar vault/realtime quanto a dados sensíveis.

## Testes recomendados
- Usuário autenticado A não consegue acessar dados de B (select/update/delete/insert) em todas as tabelas sensíveis.
- Token com phone adulterado ou sem phone é bloqueado em todas as tabelas sensíveis.
- Anônimo não lê/cria tickets, nem lê clientes, nem lê storage.objects (exceto se avatars públicos forem mantidos).
- Role de serviço (se criada) acessa apenas tabelas/policies previstas (ex.: billing_events).
- Upload de avatar só na pasta do próprio phone; uploads em pastas alheias são negados.

