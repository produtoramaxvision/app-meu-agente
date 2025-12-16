# 📚 Documentação - Meu Agente

**Versão:** 2.0.0  
**Última Atualização:** 15 de Dezembro de 2025

---

## 🎯 Visão Geral

Esta pasta contém toda a documentação técnica, guias de usuário, especificações de features e procedimentos operacionais do projeto **Meu Agente**.

---

## 📂 Estrutura Organizada

### 🏗️ [architecture/](./architecture/) - Arquitetura e APIs
Documentação técnica sobre a arquitetura do sistema e integrações.

| Documento | Descrição |
|-----------|-----------|
| [DOCUMENTACAO_ARQUITETURA.md](./architecture/DOCUMENTACAO_ARQUITETURA.md) | Visão completa da arquitetura (React + Supabase + Integrações) |
| [DOCUMENTACAO_API_INTEGRACOES.md](./architecture/DOCUMENTACAO_API_INTEGRACOES.md) | APIs e integrações (Stripe, N8N, Evolution API) |

---

### 📖 [guides/](./guides/) - Guias Completos
Guias detalhados para usuários e desenvolvedores.

| Documento | Descrição | Páginas |
|-----------|-----------|---------|
| [GUIA_COMPLETO_AGENTE_SDR.md](./guides/GUIA_COMPLETO_AGENTE_SDR.md) | Setup completo do Agente SDR (6 abas, múltiplas instâncias, playground) | ~8000 linhas |
| [GUIA_COMPLETO_CRM_PIPELINE.md](./guides/GUIA_COMPLETO_CRM_PIPELINE.md) | CRM Kanban 7 estágios, integração WhatsApp, métricas | ~6000 linhas |
| [GUIA_USUARIO_COMPLETO.md](./guides/GUIA_USUARIO_COMPLETO.md) | Manual do usuário final (todas funcionalidades) | Completo |

---

### ⚙️ [operations/](./operations/) - Operações e Desenvolvimento
Procedimentos operacionais, deploy, troubleshooting e contribuição.

| Documento | Descrição |
|-----------|-----------|
| [DEPLOYMENT.md](./operations/DEPLOYMENT.md) | Guia completo de deploy (Vite, Supabase, Vercel, Edge Functions, checklist) |
| [TROUBLESHOOTING.md](./operations/TROUBLESHOOTING.md) | Resolução de problemas comuns (Auth, SDR, CRM, Chat, Performance, Pagamento) |
| [CONTRIBUTING.md](./operations/CONTRIBUTING.md) | Guia para contribuidores (padrões, Git workflow, PR process, testes) |
| [CHANGELOG.md](./operations/CHANGELOG.md) | Histórico de versões e roadmap (v0.5.0 → v2.0.0 → v3.0.0) |
| [DOCUMENTACAO_MANUTENCAO.md](./operations/DOCUMENTACAO_MANUTENCAO.md) | Procedimentos de manutenção e atualizações |

---

### 🔒 [security/](./security/) - Segurança e Compliance
Auditorias de segurança, testes RLS e conformidade legal.

| Documento | Descrição |
|-----------|-----------|
| [RELATORIO_AUDITORIA_RLS_COMPLETO_2025_12_10.md](./security/RELATORIO_AUDITORIA_RLS_COMPLETO_2025_12_10.md) | Auditoria completa RLS (98% compliance, 29 tabelas, policies) |
| [TESTES_PGTAP_RLS_COMPLETO.md](./security/TESTES_PGTAP_RLS_COMPLETO.md) | Testes automatizados pgTAP para validação RLS |
| [PERIODO_ARREPENDIMENTO_CDC.md](./security/PERIODO_ARREPENDIMENTO_CDC.md) | Implementação período arrependimento 7 dias (CDC Lei 12.965/2014) |

---

### ✨ [features/](./features/) - Funcionalidades e Recursos
Documentação detalhada de features específicas.

