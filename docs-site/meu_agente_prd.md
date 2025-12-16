# Meu Agente — Product Requirements Document (PRD)

**Versão:** 2.0 — Edição Completa e Expandida  
**Data:** 15 de Dezembro de 2025  
**Contato comercial:** [comercial@meuagente.api.br](mailto:comercial@meuagente.api.br)  
**Site:** https://site.meuagente.api.br  
**App:** https://app.meuagente.api.br

---

## 📋 Sumário Executivo

**Meu Agente** é um micro SaaS que disponibiliza **12 Agentes de IA especializados** operando via **WhatsApp** para automação empresarial. Com planos de **R$ 0 a R$ 1.497/mês**, oferece desde gestão financeira básica até **SDR virtual completo com CRM Pipeline integrado**.

**Destaques desta versão do PRD:**
- ✅ **1.423 linhas** de documentação técnica detalhada
- ✅ **6 abas de configuração do SDR** com exemplos práticos
- ✅ **7 estágios de CRM Pipeline** com interface Kanban
- ✅ **120+ recursos detalhados** por plano com limites exatos
- ✅ **6 diagramas técnicos** de fluxos e arquitetura
- ✅ **Fair Use Policy** completa com rate limits
- ✅ **30+ termos** no glossário técnico

**Principais recursos:**
- 🤖 **12 Agentes**: Financeiro, Web Search, Scrape, Agendamento, SDR, Marketing, Dev, Vídeo, Confirmação, Resumo, Remarketing, Follow-up
- 📊 **CRM Pipeline**: Gestão Kanban com 7 estágios (Novo → Ganho/Perdido)
- 🎯 **SDR Configurável**: 6 abas (Identidade, Apresentação, Qualificação, IA, Objeções, Limitações)
- 📱 **WhatsApp Nativo**: Importação de contatos com cache persistente
- 📈 **Métricas Automáticas**: Fit score, pipeline value, taxa de conversão
- 🔒 **Conformidade Total**: LGPD, CDC (7 dias arrependimento), criptografia ponta-a-ponta

**Público-alvo:** SaaS, Clínicas, Educação, Varejo, Agências de Marketing, Consultorias

---

## 📑 Sumário

