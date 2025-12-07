# 🚀 PLANO DE INTEGRAÇÃO - Agente SDR + EvolutionAPI + WhatsApp

## 📋 Visão Geral do Projeto

Este documento detalha o plano de integração para implantação automática de Agente SDR no app **Meu Agente**, permitindo que usuários dos planos **Business** e **Premium** conectem seu WhatsApp via QR Code e configurem um prompt personalizado para o Agente SDR.

---

## 🎯 Objetivo

Criar um fluxo completo onde:
1. Usuário Business/Premium acessa página exclusiva
2. Conecta WhatsApp via QR Code (EvolutionAPI)
3. Preenche formulário de configuração do Agente SDR (prompt)
4. N8N busca as configurações e executa o agente com o prompt personalizado

---

## 📊 Análise do Código Atual

### **Estrutura do Projeto**
```
src/
├── App.tsx                    # Rotas principais (React Router)
├── contexts/
│   └── AuthContext.tsx        # Autenticação Supabase Auth + dados do cliente
├── hooks/
│   ├── usePlanInfo.ts         # Informações do plano atual
│   ├── usePermissions.ts      # Controle de permissões por plano
│   ├── useStripeCheckout.ts   # Checkout Stripe
│   └── useChatAgent.ts        # Integração chat com N8N webhook
├── components/
│   ├── ProtectedRoute.tsx     # Proteção de rotas (autenticação)
│   ├── ProtectedFeature.tsx   # Proteção de features (planos)
│   └── PlansSection.tsx       # Seção de planos (Business/Premium)
├── integrations/supabase/
│   ├── client.ts              # Cliente Supabase
│   └── types.ts               # Tipos do banco de dados
└── pages/
    ├── Profile.tsx            # Perfil + Planos
    └── Chat.tsx               # Chat com Agente (N8N webhook)
```

### **Sistema de Planos Existente**

| Plano | `plan_id` | `hasWhatsApp` | `hasSupport` | Agente SDR |
|-------|-----------|---------------|--------------|------------|
| Free | `free` | ❌ | ❌ | ❌ |
| Basic | `basic` | ❌ | ❌ | ❌ |
| Business | `business` | ✅ | ✅ | ✅ |
| Premium | `premium` | ✅ | ✅ | ✅ |

### **Controle de Acesso Atual**
- `usePermissions.ts`: Hook que verifica `canAccessWhatsApp` para Business/Premium
- `ProtectedFeature.tsx`: Componente que bloqueia features e mostra upgrade prompt
- `isBusinessOrPremium`: Flag booleana para verificação rápida

### **Integração N8N Existente**
- Webhook URL via env: `VITE_N8N_WEBHOOK_URL`
- Payload enviado inclui: `message`, `timestamp`, `sessionId`, `cliente` (phone, name, plan_id, etc.)
- Resposta esperada: `{ success: boolean, data: { response: string, metadata?: object } }`

---

## 🏗️ Arquitetura da Solução

### **Diagrama de Fluxo**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React App)                              │
├─────────────────────────────────────────────────────────────────────┤
│  1. Usuário Business/Premium acessa /agente-sdr                     │
│  2. Componente verifica permissão (usePermissions)                  │
│  3. Se autorizado, exibe página de conexão WhatsApp                 │
│  4. Frontend busca QR Code do app conector externo                  │
│  5. Após conexão, exibe formulário de configuração SDR              │
│  6. Dados salvos no Supabase (tabela sdr_agent_config)              │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  │ (1) Cria instância
                  │ (2) Busca QR Code
                  │ (3) Salva configuração
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                                │
├─────────────────────────────────────────────────────────────────────┤
│  Tabelas:                                                           │
│  ├── clientes (existente) - dados do usuário + plan_id             │
│  ├── evolution_instances (NOVA) - instâncias EvolutionAPI          │
│  └── sdr_agent_config (NOVA) - configuração do prompt SDR          │
│                                                                     │
│  Edge Functions:                                                    │
│  ├── create-evolution-instance (NOVA) - cria instância via N8N     │
│  └── get-instance-status (NOVA) - verifica status da conexão       │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  │ Webhook / API
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    N8N (Automação)                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Fluxos:                                                            │
│  ├── Criar instância EvolutionAPI + gerar token                    │
│  ├── Buscar QR Code da instância                                   │
│  └── Agente SDR (busca config no Supabase + executa com prompt)    │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  │ API REST
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EVOLUTION API                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ├── POST /instance/create                                         │
│  ├── GET /instance/connectionState                                  │
│  └── GET /instance/fetchInstances                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Etapas de Implementação

