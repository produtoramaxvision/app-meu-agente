# 📚 DOCUMENTAÇÃO TÉCNICA COMPLETA
## Meu Agente - Sistema de Gestão Financeira e Agentes de IA

---

## 📋 **ÍNDICE**

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Funcionalidades do App](#funcionalidades-do-app)
5. [Chat com IA Integrado](#chat-com-ia-integrado)
6. [Agente SDR](#agente-sdr)
7. [Animações e UI/UX](#animações-e-uiux)
8. [Gestão de Assinaturas e Planos](#gestão-de-assinaturas-e-planos)
9. [Validações e Segurança](#validações-e-segurança)
10. [Integração com Supabase](#integração-com-supabase)
11. [Componentes e Hooks](#componentes-e-hooks)
12. [Deploy e Produção](#deploy-e-produção)

---

## 🎯 **VISÃO GERAL DO SISTEMA**

### **Descrição**
O Meu Agente é uma aplicação web completa que combina **gestão financeira pessoal** com **agentes de IA conversacionais**. O sistema oferece uma experiência visual imersiva com animações 3D, chat com IA integrado para todos os planos, e integração com WhatsApp para planos pagos.

### **Características Principais**
- ✅ **Interface Premium**: Design com glassmorphism, gradientes e animações Framer Motion
- ✅ **Chat com IA**: Agente conversacional integrado (disponível até no plano Free)
- ✅ **Animações 3D**: Cena espacial interativa com Spline na tela de chat
- ✅ **Agente SDR**: Qualificação de leads via WhatsApp (Business/Premium)
- ✅ **Dashboard Financeiro**: Gráficos interativos e métricas em tempo real
- ✅ **Agenda Avançada**: 6 visualizações com drag-and-drop
- ✅ **PWA Ready**: Funciona como app nativo no celular
- ✅ **Realtime**: Atualizações instantâneas via WebSocket
- ✅ **Assinaturas Stripe**: Checkout, Portal e Webhooks

### **Status Atual**
- **Versão**: 2.0.0
- **Status**: ✅ **PRODUÇÃO READY**
- **Última Atualização**: Dezembro/2025

---

## 🏗️ **ARQUITETURA E TECNOLOGIAS**

### **Stack Tecnológico**

#### **Frontend**
- **React 18.2.0**: Framework principal
- **TypeScript 5.0+**: Linguagem de programação
- **Vite 4.0+**: Build tool e dev server
- **Tailwind CSS 3.0+**: Framework CSS
- **ShadcnUI v4**: Biblioteca de componentes

#### **Backend e Banco de Dados**
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Banco de dados principal
- **Row Level Security (RLS)**: Segurança de dados
- **Edge Functions (Deno)**: Processamento de pagamentos e webhooks

#### **Bibliotecas Principais**
- **@tanstack/react-query**: Gerenciamento de estado servidor
- **@dnd-kit**: Drag and drop
- **Zod**: Validação de schemas
- **Sonner**: Sistema de notificações
- **React Hook Form**: Gerenciamento de formulários
- **Recharts**: Gráficos e visualizações

### **Arquitetura do Sistema**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   PostgreSQL    │
│   (React/TS)    │◄──►│   (Backend)     │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       │                       │
    ┌─────────┐            ┌─────────────┐        ┌──────────────┐
    │ ShadcnUI│            │ Edge Funcs  │◄──────►│   Stripe     │
    │ Tailwind│            │ (Webhooks)  │        │  (Payment)   │
    │ Framer  │            └─────────────┘        └──────────────┘
    │ Motion  │                  ▲
    │ Spline  │                  │
    └─────────┘            ┌─────────────┐
         │                 │  Realtime   │
         ▼                 │ Subscription│
    ┌─────────┐            └─────────────┘
    │ n8n     │                  ▲
    │ Webhook │◄─────────────────┘
    │(Chat IA)│
    └─────────┘
```

---

## 📁 **ESTRUTURA DO PROJETO**

```
meu-agente/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Componentes base (ShadcnUI v4)
│   │   ├── chat/           # Componentes do Chat com IA
│   │   │   ├── ChatIntroAnimation.tsx  # Animação espacial 3D
│   │   │   ├── ChatMessage.tsx         # Mensagens do chat
│   │   │   ├── PromptInputBox.tsx      # Input com histórico
│   │   │   └── ...
│   │   ├── sdr/            # Componentes do Agente SDR
│   │   │   ├── SDRConnectionCard.tsx   # Conexão WhatsApp
│   │   │   ├── SDRConfigForm.tsx       # Configurações
│   │   │   ├── SDRPlayground.tsx       # Testes
│   │   │   └── ...
│   │   ├── layout/         # Componentes de layout
│   │   └── ...
│   ├── pages/              # Páginas da aplicação
│   │   ├── Dashboard.tsx   # Dashboard financeiro
│   │   ├── Chat.tsx        # Chat com IA
│   │   ├── AgenteSDR.tsx   # Agente SDR
│   │   ├── Contas.tsx      # Gestão de contas
│   │   ├── Goals.tsx       # Metas financeiras
│   │   ├── Agenda.tsx      # Agenda e eventos
│   │   ├── Tasks.tsx       # Tarefas
│   │   ├── Profile.tsx     # Perfil e assinatura
│   │   └── ...
│   ├── hooks/              # Hooks customizados
│   │   ├── useChatAgent.ts       # Lógica do chat com IA
│   │   ├── useSDRAgent.ts        # Lógica do agente SDR
│   │   ├── usePlanInfo.ts        # Informações de planos
│   │   ├── useFinancialData.ts   # Dados financeiros
│   │   └── ...
│   ├── contexts/           # Contextos React
│   │   ├── AuthContext.tsx       # Autenticação + Realtime
│   │   ├── SearchContext.tsx     # Busca global
│   │   └── ThemeContext.tsx      # Tema claro/escuro
│   ├── types/              # Tipos TypeScript
│   │   ├── chat.ts         # Tipos do chat
│   │   └── ...
│   └── integrations/       # Integrações externas
│       └── supabase/
├── supabase/               # Configuração Supabase
│   ├── functions/          # Edge Functions
│   │   ├── create-checkout-session/
│   │   ├── create-portal-session/
│   │   └── stripe-webhook/
│   └── migrations/         # Migrações do banco
├── docs/                   # Documentação técnica
├── docs-site/              # Documentação do site
└── public/                 # Arquivos estáticos
```

---

## 🚀 **FUNCIONALIDADES DO APP**

### **1. Dashboard Financeiro**
- ✅ Cards de métricas com gradientes animados
- ✅ Gráfico de evolução diária (área)
- ✅ Gráfico de distribuição por categoria (pizza interativa)
- ✅ Card de meta principal com progresso
- ✅ Lista de contas próximas
- ✅ Tarefas pendentes
- ✅ Filtro por período (7, 30, 90, 365 dias)

### **2. Gestão de Contas**
- ✅ Abas: A Pagar, A Receber, Pagas, Recebidas
- ✅ Cards de resumo com totais
- ✅ Lista de transações com animações stagger
- ✅ Filtros por categoria e período
- ✅ Ações: Editar, Duplicar, Excluir

### **3. Metas Financeiras**
- ✅ Criar metas com valor e prazo
- ✅ Barra de progresso animada
- ✅ Tipos: Economia, Compra, Viagem, Educação
- ✅ Ações: Editar, Concluir, Excluir

### **4. Agenda e Eventos**
- ✅ 6 visualizações: Dia, Semana, Mês, Lista, Timeline, Ano
- ✅ Drag-and-drop para eventos
- ✅ Criação rápida via popover
- ✅ Filtros: Calendário, Categoria, Prioridade, Status
- ✅ Integração Google Calendar (planos pagos)

### **5. Tarefas**
- ✅ Estatísticas: Total, Pendentes, Concluídas, Atrasadas
- ✅ Filtros por status e busca
- ✅ Prioridades com cores
- ✅ Ações: Concluir, Editar, Duplicar, Excluir

### **6. Notificações**
- ✅ Bell dropdown com contador
- ✅ Tipos: Financeiras, Agenda, Metas, Sistema
- ✅ Marcar como lidas
- ✅ Link para página completa

### **7. Perfil e Assinaturas**
- ✅ Upload de avatar com crop
- ✅ Edição de dados pessoais
- ✅ Visualização do plano atual
- ✅ Cards de upgrade
- ✅ Redirecionamento para Stripe

---

## 🤖 **CHAT COM IA INTEGRADO**

### **Visão Geral**
O Chat com IA é um agente conversacional integrado diretamente no app, disponível para **todos os planos** (incluindo Free). Ele se conecta a um webhook n8n para processamento inteligente.

### **Arquitetura do Chat**

```
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│   Usuário       │        │   App (React)   │        │   n8n Webhook   │
│                 │───────►│                 │───────►│                 │
│   Envia msg     │        │   useChatAgent  │        │   Processa IA   │
└─────────────────┘        └─────────────────┘        └─────────────────┘
                                    │                          │
                                    ▼                          ▼
                           ┌─────────────────┐        ┌─────────────────┐
                           │   Supabase      │        │   Resposta IA   │
                           │   (Histórico)   │◄───────│                 │
                           └─────────────────┘        └─────────────────┘
```

### **Hook useChatAgent**

```typescript
// Funcionalidades principais
export function useChatAgent() {
  // Estados
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  
  // Queries
  const { data: allSessions } = useQuery({...}); // Todas as sessões
  const { data: session } = useQuery({...});     // Sessão ativa
  const { data: messages } = useQuery({...});    // Mensagens da sessão
  
  // Mutations
  const sendMessage = useMutation({...});        // Enviar mensagem
  const createSession = useMutation({...});      // Criar sessão
  
  // Funções expostas
  return {
    messages,
    allSessions,
    sendMessage,
    retryMessage,
    clearMessages,
    selectSession,
    isLoading,
    messagesEndRef,
    isWebhookConfigured,
  };
}
```

### **Animação Espacial (ChatIntroAnimation)**

O componente cria uma experiência visual imersiva:

```typescript
// Elementos da animação
const starPositions = useMemo(() => generateStarPositions(60), []);

// Estrutura
<div className="absolute inset-0 bg-gradient-to-b from-black via-[#050508] to-[#0a0a0f]">
  {/* Nebulosas pulsantes */}
  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.12, 0.08] }} />
  
  {/* Campo de estrelas */}
  {starPositions.map(star => (
    <motion.div animate={{ opacity: [0, star.opacity, 0], y: [0, -150, -300] }} />
  ))}
  
  {/* Robô 3D (Spline) */}
  <SplineScene scene="https://prod.spline.design/..." />
  
  {/* Input flutuante */}
  <PromptInputBox />
</div>
```

### **Tabelas do Banco**

```sql
-- Sessões de chat
CREATE TABLE chat_ia_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL REFERENCES clientes(phone),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensagens
CREATE TABLE chat_ia_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_ia_sessions(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 **AGENTE SDR**

### **Visão Geral**
O Agente SDR (Sales Development Representative) é um assistente de vendas com IA que qualifica leads automaticamente via WhatsApp. Disponível apenas nos planos **Business** e **Premium**.

### **Arquitetura**

```
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│   WhatsApp      │        │   Evolution API │        │   n8n           │
│   (Mensagens)   │◄──────►│   (Conexão)     │◄──────►│   (Automação)   │
└─────────────────┘        └─────────────────┘        └─────────────────┘
                                    │                          │
                                    ▼                          ▼
                           ┌─────────────────┐        ┌─────────────────┐
                           │   Supabase      │        │   IA (GPT/etc)  │
                           │   (Config/Logs) │        │   Processamento │
                           └─────────────────┘        └─────────────────┘
```

### **Hook useSDRAgent**

```typescript
export function useSDRAgent() {
  return {
    instance,           // Dados da instância WhatsApp
    config,             // Configurações do agente
    isAgentActive,      // Status de ativação
    isConnected,        // Status da conexão WhatsApp
    isLoadingInstance,
    isLoadingConfig,
    toggleActive,       // Ativar/pausar agente
    isSaving,
  };
}
```

### **Componentes SDR**

| Componente | Função |
|------------|--------|
| `SDRConnectionCard` | Exibe QR Code e status da conexão |
| `SDRConfigForm` | Formulário de configuração |
| `SDRPlayground` | Área de testes do agente |
| `SDRStatusBadge` | Badge de status (conectado/desconectado) |
| `SDRQRCodeDisplay` | Exibição do QR Code |

### **Fluxo de Qualificação**

```
1. Lead envia mensagem
       ↓
2. Recepção humanizada
       ↓
3. Coleta: nome, empresa, interesse, urgência, orçamento
       ↓
4. Qualificação: fit (alto/médio/baixo)
       ↓
5. Oferta: reunião ou orçamento
       ↓
6. Agendamento automático (Google Calendar)
       ↓
7. Confirmação (WhatsApp + e-mail)
```

---

## ✨ **ANIMAÇÕES E UI/UX**

### **Tecnologias de Animação**

| Tecnologia | Uso |
|------------|-----|
| **Framer Motion** | Animações de componentes React |
| **Spline** | Cenas 3D interativas |
| **Tailwind** | Transições CSS |
| **Recharts** | Gráficos animados |

### **Padrões de Animação**

#### **Fade In**
```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
/>
```

#### **Slide Up**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
/>
```

#### **Stagger Children**
```typescript
{items.map((item, index) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.1 }}
  />
))}
```

#### **Hover Scale**
```typescript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>
```

### **Design System**

#### **Glassmorphism**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### **Gradientes**
```css
.gradient-card {
  background: linear-gradient(
    to bottom right,
    var(--surface),
    var(--surface-95),
    var(--background)
  );
}
```

---

## 💳 **GESTÃO DE ASSINATURAS E PLANOS**

O sistema utiliza uma lógica robusta de consistência de dados garantida por **Triggers no PostgreSQL**.

### **Regra de Negócio (Enforcement)**
Existe uma *Constraint* e um *Trigger* no banco de dados (`enforce_cliente_subscription_flags`) que garante:

1. **Conta Banida (`is_active = false`)**:
   - `subscription_active` é forçado para `FALSE`.
   
2. **Conta Ativa sem Plano Pago**:
   - Se `plan_id` for `NULL` ou `free` ou inválido.
   - `subscription_active` é forçado para `FALSE`.
   - `plan_id` é normalizado para `free`.

3. **Conta Ativa com Plano Pago**:
   - Se `plan_id` for `basic`, `business` ou `premium`.
   - `subscription_active` é forçado para `TRUE`.

Isso elimina a possibilidade de estados inconsistentes (ex: plano Premium com assinatura inativa) e simplifica o frontend.

### **Fluxo de Atualização**
1. **Stripe Webhook** recebe evento (ex: `customer.subscription.updated`).
2. Edge Function atualiza apenas o `plan_id` na tabela `clientes`.
3. **Trigger do Banco** recalcula automaticamente `subscription_active`.
4. **Supabase Realtime** notifica o frontend (`AuthContext`).
5. UI atualiza instantaneamente sem refresh.

---

## 🔒 **VALIDAÇÕES E SEGURANÇA**

### **Validações Frontend**
- Zod schemas para formulários.
- Prevenção de duplicatas financeiras.

### **Segurança Backend (RLS)**
Todas as tabelas possuem RLS habilitado.
- **Política de Acesso**: Baseada em `auth.uid()` mapeado para o `phone` do cliente.
- **Isolamento**: Usuários só acessam seus próprios dados.

---

## 🗄️ **INTEGRAÇÃO COM SUPABASE**

### **Edge Functions**
- `create-checkout-session`: Gera sessão de pagamento Stripe.
- `create-portal-session`: Gera link para portal do cliente Stripe.
- `stripe-webhook`: Processa eventos do Stripe de forma segura.

---

## 📊 **MÉTRICAS E PERFORMANCE**

- **Realtime**: Latência < 100ms para atualizações de plano.
- **Otimizações**: Memoização de contextos (`AuthContext`), lazy loading de páginas.

---

**Documentação técnica atualizada em**: 24/11/2025  
**Versão**: 1.1.0  
**Status**: ✅ **PRODUÇÃO READY**
