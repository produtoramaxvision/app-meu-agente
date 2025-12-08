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

O Agente SDR (Sales Development Representative) é um **assistente de vendas com IA** que qualifica leads automaticamente via WhatsApp.

> ⚠️ **Disponível apenas nos planos Business e Premium**

### **Abas do Agente SDR**

| Aba | Função |
|-----|--------|
| ⚡ **Conexão** | Conectar WhatsApp via QR Code |
| ⚙️ **Configurar** | Personalizar comportamento do agente |
| 🧪 **Testar** | Playground para simular conversas |
| 📊 **Métricas** | Dashboard de performance |

### **Conexão WhatsApp**

```
┌─────────────────────────────────────┐
│  📱 Conectar WhatsApp               │
├─────────────────────────────────────┤
│                                     │
│       ┌─────────────────┐           │
│       │ ██████████████  │           │
│       │ █ QR CODE     █ │           │
│       │ █   Scan me   █ │           │
│       │ ██████████████  │           │
│       └─────────────────┘           │
│                                     │
│  Status: 🟢 Conectado               │
│  Número: +55 11 99999-9999          │
│                                     │
└─────────────────────────────────────┘
```

### **Configurações do Agente**

- 📝 **Mensagem de Boas-vindas**: Personalizar saudação
- ❓ **Perguntas de Qualificação**: Definir perguntas
- 🎯 **Critérios de Fit**: Alto, médio, baixo
- 📅 **Disponibilidade**: Dias e horários
- ⏱️ **Duração de Reunião**: 15, 20, 30, 45, 60 min

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