| Documento | Descrição | Linhas |
|-----------|-----------|--------|
| [IMPORTACAO_CONTATOS_WHATSAPP.md](./features/IMPORTACAO_CONTATOS_WHATSAPP.md) | Sincronização manual WhatsApp, cache persistente, filtros | ~4000 |
| [LIMITES_PLANOS_RECURSOS.md](./features/LIMITES_PLANOS_RECURSOS.md) | Matriz completa de limites (Free/Basic/Business/Premium) | ~3000 |
| [MELHORIAS_CHAT_SESSOES_20251213.md](./features/MELHORIAS_CHAT_SESSOES_20251213.md) | Melhorias sistema Chat IA (nova conversa padrão, histórico) | Completo |
| [IMPLANTACAO_TRIAL_7_DIAS.md](./features/IMPLANTACAO_TRIAL_7_DIAS.md) | Sistema de trial 7 dias + período arrependimento | Detalhado |
| [RESUMO_IMPLEMENTACAO_TRIAL.md](./features/RESUMO_IMPLEMENTACAO_TRIAL.md) | Resumo executivo implementação trial | Resumido |

---

### 📅 [planning/](./planning/) - Planejamento Futuro
Planos de implementação futura (roadmap).

| Documento | Descrição | Status | Prazo |
|-----------|-----------|--------|-------|
| [PLANO_IMPLANTACAO_CUPOM_INFLUENCER.md](./planning/PLANO_IMPLANTACAO_CUPOM_INFLUENCER.md) | Sistema de cupons para influencers | 🔜 Pendente | Q1 2026 |

---

### 🗄️ [obsolete/](./obsolete/) - Arquivos Obsoletos
Documentação histórica (planos executados, correções aplicadas, versões antigas).

**14 documentos arquivados** - [Ver inventário completo](./obsolete/README.md)

---

## 📄 Documentos na Raiz

| Documento | Descrição |
|-----------|-----------|
| [meu_agente_prd.md](./meu_agente_prd.md) | **PRD Principal** - Especificação completa do produto (planos, features, agentes) |
| [DOCUMENTACAO_TECNICA_COMPLETA.md](./DOCUMENTACAO_TECNICA_COMPLETA.md) | Documentação técnica consolidada (stack, estrutura, padrões) |

---

## 🚀 Início Rápido

### Para Novos Usuários
1. Leia o [GUIA_USUARIO_COMPLETO.md](./guides/GUIA_USUARIO_COMPLETO.md)
2. Se vai usar SDR: [GUIA_COMPLETO_AGENTE_SDR.md](./guides/GUIA_COMPLETO_AGENTE_SDR.md)
3. Se vai usar CRM: [GUIA_COMPLETO_CRM_PIPELINE.md](./guides/GUIA_COMPLETO_CRM_PIPELINE.md)

### Para Desenvolvedores
1. Leia [CONTRIBUTING.md](./operations/CONTRIBUTING.md) - Padrões e workflow
2. Configure ambiente: [DEPLOYMENT.md](./operations/DEPLOYMENT.md)
3. Entenda arquitetura: [DOCUMENTACAO_ARQUITETURA.md](./architecture/DOCUMENTACAO_ARQUITETURA.md)
4. Se algo quebrar: [TROUBLESHOOTING.md](./operations/TROUBLESHOOTING.md)

### Para Product Managers
1. [meu_agente_prd.md](./meu_agente_prd.md) - Visão produto e planos
2. [LIMITES_PLANOS_RECURSOS.md](./features/LIMITES_PLANOS_RECURSOS.md) - Matriz de recursos
3. [CHANGELOG.md](./operations/CHANGELOG.md) - Histórico e roadmap
4. [planning/](./planning/) - Planos futuros

---

## 🔍 Índice por Categoria

### Autenticação e Segurança
- [RELATORIO_AUDITORIA_RLS_COMPLETO](./security/RELATORIO_AUDITORIA_RLS_COMPLETO_2025_12_10.md) - 98% compliance, 29 tabelas
- [TESTES_PGTAP_RLS_COMPLETO](./security/TESTES_PGTAP_RLS_COMPLETO.md) - Testes automatizados
- [PERIODO_ARREPENDIMENTO_CDC](./security/PERIODO_ARREPENDIMENTO_CDC.md) - Compliance legal

### Agente SDR e WhatsApp
- [GUIA_COMPLETO_AGENTE_SDR](./guides/GUIA_COMPLETO_AGENTE_SDR.md) - Setup completo 6 abas
- [IMPORTACAO_CONTATOS_WHATSAPP](./features/IMPORTACAO_CONTATOS_WHATSAPP.md) - Sincronização manual
- [DOCUMENTACAO_API_INTEGRACOES](./architecture/DOCUMENTACAO_API_INTEGRACOES.md) - Evolution API

