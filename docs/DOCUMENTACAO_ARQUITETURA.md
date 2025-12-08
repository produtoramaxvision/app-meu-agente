# 🏗️ DOCUMENTAÇÃO DE ARQUITETURA
## Meu Agente - Arquitetura e Design do Sistema

---

## 📋 **ÍNDICE**

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Arquitetura de Alto Nível](#arquitetura-de-alto-nível)
3. [Arquitetura do Chat com IA](#arquitetura-do-chat-com-ia)
4. [Arquitetura do Agente SDR](#arquitetura-do-agente-sdr)
5. [Arquitetura Frontend](#arquitetura-frontend)
6. [Arquitetura Backend](#arquitetura-backend)
7. [Arquitetura de Dados](#arquitetura-de-dados)
8. [Padrões de Design](#padrões-de-design)
9. [Fluxos de Dados](#fluxos-de-dados)
10. [Decisões Arquiteturais](#decisões-arquiteturais)
11. [Escalabilidade](#escalabilidade)
12. [Segurança](#segurança)

---

## 🎯 **VISÃO GERAL DA ARQUITETURA**

### **Filosofia Arquitetural**

O Meu Agente é um **sistema híbrido** que combina:
- **Gestão Financeira Pessoal** - CRUD completo com visualizações avançadas
- **Agentes de IA Conversacionais** - Chat integrado via webhooks n8n
- **Automação de Vendas (SDR)** - Qualificação de leads via WhatsApp

O sistema foi projetado seguindo os princípios de:
- **Modularidade**: Componentes independentes e reutilizáveis
- **Escalabilidade**: Preparado para crescimento horizontal
- **Manutenibilidade**: Código limpo e bem estruturado
- **Performance**: Otimizado para velocidade e eficiência
- **Segurança**: Proteção de dados em todas as camadas
- **Experiência Imersiva**: Animações e interações premium

### **Stack Tecnológico**

#### **Frontend**
- **React 18**: Framework principal com hooks modernos
- **TypeScript**: Tipagem estática para maior confiabilidade
- **Vite**: Build tool otimizado para desenvolvimento
- **Tailwind CSS**: Framework CSS utilitário
- **ShadcnUI v4**: Biblioteca de componentes
- **Framer Motion**: Animações fluidas
- **Spline**: Animações 3D interativas (robô do chat)
- **Recharts**: Gráficos financeiros

#### **Backend**
- **Supabase**: Backend-as-a-Service completo
- **PostgreSQL**: Banco de dados relacional
- **Edge Functions**: Serverless functions em Deno
- **Row Level Security**: Segurança a nível de linha
- **Stripe**: Processamento de pagamentos

#### **Integrações IA**
- **n8n Webhooks**: Orquestração de agentes de IA
- **Evolution API**: Conexão WhatsApp para SDR
- **OpenAI/LLMs**: Processamento de linguagem natural

#### **DevOps**
- **Vercel**: Deploy e hosting
- **GitHub Actions**: CI/CD
- **Supabase CLI**: Gerenciamento de banco
- **Docker**: Containerização (futuro)

---

## 🏛️ **ARQUITETURA DE ALTO NÍVEL**

### **Diagrama de Arquitetura Completo**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser/PWA)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  React App (Frontend)                                                  │
│  ├── Pages (Dashboard, Chat, Contas, Goals, Agenda, SDR, etc.)        │
│  ├── Components (UI + Animações Spline/Framer Motion)                 │
│  ├── Hooks (useChatAgent, useSDRAgent, useFinancialData, etc.)        │
│  ├── Contexts (Auth, Theme, Notifications)                            │
│  └── Utils (Formatters, Validators, API Clients)                      │
└───────────┬──────────────────────────────┬──────────────────┬──────────┘
            │                              │                  │
            │ HTTPS/REST                   │ Webhook          │ HTTPS
            │ WebSocket                    │ Requests         │
            ▼                              ▼                  ▼
┌───────────────────────┐   ┌──────────────────────┐   ┌──────────────────┐
│   SUPABASE (Backend)  │   │   n8n (Automação)    │   │  STRIPE (Pagtos) │
├───────────────────────┤   ├──────────────────────┤   ├──────────────────┤
│ ├── Auth Service      │   │ ├── Chat IA Webhook  │   │ ├── Checkout     │
│ ├── REST API          │   │ ├── SDR AI Workflow  │   │ ├── Portal       │
│ ├── Real-time         │   │ └── Lead Scoring     │   │ └── Webhooks     │
│ ├── Edge Functions    │   └──────────────────────┘   └──────────────────┘
│ └── Storage           │              │
└───────────┬───────────┘              │
            │                          │
            │ SQL                      │ HTTP
            ▼                          ▼
┌───────────────────────┐   ┌──────────────────────┐
│  POSTGRESQL (Database)│   │  EVOLUTION API       │
├───────────────────────┤   ├──────────────────────┤
│ ├── Tabelas           │   │ ├── WhatsApp Connect │
│ ├── Views             │   │ ├── Messages         │
│ ├── RLS Policies      │   │ └── QR Code          │
│ └── Triggers          │   └──────────────────────┘
└───────────────────────┘
```

### **Camadas do Sistema**

#### **🎨 Camada de Apresentação (Frontend)**
- **Responsabilidade**: Interface do usuário e interação
- **Tecnologias**: React, TypeScript, Tailwind CSS, Framer Motion
- **Padrões**: Component-based, Hook-based
- **Animações**: Spline 3D, CSS Animations, Framer Motion

#### **🤖 Camada de IA (Chat & SDR)**
- **Responsabilidade**: Processamento de linguagem natural e automações
- **Tecnologias**: n8n Webhooks, OpenAI, Evolution API
- **Padrões**: Webhook-based, Event-driven

#### **🔧 Camada de Aplicação (Business Logic)**
- **Responsabilidade**: Lógica de negócio e regras
- **Tecnologias**: React Hooks, Edge Functions
- **Padrões**: Custom Hooks, Service Layer

#### **🗄️ Camada de Dados (Data Layer)**
- **Responsabilidade**: Persistência e acesso a dados
- **Tecnologias**: PostgreSQL, Supabase
- **Padrões**: Repository, Active Record

#### **🔐 Camada de Segurança (Security Layer)**
- **Responsabilidade**: Autenticação e autorização
- **Tecnologias**: JWT, RLS, HTTPS
- **Padrões**: Token-based Auth, Row-level Security

---

## 💬 **ARQUITETURA DO CHAT COM IA**

### **Visão Geral**

O Chat com IA é um sistema conversacional integrado que permite aos usuários interagir com agentes de IA através de linguagem natural. O sistema é disponível para **TODOS os planos** (incluindo Free).

### **Fluxo de Dados**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   1. USUÁRIO DIGITA                  2. HOOK PROCESSA                    │
│   ┌─────────────────────┐            ┌─────────────────────┐             │
│   │ "Pesquise sobre..." │ ──────────>│ useChatAgent()      │             │
│   └─────────────────────┘            │ ├── Cria mensagem   │             │
│                                      │ ├── Atualiza UI     │             │
│                                      │ └── Envia webhook   │             │
│                                      └──────────┬──────────┘             │
│                                                 │                        │
│   3. N8N PROCESSA                              │ POST                    │
│   ┌─────────────────────┐                      │                        │
│   │ Webhook n8n         │<─────────────────────┘                        │
│   │ ├── Recebe query    │                                               │
│   │ ├── Chama LLM       │                                               │
│   │ └── Retorna resposta│                                               │
│   └──────────┬──────────┘                                               │
│              │                                                          │
│   4. RESPOSTA STREAMING          5. UI ATUALIZA                         │
│   ┌──────────▼──────────┐        ┌─────────────────────┐                │
│   │ { response: "..." } │───────>│ Mensagem aparece    │                │
│   └─────────────────────┘        │ com streaming       │                │
│                                  └─────────────────────┘                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### **Componentes Principais**

#### **1. useChatAgent Hook**
```typescript
// src/hooks/useChatAgent.ts
export function useChatAgent() {
  // Estado das sessões e mensagens
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Envia mensagem para o webhook n8n
  const sendMessage = async (content: string) => {
    const response = await fetch(VITE_N8N_WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({ 
        sessionId, 
        message: content,
        userId: cliente.id 
      })
    })
    // Processa resposta streaming
  }

  return { sessions, messages, sendMessage, isLoading }
}
```

#### **2. ChatIntroAnimation Component**
```typescript
// src/components/chat/ChatIntroAnimation.tsx
// Animação espacial imersiva com:
// - 60+ estrelas animadas (CSS keyframes)
// - Nebulosas pulsantes com blur
// - Robô 3D interativo (Spline)
// - Parallax effect no mouse
```

#### **3. Armazenamento de Sessões**
```sql
-- Tabela de sessões de chat
CREATE TABLE chat_ia_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de mensagens
CREATE TABLE chat_ia_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_ia_sessions(id),
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### **Configuração de Ambiente**

```env
# .env
VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/chat-ia
```

---

## 🤖 **ARQUITETURA DO AGENTE SDR**

### **Visão Geral**

O Agente SDR (Sales Development Representative) é um sistema de qualificação automática de leads via WhatsApp, disponível para planos **Business** e **Premium**.

### **Arquitetura de Integração**

```
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│   FRONTEND                     BACKEND                     WHATSAPP      │
│   ┌─────────────┐              ┌─────────────┐             ┌───────────┐ │
│   │ AgenteSDR   │              │ Supabase    │             │ Evolution │ │
│   │ Page        │              │ Edge Func   │             │ API       │ │
│   ├─────────────┤              ├─────────────┤             ├───────────┤ │
│   │ Connection  │◄────REST────►│ sdr_agents  │◄────HTTP───►│ Instance  │ │
│   │ Card (QR)   │              │ sdr_config  │             │ Management│ │
│   ├─────────────┤              ├─────────────┤             ├───────────┤ │
│   │ Config Form │              │ n8n Webhook │◄────────────│ Messages  │ │
│   │             │              │ for SDR     │             │ Incoming  │ │
│   ├─────────────┤              └─────────────┘             └───────────┘ │
│   │ Playground  │                     │                                  │
│   │ Testing     │                     ▼                                  │
│   ├─────────────┤              ┌─────────────┐                           │
│   │ Metrics     │              │ LLM Service │                           │
│   │ Dashboard   │              │ (OpenAI)    │                           │
│   └─────────────┘              └─────────────┘                           │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### **Componentes Principais**

#### **1. useSDRAgent Hook**
```typescript
// src/hooks/useSDRAgent.ts
export function useSDRAgent() {
  // Gerencia conexão WhatsApp
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>()
  const [qrCode, setQrCode] = useState<string | null>(null)

  // Gerencia configuração do agente
  const [config, setConfig] = useState<SDRConfig>()

  // Métricas
  const [metrics, setMetrics] = useState<SDRMetrics>()

  return { connectionStatus, qrCode, config, metrics, connect, disconnect, updateConfig }
}
```

#### **2. SDRConnectionCard Component**
- Exibe QR Code para conexão
- Mostra status de conexão
- Exibe informações do número conectado

#### **3. SDRConfigForm Component**
- Formulário para configurar o agente
- Campo de nome do negócio
- Textarea para prompt/contexto

#### **4. SDRPlayground Component**
- Interface de testes do agente
- Simula conversas antes de produção
- Mostra respostas do agente

### **Fluxo de Qualificação**

```
1. Lead envia mensagem no WhatsApp
         │
         ▼
2. Evolution API recebe e encaminha para n8n webhook
         │
         ▼
3. n8n processa com contexto do agente (prompt configurado)
         │
         ▼
4. LLM gera resposta personalizada
         │
         ▼
5. Resposta é enviada ao lead via Evolution API
         │
         ▼
6. Lead é classificado (quente/frio) baseado nas respostas
         │
         ▼
7. Métricas são atualizadas no dashboard
```

### **Tabelas do Banco de Dados**

```sql
-- Configuração do agente SDR
CREATE TABLE sdr_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id),
  instance_name TEXT,
  instance_id TEXT,
  webhook_url TEXT,
  business_name TEXT,
  prompt_context TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads qualificados
CREATE TABLE sdr_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES sdr_agents(id),
  phone TEXT,
  name TEXT,
  score INTEGER, -- 1-10 (quente/frio)
  status TEXT, -- 'new', 'qualified', 'contacted', 'converted'
  conversation_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## ⚛️ **ARQUITETURA FRONTEND**

### **Estrutura de Componentes**

```
src/
├── components/                 # Componentes reutilizáveis
│   ├── ui/                    # Componentes base (ShadcnUI)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── chat/                  # Componentes do Chat IA
│   │   ├── ChatIntroAnimation.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── PromptInputBox.tsx
│   │   └── SessionList.tsx
│   ├── sdr/                   # Componentes do Agente SDR
│   │   ├── SDRConnectionCard.tsx
│   │   ├── SDRConfigForm.tsx
│   │   ├── SDRPlayground.tsx
│   │   └── SDRMetrics.tsx
│   ├── forms/                 # Formulários específicos
│   │   ├── FinanceRecordForm.tsx
│   │   ├── GoalForm.tsx
│   │   └── ...
│   ├── layout/                # Componentes de layout
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── charts/                # Componentes de gráficos
│       ├── LineChart.tsx
│       ├── PieChart.tsx
│       └── ...
├── pages/                      # Páginas da aplicação
│   ├── Dashboard.tsx          # Dashboard financeiro
│   ├── Chat.tsx               # Chat com IA
│   ├── AgenteSDR.tsx          # Configuração SDR
│   ├── Contas.tsx             # Gestão de transações
│   ├── Goals.tsx              # Metas financeiras
│   ├── Agenda.tsx             # Agenda de eventos
│   ├── Tasks.tsx              # Lista de tarefas
│   └── ...
├── hooks/                      # Hooks customizados
│   ├── useChatAgent.ts        # Hook do chat IA
│   ├── useSDRAgent.ts         # Hook do agente SDR
│   ├── useFinancialData.ts    # Hook dados financeiros
│   ├── usePlanInfo.ts         # Hook informações do plano
│   └── ...
├── contexts/                   # Contextos React
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── ...
└── lib/                        # Utilitários
    ├── utils.ts
    ├── validations.ts
    └── ...
```

### **Padrões de Componentes**

#### **🎯 Component Pattern**
```typescript
// Estrutura padrão de componente
interface ComponentProps {
  // Props tipadas
  title: string
  onAction?: () => void
  children?: React.ReactNode
}

export const Component: React.FC<ComponentProps> = ({
  title,
  onAction,
  children
}) => {
  // Hooks locais
  const [state, setState] = useState()
  
  // Handlers
  const handleAction = useCallback(() => {
    onAction?.()
  }, [onAction])
  
  // Render
  return (
    <div className="component">
      <h2>{title}</h2>
      {children}
      <button onClick={handleAction}>Action</button>
    </div>
  )
}
```

#### **🪝 Custom Hooks Pattern**
```typescript
// Hook para dados financeiros
export const useFinancialData = () => {
  const [data, setData] = useState<FinancialRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data: records, error } = await supabase
        .from('financeiro_registros')
        .select('*')
        .order('data_hora', { ascending: false })

      if (error) throw error
      setData(records)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
```

### **Gerenciamento de Estado**

#### **🔄 Estado Local vs Global**
- **Estado Local**: `useState` para dados do componente
- **Estado Global**: Context API para dados compartilhados
- **Estado Servidor**: React Query para dados do backend

#### **📊 Context API Structure**
```typescript
// Contexto de autenticação
interface AuthContextType {
  user: User | null
  login: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Implementação dos métodos
  const login = useCallback(async (phone: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password
    })
    
    if (error) throw error
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

---

## 🗄️ **ARQUITETURA BACKEND**

### **Supabase como Backend**

#### **🔧 Serviços Utilizados**
- **Auth**: Autenticação e autorização
- **Database**: PostgreSQL com RLS
- **API**: REST API automática
- **Real-time**: WebSocket para updates
- **Edge Functions**: Serverless functions
- **Storage**: Armazenamento de arquivos

#### **📊 Estrutura do Banco**
```sql
-- Schema principal
CREATE SCHEMA public;

-- Tabela de usuários
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) UNIQUE,
  phone TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de registros financeiros
CREATE TABLE financeiro_registros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL REFERENCES clientes(phone),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  categoria TEXT NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'recebido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_financeiro_registros_phone ON financeiro_registros(phone);
CREATE INDEX idx_financeiro_registros_data ON financeiro_registros(data_hora);
CREATE INDEX idx_financeiro_registros_categoria ON financeiro_registros(categoria);
```

### **Edge Functions**

#### **🚀 Arquitetura Serverless**
```typescript
// Estrutura de Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Validação de método
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Criação do cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Processamento da requisição
    const { data, error } = await supabaseClient
      .from('table_name')
      .select('*')

    if (error) throw error

    // Resposta
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

---

## 🗃️ **ARQUITETURA DE DADOS**

### **Modelo de Dados**

#### **📊 Entidades Principais**
```typescript
// Entidade Cliente
interface Cliente {
  id: string
  auth_user_id: string
  phone: string
  nome: string
  email?: string
  created_at: string
  updated_at: string
}

// Entidade Registro Financeiro
interface FinanceiroRegistro {
  id: string
  phone: string
  tipo: 'entrada' | 'saida'
  valor: number
  categoria: string
  descricao?: string
  data_hora: string
  status: 'pendente' | 'pago' | 'recebido'
  created_at: string
  updated_at: string
}

// Entidade Meta
interface Meta {
  id: string
  phone: string
  nome: string
  valor_meta: number
  valor_atual: number
  prazo: string
  categoria?: string
  descricao?: string
  status: 'ativa' | 'concluida' | 'cancelada'
  created_at: string
  updated_at: string
}
```

#### **🔗 Relacionamentos**
- **Cliente 1:N FinanceiroRegistro**: Um cliente tem muitos registros
- **Cliente 1:N Meta**: Um cliente tem muitas metas
- **Cliente 1:N Tarefa**: Um cliente tem muitas tarefas
- **Cliente 1:N Evento**: Um cliente tem muitos eventos
- **Cliente 1:N Notificacao**: Um cliente tem muitas notificações

### **Políticas de Segurança (RLS)**

#### **🛡️ Implementação de RLS**
```sql
-- Habilitar RLS
ALTER TABLE financeiro_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Users can view own financial records"
ON financeiro_registros
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid())
);

-- Política para INSERT
CREATE POLICY "Users can insert own financial records"
ON financeiro_registros
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND
  phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid())
);

-- Política para UPDATE
CREATE POLICY "Users can update own financial records"
ON financeiro_registros
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL AND
  phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid())
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid())
);
```

---

## 🎨 **PADRÕES DE DESIGN**

### **Padrões Implementados**

#### **🏭 Factory Pattern**
```typescript
// Factory para criação de componentes
export const createFormComponent = (type: FormType) => {
  switch (type) {
    case 'financial':
      return FinanceRecordForm
    case 'goal':
      return GoalForm
    case 'task':
      return TaskForm
    default:
      return DefaultForm
  }
}
```

#### **🔧 Strategy Pattern**
```typescript
// Strategy para diferentes tipos de validação
interface ValidationStrategy {
  validate(data: any): ValidationResult
}

class FinancialRecordValidation implements ValidationStrategy {
  validate(data: FinancialRecord): ValidationResult {
    const errors: string[] = []
    
    if (!data.valor || data.valor <= 0) {
      errors.push('Valor deve ser maior que zero')
    }
    
    if (!data.categoria) {
      errors.push('Categoria é obrigatória')
    }
    
    return { isValid: errors.length === 0, errors }
  }
}
```

#### **👀 Observer Pattern**
```typescript
// Observer para notificações
class NotificationObserver {
  private observers: Array<(notification: Notification) => void> = []

  subscribe(observer: (notification: Notification) => void) {
    this.observers.push(observer)
  }

  unsubscribe(observer: (notification: Notification) => void) {
    this.observers = this.observers.filter(obs => obs !== observer)
  }

  notify(notification: Notification) {
    this.observers.forEach(observer => observer(notification))
  }
}
```

### **Padrões de Arquitetura**

#### **🏗️ Layered Architecture**
```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│    (React Components, UI)           │
├─────────────────────────────────────┤
│         Application Layer           │
│    (Hooks, Business Logic)          │
├─────────────────────────────────────┤
│           Service Layer             │
│    (API Calls, Data Processing)     │
├─────────────────────────────────────┤
│           Data Layer                │
│    (Supabase, Database)             │
└─────────────────────────────────────┘
```

#### **🔄 Repository Pattern**
```typescript
// Repository para dados financeiros
export class FinancialRecordRepository {
  async create(record: FinancialRecord): Promise<FinancialRecord> {
    const { data, error } = await supabase
      .from('financeiro_registros')
      .insert(record)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async findByPhone(phone: string): Promise<FinancialRecord[]> {
    const { data, error } = await supabase
      .from('financeiro_registros')
      .select('*')
      .eq('phone', phone)
      .order('data_hora', { ascending: false })

    if (error) throw error
    return data
  }

  async update(id: string, updates: Partial<FinancialRecord>): Promise<FinancialRecord> {
    const { data, error } = await supabase
      .from('financeiro_registros')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
```

---

## 🔄 **FLUXOS DE DADOS**

### **Fluxo de Autenticação**
```
1. Usuário insere credenciais
2. Frontend envia para Supabase Auth
3. Supabase valida credenciais
4. JWT token retornado
5. Token armazenado no localStorage
6. Requisições subsequentes incluem token
7. Supabase valida token em cada requisição
```

### **Fluxo de Criação de Registro**
```
1. Usuário preenche formulário
2. Validação frontend (Zod)
3. Verificação de duplicatas
4. Envio para Supabase
5. Validação RLS
6. Inserção no banco
7. Trigger de notificação
8. Update em tempo real
9. Confirmação para usuário
```

### **Fluxo de Relatórios**
```
1. Usuário seleciona filtros
2. Frontend monta query
3. Envio para Edge Function
4. Processamento de dados
5. Agregações e cálculos
6. Formatação do relatório
7. Geração do arquivo
8. Download para usuário
```

---

## 🎯 **DECISÕES ARQUITETURAIS**

### **Decisões Tomadas**

#### **✅ Supabase vs Backend Customizado**
**Decisão**: Supabase
**Justificativa**:
- Desenvolvimento mais rápido
- Funcionalidades prontas (Auth, RLS, Real-time)
- Menor complexidade de infraestrutura
- Escalabilidade automática

#### **✅ React Query vs Redux**
**Decisão**: React Query
**Justificativa**:
- Melhor para dados do servidor
- Cache automático
- Sincronização em tempo real
- Menos boilerplate

#### **✅ TypeScript vs JavaScript**
**Decisão**: TypeScript
**Justificativa**:
- Maior confiabilidade
- Melhor experiência de desenvolvimento
- Detecção de erros em tempo de compilação
- Documentação automática

#### **✅ Tailwind CSS vs Styled Components**
**Decisão**: Tailwind CSS
**Justificativa**:
- Performance melhor
- Consistência de design
- Menor bundle size
- Facilidade de manutenção

---

## 📈 **ESCALABILIDADE**

### **Estratégias de Escalabilidade**

#### **🔄 Escalabilidade Horizontal**
- **Frontend**: CDN global (Vercel)
- **Backend**: Supabase auto-scaling
- **Database**: PostgreSQL com read replicas
- **Storage**: CDN distribuído

#### **⚡ Otimizações de Performance**
- **Code Splitting**: Lazy loading de componentes
- **Bundle Optimization**: Tree shaking e minificação
- **Caching**: React Query e browser cache
- **Image Optimization**: Lazy loading e WebP

#### **📊 Monitoramento de Escalabilidade**
```typescript
// Métricas de escalabilidade
const scalabilityMetrics = {
  concurrentUsers: 1000,
  responseTime: '< 200ms',
  throughput: '> 1000 req/min',
  errorRate: '< 0.1%',
  availability: '> 99.9%'
}
```

---

## 🔒 **SEGURANÇA**

### **Camadas de Segurança**

#### **🛡️ Frontend**
- **HTTPS**: Comunicação criptografada
- **Input Validation**: Sanitização de dados
- **XSS Protection**: Escape de conteúdo
- **CSRF Protection**: Tokens de proteção

#### **🔐 Backend**
- **JWT Authentication**: Tokens seguros
- **Row Level Security**: Isolamento de dados
- **API Rate Limiting**: Proteção contra abuso
- **Input Validation**: Validação server-side

#### **🗄️ Database**
- **Encryption**: Dados criptografados
- **Access Control**: Controle de acesso granular
- **Audit Logs**: Logs de auditoria
- **Backup Security**: Backups criptografados

---

**Documentação de arquitetura atualizada em**: 16/01/2025  
**Versão**: 1.0.0  
**Próxima revisão**: 16/04/2025
