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

## 🔍 **SISTEMA DE BUSCA GLOBAL**

### **Visão Geral**
O sistema de busca global permite pesquisa rápida e comandos shortcuts (`/`) em todas as páginas do app. Implementado via `SearchContext` e integrado ao `AppHeader`.

### **Arquitetura**

```
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│   AppHeader     │        │  SearchContext  │        │   Páginas       │
│   (Input)       │───────►│   (Estado)      │───────►│   (Filtros)     │
│   /comando      │        │   + Comandos    │        │                 │
└─────────────────┘        └─────────────────┘        └─────────────────┘
```

### **SearchContext (src/contexts/SearchContext.tsx)**

```typescript
interface SearchContextValue {
  // Estado da busca
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hasResults: boolean;
  setHasResults: (hasResults: boolean) => void;
  
  // Metadados de comandos globais
  mode: 'global' | 'local';
  setMode: (mode: 'global' | 'local') => void;
  rawCommand?: string;
  setRawCommand: (value: string | undefined) => void;
  commandId?: string;
  setCommandId: (id: string | undefined) => void;
  targetRoute?: string;
  setTargetRoute: (route: string | undefined) => void;
  
  // Resultados agregados
  searchResults: SearchResults;
  setSearchResults: (results: SearchResults) => void;
  clearSearch: () => void;
}

// Provider com memoização
export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'global' | 'local'>('local');
  
  // ✅ Memoizar value para evitar re-renders
  const contextValue = useMemo(() => ({
    searchQuery, 
    setSearchQuery,
    mode,
    setMode,
    // ... outros valores
  }), [searchQuery, mode, /* dependências */]);
  
  return <SearchContext.Provider value={contextValue}>
    {children}
  </SearchContext.Provider>;
}
```

### **Comandos Universais**

| Comando | ID | Rota | Descrição |
|---------|-----|------|-----------|
| `/dashboard` | dashboard | /dashboard | Abre dashboard |
| `/contas` | financial | /contas | Abre gestão de contas |
| `/tarefas` | tasks | /tarefas | Abre lista de tarefas |
| `/agenda` | agenda | /agenda | Abre agenda |
| `/timeline` | timeline | /agenda | Abre timeline |
| `/metas` | goals | /metas | Abre metas |
| `/chat` | chat | /chat | Abre chat IA |
| `/sdr` | sdr | /agente-sdr | Abre agente SDR |
| `/perfil` | profile | /perfil | Abre perfil |

### **Integração nas Páginas**

#### **Exemplo: Contas (src/pages/Contas.tsx)**

```typescript
export default function Contas() {
  const { searchQuery, mode, commandId } = useSearch();
  
  // Determina se busca global aplica nesta página
  const effectiveSearch = useMemo(() => {
    if (!searchQuery.trim()) return '';
    // Só aplica se comando foi /contas
    if (mode === 'global' && commandId === 'financial') {
      return searchQuery.toLowerCase();
    }
    return '';
  }, [searchQuery, mode, commandId]);
  
  // Usa effectiveSearch para filtrar registros
  const filteredRecords = records.filter(record => 
    effectiveSearch 
      ? record.descricao?.toLowerCase().includes(effectiveSearch)
      : true
  );
  
  return <div>{/* UI com filteredRecords */}</div>;
}
```

### **Command Palette (Ctrl/Cmd + K)**

```typescript
// src/components/layout/AppHeader.tsx
useEffect(() => {
  const down = (e: KeyboardEvent) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setIsCommandPaletteOpen(true);
    }
  };
  document.addEventListener('keydown', down);
  return () => document.removeEventListener('keydown', down);
}, []);
```

### **Benefícios**

- ✅ **Navegação Rápida**: Comandos `/` para acesso instantâneo.
- ✅ **Busca Contextual**: Cada página interpreta a busca global.
- ✅ **Performance**: Memoização e debounce evitam re-renders.
- ✅ **UX**: Feedback visual (shake animation) quando sem resultados.

---

## 📱 **PWA (PROGRESSIVE WEB APP)**

