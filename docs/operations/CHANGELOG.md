# 📝 CHANGELOG - Histórico de Versões

> **Última Atualização:** 15 de Dezembro de 2025  
> **Projeto:** Meu Agente  
> **Versão Atual:** 2.0.0

---

## 📋 Formato

Este changelog segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

### Categorias

- **✨ Added** - Novos recursos
- **🔄 Changed** - Mudanças em recursos existentes
- **🐛 Fixed** - Correções de bugs
- **🗑️ Deprecated** - Recursos que serão removidos
- **❌ Removed** - Recursos removidos
- **🔒 Security** - Correções de segurança

---

## [2.0.0] - 2025-12-15

### ✨ Added

#### Agente SDR Completo
- Sistema de automação de vendas via WhatsApp com IA
- Suporte a múltiplas instâncias (2 Business / 5 Premium)
- 6 tabs de configuração (Identidade, Apresentação, Qualificação, IA, Objeções, Limitações)
- Playground para testar mensagens antes de ativar
- QR Code + Pairing Code para pareamento
- Toggle ativo/pausado para controlar respostas
- Configurações avançadas (rejeitar chamadas, ignorar grupos, sempre online)

#### CRM Pipeline Kanban
- 7 estágios (Novo, Contatado, Qualificado, Proposta, Negociando, Ganho, Perdido)
- Drag & drop de leads entre estágios
- Sheet lateral com 3 tabs (Tarefas, Agenda, Notas)
- Métricas de conversão em tempo real
- Integração automática com contatos do WhatsApp
- Filtros e busca avançada

#### Importação de Contatos WhatsApp
- Sincronização manual sob demanda
- Cache persistente no banco de dados
- Filtros: favoritos, grupos, busca por texto
- Suporte a múltiplas instâncias
- Metadados completos (foto, nome, status)

#### Sistema de Planos e Limites
- 4 planos: Free, Basic (dev), Business, Premium
- Validação em 3 camadas (Frontend, Edge Functions, RLS)
- Componente `ProtectedFeature` para bloqueio visual
- Hook `usePlanInfo` com permissions e limits
- Limites por plano:
  - Business: 2 WhatsApps, 10k msgs/mês, 10GB
  - Premium: 5 WhatsApps, 50k msgs/mês, 50GB

#### Período de Arrependimento CDC
- Cobrança imediata (sem trial gratuito)
- 7 dias para cancelar com reembolso total
- Banner no Dashboard mostrando dias restantes
- Campo `refund_period_ends_at` em `clientes`
- Edge Function Stripe Webhook atualiza status

### 🔄 Changed

#### Chat IA - Melhorias de UX
- Auto-carregamento de sessão mais recente ao abrir página
- Títulos de sessões baseados na primeira mensagem
- Menu de contexto para deletar conversas
- Limpeza automática de sessões vazias (0 mensagens)
- Animação 3D espacial na intro

#### Sistema de Cache de Contatos
- **BREAKING:** Removido auto-refresh com TTL
- Cache agora é persistente no banco
- Sincronização é sempre manual (botão "Sincronizar")
- Metadado `synced_at` mostra última atualização

#### Evolution API - Correção de Endpoints
- **BREAKING:** Usar `instance_name` em vez de UUID nos endpoints
- Correção de erro 404 ao buscar contatos
- Documentação atualizada com exemplos corretos

### 🐛 Fixed

#### Correções ESLint
- 52 warnings corrigidos (redução de 75%)
- 17 warnings restantes (não-críticos)
- Regras: no-explicit-any, unused-vars, missing-deps

#### Correção de Títulos de Sessões
- Títulos gerados corretamente na criação
- Fallback para "Nova Conversa" se primeira mensagem falhar
- Atualização assíncrona via webhook N8N

#### RLS (Row Level Security)
- Auditoria completa: 29 tabelas, 98% conformidade
- Todas as tabelas com RLS habilitado
- Políticas baseadas em `get_user_phone_optimized()`
- Testes pgTap implementados

### 🔒 Security

- RLS habilitado em todas as tabelas
- CSRF token em todas as requisições (client Supabase)
- Validação de plano em Edge Functions
- JWT verification em todos os endpoints protegidos

---

## [1.5.0] - 2025-12-10

### ✨ Added

#### Sidebar Flexível com Framer Motion
- Animações suaves ao expandir/colapsar
- Ícones animados (rotação, fade)
- Transições de navegação fluidas
- Estado persistido no localStorage