### CRM e Vendas
- [GUIA_COMPLETO_CRM_PIPELINE](./guides/GUIA_COMPLETO_CRM_PIPELINE.md) - Kanban 7 estágios
- [MELHORIAS_CHAT_SESSOES](./features/MELHORIAS_CHAT_SESSOES_20251213.md) - Chat IA integrado

### Pagamentos e Planos
- [PERIODO_ARREPENDIMENTO_CDC](./security/PERIODO_ARREPENDIMENTO_CDC.md) - 7 dias CDC
- [IMPLANTACAO_TRIAL_7_DIAS](./features/IMPLANTACAO_TRIAL_7_DIAS.md) - Trial + refund
- [LIMITES_PLANOS_RECURSOS](./features/LIMITES_PLANOS_RECURSOS.md) - Matriz Free → Premium
- [DOCUMENTACAO_API_INTEGRACOES](./architecture/DOCUMENTACAO_API_INTEGRACOES.md) - Stripe webhook

### Deploy e Operações
- [DEPLOYMENT](./operations/DEPLOYMENT.md) - Guia deploy completo (Vercel + Supabase)
- [TROUBLESHOOTING](./operations/TROUBLESHOOTING.md) - Resolução de problemas
- [DOCUMENTACAO_MANUTENCAO](./operations/DOCUMENTACAO_MANUTENCAO.md) - Manutenção

---

## 📊 Estatísticas da Documentação

| Métrica | Valor |
|---------|-------|
| **Total de Documentos** | 21 ativos + 14 obsoletos = 35 |
| **Linhas de Documentação** | ~50.000+ linhas |
| **Guias Completos** | 3 (SDR, CRM, Usuário) |
| **Última Auditoria** | 15/12/2025 |
| **Coverage** | 98% features documentadas |
| **Idioma** | Português (pt_BR) |

---

## 🔄 Manutenção da Documentação

### Política de Atualização
- **Crítico (Segurança/Breaking Changes)**: Imediato
- **Features Novas**: Em até 7 dias após deploy
- **Bugfixes**: Em até 14 dias
- **Melhorias Menores**: Próxima release

### Revisão Periódica
- **Quinzenal**: Documentos em `operations/` e `features/`
- **Mensal**: Guias em `guides/`
- **Trimestral**: Arquitetura e segurança
- **Semestral**: Limpeza de `obsolete/`

### Responsabilidades
| Tipo | Responsável |
|------|-------------|
| PRD e Features | Product Manager |
| Guias de Usuário | Customer Success |
| Docs Técnicos | Tech Lead |
| Segurança | Security Team |
| Deploy/Ops | DevOps |

---

## 📝 Como Contribuir com Documentação

1. Siga template em [CONTRIBUTING.md](./operations/CONTRIBUTING.md)
2. Use Markdown com:
   - Títulos claros
   - Exemplos de código
   - Diagramas Mermaid quando necessário
   - Tabelas para comparações
   - Emojis para categorização
3. Inclua:
   - Data da última atualização
   - Versão do documento
   - Links para docs relacionados
4. Faça PR com label `documentation`

---

## 🆘 Precisa de Ajuda?

### Por Tipo de Dúvida

| Dúvida | Documento | Suporte |
|--------|-----------|---------|
| Como usar o SDR? | [GUIA_COMPLETO_AGENTE_SDR.md](./guides/GUIA_COMPLETO_AGENTE_SDR.md) | - |
| Erro ao conectar WhatsApp? | [TROUBLESHOOTING.md](./operations/TROUBLESHOOTING.md#agente-sdr) | suporte@meuagente.api.br |
| Como fazer deploy? | [DEPLOYMENT.md](./operations/DEPLOYMENT.md) | - |
| Quero contribuir código | [CONTRIBUTING.md](./operations/CONTRIBUTING.md) | - |
| Dúvida sobre planos | [LIMITES_PLANOS_RECURSOS.md](./features/LIMITES_PLANOS_RECURSOS.md) | comercial@meuagente.api.br |

---

**Mantido por:** Equipe Meu Agente  
**Última revisão:** 15 de Dezembro de 2025  
**Próxima revisão:** 15 de Janeiro de 2026