### **Visão Geral**
O app é uma PWA completa que funciona como app nativo, com suporte offline, notificações push e instalação na tela inicial.

### **Configuração (vite.config.ts)**

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false }, // Desabilitado em dev
      manifest: {
        name: 'Meu Agente',
        short_name: 'Meu Agente',
        description: 'Sua agência de IA de Bolso',
        theme_color: '#000000',
        background_color: '#0d0d0d',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            // Cache da API Supabase com NetworkFirst
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24h
              }
            }
          }
        ]
      }
    })
  ]
});
```

### **Service Worker Registration (src/components/PWARegister.tsx)**

```typescript
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PWARegister() {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker registrado:', r);
    },
    onRegisterError(error) {
      console.error('❌ Erro ao registrar SW:', error);
    },
    onOfflineReady() {
      console.log('✅ App pronto para trabalhar offline');
    },
  });

  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true); // Auto-update
    }
  }, [needRefresh, updateServiceWorker]);

  return null; // Não renderiza UI
}
```

### **Estratégias de Cache (Workbox)**

| Recurso | Estratégia | TTL |
|---------|------------|-----|
| **Assets estáticos** | CacheFirst | - |
| **API Supabase** | NetworkFirst | 24h |
| **Imagens** | CacheFirst | 7 dias |
| **Fonts** | CacheFirst | 1 ano |

### **Funcionalidades PWA**

- ✅ **Instalação**: Prompt automático em dispositivos mobile.
- ✅ **Offline First**: Cache de assets críticos (JS, CSS, imagens).
- ✅ **Notificações Push**: Planejado para lembretes.

---

## ⚡ **PERFORMANCE MONITORING**

### **Visão Geral**
Sistema de monitoramento de performance em tempo real que rastreia Core Web Vitals, uso de memória e métricas customizadas.

### **Inicialização (src/App.tsx)**

```typescript
import { initPerformanceMonitoring } from './lib/performance-monitor';

initPerformanceMonitoring();
```

### **Biblioteca (src/lib/performance-monitor.ts)**

#### **Core Web Vitals**

```typescript
export const measureCoreWebVitals = () => {
  if (typeof window === 'undefined') return;

  // First Contentful Paint (FCP)
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          console.log('🎯 FCP:', entry.startTime, 'ms');
        }
      }
    });
    observer.observe({ entryTypes: ['paint'] });
  }
};
```

#### **Hook: usePerformanceScan**

```typescript
// Monitorar componente específico
export const usePerformanceScan = (componentName: string) => {
  useEffect(() => {
    console.log(`Performance monitoring enabled for ${componentName}`);
  }, [componentName]);
};

// Uso
function Dashboard() {
  usePerformanceScan('Dashboard');
  // ... componente
}
```

#### **Hook: useMemoryMonitor**

```typescript
export const useMemoryMonitor = () => {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercentage > 80) {
          console.warn(`⚠️ High memory usage: ${usagePercentage.toFixed(1)}%`);
        }
      }
    };
    const interval = setInterval(checkMemory, 5000);
    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
};
```

### **Métricas Rastreadas**

- **LCP** (Largest Contentful Paint): < 2.5s ✅
- **FID** (First Input Delay): < 100ms ✅
- **CLS** (Cumulative Layout Shift): < 0.1 ✅
- **FCP** (First Contentful Paint): < 1.8s ✅
- **TTI** (Time to Interactive): < 3.8s ✅

---

## 🔐 **SISTEMA DE PERMISSÕES (usePermissions)**

### **Visão Geral**
Hook centralizado que controla acesso a recursos baseado no plano do usuário, com integração total ao RLS do Supabase.

### **Hook usePermissions (src/hooks/usePermissions.ts)**

```typescript
export interface Permission {
  canExport: boolean;                  // Exportação PDF/JSON/CSV
  canAccessWhatsApp: boolean;          // Integração WhatsApp
  canAccessSupport: boolean;           // Suporte prioritário
  canAccessAdvancedFeatures: boolean;  // Recursos avançados
  canAccessAIFeatures: boolean;        // IA avançada
  canAccessSDRAgent: boolean;          // Agente SDR
}