### **FASE 1: Estrutura de Banco de Dados** (Supabase)

#### 1.1 Nova tabela: `evolution_instances`
```sql
CREATE TABLE evolution_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL REFERENCES clientes(phone) ON DELETE CASCADE,
    instance_name VARCHAR(100) NOT NULL UNIQUE,
    instance_token VARCHAR(255) NOT NULL,
    connection_status VARCHAR(20) DEFAULT 'disconnected', -- disconnected, connecting, connected
    whatsapp_number VARCHAR(20), -- número conectado após scan
    qr_code_url TEXT, -- URL do QR Code (temporário)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    connected_at TIMESTAMPTZ,
    CONSTRAINT fk_cliente FOREIGN KEY (phone) REFERENCES clientes(phone)
);

-- RLS Policy
ALTER TABLE evolution_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own instances" ON evolution_instances
    FOR SELECT USING (phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own instances" ON evolution_instances
    FOR UPDATE USING (phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid()));
```

#### 1.2 Nova tabela: `sdr_agent_config`
```sql
CREATE TABLE sdr_agent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL REFERENCES clientes(phone) ON DELETE CASCADE,
    instance_id UUID REFERENCES evolution_instances(id) ON DELETE CASCADE,
    
    -- Configurações do SDR
    agent_name VARCHAR(100) NOT NULL DEFAULT 'Assistente SDR',
    company_name VARCHAR(200),
    business_type VARCHAR(100),
    target_audience TEXT,
    main_products_services TEXT,
    qualification_questions JSONB DEFAULT '[]'::jsonb,
    custom_prompt TEXT NOT NULL,
    
    -- Configurações de comportamento
    greeting_message TEXT,
    fallback_message TEXT,
    business_hours JSONB, -- {"start": "09:00", "end": "18:00", "days": [1,2,3,4,5]}
    auto_schedule_meetings BOOLEAN DEFAULT false,
    calendar_integration_id VARCHAR(255), -- Google Calendar ID
    
    -- Status e controle
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_cliente FOREIGN KEY (phone) REFERENCES clientes(phone)
);

-- RLS Policy
ALTER TABLE sdr_agent_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own SDR config" ON sdr_agent_config
    FOR ALL USING (phone = (SELECT phone FROM clientes WHERE auth_user_id = auth.uid()));

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_sdr_agent_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sdr_config
    BEFORE UPDATE ON sdr_agent_config
    FOR EACH ROW EXECUTE FUNCTION update_sdr_agent_config_updated_at();
```

---

### **FASE 2: Backend (Edge Functions + N8N)**

#### 2.1 Edge Function: `create-evolution-instance`
```typescript
// supabase/functions/create-evolution-instance/index.ts
// Responsabilidades:
// - Validar que usuário é Business/Premium
// - Chamar N8N webhook para criar instância na EvolutionAPI
// - Salvar dados da instância no Supabase
// - Retornar token de acesso para app conector
```

**Payload de entrada:**
```json
{
  "instance_name": "user_phone_timestamp"
}
```

**Payload de saída:**
```json
{
  "success": true,
  "data": {
    "instance_id": "uuid",
    "instance_name": "instance_name",
    "token": "access_token_for_connector",
    "connector_url": "https://seu-conector.com?token=xxx"
  }
}
```

#### 2.2 Edge Function: `get-instance-status`
```typescript
// supabase/functions/get-instance-status/index.ts
// Responsabilidades:
// - Buscar status da instância na EvolutionAPI via N8N
// - Atualizar status no Supabase
// - Retornar status atual (connected, disconnected, etc.)
```

#### 2.3 Fluxo N8N: Criar Instância
```
Webhook Trigger (do Edge Function)
    ↓
HTTP Request → EvolutionAPI POST /instance/create
    ↓
Set Variables (instance_name, token)
    ↓
Respond to Webhook
```

#### 2.4 Fluxo N8N: Agente SDR
```
Webhook Trigger (mensagem WhatsApp via EvolutionAPI)
    ↓
Supabase Node → SELECT * FROM sdr_agent_config WHERE instance_id = ?
    ↓
IF (config.is_active)
    ↓
AI Agent Node (usar config.custom_prompt como system prompt)
    ↓
HTTP Request → EvolutionAPI → Enviar resposta
```

---

### **FASE 3: Frontend (React Components)**

#### 3.1 Nova Página: `/agente-sdr`
Criar arquivo: `src/pages/AgenteSDR.tsx`