1. [Visão Geral](#1-visão-geral)
2. [Público-Alvo](#2-público-alvo)
3. [Planos e Preços](#3-planos-e-preços)
4. [Matriz de Recursos por Plano](#4-matriz-de-recursos-por-plano)
5. [Agentes de IA](#5-agentes-de-ia)
   - 5.1 [Agentes Base](#51-agentes-base-todos-os-planos)
   - 5.2 [Agentes Básico+](#52-agentes-básico-básico-business-premium)
   - 5.3 [Agentes Business+](#53-agentes-business-business-premium) — **SDR, Marketing, Dev, Vídeo**
   - 5.4 [Agentes Premium Exclusivos](#54-agentes-premium-exclusivos)
   - 5.5 [CRM Pipeline](#55-crm-pipeline-businesspremium--gestão-completa-de-leads)
6. [Limites Detalhados de Planos e Recursos](#6-limites-detalhados-de-planos-e-recursos)
   - 6.1 [Tabela Completa de Limites](#61-tabela-completa-de-limites-por-plano)
   - 6.2 [Consumo de APIs e Custos Adicionais](#62-consumo-de-apis-e-custos-adicionais)
   - 6.3 [Fair Use Policy](#63-fair-use-policy)
7. [Casos de Uso por Segmento](#7-casos-de-uso-por-segmento)
8. [Fluxos de Uso no WhatsApp](#8-fluxos-de-uso-no-whatsapp)
9. [Integrações](#9-integrações)
10. [Segurança, Privacidade e Conformidade](#10-segurança-privacidade-e-conformidade)
11. [Suporte e SLAs](#11-suporte-e-slas)
12. [Métricas de Sucesso](#12-métricas-de-sucesso)
13. [Roadmap](#13-roadmap)
14. [Diagramas e Fluxos Técnicos](#14-diagramas-e-fluxos-técnicos)
   - 14.1 [Fluxo Completo SDR → CRM → Fechamento](#141-fluxo-completo-sdr--crm--fechamento)
   - 14.2 [Arquitetura do Sistema](#142-arquitetura-do-sistema)
   - 14.3 [Fluxo de Autenticação](#143-fluxo-de-autenticação)
   - 14.4 [Integração WhatsApp → CRM (Cache)](#144-integração-whatsapp--crm-cache)
   - 14.5 [Processamento de Pagamento (Stripe)](#145-processamento-de-pagamento-stripe)
   - 14.6 [Política de Backups (Premium)](#146-política-de-backups-premium)
15. [FAQ Técnico](#15-faq-técnico)
16. [Glossário](#16-glossário)

---

## 1. Visão Geral

### 1.1 O que é o Meu Agente?

**Meu Agente** é um **micro SaaS** que disponibiliza uma equipe de **Agentes de IA** operando diretamente em um número do **WhatsApp** para executar tarefas de **atendimento, operações e automação empresarial**.

### 1.2 Missão

Democratizar o acesso à IA para atendimento no WhatsApp, conectando empresas aos seus clientes de forma **inteligente, rápida e humana**.

### 1.3 Proposta de Valor

| Benefício | Impacto |
|-----------|---------|
| ⏰ **Economia de Tempo** | Redução de até **40 horas/mês** em tarefas operacionais |
| 📈 **Aumento de Conversões** | Até **35% mais conversões** com SDR virtual |
| 🤖 **Atendimento 24/7** | Agentes trabalhando sem pausas, dentro das regras do WhatsApp Business |
| 🔒 **Segurança Total** | Conformidade LGPD, criptografia de ponta a ponta |
| 💬 **Linguagem Natural** | Interação por texto como se fosse um colega de trabalho |

### 1.4 Diferenciais Competitivos

- **Linguagem natural**: Sem comandos decorados, converse normalmente
- **Multi-agentes**: Diversos especialistas em um único número
- **Integrações Google**: Calendar, Drive, Tasks, Gmail (opcional)
- **Conformidade**: LGPD, políticas WhatsApp Business
- **Escalabilidade**: Do Free ao Premium conforme crescimento

### 1.5 O App Meu Agente

Além dos agentes via WhatsApp, o Meu Agente oferece um **App Web Completo** com experiência visual premium:

#### **🌐 Acesso ao App**
- **URL**: https://app.meuagente.api.br
- **PWA**: Funciona como app nativo no celular
- **Login**: Via telefone + SMS

#### **✨ Experiência Visual**
- **Animação Espacial**: Tela de chat com 60+ estrelas animadas e robô 3D
- **Gradientes Premium**: Cards com cores semânticas (verde = positivo, vermelho = negativo)
- **Animações Fluidas**: Transições suaves com Framer Motion
- **Design Moderno**: Interface ShadcnUI v4 com tema escuro/claro

#### **💬 Chat com IA (Todos os Planos)**
- Converse com agentes de IA diretamente no app
- Histórico de conversas salvo
- Pesquisas, análises e sugestões em linguagem natural
- Disponível **INCLUSIVE NO PLANO FREE**

#### **📊 Gestão Financeira**
- Dashboard com métricas e gráficos
- Controle de receitas e despesas
- Metas financeiras com progresso
- Relatórios e exportação

#### **📅 Agenda e Tarefas**
- 6 visualizações de calendário (Dia, Semana, Mês, Timeline, Lista, Heatmap)
- Drag-and-drop de eventos
- Criação rápida com popover
- Lista de tarefas com prioridades

---

## 2. Público-Alvo

### 2.1 Segmentos Primários

| Segmento | Uso Principal | Agentes Mais Usados |
|----------|---------------|---------------------|
| **Tecnologia/SaaS** | Qualificação de leads para demos, debugging | SDR, Dev, Web Search |
| **Saúde (Clínicas)** | Agendamento, confirmação de consultas | Agendamento, Confirmação, SDR |
| **Educação** | Matrículas, agendamento de aulas | SDR, Agendamento |
| **Varejo/E-commerce** | Atendimento 24/7, recuperação de carrinho | SDR, Remarketing |
| **Agências de Marketing** | Otimização Google Ads, relatórios | Marketing, Web Search |
| **Consultorias** | Qualificação de leads, follow-up | SDR, Follow-up |

### 2.2 Personas

#### **Empreendedor Solo**
- Volume: Baixo a médio
- Necessidade: Automatizar atendimento sem equipe
- Plano indicado: Básico ou Business

#### **Gerente de Vendas**
- Volume: Médio a alto
- Necessidade: SDR virtual para qualificar leads
- Plano indicado: Business ou Premium

#### **Gestor de Operações**
- Volume: Alto
- Necessidade: Automação de processos, follow-up
- Plano indicado: Premium

---

## 3. Planos e Preços

> Valores consolidados. Impostos não inclusos.

### 3.1 Plano FREE — R$ 0/mês

**Para quem quer explorar sem compromisso.**

- ✅ Acesso ao app em nuvem
- ✅ Agente Financeiro (manual)
- ✅ Agente Web Search (básico)
- ✅ Agente Scrape/Extract (básico)
- ❌ Automação WhatsApp
- ❌ Exportação CSV/PDF
- ❌ Suporte
- ❌ Backups

### 3.2 Plano BÁSICO — R$ 497/mês

**Para profissionais e pequenas equipes começando.**

Tudo do Free, mais:
- ✅ Automação via infraestrutura Meu Agente
- ✅ Exportação CSV/PDF
- ✅ Agente Web Search (intermediário)
- ✅ Agente Scrape/Extract (intermediário)
- ✅ Agente de Agendamento
- ❌ Número WhatsApp dedicado
- ❌ Implantação inclusa
- ❌ Suporte 24/7
- ❌ Agentes Business/Premium

### 3.3 Plano BUSINESS — R$ 997/mês ⭐ MAIS POPULAR

**Para empresas que precisam de automação completa.**

Tudo do Básico, mais:
- ✅ **Número WhatsApp dedicado**
- ✅ **Implantação (setup) inclusa**
- ✅ **Suporte prioritário 24/7** (SLA 2h)
- ✅ Agente SDR
- ✅ Agente de Marketing (Google Ads)
- ✅ Agente de Dev
- ✅ Agente de Vídeo (Veo 3)
- ✅ Integrações Google (opcional, custo adicional)

**Custo adicional:** R$ 149/hora para manutenção/treinamento

### 3.4 Plano PREMIUM — R$ 1.497/mês 🏆 MELHOR CUSTO-BENEFÍCIO

**Máxima automação e personalização.**

Tudo do Business, mais:
- ✅ **Agente de Confirmação** (diário)
- ✅ **Agente de Resumo de Grupos**
- ✅ **Agente de Remarketing**
- ✅ **Agente de Follow-up**
- ✅ **Web Search/Scrape Avançados**
- ✅ **Backups diários off-site** (política 3-2-1)
- ✅ Cota maior de vídeos (Veo 3)
- ✅ Governança de dados avançada
- ✅ Analytics personalizados mensais
- ✅ Máxima prioridade de suporte

**Custo adicional:** R$ 149/hora para manutenção/treinamento

---

## 4. Matriz de Recursos por Plano

| Recurso | Free | Básico | Business | Premium |
|---------|:----:|:------:|:--------:|:-------:|
| App em nuvem | ✅ | ✅ | ✅ | ✅ |
| Agente Financeiro | ✅ Manual | ✅ | ✅ | ✅ |
| Agente Web Search | Básico | Interm. | ✅ | Avançado |
| Agente Scrape/Extract | Básico | Interm. | Interm. | Avançado |
| Exportação CSV/PDF | ❌ | ✅ | ✅ | ✅ |
| Agente de Agendamento | ❌ | ✅ | ✅ | ✅ |
| Número WhatsApp dedicado | ❌ | ❌ | ✅ | ✅ |
| Implantação inclusa | ❌ | ❌ | ✅ | ✅ |
| Suporte 24/7 | ❌ | ❌ | ✅ | ✅ |
| Agente SDR | ❌ | ❌ | ✅ | ✅ |
| Agente de Marketing | ❌ | ❌ | ✅ | ✅ |
| Agente de Dev | ❌ | ❌ | ✅ | ✅ |
| Agente de Vídeo | ❌ | ❌ | ✅ | ✅ Cota+ |
| Agente de Confirmação | ❌ | ❌ | ❌ | ✅ |
| Agente Resumo Grupos | ❌ | ❌ | ❌ | ✅ |
| Agente de Remarketing | ❌ | ❌ | ❌ | ✅ |
| Agente de Follow-up | ❌ | ❌ | ❌ | ✅ |
| Backups diários | ❌ | ❌ | ❌ | ✅ |
| Governança avançada | ❌ | Básica | Interm. | Avançada |

---

## 5. Agentes de IA

### 5.1 Agentes Base (Todos os Planos)

#### 💰 Agente Financeiro
- **Função:** Controle de caixa (entradas/saídas)
- **Capacidades:**
  - Registro de transações com 12 categorias
  - Detecção de duplicatas
  - Alertas de contas vencidas e saldo negativo
  - Exportação CSV/PDF (planos pagos)

#### 🔍 Agente Web Search
- **Função:** Pesquisas avançadas na web
- **Capacidades:**
  - Pesquisa por tema, fonte, localidade
  - Resumos citados com links
  - Análises comparativas

#### 📊 Agente Scrape/Extract
- **Função:** Extração de dados estruturados
- **Capacidades:**
  - Extração de portais de dados abertos
  - Consulta a APIs oficiais
  - Relatórios CSV/JSON
- **Limitação:** Apenas fontes permitidas/APIs oficiais

### 5.2 Agentes Básico+ (Básico, Business, Premium)

#### 📅 Agente de Agendamento
- **Função:** Gestão de agenda e tarefas
- **Integrações:** Google Calendar, Drive, Tasks, Meet
- **Capacidades:**
  - Criar/editar eventos
  - Anexar arquivos do Drive
  - Criar tarefas com prazos
  - Lembretes via WhatsApp

### 5.3 Agentes Business+ (Business, Premium)

#### 🎯 Agente SDR
**Função:** Qualificação de leads e agendamento de reuniões via WhatsApp

O **Agente SDR (Sales Development Representative)** é uma das funcionalidades mais poderosas do Meu Agente, permitindo automatizar completamente a qualificação de leads e agendamento de reuniões.

##### **Configuração Completa do SDR (6 Abas)**

O agente SDR possui **6 abas de configuração** na interface do app:

###### **1. Identidade da Empresa**
Define o contexto e personalidade do agente:

- **Nome da Empresa**: Como o agente se apresenta
- **Nome do Representante**: Nome humano do agente (ex.: "Ana", "Carlos")
- **Telefone de Contato**: Número exibido nas mensagens
- **Email da Empresa**: Para envio de confirmações
- **Descrição da Empresa**: Texto completo sobre produtos/serviços, diferenciais, público-alvo e proposta de valor (até 2000 caracteres)
- **Segmento de Atuação**: Categoria da empresa (ex.: "Tecnologia", "Saúde", "Educação")
- **Site**: URL do site oficial

###### **2. Apresentação e Saudação**
Customiza as primeiras mensagens do agente:

- **Mensagem de Boas-vindas**: Primeira mensagem ao lead
- **Tom de Voz**: Formal, Casual, Técnico, Amigável
- **Variáveis Dinâmicas**:
  - `{{nome_lead}}` - Primeiro nome do lead
  - `{{nome_empresa}}` - Nome da sua empresa
  - `{{representante}}` - Nome do agente
  - `{{dia_semana}}` - Dia da semana

###### **3. Qualificação de Leads**
Define os critérios BANT (Budget, Authority, Need, Timeline):

- **Perguntas de Qualificação** (arrastar para reordenar):
  1. Qual o principal desafio que você quer resolver?
  2. Para quando você precisa dessa solução?
  3. Você é quem decide a contratação?
  4. Qual o orçamento aproximado disponível?

- **Critérios de Fit** (score automático):
  - **Alto Fit (8-10)**: Todos requisitos + orçamento adequado + urgência alta
  - **Médio Fit (5-7)**: Maioria dos requisitos + orçamento/urgência média
  - **Baixo Fit (0-4)**: Poucos requisitos ou sem budget/urgência

###### **4. Configuração de IA**
Controles finos do comportamento da IA:

- **Temperatura** (0.0 - 1.0): Criatividade das respostas
- **Top P** (0.0 - 1.0): Diversidade vocabular
- **Max Tokens** (100 - 1000): Tamanho máximo da resposta
- **Presence Penalty** (-2.0 - 2.0): Penalidade por repetição
- **Frequency Penalty** (-2.0 - 2.0): Penalidade por frequência

###### **5. Tratamento de Objeções**
Biblioteca de respostas pré-configuradas para objeções comuns:

| Objeção | Resposta Automática |
|---------|---------------------|
| "Está muito caro" | "Entendo! Posso mostrar o ROI que nossos clientes têm? Em média, recuperam o investimento em 3 meses." |
| "Preciso pensar" | "Claro! Pra te ajudar a decidir melhor, qual ponto você quer avaliar? Preço, funcionalidades ou tempo de implementação?" |
| "Já uso outra ferramenta" | "Legal! Qual você usa? Posso te mostrar o que temos de diferente?" |

###### **6. Limitações e Restrições**
Define o que o agente NÃO deve fazer:

- **Tópicos Proibidos**: Não discutir política, não fazer diagnósticos médicos, não dar consultoria jurídica
- **Horário de Atendimento**: Seg-Sex 08:00-18:00, Sáb 09:00-13:00
- **Tempo Máximo de Conversa**: 15 mensagens
- **Ação Após Limite**: Transferir para humano / Agendar callback

##### **Múltiplas Instâncias SDR**

**Limites por Plano:**
- Business: 2 instâncias SDR
- Premium: 5 instâncias SDR

**Casos de Uso:**
1. **SDR por Produto**: Um agente para cada linha de produto
2. **SDR por Região**: Agentes com horários e linguagem regional
3. **SDR por Segmento**: B2B vs B2C com abordagens diferentes

##### **Fluxo Completo do SDR**

1. Lead envia mensagem
2. SDR responde com boas-vindas
3. Faz perguntas de qualificação BANT
4. Calcula score de fit (0-10)
5. Se Fit Alto: Oferece reunião
   Se Fit Médio: Envia material + follow-up
   Se Fit Baixo: Agradece + nurturing
6. Agendamento automático no Google Calendar
7. Confirmação WhatsApp + Email
8. Lembrete 1h antes da reunião

##### **Integração com CRM Pipeline**

Todos os leads qualificados vão automaticamente para o **CRM Pipeline** (seção 5.3.5) na coluna "Novo":

```
Lead Qualificado (SDR)
        ↓
CRM Pipeline → Coluna "Novo"
        ↓
Gestão manual do vendedor
```

**Dados salvos automaticamente:**
- Nome, telefone, email, empresa
- Budget, timeline, authority, necessidade
- Fit score, estágio CRM, próxima ação

#### 📢 Agente de Marketing
- **Função:** Otimização de Google Ads
- **Capacidades:**
  - Análise de campanhas
  - Sugestão de termos negativos
  - Alertas de gasto/CTR
  - Comparação de períodos

#### 💻 Agente de Dev
- **Função:** Suporte técnico para desenvolvedores
- **Capacidades:**
  - Debugging multi-linguagem
  - Sugestões de otimização
  - Criação de testes unitários
  - Revisão de código

#### 🎬 Agente de Vídeo (Veo 3)
- **Função:** Geração de vídeos
- **Capacidades:**
  - Vídeos a partir de prompts/roteiros
  - Variações para testes A/B
  - Formatos: stories, reels, MP4
- **Cotas:** Limite por plano

### 5.4 Agentes Premium Exclusivos

#### ✅ Agente de Confirmação
- **Função:** Confirmação diária de presença
- **Operação:**
  - Contata leads agendados no dia
  - Varredura diária no Google Tasks
  - Horários pré-definidos

#### 📝 Agente de Resumo de Grupos
- **Função:** Resumo de grupos WhatsApp
- **Operação:**
  - Monitora grupos selecionados
  - Extrai pontos relevantes (24h)
  - Resumo estruturado diário
- **Requisito:** Consentimento e regras do grupo

#### 🎯 Agente de Remarketing
- **Função:** Reengajamento de contatos
- **Operação:**
  - Identifica contatos no histórico
  - Dispara mensagens baseadas em funil
  - Templates aprovados fora de 24h
- **Requisito:** Opt-in do contato

#### 📞 Agente de Follow-up
- **Função:** Reativação de contatos inativos
- **Operação:**
  - Identificação por período configurável
  - Lembretes e mensagens de reativação
- **Requisito:** Templates e opt-in

### 5.5 CRM Pipeline (Business/Premium) — Gestão Completa de Leads

O **CRM Pipeline** é um módulo completo de gestão de vendas integrado ao app, permitindo acompanhar visualmente cada lead desde o primeiro contato até o fechamento.

#### **Interface Kanban Visual**

```
┌─────────────────────────────────────────────────────────────────┐
│  [Novo] → [Contatado] → [Qualificado] → [Proposta] →           │
│  → [Negociando] → [Ganho] ✅ / [Perdido] ❌                      │
└─────────────────────────────────────────────────────────────────┘
```

#### **7 Estágios do Pipeline**

##### **1. Novo** 🆕
- **Quando entra**: Lead qualificado pelo Agente SDR ou adicionado manualmente
- **Dados obrigatórios**: Nome, telefone
- **Próxima ação sugerida**: "Fazer contato inicial"
- **Cor do card**: Azul claro

##### **2. Contatado** 📞
- **Quando entra**: Primeiro contato realizado (WhatsApp, ligação, email)
- **Dados obrigatórios**: Data do contato, meio de contato
- **Próxima ação sugerida**: "Qualificar necessidade"
- **Cor do card**: Azul

##### **3. Qualificado** ✅
- **Quando entra**: Lead passou pelo critério BANT (Budget, Authority, Need, Timeline)
- **Dados obrigatórios**: Budget estimado, timeline, autoridade confirmada
- **Próxima ação sugerida**: "Enviar proposta comercial"
- **Cor do card**: Verde claro
- **Fit Score visível**: Alto (8-10), Médio (5-7), Baixo (0-4)

##### **4. Proposta** 📄
- **Quando entra**: Proposta comercial enviada ao lead
- **Dados obrigatórios**: Data de envio, valor da proposta, validade
- **Próxima ação sugerida**: "Follow-up em 2 dias"
- **Cor do card**: Laranja claro
- **Contador de dias**: "Enviada há X dias"

##### **5. Negociando** 💬
- **Quando entra**: Lead em discussão de ajustes, condições, prazos
- **Dados obrigatórios**: Objeções, condições propostas
- **Próxima ação sugerida**: "Alinhar condições finais"
- **Cor do card**: Laranja escuro
- **Alerta**: Cards > 7 dias em negociação ficam destacados

##### **6. Ganho** 🎉
- **Quando entra**: Deal fechado, contrato assinado
- **Dados obrigatórios**: Valor fechado, data de fechamento, forma de pagamento
- **Métricas calculadas automaticamente**:
  - Ticket médio
  - Tempo de conversão (dias desde "Novo")
  - Taxa de conversão por origem
- **Cor do card**: Verde intenso
- **Ações automáticas**: 
  - Entrada no Financeiro se configurado
  - Email de boas-vindas
  - Criação de tarefas de onboarding

##### **7. Perdido** ❌
- **Quando entra**: Deal não fechou
- **Dados obrigatórios**: Motivo da perda (Preço, Concorrente, Não era o momento, Outro)
- **Próxima ação sugerida**: "Remarketing em 90 dias" (se opt-in ativo)
- **Cor do card**: Cinza
- **Análise de perdas**: Dashboard com motivos mais frequentes

#### **Card do Lead — Detalhes no Sidebar**

Ao clicar em qualquer card, abre um **Sidebar lateral** com:

```
┌────────────────────────────────────┐
│  👤 João Silva                     │
│  📱 (11) 99999-9999               │
│  📧 joao@empresa.com.br           │
│  🏢 Empresa XYZ Ltda              │
│                                    │
│  📊 Fit Score: 9/10 (ALTO)        │
│  💰 Budget: R$ 2.000/mês          │
│  ⏰ Timeline: 15 dias              │
│  ✅ Authority: Sim (Sócio)        │
│                                    │
│  📝 Histórico:                     │
│  • 10/12 - Contatado via WhatsApp │
│  • 11/12 - Qualificado (fit alto) │
│  • 12/12 - Proposta enviada       │
│                                    │
│  🔔 Próxima Ação:                  │
│  "Follow-up proposta amanhã 10h"  │
│                                    │
│  [Mover p/ Negociando]            │
│  [Editar] [Excluir]                │
└────────────────────────────────────┘
```

**Informações Exibidas:**
- **Dados Pessoais**: Nome, telefone, email, empresa, cargo
- **Qualificação BANT**: Budget, Authority, Need, Timeline
- **Fit Score**: Pontuação 0-10 com indicador visual
- **Origem**: WhatsApp SDR, Indicação, Site, Anúncio
- **Histórico de Interações**: Timeline reversa (mais recente primeiro)
- **Tags**: Customizáveis (ex.: "Urgente", "Hot Lead", "VIP")
- **Próxima Ação**: Campo de texto livre + data/hora
- **Observações**: Campo de anotações internas

#### **Funcionalidades do CRM**

##### **Drag-and-Drop**
- Arraste cards entre colunas para mudar de estágio
- Confirmação automática ao mover para "Ganho" ou "Perdido"
- Validação de campos obrigatórios antes de avançar

##### **Filtros e Busca**
- **Busca**: Por nome, telefone, empresa
- **Filtros**:
  - Estágio do pipeline
  - Fit score (Alto, Médio, Baixo)
  - Origem (SDR, Manual, Indicação)
  - Período de entrada
  - Vendedor responsável (Premium)

##### **Importação de Contatos do WhatsApp**
Sincronize automaticamente contatos do WhatsApp para o CRM:

**Processo de Importação:**
1. Navegue até: **CRM Pipeline → Botão "Importar do WhatsApp"**
2. Sistema busca instância Evolution API configurada
3. Faz chamada GET para `/contacts` da Evolution API
4. Retorna lista de contatos com:
   - Nome, telefone, foto de perfil
   - Status (online/offline)
   - Última interação
5. Selecione contatos (multi-select com checkbox)
6. Clique em "Importar Selecionados"
7. Contatos vão para coluna "Novo" do CRM

**Cache e Performance:**
- Contatos importados são cacheados no Supabase
- Cache válido por 24 horas
- Busca incremental: apenas novos contatos são baixados
- Tabela `evolution_contacts_cache` armazena:
  ```sql
  id, instance_id, phone, name, profile_pic_url,
  last_message_timestamp, cached_at
  ```

**Sincronização Automática (Premium):**
- Sync diária automática às 06:00
- Novos contatos vão direto para CRM Pipeline
- Notificação via WhatsApp: "5 novos contatos importados"

#### **Métricas do Pipeline**

Dashboard automático com:

| Métrica | Descrição |
|---------|-----------|
| **Taxa de Conversão Geral** | (Ganhos / Total de Leads) × 100 |
| **Taxa de Conversão por Estágio** | % que passa de um estágio para outro |
| **Tempo Médio de Conversão** | Dias desde "Novo" até "Ganho" |
| **Ticket Médio** | Valor médio dos deals ganhos |
| **Pipeline Value** | Soma de todos os deals em aberto |
| **Motivos de Perda** | Gráfico de pizza com distribuição |

**Exemplo de Dashboard:**
```
┌──────────────────────────────────────────┐
│  📊 Métricas do Mês                      │
├──────────────────────────────────────────┤
│  Total de Leads: 47                      │
│  Ganhos: 12 (25.5%)                      │
│  Perdidos: 8 (17.0%)                     │
│  Em andamento: 27 (57.5%)                │
│                                           │
│  💰 Ticket Médio: R$ 1.350               │
│  ⏱️ Tempo Médio: 18 dias                 │
│  💵 Pipeline Value: R$ 36.450            │
│                                           │
│  🎯 Melhores Origens:                    │
│  1. SDR WhatsApp: 65% conversão          │
│  2. Indicação: 40% conversão             │
│  3. Site: 15% conversão                  │
└──────────────────────────────────────────┘
```

#### **Integrações do CRM**

- ✅ **Agente SDR**: Leads qualificados entram automaticamente
- ✅ **Agente Follow-up**: Contatos inativos recebem mensagens
- ✅ **Agente Remarketing**: Leads "Perdidos" podem ser reativados
- ✅ **Financeiro**: Deals "Ganhos" viram entradas automáticas
- ✅ **WhatsApp**: Importação de contatos com cache
- ✅ **Google Calendar**: Reuniões sincronizadas

#### **Limites por Plano**

| Recurso | Business | Premium |
|---------|:--------:|:-------:|
| Leads no CRM | 500 | Ilimitado |
| Instâncias SDR | 2 | 5 |
| Importação WhatsApp | Manual | Automática diária |
| Vendedores | 1 | 3 |
| Exportação de relatórios | CSV | CSV + PDF |

---

## 6. Limites Detalhados de Planos e Recursos

### 6.1 Tabela Completa de Limites por Plano

| Recurso | Free | Básico | Business | Premium |
|---------|:----:|:------:|:--------:|:-------:|
| **GERAL** |
| Usuários | 1 | 1 | 1-3 | 1-5 |
| Projetos simultâneos | 1 | 1 | 3 | 10 |
| Armazenamento | 100 MB | 1 GB | 10 GB | 50 GB |
| Exportação CSV/PDF | ❌ | ✅ | ✅ | ✅ |
| **AGENTES** |
| Agentes ativos | 3 | 5 | 12 | 12 |
| Execuções/mês | 100 | 1.000 | 5.000 | Ilimitado |
| Tempo resposta IA | < 5s | < 3s | < 2s | < 1s |
| **FINANCEIRO** |
| Transações/mês | 50 | 500 | 2.000 | Ilimitado |
| Categorias customizadas | 12 fixas | 12 fixas | +10 custom | +50 custom |
| Alertas automáticos | ❌ | ✅ | ✅ | ✅ |
| Detecção duplicatas | ❌ | ✅ | ✅ | ✅ |
| **WEB SEARCH** |
| Pesquisas/mês | 20 | 100 | 500 | 2.000 |
| Profundidade | Básica | Intermediária | Avançada | Profunda |
| Fontes simultâneas | 3 | 5 | 10 | 20 |
| Cache de resultados | ❌ | 24h | 7 dias | 30 dias |
| **SCRAPE/EXTRACT** |
| Extrações/mês | 10 | 50 | 200 | 1.000 |
| Páginas por extração | 5 | 20 | 100 | 500 |
| APIs oficiais | ✅ | ✅ | ✅ | ✅ |
| Agendamento automático | ❌ | ❌ | ✅ | ✅ |
| **AGENDAMENTO** |
| Eventos/mês | - | 100 | 500 | Ilimitado |
| Google Calendar | - | ✅ | ✅ | ✅ |
| Google Tasks | - | ✅ | ✅ | ✅ |
| Lembretes WhatsApp | - | ✅ | ✅ | ✅ |
| **SDR** |
| Instâncias SDR | - | - | 2 | 5 |
| Leads qualificados/mês | - | - | 200 | 1.000 |
| Templates customizados | - | - | 5 | 20 |
| Objeções pré-configuradas | - | - | 10 | 50 |
| **CRM PIPELINE** |
| Leads no CRM | - | - | 500 | Ilimitado |
| Vendedores | - | - | 1 | 3 |
| Estágios pipeline | - | - | 7 fixos | 7 + custom |
| Importação WhatsApp | - | - | Manual | Auto diária |
| **MARKETING** |
| Campanhas Google Ads | - | - | 5 | 20 |
| Análises/mês | - | - | 50 | 200 |
| Termos negativos sugeridos | - | - | 100 | 500 |
| Alertas de budget | - | - | ✅ | ✅ |
| **DEV** |
| Debugging/mês | - | - | 100 | 500 |
| Linguagens suportadas | - | - | 15+ | 15+ |
| Testes unitários/mês | - | - | 50 | 200 |
| Code review/mês | - | - | 10 | 50 |
| **VÍDEO (Veo 3)** |
| Vídeos/mês | - | - | 10 | 50 |
| Duração máxima | - | - | 30s | 60s |
| Resoluções | - | - | 1080p | 4K |
| Variações A/B | - | - | 2 | 5 |
| **CONFIRMAÇÃO** |
| Confirmações/dia | - | - | - | 100 |
| Horários customizados | - | - | - | ✅ |
| Templates | - | - | - | 10 |
| **RESUMO GRUPOS** |
| Grupos monitorados | - | - | - | 10 |
| Frequência | - | - | - | Diária |
| Pontos por resumo | - | - | - | 10 |
| **REMARKETING** |
| Contatos reativados/mês | - | - | - | 500 |
| Templates aprovados | - | - | - | 15 |
| Segmentação | - | - | - | Avançada |
| **FOLLOW-UP** |
| Follow-ups/mês | - | - | - | 300 |
| Período de inatividade | - | - | - | Custom |
| Templates | - | - | - | 10 |
| **INTEGRAÇÕES** |
| Google Workspace | - | Básico¹ | Completo¹ | Completo¹ |
| WhatsApp Business | - | Shared | Dedicado | Dedicado |
| Stripe | ✅ | ✅ | ✅ | ✅ |
| Webhooks custom | ❌ | ❌ | 3 | 10 |
| **SUPORTE** |
| Canal | - | - | WhatsApp/Email | Prioritário |
| SLA | - | - | 2 horas | 1 hora |
| Onboarding | - | - | ✅ 2h | ✅ 4h |
| Treinamentos | - | - | +R$ 149/h | +R$ 149/h |
| **SEGURANÇA** |
| Criptografia | ✅ | ✅ | ✅ | ✅ |
| 2FA | ✅ | ✅ | ✅ | ✅ |
| Backups | ❌ | ❌ | ❌ | 3-2-1 diário |
| Auditoria de logs | ❌ | Básica | Completa | Completa + Exportação |
| LGPD/DPO | ✅ | ✅ | ✅ | ✅ |

**¹ Custo adicional conforme uso das APIs Google**

### 6.2 Consumo de APIs e Custos Adicionais

#### **Google Workspace (Básico+ com custos adicionais)**
As integrações Google utilizam cotas pagas pelas APIs oficiais:

| API | Custo Aproximado | Incluído em |
|-----|------------------|-------------|
| Google Calendar | US$ 0,0025/evento | Business/Premium (até cota) |
| Google Drive | US$ 0,0020/arquivo | Business/Premium (até cota) |
| Google Tasks | US$ 0,0015/tarefa | Business/Premium (até cota) |
| Gmail | US$ 0,0030/email | Premium |

**Cotas Mensais Inclusas:**
- **Business**: 500 eventos + 200 arquivos + 300 tarefas
- **Premium**: 2.000 eventos + 1.000 arquivos + 1.500 tarefas + 500 emails

**Excedente:** Cobrado conforme tabela acima, faturado mensalmente

#### **Veo 3 (Geração de Vídeos)**
Baseado na tabela de custos do Google Vertex AI:

| Duração | Resolução | Custo/vídeo | Incluído Business | Incluído Premium |
|---------|-----------|-------------|-------------------|------------------|
| 0-30s | 1080p | US$ 0,50 | 10 vídeos | 50 vídeos |
| 31-60s | 1080p | US$ 1,00 | - | 50 vídeos |
| 0-30s | 4K | US$ 2,00 | - | 20 vídeos |

**Excedente:** Faturado mensalmente conforme consumo

#### **WhatsApp Business API**
Custos operacionais por conversa (não inclusos nos planos):

| Tipo de Conversa | Custo/conversa |
|------------------|----------------|
| Service (resposta < 24h) | US$ 0,0052 |
| Marketing (template aprovado) | US$ 0,0130 |
| Utility (notificações) | US$ 0,0026 |

**Média estimada:** R$ 200-500/mês para 1.000-3.000 conversas  
**Faturamento:** Direto pela Meta/WhatsApp Business

### 6.3 Fair Use Policy

Para garantir qualidade de serviço para todos os clientes:

#### **Limites de Taxa (Rate Limits)**
- **Free**: 10 requisições/minuto
- **Básico**: 30 requisições/minuto
- **Business**: 100 requisições/minuto
- **Premium**: 300 requisições/minuto

**Exceder limites:** Requisições ficam em fila (até 1000 na fila)

#### **Proibições**
❌ **Uso Comercial no Plano Free** (revenda, clientes externos)  
❌ **Scraping de sites que proíbem** (violação de ToS)  
❌ **Spam via WhatsApp** (mensagens não solicitadas)  
❌ **Armazenamento de dados sensíveis** (CPF, cartões, senhas)  
❌ **Automação de captchas** ou bypass de segurança  

**Penalidades:** Alerta → Suspensão temporária → Cancelamento sem reembolso

#### **Uso Abusivo**
Considera-se abuso:
- Executar > 10.000 requisições/hora mesmo no Premium
- Armazenar > 100 GB de logs/dados temporários
- Manter > 100 sessões simultâneas de IA ativas

**Ação:** Contato do time técnico para ajuste ou upgrade de plano

---

## 7. Casos de Uso por Segmento

### 7.1 Tecnologia/SaaS

| Necessidade | Agente | Exemplo |
|-------------|--------|---------|
| Qualificar leads para demo | SDR | "Lead interessado em trial, marcar demo terça 14h" |
| Controle de MRR | Financeiro | "Entrada R$ 5.000 categoria Recorrente" |
| Debugging de API | Dev | "Erro 500 no endpoint /checkout" |
| Pesquisa de concorrentes | Web Search | "Comparar CRMs do mercado" |

### 7.2 Saúde (Clínicas/Consultórios)

| Necessidade | Agente | Exemplo |
|-------------|--------|---------|
| Agendamento de consultas | Agendamento | "Marcar consulta Dr. Silva quinta 15h" |
| Confirmação de presença | Confirmação | Automático no dia da consulta |
| Controle de pagamentos | Financeiro | "Entrada R$ 350 categoria Consultas" |
| Redução de no-show | Follow-up | Lembrete 24h antes |

### 7.3 Educação

| Necessidade | Agente | Exemplo |
|-------------|--------|---------|
| Qualificar interessados | SDR | "Lead quer info sobre curso de Python" |
| Agendar aula experimental | Agendamento | "Aula teste sexta 10h" |
| Controle de mensalidades | Financeiro | "Entrada R$ 997 categoria Mensalidades" |

### 7.4 Varejo/E-commerce

| Necessidade | Agente | Exemplo |
|-------------|--------|---------|
| Atendimento 24/7 | SDR | Qualificação automática de interessados |
| Recuperação de carrinho | Remarketing | Mensagem após abandono |
| Pesquisa de preços | Web Search | "Comparar preço produto X" |

### 7.5 Agências de Marketing

| Necessidade | Agente | Exemplo |
|-------------|--------|---------|
| Análise de campanhas | Marketing | "Analisar campanha Google Ads outubro" |
| Termos negativos | Marketing | "Sugerir 5 termos negativos" |
| Relatórios para cliente | Web Search + Scrape | Dados estruturados para apresentação |
| Criação de vídeos | Vídeo | "Vídeo 30s para stories" |

---

## 8. Fluxos de Uso no WhatsApp

### 8.1 Como Falar com o Meu Agente

Escreva normalmente, como falaria com um colega. Exemplos práticos:

### 8.2 Exemplos por Agente

#### Financeiro
```
"Registra entrada de R$ 1.200 na categoria Assinaturas, Plano Business, data 01/12/2025"
"Saída de R$ 320 em Marketing, descrição 'Impulsionamento Instagram'"
"Exporta CSV de setembro, categorias Marketing e Operação"
"Qual meu saldo do mês?"
```

#### Web Search
```
"Busque 3 pousadas em Fortaleza com potencial para meu produto"
"Tendências de roupas fitness em SP nos últimos 90 dias"
"Compare CRM vs ERP para clínicas"
```

#### Agendamento
```
"Marca reunião com João amanhã 15h no Meet"
"Cria tarefa: enviar proposta até sexta 17h"
"Anexa Proposta_v3.pdf na reunião de segunda"
```

#### SDR
```
"Qualifica lead: Ana, 11 99999-9999, quer demo"
"Oferece dois horários: quinta 10:30 ou sexta 14:00"
"Prepara orçamento com base na conversa"
```

#### Marketing
```
"Analisa campanha 'Tráfego Dezembro', sugere 3 termos negativos"
"Por que o gasto diário está estourando cedo?"
"Compara última semana com anterior, 5 insights"
```

#### Vídeo
```
"Cria vídeo 30s em 1080x1920 com roteiro: 'Bem-vindo ao Meu Agente...'"
"Adapta roteiro para clínica odontológica, vídeo para stories"
```

### 8.3 Palavras de Controle

| Comando | Ação |
|---------|------|
| **SAIR** / **pare** | Cancela notificações |
| **ajuda** | Menu de opções |
| **status** | Status dos agentes |

---

## 9. Integrações

### 9.1 Google Workspace

| Serviço | Funcionalidade | Disponibilidade |
|---------|----------------|-----------------|
| Google Calendar | Eventos e reuniões | Básico+ (custo adicional Business+) |
| Google Drive | Anexos de arquivos | Básico+ |
| Google Tasks | Tarefas com prazos | Básico+ |
| Gmail | E-mails de confirmação | Business+ |
| Google Meet | Links de reunião | Básico+ |

**Requisitos:** OAuth com escopos mínimos

### 9.2 WhatsApp Business

- Canal principal de comunicação
- Mensagens dentro das políticas Meta
- Templates aprovados para proativas (>24h)
- Número dedicado (Business/Premium)

### 9.3 Stripe

- Processamento de pagamentos
- Gestão de assinaturas
- Faturas automáticas

### 9.4 Supabase

- Banco de dados PostgreSQL
- Autenticação de usuários
- Edge Functions
- Realtime sync

---

## 10. Segurança, Privacidade e Conformidade

### 10.1 LGPD

- ✅ Bases legais definidas por finalidade
- ✅ Canal do Encarregado (DPO) disponível
- ✅ Direitos do titular garantidos
- ✅ Políticas de retenção e descarte

### 10.2 Criptografia

- ✅ Dados em trânsito: TLS 1.3
- ✅ Dados em repouso: AES-256
- ✅ Criptografia de ponta a ponta no WhatsApp

### 10.3 Consentimento e Opt-out

- ✅ Registro de opt-in
- ✅ Palavras de parada: **SAIR**, **pare**
- ✅ Opt-out imediato e automático

### 10.4 Scraping Ético

- ✅ Apenas fontes permitidas e APIs oficiais
- ✅ Respeito a robots.txt e termos de uso
- ❌ Nunca sites que proíbem scraping

### 10.5 Backups (Premium)

- Política 3-2-1 (3 cópias, 2 mídias, 1 off-site)
- Backups diários off-site
- Testes periódicos de restauração

### 10.6 Certificações em Progresso

- 🔄 ISO 27001 (em processo)
- ✅ Monitoramento 24/7
- ✅ Infraestrutura em data center seguro

---

## 11. Suporte e SLAs

### 11.1 Canais por Plano

| Plano | Suporte | SLA |
|-------|---------|-----|
| Free | ❌ Sem suporte | - |
| Básico | ❌ Sem suporte | - |
| Business | ✅ 24/7 prioritário | 2 horas |
| Premium | ✅ 24/7 máxima prioridade | 1 hora |

### 11.2 Horário Comercial

- Segunda a Sexta: 8h às 18h
- Sábado: 9h às 13h
- Domingo/Feriados: Fechado (exceto suporte 24/7)

### 11.3 Contatos

| Canal | Contato |
|-------|---------|
| WhatsApp | (11) 95118-2561 |
| Email Geral | contato@meuagente.api.br |
| Comercial | comercial@meuagente.api.br |
| Suporte | suporte@meuagente.api.br |

---

## 12. Métricas de Sucesso

### 12.1 Métricas de Negócio

| Métrica | Meta |
|---------|------|
| Economia de tempo | 40h/mês por equipe |
| Aumento de conversões | +35% |
| Redução de no-show | -50% |
| NPS | > 50 |

### 12.2 Métricas Técnicas

| Métrica | Meta |
|---------|------|
| Uptime App Core | 99.99% |
| Uptime Agentes | 99.9% |
| Tempo de resposta | < 2s |
| SLA Suporte Business | 2h |

### 12.3 Relatórios Disponíveis

- **Vendas:** Conversão por etapa, no-show, ticket médio
- **Marketing:** CTR templates, opt-in/opt-out, ROI
- **Operações:** Transações por período, tarefas concluídas
- **Exportação:** CSV, PDF (planos pagos)

---

## 13. Roadmap

### 13.1 Histórico

| Período | Marco |
|---------|-------|
| **2023** | Fundação da empresa |
| **Q3 2023** | Lançamento do MVP com parceiros selecionados |
| **2024** | Expansão nacional, integrações oficiais |
| **Q4 2024** | Lançamento dos agentes Premium |
| **2025** | Site e app redesenhados, novos agentes |

### 13.2 Próximos Passos (2025-2026)

| Período | Planejamento |
|---------|--------------|
| **Q1 2026** | Integração com outros canais (Telegram, Instagram) |
| **Q2 2026** | Agentes de voz |
| **Q3 2026** | Expansão internacional |
| **Q4 2026** | Marketplace de agentes customizados |

---

## 14. Diagramas e Fluxos Técnicos

### 14.1 Fluxo Completo SDR → CRM → Fechamento

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO DE VENDAS                     │
└─────────────────────────────────────────────────────────────────┘

1. Lead envia mensagem no WhatsApp
         ↓
2. Agente SDR responde e inicia qualificação
         ↓
3. Perguntas BANT (Budget, Authority, Need, Timeline)
         ↓
4. Sistema calcula Fit Score (0-10)
         ↓
   ┌────────────┬────────────┬────────────┐
   │ Fit Alto   │ Fit Médio  │ Fit Baixo  │
   │  (8-10)    │   (5-7)    │   (0-4)    │
   └────────────┴────────────┴────────────┘
         │            │            │
         ↓            ↓            ↓
   Oferece       Envia       Agradece +
   reunião      material     nurturing
         ↓            ↓            │
   Agendamento  Follow-up    (sai do funil)
   no Calendar    em 3d
         ↓            │
         └────────────┘
                ↓
5. Lead salvo no CRM Pipeline (coluna "Novo")
                ↓
6. Vendedor move manualmente entre estágios:
   Novo → Contatado → Qualificado → Proposta → 
   Negociando → Ganho ✅ / Perdido ❌
                ↓
7. Se Ganho: Entrada automática no Financeiro
   Se Perdido: Remarketing em 90 dias (se opt-in)
```

### 14.2 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                │
│   React 18 + TypeScript + Vite + TanStack Query + ShadcnUI     │
└─────────────────────────────────────────────────────────────────┘
                            ↓ HTTPS/TLS 1.3
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
│   Supabase (PostgreSQL + Auth + Realtime + Edge Functions)     │
└─────────────────────────────────────────────────────────────────┘
         ↓                  ↓                  ↓
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  Evolution API │  │      n8n       │  │     Stripe     │
│   (WhatsApp)   │  │  (Chat IA)     │  │  (Pagamentos)  │
└────────────────┘  └────────────────┘  └────────────────┘
         ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                    INTEGRAÇÕES EXTERNAS                          │
│   Google Workspace • WhatsApp Business API • Vertex AI (Veo 3)  │
└─────────────────────────────────────────────────────────────────┘
```

### 14.3 Fluxo de Autenticação

```
1. Usuário acessa app.meuagente.api.br
         ↓
2. Insere telefone no formato (XX) XXXXX-XXXX
         ↓
3. Sistema converte: telefone → email sintético
   Ex.: (11) 95118-2561 → 11951182561@meuagente.api.br
         ↓
4. Supabase Auth envia código SMS via Twilio
         ↓
5. Usuário insere código de 6 dígitos
         ↓
6. Token JWT gerado (válido por 7 dias)
         ↓
7. AuthContext busca dados do cliente na tabela "clientes"
   WHERE auth_user_id = session.user.id
         ↓
8. App carrega com dados completos do cliente
```

### 14.4 Integração WhatsApp → CRM (Cache)

```
┌──────────────────────────────────────────────────────────────┐
│  1. Botão "Importar do WhatsApp" clicado no CRM              │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  2. Edge Function verifica cache (tabela                      │
│     evolution_contacts_cache)                                 │
│     - Se cache < 24h: retorna do banco                       │
│     - Se cache > 24h ou vazio: busca da API                  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  3. GET https://evolution-api.com/contacts                    │
│     Headers: { apikey: EVOLUTION_API_KEY }                   │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  4. Response: [                                               │
│       { name, phone, profilePicUrl, lastMessageTimestamp }   │
│     ]                                                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  5. Salva no cache (evolution_contacts_cache)                │
│     INSERT INTO evolution_contacts_cache (...)               │
│     ON CONFLICT (phone) DO UPDATE cached_at = NOW()          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  6. UI exibe contatos com checkbox multi-select              │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  7. Usuário seleciona contatos e clica "Importar"           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  8. INSERT INTO evolution_contacts (...)                      │
│     WHERE NOT EXISTS (evita duplicatas)                      │
│     + crm_stage = 'novo'                                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  9. CRM Pipeline atualiza em tempo real (Supabase Realtime) │
└──────────────────────────────────────────────────────────────┘
```

### 14.5 Processamento de Pagamento (Stripe)

```
1. Usuário escolhe plano (Business R$ 997 ou Premium R$ 1.497)
         ↓
2. Frontend chama: supabase.functions.invoke('create-checkout-session')
         ↓
3. Edge Function cria Checkout Session no Stripe
   - price_id baseado no plano
   - success_url: app.meuagente.api.br/sucesso?session_id={CHECKOUT_SESSION_ID}
   - cancel_url: app.meuagente.api.br/planos
         ↓
4. Usuário redirecionado para Stripe Checkout
         ↓
5. Após pagamento, Stripe redireciona para success_url
         ↓
6. Stripe envia webhook para: supabase.functions.invoke('stripe-webhook')
         ↓
7. Webhook atualiza tabela "clientes":
   - plano_ativo = 'business' ou 'premium'
   - stripe_customer_id = customer.id
   - stripe_subscription_id = subscription.id
   - periodo_arrependimento_ate = NOW() + INTERVAL '7 days'
         ↓
8. App recarrega dados do cliente via AuthContext
         ↓
9. Funcionalidades do plano liberadas automaticamente
```

### 14.6 Política de Backups (Premium)

```
┌─────────────────────────────────────────────────────────────┐
│                    POLÍTICA 3-2-1                            │
│  3 cópias • 2 mídias diferentes • 1 off-site                │
└─────────────────────────────────────────────────────────────┘

Diariamente às 03:00 UTC:
         ↓
┌──────────────────────────────────────────────────────────────┐
│  1ª Cópia: Backup local no servidor Supabase (primary)      │
│     - Full backup do PostgreSQL (pg_dump)                    │
│     - Storage bucket completo                                │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│  2ª Cópia: Réplica síncrona em datacenter secundário         │
│     - Streaming replication (PostgreSQL)                     │
│     - Latência < 100ms                                       │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│  3ª Cópia: Backup off-site no AWS S3 (região diferente)     │
│     - Compactado e criptografado (AES-256)                   │
│     - Retenção: 30 dias diários + 6 meses mensais           │
└──────────────────────────────────────────────────────────────┘

Testes de Restauração:
- Semanalmente: Restauração parcial (tabela random)
- Mensalmente: Restauração completa em ambiente staging
- Documentação de RTO: < 4 horas
- Documentação de RPO: < 24 horas
```

---

## 15. FAQ Técnico

### P: Posso usar sem número próprio?
**R:** Sim, nos planos Free e Básico o atendimento usa a infraestrutura do Meu Agente.

### P: O que muda no Business/Premium?
**R:** Número WhatsApp dedicado, implantação inclusa, suporte 24/7 e agentes adicionais.

### P: Como funcionam mensagens proativas?
**R:** Fora da janela de 24h, apenas com template aprovado pelo WhatsApp e opt-in do contato.

### P: Há taxa de manutenção?
**R:** Sim, R$ 149/hora quando solicitada (ajustes de modelos, reconfigurações, treinamentos).

### P: Vocês fazem scraping de sites que proíbem?
**R:** Não. Trabalhamos apenas com APIs oficiais e fontes permitidas.

### P: Como são feitos os backups?
**R:** Política 3-2-1 no Premium: backups diários off-site com testes de restauração.

### P: Qual a diferença dos níveis de Web Search?
**R:** Básico (consultas simples), Intermediário (filtros avançados), Avançado (análises profundas, mais fontes).

### P: Como funciona o período de arrependimento (CDC)?
**R:** Clientes têm 7 dias corridos a partir da contratação para cancelar e receber reembolso total, conforme Art. 49 do Código de Defesa do Consumidor.

### P: Posso configurar múltiplos agentes SDR?
**R:** Sim! Business permite 2 instâncias e Premium permite 5. Útil para segmentar por produto, região ou idioma.

### P: Como funciona a importação de contatos do WhatsApp?
**R:** Via Evolution API, você pode importar contatos diretamente para o CRM Pipeline. Business faz manualmente, Premium tem sync automática diária.

### P: Os dados dos clientes são usados para treinar IAs?
**R:** Não. Seus dados nunca são usados para treinamento de modelos. Utilizamos apenas para processamento das suas solicitações.

### P: Posso exportar todos os meus dados?
**R:** Sim! Via dashboard você pode exportar CSV/PDF (planos pagos). Premium tem exportação completa incluindo logs de auditoria.

### P: O que acontece se eu exceder os limites do plano?
**R:** Sistema notifica ao atingir 80% do limite. Se exceder, funcionalidades ficam em fila ou pausam temporariamente até próximo ciclo/upgrade.

### P: Posso mudar de plano a qualquer momento?
**R:** Sim! Upgrades são imediatos (pro-rata). Downgrades aplicam no próximo ciclo de faturamento.

### P: Como funciona o SLA de suporte?
**R:** Business: resposta em até 2h (horário comercial estendido). Premium: resposta em até 1h com atendimento 24/7.

### P: Vocês oferecem trial gratuito?
**R:** Plano Free disponível permanentemente. Business/Premium têm 7 dias de período de arrependimento com reembolso total.

### P: O CRM Pipeline substitui meu CRM atual?
**R:** Depende do seu uso. Para gestão simples de leads, sim. Para CRMs corporativos complexos, pode ser usado como complemento via exportação.

### P: Quanto tempo leva a implantação (setup)?
**R:** Business/Premium incluem onboarding: 2-4h de configuração com especialista, geralmente em 1-2 dias úteis.

### P: Posso usar para atender clientes fora do Brasil?
**R:** Sim! Agentes funcionam em qualquer idioma. WhatsApp Business API tem cobertura global (custos variam por região).

### P: Como são cobradas as mensagens do WhatsApp?
**R:** Meta cobra por conversa (não por mensagem). Média: R$ 200-500/mês para 1.000-3.000 conversas. Cobrança direta pela Meta.

### P: O que está incluído no onboarding?
**R:** Configuração de agentes, integração Google (se aplicável), treinamento da equipe, testes e validação. Business: 2h, Premium: 4h.

---

## 15. Glossário

| Termo | Definição |
|-------|-----------|
| **Agente** | IA especializada em uma função (Financeiro, SDR, etc.) |
| **SDR** | Sales Development Representative - qualificação de leads |
| **MRR** | Monthly Recurring Revenue - receita recorrente mensal |
| **CTR** | Click-Through Rate - taxa de cliques |
| **Opt-in** | Consentimento ativo do usuário |
| **Opt-out** | Solicitação de saída/cancelamento |
| **SLA** | Service Level Agreement - acordo de nível de serviço |
| **LGPD** | Lei Geral de Proteção de Dados |
| **DPO** | Data Protection Officer - encarregado de dados |
| **Veo 3** | Modelo de geração de vídeo do Google |
| **Template** | Mensagem pré-aprovada pelo WhatsApp Business |
| **Janela 24h** | Período em que mensagens livres podem ser enviadas após interação |
| **BANT** | Budget, Authority, Need, Timeline - critérios de qualificação de leads |
| **Fit Score** | Pontuação 0-10 que indica qualidade/potencial de um lead |
| **Pipeline Value** | Soma total do valor de todos os deals em aberto no CRM |
| **Ticket Médio** | Valor médio dos negócios fechados (ganhos) |
| **Taxa de Conversão** | Percentual de leads que avançam entre estágios ou fecham |
| **Remarketing** | Reengajamento de contatos que não fecharam negócio |
| **Follow-up** | Retomada de contato com leads inativos |
| **Rate Limit** | Limite de requisições por minuto/hora para evitar sobrecarga |
| **Fair Use** | Política de uso justo para garantir qualidade para todos |
| **Pro-rata** | Cálculo proporcional de valor ao mudar de plano no meio do ciclo |
| **Onboarding** | Processo de configuração inicial e treinamento |
| **OAuth** | Protocolo de autenticação usado nas integrações Google |
| **Edge Functions** | Funções serverless executadas na borda (Supabase) |
| **Realtime** | Sincronização em tempo real de dados (Supabase) |
| **Evolution API** | API de integração com WhatsApp usada pelo sistema |
| **n8n** | Plataforma de automação de workflows usada internamente |
| **PWA** | Progressive Web App - app web que funciona como nativo |
| **CDC** | Código de Defesa do Consumidor (Lei 8.078/1990) |
| **Período de Arrependimento** | 7 dias corridos para cancelar com reembolso (Art. 49 CDC) |
| **Opt-in** | Consentimento explícito do usuário para receber comunicações |
| **Opt-out** | Solicitação de cancelamento de comunicações |
| **Template Aprovado** | Mensagem pré-aprovada pela Meta para uso fora da janela 24h |
| **Conversa** | Unidade de cobrança do WhatsApp (janela de 24h) |
| **Service Conversation** | Conversa de resposta dentro de 24h após mensagem do cliente |
| **Marketing Conversation** | Conversa iniciada com template de marketing |
| **Utility Conversation** | Conversa de notificações/utilidade (confirmações, etc.) |

---

## Observações Comerciais

- Limites de consumo (execuções, minutos de vídeo) detalhados na Proposta Comercial
- Ajustes fora de escopo são tratados como add-ons sob demanda
- Preços sujeitos a reajuste anual
- Contratos mínimos de 12 meses para Business/Premium (negociável)

---

---

**Documento atualizado em:** 15 de Dezembro de 2025  
**Versão:** 2.0 — Edição Completa e Expandida  
**Próxima revisão:** Março/2026

**Changelog desta versão:**
- ✅ Adicionada configuração completa do SDR (6 abas) com exemplos práticos
- ✅ Documentado CRM Pipeline completo (7 estágios, Kanban, métricas)
- ✅ Incluída importação de contatos WhatsApp com cache
- ✅ Adicionada tabela completa de limites por plano (120+ recursos detalhados)
- ✅ Documentados custos adicionais (Google Workspace, Veo 3, WhatsApp API)
- ✅ Incluída Fair Use Policy com rate limits e proibições
- ✅ Adicionados 6 diagramas técnicos de fluxos
- ✅ Expandido FAQ com 15 novas perguntas
- ✅ Glossário ampliado com 30+ termos técnicos

© 2025 Meu Agente. Todos os direitos reservados.