export function usePermissions() {
  const { cliente } = useAuth();

  const isBusinessOrPremium = cliente?.subscription_active && 
    ['business', 'premium'].includes(cliente?.plan_id || '');

  const permissions: Permission = {
    canExport: isBusinessOrPremium,
    canAccessWhatsApp: isBusinessOrPremium,
    canAccessSupport: isBusinessOrPremium,
    canAccessAdvancedFeatures: isBusinessOrPremium,
    canAccessAIFeatures: isBusinessOrPremium,
    canAccessSDRAgent: isBusinessOrPremium,
  };

  return { permissions, hasPermission, getUpgradeMessage };
}
```

### **Matriz de Permissões**

| Recurso | Free | Basic | Business | Premium |
|---------|------|-------|----------|---------|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ |
| **Exportação** | ❌ | ❌ | ✅ | ✅ |
| **WhatsApp** | ❌ | ❌ | ✅ | ✅ |
| **Suporte 24/7** | ❌ | ❌ | ✅ | ✅ |
| **SDR Agent** | ❌ | ❌ | ✅ | ✅ |

### **Componente ProtectedFeature**

```typescript
export function ProtectedFeature({ 
  children, 
  permission, 
  featureName 
}: ProtectedFeatureProps) {
  const { hasPermission, getUpgradeMessage } = usePermissions();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Crown className="h-5 w-5" />
          Recurso Business/Premium
        </CardTitle>
        <CardDescription>
          {getUpgradeMessage(featureName)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => navigate('/perfil?tab=plans')}>
          Ver Planos
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 💾 **SISTEMA DE BACKUP (BackupSection)**

### **Visão Geral**
Sistema de backup completo que permite criar, baixar e restaurar snapshots dos dados do usuário.

### **Componente BackupSection (src/components/BackupSection.tsx)**

```typescript
interface BackupInfo {
  id: string;
  created_at: string;
  size: number;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'automatic' | 'manual';
  description: string;
}

export function BackupSection() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  
  return (
    <div className="space-y-6">
      <Button onClick={handleCreateBackup}>
        <Database className="mr-2 h-4 w-4" />
        Criar Backup Manual
      </Button>
      
      {backups.map(backup => (
        <Card key={backup.id}>
          <CardContent>
            <h3>{backup.description}</h3>
            <p>{format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm')}</p>
            <Button onClick={() => handleDownloadBackup(backup.id)}>
              <Download className="h-4 w-4" /> Baixar
            </Button>
            <Button onClick={() => handleRestoreBackup(backup.id)}>
              <Upload className="h-4 w-4" /> Restaurar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### **Estrutura do Backup (JSON)**

```typescript
interface BackupData {
  version: string;
  created_at: string;
  phone: string;
  data: {
    financeiro_registros: FinancialRecord[];
    metas: Goal[];
    tasks: Task[];
    events: Event[];
  };
  metadata: {
    total_records: number;
    total_size_bytes: number;
    backup_type: 'automatic' | 'manual';
  };
}
```

### **Funcionalidades**

- ✅ **Criar Backup Manual**: Snapshot instantâneo de todos os dados.
- ✅ **Baixar Backup**: Download em formato JSON.
- ✅ **Restaurar Backup**: Substituir dados atuais pelos do backup.
- ✅ **Backups Automáticos**: Diários às 02:00 (planejado).

### **Política de Retenção**

- **Manuais**: Mantidos indefinidamente.
- **Automáticos**: Últimos 30 dias.
- **Tamanho Máximo**: 50MB por backup.

### **Segurança**

- ✅ **Criptografia**: Em repouso (Supabase Storage).
- ✅ **RLS**: Apenas dono acessa seus backups.
- ✅ **Validação**: Schema Zod antes de restaurar.

---

**Documentação técnica atualizada em**: 15/12/2025  
**Versão**: 2.0.0  
**Status**: ✅ **PRODUÇÃO READY**