**Estrutura da página:**
```
┌─────────────────────────────────────────────────────┐
│  Header: "Configuração do Agente SDR"               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Step 1: Conexão WhatsApp]                        │
│  ┌─────────────────────────────────────────┐       │
│  │  Status: ● Desconectado                  │       │
│  │                                          │       │
│  │  [Botão: Conectar WhatsApp]              │       │
│  │                                          │       │
│  │  ou                                      │       │
│  │                                          │       │
│  │  [QR Code aqui]                          │       │
│  │  Escaneie com seu WhatsApp               │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
│  [Step 2: Configuração SDR] (aparece após conectar)│
│  ┌─────────────────────────────────────────┐       │
│  │  Nome do Agente: [__________]            │       │
│  │  Nome da Empresa: [__________]           │       │
│  │  Tipo de Negócio: [__________]           │       │
│  │  Público-Alvo: [__________]              │       │
│  │  Produtos/Serviços: [__________]         │       │
│  │  Mensagem de Boas-vindas: [__________]   │       │
│  │                                          │       │
│  │  Prompt Personalizado:                   │       │
│  │  [________________________]              │       │
│  │  [________________________]              │       │
│  │  [________________________]              │       │
│  │                                          │       │
│  │  [Salvar Configuração]                   │       │
│  └─────────────────────────────────────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### 3.2 Novos Componentes

| Componente | Arquivo | Responsabilidade |
|------------|---------|------------------|
| `SDRConnectionStatus` | `src/components/sdr/SDRConnectionStatus.tsx` | Exibe status da conexão WhatsApp |
| `SDRQRCodeScanner` | `src/components/sdr/SDRQRCodeScanner.tsx` | Exibe QR Code para scan |
| `SDRConfigForm` | `src/components/sdr/SDRConfigForm.tsx` | Formulário de configuração do prompt |
| `SDRPromptBuilder` | `src/components/sdr/SDRPromptBuilder.tsx` | Builder visual do prompt |

#### 3.3 Novo Hook: `useSDRAgent`
```typescript
// src/hooks/useSDRAgent.ts
// Responsabilidades:
// - Criar instância EvolutionAPI
// - Buscar status da conexão
// - Salvar/atualizar configuração SDR
// - Polling para verificar conexão após QR Code scan
```

#### 3.4 Atualização de Rotas
```typescript
// App.tsx - Adicionar nova rota
const AgenteSDR = lazy(() => import("./pages/AgenteSDR"));

<Route
  path="/agente-sdr"
  element={
    <ProtectedRoute>
      <AppLayout><AgenteSDR /></AppLayout>
    </ProtectedRoute>
  }
/>
```

---

### **FASE 4: Integração com App Conector Externo**

#### 4.1 Fluxo de Autenticação do Conector
```
1. Frontend chama Edge Function → create-evolution-instance
2. Edge Function retorna token + URL do conector
3. Frontend redireciona/abre iframe com: connector_url?token=xxx&phone=yyy
4. Usuário escaneia QR Code no conector
5. Conector notifica backend via webhook
6. Frontend faz polling para verificar status
7. Quando conectado, exibe formulário de configuração
```

#### 4.2 Webhook de Status (EvolutionAPI → N8N → Supabase)
```
EvolutionAPI envia webhook de status change
    ↓
N8N recebe e processa
    ↓
Supabase UPDATE evolution_instances SET connection_status = 'connected'
    ↓
Frontend detecta mudança via Realtime ou polling
```

---

### **FASE 5: Tipos TypeScript**

#### 5.1 Atualizar `src/integrations/supabase/types.ts`
```typescript
// Adicionar interfaces para novas tabelas
export interface EvolutionInstance {
  id: string;
  phone: string;
  instance_name: string;
  instance_token: string;
  connection_status: 'disconnected' | 'connecting' | 'connected';
  whatsapp_number: string | null;
  qr_code_url: string | null;
  created_at: string;
  updated_at: string;
  connected_at: string | null;
}

