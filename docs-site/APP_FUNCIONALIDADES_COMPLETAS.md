# 📱 FUNCIONALIDADES COMPLETAS DO APP
## Meu Agente - Guia Visual e Interativo do Aplicativo

**Versão:** 2.0  
**Última Atualização:** Dezembro/2025  
**App:** https://app.meuagente.api.br  

---

## 📋 **ÍNDICE**

1. [Visão Geral do App](#visão-geral-do-app)
2. [Interface e Design](#interface-e-design)
3. [Dashboard Financeiro](#dashboard-financeiro)
4. [Agente de IA Conversacional](#agente-de-ia-conversacional)
5. [Gestão de Contas](#gestão-de-contas)
6. [Metas Financeiras](#metas-financeiras)
7. [Agenda e Eventos](#agenda-e-eventos)
8. [Tarefas](#tarefas)
9. [Agente SDR](#agente-sdr)
10. [Notificações e Alertas](#notificações-e-alertas)
11. [Perfil e Assinaturas](#perfil-e-assinaturas)
12. [Animações e Experiência Visual](#animações-e-experiência-visual)

---

## 🎯 **VISÃO GERAL DO APP**

### **O que é o App Meu Agente?**

O App Meu Agente é uma **aplicação web moderna e responsiva** que oferece uma experiência visual imersiva para gestão financeira pessoal e empresarial, combinada com **agentes de IA conversacionais integrados** diretamente na interface.

### **Características Diferenciais**

| Característica | Descrição |
|----------------|-----------|
| 🎨 **Interface Premium** | Design moderno com glassmorphism, gradientes e animações fluidas |
| 🤖 **IA Conversacional** | Chat integrado com agente de IA para usuários Free e pagos |
| ⚡ **Performance Otimizada** | Lazy loading, memoização e carregamento inteligente |
| 📱 **PWA Ready** | Funciona como app nativo no celular |
| 🌙 **Tema Adaptativo** | Suporte a modo claro e escuro |
| 🔄 **Realtime** | Atualizações em tempo real via WebSocket |

### **Tecnologias do App**

```
Frontend: React 18 + TypeScript + Vite
UI: ShadcnUI v4 + Tailwind CSS
Animações: Framer Motion
3D: Spline (cenas interativas)
Estado: React Query + Context API
Backend: Supabase (PostgreSQL + Auth + Realtime)
Pagamentos: Stripe
```

---

## 🎨 **INTERFACE E DESIGN**

### **Design System**

O app utiliza um design system sofisticado com:

#### **🎨 Paleta de Cores**
- **Gradientes Premium**: Transições suaves entre cores da marca
- **Glassmorphism**: Efeitos de vidro fosco em cards e modais
- **Cores Semânticas**: Verde para positivo, vermelho para negativo, azul para informativo

#### **📐 Componentes Visuais**
- **Cards Flutuantes**: Sombras suaves e bordas arredondadas
- **Ícones Animados**: Transições de hover e feedback visual
- **Skeleton Loading**: Placeholder animado durante carregamento

#### **✨ Animações e Transições**

```typescript
// Exemplo de animação de entrada
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

- **Fade-in**: Elementos aparecem suavemente
- **Slide**: Cards deslizam para suas posições
- **Scale**: Botões crescem no hover
- **Stagger**: Listas animam sequencialmente

### **Layout Responsivo**

| Dispositivo | Comportamento |
|-------------|---------------|
| 📱 Mobile | Menu colapsável, cards em coluna única |
| 📱 Tablet | Grid 2 colunas, sidebar retrátil |
| 💻 Desktop | Grid 4 colunas, sidebar fixa |

---

## 📊 **DASHBOARD FINANCEIRO**

### **Visão Geral**

O Dashboard é a **central de comando** do seu controle financeiro, apresentando informações cruciais de forma visual e intuitiva.

### **Cards de Métricas**

#### **💰 Total Receitas**
- Gradiente verde com ícone animado
- Soma de todas as entradas do período
- Atualização em tempo real

#### **💸 Total Despesas**
- Gradiente vermelho com ícone animado
- Soma de todas as saídas do período
- Indicadores de tendência

#### **📈 Saldo**
- Cor dinâmica (verde/vermelho)
- Diferença entre receitas e despesas
- Indicador visual de saúde financeira

#### **📋 Transações**
- Contador de movimentações
- Link rápido para detalhes
- Badge de status

### **Gráficos Interativos**

#### **📈 Evolução Diária**
```
┌─────────────────────────────────────┐
│  ╭─╮                                │
│ ╭╯ ╰─╮     ╭──╮                     │
│╭╯    ╰─────╯  ╰───╮                 │
│                   ╰──────────────── │
│  Jan  Fev  Mar  Abr  Mai  Jun       │
└─────────────────────────────────────┘
```
- Gráfico de área com gradiente
- Hover interativo com tooltips
- Comparação receitas vs despesas
- Zoom e pan (em desenvolvimento)

#### **🥧 Distribuição por Categoria**
- Gráfico de pizza interativo
- Animação de hover expandindo fatia
- Tooltips com valor e percentual
- Cores distintas por categoria

### **Funcionalidades Adicionais**

- 🎯 **Card de Meta Principal**: Progresso visual da meta ativa
- 📅 **Contas Próximas**: Lista de vencimentos iminentes
- ✅ **Tarefas Pendentes**: Próximas tarefas do dia
- ⚡ **Ações Rápidas**: Botões de acesso direto

---

## 🤖 **AGENTE DE IA CONVERSACIONAL**

### **Chat Integrado (Disponível para TODOS os planos)**

O App Meu Agente possui um **agente de IA conversacional integrado** acessível diretamente pela interface, disponível inclusive para usuários do plano **Free**.

### **Animação de Entrada Imersiva**

A tela de chat apresenta uma **animação espacial impressionante**:

```
🌌 EXPERIÊNCIA VISUAL:
─────────────────────────────
• Fundo espacial negro profundo
• Estrelas animadas ascendendo
• Efeitos de nebulosa pulsante
• Robô 3D interativo (Spline)
• Partículas de poeira cósmica
```

#### **Elementos da Animação**
1. **Campo de Estrelas**: 60+ estrelas com movimento parallax
2. **Nebulosas**: Efeitos de brilho pulsante em cinza/prata
3. **Robô 3D**: Cena Spline interativa com o mascote
4. **Input Flutuante**: Caixa de entrada com efeito glass

### **Funcionalidades do Chat**

| Recurso | Descrição |
|---------|-----------|
| 💬 **Histórico de Sessões** | Todas as conversas são salvas |
| 🔄 **Múltiplas Sessões** | Alternar entre conversas anteriores |
| ⚡ **Respostas em Tempo Real** | Streaming de respostas da IA |
| 🔁 **Retry de Mensagens** | Reenviar mensagens com falha |
| 🗑️ **Limpar Histórico** | Iniciar nova conversa |

### **Interface do Chat**

```
┌─────────────────────────────────────┐
│  🤖 Agente de IA           [🗑️ 🔔]  │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────┐           │
│  │ Você: Como registrar │           │
│  │ uma despesa?         │           │
│  └──────────────────────┘           │
│                                     │
│           ┌──────────────────────┐  │
│           │ 🤖 Para registrar    │  │
│           │ uma despesa, você    │  │
│           │ pode usar o comando: │  │
│           │ "Saída de R$ 100     │  │
│           │ em Alimentação"      │  │
│           └──────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  [📎] Digite sua mensagem...  [➤]   │
└─────────────────────────────────────┘
```

### **Integração com n8n**

O chat se conecta a um webhook n8n para processamento inteligente:

```typescript
// Fluxo de mensagem
Usuario → App → Webhook n8n → Processamento IA → Resposta
```

### **Agente de Scrape (Plano Free+)**

O agente de chat pode realizar:
- 🔍 Pesquisas na web
- 📊 Extração de dados
- 📝 Resumos de informações
- 💡 Sugestões inteligentes

---

## 💳 **GESTÃO DE CONTAS**

### **Tela de Contas**

A página de Contas oferece uma visão completa das suas movimentações financeiras.

### **Abas de Navegação**

| Aba | Descrição | Indicador |
|-----|-----------|-----------|
| 📤 **A Pagar** | Despesas pendentes | Badge vermelho |
| 📥 **A Receber** | Receitas pendentes | Badge verde |
| ✅ **Pagas** | Despesas concluídas | Histórico |
| ✅ **Recebidas** | Receitas concluídas | Histórico |

### **Cards de Resumo**

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📤 A PAGAR   │ │ 📥 A RECEBER │ │ 💰 LÍQUIDO   │
│  R$ 2.500    │ │  R$ 8.000    │ │  R$ 5.500    │
│  5 contas    │ │  3 contas    │ │  +↑ 12%      │
└──────────────┘ └──────────────┘ └──────────────┘
```

### **Lista de Transações**

Cada transação exibe:
- 📋 Descrição e categoria
- 💰 Valor formatado (R$)
- 📅 Data de vencimento
- 🏷️ Status (pendente/pago)
- ⚡ Ações (editar, duplicar, excluir)

### **Filtros Avançados**

- **Período**: 7, 30, 90, 365 dias
- **Categoria**: Filtro por categoria específica
- **Busca**: Pesquisa global por descrição

### **Animações dos Cards**

```typescript
// Cards aparecem sequencialmente
{records.map((conta, index) => (
  <div 
    key={conta.id} 
    className="animate-fade-in" 
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <ContaItem conta={conta} />
  </div>
))}
```

---

## 🎯 **METAS FINANCEIRAS**

### **Criação de Metas**

O sistema de metas permite definir objetivos financeiros com acompanhamento visual.

### **Tipos de Metas**

| Tipo | Ícone | Exemplo |
|------|-------|---------|
| 💰 **Economia** | 🏦 | Reserva de emergência |
| 🛒 **Compra** | 🛍️ | Novo notebook |
| ✈️ **Viagem** | 🌎 | Férias no exterior |
| 🎓 **Educação** | 📚 | Curso de especialização |

### **Visualização de Progresso**

```
┌─────────────────────────────────────┐
│ 🎯 Reserva de Emergência            │
├─────────────────────────────────────┤
│  Meta: R$ 15.000,00                 │
│  Atual: R$ 8.500,00                 │
│                                     │
│  ████████████░░░░░░░░░  56%        │
│                                     │
│  📅 Prazo: 31/12/2025               │
│  ⏱️ Restam: 24 dias                 │
│                                     │
│  [Editar] [Concluir] [Excluir]      │
└─────────────────────────────────────┘
```

### **Card no Dashboard**

A meta principal aparece no Dashboard com:
- Barra de progresso animada
- Valor atual vs meta
- Dias restantes
- Botão de ação rápida

---

## 📅 **AGENDA E EVENTOS**

### **Múltiplas Visualizações**

A agenda oferece 6 modos de visualização:

| View | Descrição | Uso Ideal |
|------|-----------|-----------|
| 📅 **Dia** | Horários do dia | Planejamento diário |
| 📊 **Semana** | Grade semanal | Visão da semana |
| 🗓️ **Mês** | Calendário mensal | Visão ampla |
| 📋 **Lista** | Lista cronológica | Eventos em sequência |
| ⏰ **Timeline** | Linha do tempo | Fluxo de eventos |
| 🗓️ **Ano** | Heatmap anual | Visão de densidade |

### **Visualização por Dia**

```
┌─────────────────────────────────────┐
│  📅 Terça, 07 de Dezembro           │
├─────────────────────────────────────┤
│  08:00  ░░░░░░░░░░░░░░░░░░░░░░░    │
│  09:00  ████ Reunião de equipe ████ │
│  10:00  ░░░░░░░░░░░░░░░░░░░░░░░    │
│  11:00  ███ Call com cliente ██████ │
│  12:00  ░░░░░░░░░░░░░░░░░░░░░░░    │
│  ...                                │
└─────────────────────────────────────┘
```

### **Drag-and-Drop**

- Arraste eventos para reordenar
- Mova entre horários
- Redimensione duração
- Feedback visual imediato

### **Criação Rápida de Eventos**

1. Clique em horário vazio
2. Popover de criação rápida aparece
3. Preencha título e detalhes
4. Evento criado instantaneamente

### **Filtros da Agenda**

- 📁 **Calendários**: Mostrar/ocultar por calendário
- 🏷️ **Categorias**: Filtrar por tipo de evento
- ⚡ **Prioridade**: Alta, média, baixa
- 📊 **Status**: Confirmado, pendente, cancelado

---

## ✅ **TAREFAS**

### **Sistema de Tarefas Completo**

O gerenciador de tarefas oferece organização completa com prioridades e status.

### **Estatísticas Rápidas**

```
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│  📋 TOTAL │ │ ⏳ PEND.  │ │ ✅ FEITAS │ │ ⚠️ ATRAS. │
│    24     │ │    12     │ │    10     │ │     2     │
└───────────┘ └───────────┘ └───────────┘ └───────────┘
```

### **Lista de Tarefas**

Cada tarefa exibe:
- ☑️ Checkbox de conclusão
- 📝 Título e descrição
- 🏷️ Prioridade (cores)
- 📅 Data de vencimento
- ⚡ Menu de ações

### **Prioridades**

| Prioridade | Cor | Indicador |
|------------|-----|-----------|
| 🔴 **Alta** | Vermelho | Urgente |
| 🟡 **Média** | Amarelo | Normal |
| 🟢 **Baixa** | Verde | Pode esperar |

### **Ações Disponíveis**

- ✅ Marcar como concluída
- ✏️ Editar tarefa
- 📋 Duplicar tarefa
- 🗑️ Excluir tarefa
- ↩️ Marcar como pendente

---

## 🎯 **AGENTE SDR**

### **Visão Geral**

O **Agente SDR (Sales Development Representative)** é um assistente de vendas inteligente que opera diretamente no WhatsApp, qualificando leads automaticamente, agendando reuniões e movendo prospects pelo funil de vendas.

> ⚠️ **Disponível apenas nos planos Business (2 instâncias) e Premium (5 instâncias)**

### **Tela Principal do SDR**

```
┌─────────────────────────────────────────────────────────┐
│  🤖 Agente SDR                       [+ Nova Instância] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📱 Instância 1: "SDR Corporativo"    🟢 Ativo         │
│  ├─ WhatsApp: +55 11 98888-8888                        │
│  ├─ Leads qualificados: 47                              │
│  ├─ Reuniões agendadas: 12                              │
│  └─ [⚙️ Configurar] [🧪 Testar] [📊 Métricas]          │
│                                                         │
│  📱 Instância 2: "SDR Varejo"         🟡 Pausado       │
│  ├─ WhatsApp: +55 11 97777-7777                        │
│  ├─ Leads qualificados: 23                              │
│  ├─ Reuniões agendadas: 5                               │
│  └─ [⚙️ Configurar] [🧪 Testar] [📊 Métricas]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **6 Abas de Configuração**

#### **1️⃣ Identidade da Empresa**

```
┌─────────────────────────────────────┐
│  🏢 IDENTIDADE DA EMPRESA           │
├─────────────────────────────────────┤
│                                     │
│  Nome da Empresa                    │
│  [Consultoria MaxVision         ]   │
│                                     │
│  Representante (Nome do Agente)     │
│  [Ana Silva                     ]   │
│                                     │
│  Descrição da Empresa (2000 chars)  │
│  ┌─────────────────────────────┐   │
│  │Somos especializados em...   │   │
│  │transformação digital para   │   │
│  │PMEs de 10-500 funcionários. │   │
│  └─────────────────────────────┘   │
│                                     │
│  Segmento                           │
│  [Tecnologia ▼]                     │
│                                     │
│  [💾 Salvar Configuração]           │
└─────────────────────────────────────┘
```

**Campos Disponíveis:**
- ✅ Nome da Empresa
- ✅ Nome do Representante (humano)
- ✅ Telefone de Contato
- ✅ Email da Empresa
- ✅ Descrição Completa (até 2000 caracteres)
- ✅ Segmento de Atuação
- ✅ Site Oficial

#### **2️⃣ Apresentação e Saudação**

```
┌─────────────────────────────────────┐
│  💬 APRESENTAÇÃO                    │
├─────────────────────────────────────┤
│                                     │
│  Mensagem de Boas-vindas            │
│  ┌─────────────────────────────┐   │
│  │Olá {{nome_lead}}! 👋        │   │
│  │                             │   │
│  │Sou {{representante}} da     │   │
│  │{{nome_empresa}}.            │   │
│  │                             │   │
│  │Vi seu interesse em conhecer │   │
│  │nossas soluções. Posso te    │   │
│  │ajudar? 😊                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  Tom de Voz                         │
│  ◉ Formal  ○ Casual                 │
│  ○ Técnico  ○ Amigável              │
│                                     │
│  Variáveis Disponíveis:             │
│  • {{nome_lead}}                    │
│  • {{nome_empresa}}                 │
│  • {{representante}}                │
│  • {{horario}}                      │
│  • {{dia_semana}}                   │
│                                     │
│  [👁️ Preview] [💾 Salvar]           │
└─────────────────────────────────────┘
```

**Preview em Tempo Real:**
```
🤖 Olá João! 👋

Sou Ana Silva da Consultoria MaxVision.

Vi seu interesse em conhecer nossas 
soluções. Posso te ajudar? 😊
```

#### **3️⃣ Qualificação de Leads (BANT)**

```
┌─────────────────────────────────────┐
│  ✅ QUALIFICAÇÃO DE LEADS           │
├─────────────────────────────────────┤
│                                     │
│  Perguntas de Qualificação          │
│  (Arrastar para reordenar)          │
│                                     │
│  1. ≡ Qual o principal desafio      │
│       que você quer resolver?       │
│       [✏️] [🗑️]                      │
│                                     │
│  2. ≡ Qual o prazo ideal para       │
│       implementação?                │
│       [✏️] [🗑️]                      │
│                                     │
│  3. ≡ Quem toma a decisão de        │
│       compra na sua empresa?        │
│       [✏️] [🗑️]                      │
│                                     │
│  4. ≡ Qual o orçamento              │
│       aproximado disponível?        │
│       [✏️] [🗑️]                      │
│                                     │
│  [+ Adicionar Pergunta]             │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Requisitos Obrigatórios            │
│  ☑️ Nome completo                   │
│  ☑️ Email válido                    │
│  ☑️ Telefone com WhatsApp           │
│  ☑️ Nome da empresa                 │
│  ☑️ Cargo/função                    │
│  ☑️ Tamanho da empresa              │
│  ☑️ Urgência (alta/média/baixa)     │
│  ☑️ Budget estimado                 │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Critérios de Fit (Score 0-10)      │
│                                     │
│  🟢 Alto Fit (8-10)                 │
│  • Todos requisitos preenchidos     │
│  • Orçamento adequado               │
│  • Urgência alta                    │
│  → Ação: Oferecer agendamento       │
│                                     │
│  🟡 Médio Fit (5-7)                 │
│  • Maioria requisitos ok            │
│  • Interesse claro                  │
│  → Ação: Enviar material            │
│                                     │
│  🔴 Baixo Fit (0-4)                 │
│  • Poucos requisitos                │
│  • Sem budget/urgência              │
│  → Ação: Nutrição de leads          │
│                                     │
│  [💾 Salvar Configuração]           │
└─────────────────────────────────────┘
```

#### **4️⃣ Configuração de IA**

```
┌─────────────────────────────────────┐
│  🧠 CONFIGURAÇÃO DE IA              │
├─────────────────────────────────────┤
│                                     │
│  Temperature (Criatividade)         │
│  [=======|=======] 0.7              │
│  0.0              1.0               │
│  Formal ← → Criativo                │
│                                     │
│  Top P (Diversidade)                │
│  [=========|=====] 0.9              │
│  0.0              1.0               │
│                                     │
│  Max Tokens (Tamanho da Resposta)   │
│  [======|========] 500              │
│  100             1000               │
│  Curta ← → Detalhada                │
│                                     │
│  Presence Penalty (Anti-repetição)  │
│  [====|==========] 0.6              │
│  0.0              2.0               │
│                                     │
│  Frequency Penalty (Variar)         │
│  [====|==========] 0.5              │
│  0.0              2.0               │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Configurações Pré-definidas:       │
│  • [Formal] [Conversacional]        │
│  • [Técnico] [Personalizar]         │
│                                     │
│  [💾 Salvar] [🔄 Resetar]           │
└─────────────────────────────────────┘
```

#### **5️⃣ Tratamento de Objeções**

```
┌─────────────────────────────────────┐
│  🛡️ TRATAMENTO DE OBJEÇÕES          │
├─────────────────────────────────────┤
│                                     │
│  Objeção: "Está muito caro"         │
│  ┌─────────────────────────────┐   │
│  │Entendo! Posso mostrar o ROI │   │
│  │que nossos clientes têm?     │   │
│  │Em média, recuperam o        │   │
│  │investimento em 3 meses.     │   │
│  │Quer ver um case similar?    │   │
│  └─────────────────────────────┘   │
│  Técnica: Feel, Felt, Found         │
│  [✏️ Editar] [🗑️ Remover]           │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Objeção: "Preciso pensar"          │
│  ┌─────────────────────────────┐   │
│  │Claro! Pra te ajudar a       │   │
│  │decidir melhor, qual ponto   │   │
│  │você quer avaliar? Preço,    │   │
│  │funcionalidades ou tempo?    │   │
│  └─────────────────────────────┘   │
│  Técnica: Reversão                  │
│  [✏️ Editar] [🗑️ Remover]           │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  [+ Nova Objeção]                   │
│                                     │
│  Técnicas Disponíveis:              │
│  • Feel, Felt, Found                │
│  • Reversão                         │
│  • Prova Social                     │
│  • Quebra de Risco                  │
│                                     │
└─────────────────────────────────────┘
```

#### **6️⃣ Limitações e Restrições**

```
┌─────────────────────────────────────┐
│  ⚠️ LIMITAÇÕES                      │
├─────────────────────────────────────┤
│                                     │
│  Tópicos Proibidos                  │
│  ☑️ Não discutir política           │
│  ☑️ Não dar consultoria médica      │
│  ☑️ Não prometer prazos não         │
│     confirmados                     │
│  ☑️ Não aplicar descontos sem       │
│     autorização                     │
│  ☑️ Não coletar dados sensíveis     │
│     (CPF, senha, cartão)            │
│                                     │
│  [+ Adicionar Restrição]            │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Horário de Atendimento             │
│                                     │
│  Seg-Sex: [08:00] - [18:00]         │
│  Sábado:  [09:00] - [13:00]         │
│  Domingo: [ ] Desabilitado          │
│                                     │
│  Feriados: ○ Ativo  ◉ Inativo       │
│                                     │
│  Mensagem Fora do Horário:          │
│  ┌─────────────────────────────┐   │
│  │Oi! Estamos fora do horário. │   │
│  │Nosso time volta Segunda     │   │
│  │às 08:00. Deixe sua mensagem!│   │
│  └─────────────────────────────┘   │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  Limites de Conversa                │
│  Máximo de mensagens: [15]          │
│  Ação após limite:                  │
│  ◉ Transferir para humano           │
│  ○ Agendar callback                 │
│                                     │
│  [💾 Salvar Configuração]           │
└─────────────────────────────────────┘
```

### **🧪 Playground de Testes**

Simulador de conversas antes de ativar:

```
┌─────────────────────────────────────────────────────────┐
│  🧪 PLAYGROUND - Teste seu SDR       [🔄 Reset] [❌]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Você:                                                  │
│  Oi, quero saber mais sobre o produto                   │
│                                                         │
│  🤖 SDR:                                                │
│  Olá! Sou a Ana da MaxVision. Vi seu interesse em       │
│  conhecer nossas soluções de CRM. Posso te ajudar?      │
│                                                         │
│  Você:                                                  │
│  Quanto custa?                                          │
│                                                         │
│  🤖 SDR:                                                │
│  Ótima pergunta! Nossos planos começam em R$ 497/mês.   │
│  Mas pra te dar o valor exato, preciso entender         │
│  melhor sua necessidade. Quantos usuários vocês são?    │
│                                                         │
│  Você:                                                  │
│  Somos 5 pessoas                                        │
│                                                         │
│  🤖 SDR:                                                │
│  Perfeito! Para 5 usuários, o plano Business de         │
│  R$ 997/mês é ideal. Inclui tudo que precisa.           │
│  Quer que eu agende 20 min pra te mostrar o sistema?    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  [Digite sua mensagem...               ] [Enviar ➤]     │
│                                                         │
└─────────────────────────────────────────────────────────┘

[✅ Aprovar Configuração] [🚀 Ativar Agente]
```

### **📊 Métricas do SDR**

Dashboard de performance em tempo real:

```
┌─────────────────────────────────────────────────────────┐
│  📊 MÉTRICAS - Últimos 30 dias                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💬 Total de Conversas: 127                             │
│  ✅ Leads Qualificados: 47 (37%)                        │
│  📅 Reuniões Agendadas: 12 (9.4%)                       │
│  🎯 Taxa de Conversão: 25.5%                            │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📈 Tendência Semanal:                                  │
│     ╭─╮                                                 │
│  ╭─╯ ╰─╮                                                │
│ ╭╯     ╰──╮                                             │
│ │         ╰───────                                      │
│  S  S  T  Q  Q  S  S                                    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  🏆 Top Objeções Tratadas:                              │
│  1. "Está muito caro" - 23x (48% convertido)            │
│  2. "Preciso pensar" - 18x (33% convertido)             │
│  3. "Já uso outra ferramenta" - 12x (25% convertido)    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  ⏱️ Tempo Médio de Qualificação: 8 min                  │
│  📝 Média de Mensagens por Lead: 12                     │
│  ⭐ Score Médio de Fit: 7.2/10                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 **CRM PIPELINE**

### **Visão Geral do CRM**

O CRM Pipeline é um sistema **Kanban visual** integrado ao WhatsApp para gerenciar todo o funil de vendas.

### **Interface Kanban**

```
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ 🆕 NOVO │ 📞 CONT │ ✅ QUAL │ 📋 PROP │ 🤝 NEGO │ 🎉 GANH │ ❌ PERD │
│  (12)   │  (8)    │  (5)    │  (3)    │  (2)    │  (1)    │  (4)    │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│         │         │         │         │         │         │         │
│ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │ ┌─────┐ │
│ │Ana  │ │ │Carlos│ │ │Maria│ │ │Pedro│ │ │Bruno│ │ │Laura│ │ │João │ │
│ │Silva│ │ │Lima │ │ │Costa│ │ │Souza│ │ │Alves│ │ │Rocha│ │ │Pinto│ │
│ │     │ │ │     │ │ │     │ │ │     │ │ │     │ │ │     │ │ │     │ │
│ │⭐⭐⭐ │ │⭐⭐   │ │ │⭐⭐⭐⭐│ │⭐⭐⭐  │ │ │⭐⭐⭐⭐│ │⭐⭐⭐⭐│ │ │⭐   │ │
│ │R$2.5k│ │ │R$1.2k│ │ │R$3k │ │ │R$5k │ │ │R$8k │ │ │R$12k│ │ │R$2k │ │
│ │📱Zap │ │ │📱Zap │ │ │📱Zap│ │ │📱Zap│ │ │📱Zap│ │ │✅OK │ │ │❌X  │ │
│ └─────┘ │ └─────┘ │ └─────┘ │ └─────┘ │ └─────┘ │ └─────┘ │ └─────┘ │
│         │         │         │         │         │         │         │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
       ↓ Arrastar e Soltar entre colunas
```

### **7 Estágios do Pipeline**

| Estágio | Descrição | Conv. Esperada |
|---------|-----------|----------------|
| 🆕 **Novo** | Lead entrou, não contatado | - |
| 📞 **Contatado** | Primeiro contato realizado | 40-60% |
| ✅ **Qualificado** | Atende critérios BANT | 30-50% |
| 📋 **Proposta** | Proposta enviada | 25-40% |
| 🤝 **Negociando** | Em negociação ativa | 40-60% |
| 🎉 **Ganho** | Venda fechada! | - |
| ❌ **Perdido** | Não converteu | - |

### **Sheet de Detalhes do Lead**

Ao clicar em um card, abre Sheet lateral com 3 abas:

#### **📋 Aba Tarefas**

```
┌─────────────────────────────────────┐
│  📋 TAREFAS                    [×]  │
├─────────────────────────────────────┤
│                                     │
│  ✅ Enviar proposta comercial       │
│     Concluída em 10/12 às 14:30     │
│     por João Vendedor               │
│                                     │
│  ⏳ Ligar para confirmar            │
│     Hoje às 16:00                   │
│     🔔 Lembrete em 30 min           │
│     [Marcar Concluída]              │
│                                     │
│  ⬜ Agendar reunião fechamento      │
│     Amanhã                          │
│     [✏️ Editar] [🗑️ Excluir]        │
│                                     │
│  [+ Nova Tarefa]                    │
│                                     │
└─────────────────────────────────────┘
```

#### **📅 Aba Agenda**

```
┌─────────────────────────────────────┐
│  📅 AGENDA                     [×]  │
├─────────────────────────────────────┤
│                                     │
│  🗓️ Reunião de Apresentação         │
│     15/12 às 10:00 (30 min)         │
│     📍 Google Meet                  │
│     🔗 meet.google.com/abc-def      │
│     [Entrar] [Editar]               │
│                                     │
│  🗓️ Demo do Produto                 │
│     18/12 às 14:00 (45 min)         │
│     📍 Presencial - Sala 3          │
│     [Ver Mapa] [Editar]             │
│                                     │
│  [+ Novo Evento]                    │
│  [📤 Enviar Convite WhatsApp]       │
│                                     │
└─────────────────────────────────────┘
```

#### **📝 Aba Notas**

```
┌─────────────────────────────────────┐
│  📝 NOTAS                      [×]  │
├─────────────────────────────────────┤
│                                     │
│  🗓️ 14/12/2025 - 15:30              │
│  Por: João Vendedor                 │
│  ┌─────────────────────────────┐   │
│  │Cliente demonstrou interesse │   │
│  │forte em automatizar WhatsApp│   │
│  │Mencionou que usa Zoho CRM.  │   │
│  │Budget aprovado até R$ 2k/mês│   │
│  │                             │   │
│  │Próximo: Enviar case similar │   │
│  └─────────────────────────────┘   │
│  [✏️ Editar]                        │
│                                     │
│  🤖 Mensagem WhatsApp - 14/12 16:45 │
│  ┌─────────────────────────────┐   │
│  │"Recebi a proposta. Está     │   │
│  │dentro do que conversamos."  │   │
│  └─────────────────────────────┘   │
│                                     │
│  [+ Nova Nota]                      │
│  [📎 Anexar Arquivo]                │
│                                     │
└─────────────────────────────────────┘
```

### **Métricas do CRM**

```
┌─────────────────────────────────────────────────────────┐
│  📊 MÉTRICAS DO PIPELINE                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  💰 Valor Total em Pipeline: R$ 145.000                 │
│  📈 Taxa de Conversão Geral: 18.5% (+2.3%)              │
│  ⏱️ Tempo Médio de Fechamento: 28 dias (-5d)            │
│  🎯 Deals Fechados (mês): 12/15 (80%)                   │
│  💸 Ticket Médio: R$ 4.150 (+12%)                       │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Conversão por Estágio:                                 │
│  Novo → Contatado: ████████░░ 65%                       │
│  Contatado → Qualificado: ██████░░░░ 52%                │
│  Qualificado → Proposta: █████░░░░░ 38%                 │
│  Proposta → Negociando: ███████░░░ 55%                  │
│  Negociando → Ganho: ██████░░░░ 48%                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **Filtros e Visualizações**

```
🔍 Filtros:
┌─────────────────────────────────────┐
│ Vendedor: [Todos ▼]                 │
│ Origem: [WhatsApp, SDR, Form]       │
│ Score: [Alto, Médio, Baixo]         │
│ Budget: [<R$500, R$500-2k, >R$5k]   │
│ Prazo: [Urgente, Curto, Médio]      │
│ Produto: [Produto A, B, C]          │
│ Última Interação: [Hoje, 3d, 7d]    │
│                                     │
│ [Aplicar] [Limpar]                  │
└─────────────────────────────────────┘

Visualizações:
📊 Kanban  │  📋 Lista  │  📅 Timeline  │  📈 Funil
```

### **Integração WhatsApp → CRM**

Automação inteligente:

```typescript
// Palavras-chave detectadas automaticamente
"proposta" → Move para "Proposta"
"reunião" → Cria evento na agenda
"não tenho interesse" → Move para "Perdido"
"fechado" → Move para "Ganho"
"orçamento" → Adiciona nota de budget
```

### **Importação de Contatos WhatsApp**

Botão especial no CRM:

```
[📱 Importar Contatos do WhatsApp]

┌─────────────────────────────────────┐
│  SINCRONIZAR CONTATOS               │
├─────────────────────────────────────┤
│                                     │
│  Instância: [SDR Corporativo ▼]     │
│                                     │
│  Filtros:                           │
│  ✅ Apenas contatos individuais     │
│  ❌ Excluir listas transmissão      │
│  ❌ Excluir grupos                  │
│  ✅ Apenas com nome salvo           │
│  ✅ Interação recente (90 dias)     │
│                                     │
│  Contatos encontrados: 2.347        │
│                                     │
│  [🔄 Sincronizar Agora]             │
│                                     │
└─────────────────────────────────────┘

Progresso: ████████░░ 78%
⏱️ 1.831/2.347 - 2 min restantes
```

**Após Sincronização:**
```
✅ Sincronização Concluída!

📊 Resumo:
• Total importado: 1.831 contatos
• Novos no CRM: 1.650
• Já existiam: 181
• Status aplicado: "Novo"

Próximos passos:
1. Revisar contatos importados
2. Aplicar tags/segmentação
3. Atribuir a vendedores

[Ver Contatos] [Fechar]
```

### **Status do Agente**

| Status | Ícone | Descrição |
|--------|-------|-----------|
| 🔴 Desconectado | ❌ | WhatsApp não conectado |
| 🟡 Pausado | ⏸️ | Conectado mas inativo |
| 🟢 Ativo | ▶️ | Respondendo mensagens |

---

## 🔔 **NOTIFICAÇÕES E ALERTAS**

### **Sistema de Notificações**

O app possui um sistema completo de notificações em tempo real.

### **Tipos de Notificações**

| Tipo | Ícone | Exemplo |
|------|-------|---------|
| 💰 **Financeiras** | 💳 | "Conta vencendo amanhã" |
| 📅 **Agenda** | 📆 | "Reunião em 30 minutos" |
| 🎯 **Metas** | 🏆 | "Meta 80% concluída!" |
| ⚠️ **Alertas** | ⚡ | "Saldo negativo detectado" |
| 🔧 **Sistema** | ⚙️ | "Plano atualizado" |

### **Centro de Notificações**

```
┌─────────────────────────────────────┐
│  🔔 Notificações                [x] │
├─────────────────────────────────────┤
│  ● 💰 Conta de luz vence amanhã     │
│    R$ 180,00 - Moradia              │
│    há 2 horas                       │
├─────────────────────────────────────┤
│  ● 📅 Reunião com cliente           │
│    Hoje às 15:00                    │
│    há 1 hora                        │
├─────────────────────────────────────┤
│  ○ 🎯 Meta 50% concluída!           │
│    Reserva de emergência            │
│    ontem                            │
└─────────────────────────────────────┘
```

### **Bell Dropdown**

- Badge com contador de não lidas
- Dropdown com preview
- Link para ver todas
- Marcar como lidas

---

## 👤 **PERFIL E ASSINATURAS**

### **Página de Perfil**

A página de perfil oferece gerenciamento completo da conta.

### **Abas do Perfil**

| Aba | Conteúdo |
|-----|----------|
| 👤 **Dados** | Nome, email, telefone, CPF, avatar |
| 👑 **Plano** | Assinatura atual e upgrade |
| 🔒 **Privacidade** | Configurações de privacidade |
| 💾 **Backup** | Exportação e backup de dados |

### **Upload de Avatar**

- Arrastar e soltar imagem
- Crop e redimensionamento
- Preview em tempo real
- Upload para Supabase Storage

### **Gerenciamento de Planos**

```
┌─────────────────────────────────────┐
│  👑 Seu Plano: BUSINESS             │
│  Status: ✅ Ativo                   │
├─────────────────────────────────────┤
│                                     │
│  ✓ Tudo do plano Básico             │
│  ✓ Número WhatsApp dedicado         │
│  ✓ Suporte prioritário 24/7         │
│  ✓ Agente SDR                       │
│  ✓ Agente de Marketing              │
│                                     │
│  [Gerenciar Assinatura]             │
│                                     │
└─────────────────────────────────────┘
```

### **Upgrade de Plano**

1. Selecione novo plano
2. Redirecionamento para Stripe Checkout
3. Pagamento seguro
4. Atualização automática via webhook
5. Novo plano ativo instantaneamente

---

## ✨ **ANIMAÇÕES E EXPERIÊNCIA VISUAL**

### **Animações Implementadas**

O app utiliza **Framer Motion** para animações fluidas em toda a interface.

### **Tipos de Animações**

#### **🎬 Entrada de Componentes**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
/>
```

#### **🔄 Transições de Página**
```typescript
<AnimatePresence mode="wait">
  <motion.div
    key="page"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  />
</AnimatePresence>
```

#### **✨ Hover Effects**
```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

### **Animações Especiais**

#### **🌌 Tela de Chat Espacial**
- Campo de estrelas animado (60+ partículas)
- Nebulosas pulsantes com gradientes
- Robô 3D interativo (Spline)
- Efeito parallax no scroll

#### **📊 Gráficos Animados**
- Barras crescendo gradualmente
- Pizza rotacionando e expandindo
- Linhas desenhando progressivamente

#### **🎴 Cards Stagger**
- Listas aparecem item por item
- Delay progressivo (100ms por item)
- Efeito cascade elegante

### **Performance das Animações**

| Técnica | Benefício |
|---------|-----------|
| `will-change` | GPU acceleration |
| `transform` | Composited animations |
| `requestAnimationFrame` | 60fps consistency |
| Lazy loading | Reduced initial load |

---

## 📱 **EXPERIÊNCIA MOBILE**

### **PWA Features**

O app é uma **Progressive Web App** completa:

- 📲 **Instalável**: Adicionar à tela inicial
- 🔔 **Notificações Push**: Alertas mesmo fechado
- 📴 **Offline First**: Funciona sem internet
- ⚡ **Fast Loading**: Service Worker cache

### **Gestos Touch**

- 👆 **Tap**: Selecionar items
- 👆👆 **Double Tap**: Zoom em gráficos
- 👉 **Swipe**: Navegar entre abas
- 🤏 **Pinch**: Zoom na agenda

---

## 🔐 **SEGURANÇA DO APP**

### **Medidas de Segurança**

| Camada | Proteção |
|--------|----------|
| 🔐 **Autenticação** | JWT + Supabase Auth |
| 🛡️ **Autorização** | Row Level Security (RLS) |
| 🔒 **Criptografia** | HTTPS + AES-256 |
| ✅ **Validação** | Zod schemas |
| 🧹 **Sanitização** | DOMPurify inputs |

### **Proteção de Rotas**

```typescript
<ProtectedRoute>
  <AppLayout>
    <Dashboard />
  </AppLayout>
</ProtectedRoute>
```

---

© 2025 Meu Agente. Todos os direitos reservados.