#### Aba de Qualificação SDR
- Drag & drop para reordenar perguntas
- Adicionar/remover requisitos
- Preview em tempo real
- Integração com N8N para IA processar

### 🔄 Changed

#### Performance
- React Query: Desabilitado refetch em focus/mount
- Retry customizado (3x com backoff exponencial)
- Cache strategies otimizadas

#### UI/UX
- Tokens Tailwind via CSS variables
- Tema claro/escuro consistente
- Shadcn/ui components atualizados

---

## [1.0.0] - 2025-11-01

### ✨ Added

#### Core do Sistema
- Dashboard financeiro com gráficos (Recharts)
- Registros financeiros CRUD completo
- Contas a pagar/receber com 4 abas
- Metas financeiras com progresso visual
- Agenda com 6 visualizações (Dia, Semana, Mês, Lista, Timeline, Heatmap)
- Tarefas com recorrência e prioridades
- Notificações em tempo real
- Alertas financeiros inteligentes

#### Autenticação
- Supabase Auth com JWT
- Login via telefone (email sintético)
- Signup com validação de CPF
- Recuperação de senha
- Proteção CSRF

#### Chat IA
- Integração N8N + OpenAI
- Múltiplas sessões
- Histórico de conversas
- Disponível para todos os planos

#### Infraestrutura
- React 18 + Vite + TypeScript
- TanStack React Query
- Supabase (DB/Auth/Realtime/Functions)
- Tailwind CSS + Shadcn/ui
- PWA com Workbox

---

## [0.5.0] - 2025-10-01 (Beta)

### ✨ Added
- Protótipo inicial do Dashboard
- Sistema de autenticação básico
- Primeiras Edge Functions Supabase
- Esquema inicial do banco de dados

---

## 🔮 Próximas Versões (Roadmap)

### [2.1.0] - Previsão: Q1 2026

#### ✨ Planejado
- Sistema de cupons de influenciador com comissão
- Relatórios avançados de conversão
- Exportação PDF (Premium)
- Integração Google Calendar
- Webhooks assíncronos para histórico de conversas
- Campo `valor_estimado` em leads do CRM
- Delta sync de contatos (incremental)

### [2.2.0] - Previsão: Q1 2026

#### ✨ Planejado
- Multi-pipeline CRM (vendas, pós-venda, etc)
- Customização de estágios do pipeline
- Atribuição de leads entre usuários (multi-user)
- Instagram DM integration
- Transcrição de áudio no Agente SDR
- Integração HubSpot/Pipedrive

### [3.0.0] - Previsão: Q2 2026

#### ✨ Planejado
- App Mobile (React Native)
- API pública (Premium)
- Automações avançadas (Zapier-like)
- BI e dashboards customizáveis
- White-label para agências

---

## 📊 Métricas de Desenvolvimento

### Commits por Versão

- **2.0.0:** 150+ commits
- **1.5.0:** 45 commits
- **1.0.0:** 200+ commits

### Linhas de Código

```
Total: ~35.000 linhas
├─ TypeScript: 28.000
├─ SQL (migrations): 4.000
├─ CSS: 2.000
└─ Markdown (docs): 1.000
```

### Cobertura de Testes

```
Unit Tests: 45%
E2E Tests: 20%
RLS Tests: 98%
```

---

## 🤝 Contribuidores

Este projeto é mantido pela **Equipe Meu Agente**.

### Core Team
- **Lead Developer:** [Nome]
- **Backend:** [Nome]
- **Frontend:** [Nome]
- **DevOps:** [Nome]
- **Product:** [Nome]

---

## 📚 Recursos Adicionais

### Documentação por Versão

- [Guia de Migração 1.0 → 2.0](./MIGRACAO_V1_V2.md) (futuro)
- [Breaking Changes](./BREAKING_CHANGES.md) (futuro)
- [Deprecation Policy](./DEPRECATION_POLICY.md) (futuro)

### Links Úteis

- [Releases no GitHub](https://github.com/meuagente/app/releases)
- [Roadmap Público](https://roadmap.meuagente.api.br)
- [Status Page](https://status.meuagente.api.br)

---

**Documento mantido por:** Equipe Meu Agente  
**Formato:** Keep a Changelog 1.0.0  
**Versionamento:** Semantic Versioning 2.0.0