export interface SDRAgentConfig {
  id: string;
  phone: string;
  instance_id: string | null;
  agent_name: string;
  company_name: string | null;
  business_type: string | null;
  target_audience: string | null;
  main_products_services: string | null;
  qualification_questions: Array<{
    question: string;
    required: boolean;
    options?: string[];
  }>;
  custom_prompt: string;
  greeting_message: string | null;
  fallback_message: string | null;
  business_hours: {
    start: string;
    end: string;
    days: number[];
  } | null;
  auto_schedule_meetings: boolean;
  calendar_integration_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

#### 5.2 Novo arquivo: `src/types/sdr.ts`
```typescript
export interface SDRFormData {
  agentName: string;
  companyName: string;
  businessType: string;
  targetAudience: string;
  mainProductsServices: string;
  greetingMessage: string;
  customPrompt: string;
  qualificationQuestions: QualificationQuestion[];
}

export interface QualificationQuestion {
  id: string;
  question: string;
  required: boolean;
  type: 'text' | 'select' | 'multiselect';
  options?: string[];
}

export interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected';
  whatsappNumber?: string;
  connectedAt?: Date;
}
```

---

## 🎨 Design System (Referência Magic-MCP)

### **Componentes UI a Usar**
- `Card`, `CardHeader`, `CardContent` - Container principal
- `Form`, `FormField`, `FormItem`, `FormLabel` - Formulários
- `Input`, `Textarea` - Campos de texto
- `Button` - Ações
- `Badge` - Status (connected/disconnected)
- `Alert` - Mensagens de aviso
- `Skeleton` - Loading states
- `Dialog` - Modais de confirmação
- `Tabs` - Navegação entre etapas

### **Animações (Framer Motion)**
- Transição suave entre estados de conexão
- Animação de QR Code aparecendo
- Feedback visual de salvamento

---

## 📋 Checklist de Implementação

### **Banco de Dados (Supabase)**
- [ ] Criar migration: `evolution_instances`
- [ ] Criar migration: `sdr_agent_config`
- [ ] Configurar RLS policies
- [ ] Testar policies com diferentes usuários

### **Backend (Edge Functions)**
- [ ] Criar `create-evolution-instance`
- [ ] Criar `get-instance-status`
- [ ] Configurar secrets (EVOLUTION_API_URL, EVOLUTION_API_KEY)
- [ ] Testar integração com N8N

### **N8N (Fluxos)**
- [ ] Fluxo: Criar instância EvolutionAPI
- [ ] Fluxo: Verificar status da instância
- [ ] Fluxo: Agente SDR com prompt dinâmico
- [ ] Fluxo: Webhook de status change

### **Frontend (React)**
- [ ] Criar página `/agente-sdr`
- [ ] Criar componente `SDRConnectionStatus`
- [ ] Criar componente `SDRQRCodeScanner`
- [ ] Criar componente `SDRConfigForm`
- [ ] Criar componente `SDRPromptBuilder`
- [ ] Criar hook `useSDRAgent`
- [ ] Atualizar rotas em `App.tsx`
- [ ] Adicionar link no menu lateral (apenas Business/Premium)
- [ ] Atualizar tipos TypeScript

### **Testes**
- [ ] Teste E2E: Fluxo completo de conexão
- [ ] Teste unitário: useSDRAgent hook
- [ ] Teste de permissões: usuário Free tentando acessar
- [ ] Teste de RLS: isolamento de dados entre usuários

---

## ⚠️ Considerações Importantes

### **Segurança**
1. **Token da instância**: Nunca expor no frontend, usar apenas em Edge Functions
2. **RLS**: Garantir que usuários só acessem suas próprias instâncias/configs
3. **Rate Limiting**: Limitar criação de instâncias por usuário
4. **Validação de plano**: Verificar Business/Premium antes de qualquer operação

### **Performance**
1. **Polling**: Usar WebSocket/Realtime quando possível
2. **Cache**: Cachear status da conexão no frontend
3. **Lazy Loading**: Carregar página SDR apenas quando necessário

### **UX**
1. **Feedback claro**: Mostrar status em tempo real
2. **Error handling**: Mensagens claras para erros comuns
3. **Timeout**: Informar se QR Code expirar (geralmente 60s)

---

## 📅 Cronograma Sugerido

| Fase | Estimativa | Dependências |
|------|------------|--------------|
| Fase 1: Banco de Dados | 2-3 horas | - |
| Fase 2: Edge Functions | 4-6 horas | Fase 1 |
| Fase 3: Frontend | 8-12 horas | Fase 1, 2 |
| Fase 4: Integração Conector | 4-6 horas | Fase 2, 3 |
| Fase 5: N8N Fluxos | 4-6 horas | Fase 2 |
| Testes | 4-6 horas | Todas |
| **Total** | **26-39 horas** | - |

---

## 🔗 Próximos Passos

Após aprovação deste plano:

1. **Confirmar requisitos do app conector externo**: URL, API, formato de autenticação
2. **Confirmar endpoints da EvolutionAPI**: Versão, endpoints disponíveis
3. **Iniciar Fase 1**: Migrations do banco de dados
4. **Configurar ambiente de desenvolvimento**: Variáveis de ambiente, secrets

---

**Aguardando sua aprovação para iniciar a implementação!**

---

*Documento criado em: 07/12/2025*
*Versão: 1.0*
