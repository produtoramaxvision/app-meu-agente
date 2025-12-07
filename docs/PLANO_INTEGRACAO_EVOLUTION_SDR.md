# Plano de Integração: Evolution API + Agente SDR WhatsApp

## Resumo Executivo

Integração do app "Meu Agente" com Evolution API para conexão WhatsApp e configuração de Agentes SDR automatizados. Usuários dos planos Business/Premium terão acesso a uma página exclusiva para conectar seu WhatsApp via QR Code e configurar o prompt do agente SDR.

## Jornada do Usuário

1. Usuário faz upgrade para plano Business ou Premium
2. Acessa menu "Agente SDR" (exclusivo para esses planos)
3. Sistema cria instância na Evolution API (via N8N ou Edge Function)
4. Usuário recebe token de acesso
5. Usuário acessa o conector externo com telefone + token
6. Lê QR Code e conecta WhatsApp
7. Formulário de configuração do SDR é exibido
8. Usuário preenche: nome do agente, empresa, produtos, perguntas de qualificação, prompt personalizado
9. Configuração é salva no banco de dados
10. N8N busca configuração e usa como prompt variável no Agente de IA

---

## Fase 1: Banco de Dados

### Tabela `evolution_instances`

```sql
CREATE TABLE public.evolution_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL REFERENCES public.clientes(phone) ON DELETE CASCADE,
    instance_name VARCHAR(100) UNIQUE NOT NULL,
    instance_token VARCHAR(255) NOT NULL,
    connection_status VARCHAR(20) DEFAULT 'disconnected',
    whatsapp_number VARCHAR(20),
    qr_code_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    connected_at TIMESTAMPTZ,
    
    CONSTRAINT valid_status CHECK (connection_status IN ('disconnected', 'connecting', 'connected', 'error'))
);

-- RLS Policies
ALTER TABLE public.evolution_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evolution_instances_select" ON public.evolution_instances
FOR SELECT TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()));

CREATE POLICY "evolution_instances_insert" ON public.evolution_instances
FOR INSERT TO authenticated
WITH CHECK (phone = (SELECT public.get_user_phone_optimized()));

CREATE POLICY "evolution_instances_update" ON public.evolution_instances
FOR UPDATE TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()));
```

### Tabela `sdr_agent_config`

```sql
CREATE TABLE public.sdr_agent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL REFERENCES public.clientes(phone) ON DELETE CASCADE,
    instance_id UUID REFERENCES public.evolution_instances(id) ON DELETE SET NULL,
    
    -- Identificação
    agent_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(100),
    
    -- Contexto do Negócio
    target_audience TEXT,
    main_products_services TEXT NOT NULL,
    unique_value_proposition TEXT,
    
    -- Qualificação
    qualification_questions JSONB DEFAULT '[]',
    
    -- Mensagens
    greeting_message TEXT NOT NULL,
    fallback_message TEXT,
    closing_message TEXT,
    
    -- Prompt Principal
    custom_prompt TEXT NOT NULL,
    
    -- Configurações
    business_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00", "days": [1,2,3,4,5]}',
    auto_schedule_meetings BOOLEAN DEFAULT false,
    calendar_link VARCHAR(500),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies (mesmo padrão)
ALTER TABLE public.sdr_agent_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sdr_config_select" ON public.sdr_agent_config
FOR SELECT TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()));

CREATE POLICY "sdr_config_insert" ON public.sdr_agent_config
FOR INSERT TO authenticated
WITH CHECK (phone = (SELECT public.get_user_phone_optimized()));

CREATE POLICY "sdr_config_update" ON public.sdr_agent_config
FOR UPDATE TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()));

CREATE POLICY "sdr_config_delete" ON public.sdr_agent_config
FOR DELETE TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()));
```

---

## Fase 2: Tipos TypeScript

### Arquivo: `src/types/sdr.ts`

```typescript
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface EvolutionInstance {
  id: string;
  phone: string;
  instance_name: string;
  instance_token: string;
  connection_status: ConnectionStatus;
  whatsapp_number: string | null;
  qr_code_url: string | null;
  created_at: string;
  updated_at: string;
  connected_at: string | null;
}

export interface QualificationQuestion {
  id: string;
  question: string;
  expectedAnswerType: 'text' | 'yes_no' | 'multiple_choice';
  options?: string[];
  required: boolean;
}

export interface BusinessHours {
  start: string; // "09:00"
  end: string;   // "18:00"
  days: number[]; // [1,2,3,4,5] = seg-sex
}

export interface SDRAgentConfig {
  id: string;
  phone: string;
  instance_id: string | null;
  
  agent_name: string;
  company_name: string;
  business_type: string | null;
  
  target_audience: string | null;
  main_products_services: string;
  unique_value_proposition: string | null;
  
  qualification_questions: QualificationQuestion[];
  
  greeting_message: string;
  fallback_message: string | null;
  closing_message: string | null;
  
  custom_prompt: string;
  
  business_hours: BusinessHours;
  auto_schedule_meetings: boolean;
  calendar_link: string | null;
  
  is_active: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface CreateInstanceRequest {
  phone: string;
}

export interface CreateInstanceResponse {
  instance_name: string;
  instance_token: string;
  connector_url: string;
}
```

---

## Fase 3: Hook `useSDRAgent.ts`

```typescript
// src/hooks/useSDRAgent.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import type { EvolutionInstance, SDRAgentConfig } from '@/types/sdr';

export function useSDRAgent() {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();
  
  // Query: Buscar instância do usuário
  const instanceQuery = useQuery({
    queryKey: ['evolution-instance', cliente?.phone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evolution_instances')
        .select('*')
        .eq('phone', cliente!.phone)
        .maybeSingle();
      
      if (error) throw error;
      return data as EvolutionInstance | null;
    },
    enabled: !!cliente?.phone,
  });
  
  // Query: Buscar configuração SDR
  const configQuery = useQuery({
    queryKey: ['sdr-config', cliente?.phone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sdr_agent_config')
        .select('*')
        .eq('phone', cliente!.phone)
        .maybeSingle();
      
      if (error) throw error;
      return data as SDRAgentConfig | null;
    },
    enabled: !!cliente?.phone,
  });
  
  // Mutation: Criar instância
  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-evolution-instance', {
        body: { phone: cliente!.phone }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-instance'] });
    },
  });
  
  // Mutation: Salvar configuração SDR
  const saveConfigMutation = useMutation({
    mutationFn: async (config: Partial<SDRAgentConfig>) => {
      const { data: existing } = await supabase
        .from('sdr_agent_config')
        .select('id')
        .eq('phone', cliente!.phone)
        .maybeSingle();
      
      if (existing) {
        const { error } = await supabase
          .from('sdr_agent_config')
          .update({ ...config, updated_at: new Date().toISOString() })
          .eq('phone', cliente!.phone);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sdr_agent_config')
          .insert({ ...config, phone: cliente!.phone });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sdr-config'] });
    },
  });
  
  // Realtime: Escutar mudanças de status
  useEffect(() => {
    if (!cliente?.phone) return;
    
    const channel = supabase
      .channel('instance-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evolution_instances',
          filter: `phone=eq.${cliente.phone}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['evolution-instance'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cliente?.phone, queryClient]);
  
  return {
    // Data
    instance: instanceQuery.data,
    config: configQuery.data,
    
    // Status
    isLoading: instanceQuery.isLoading || configQuery.isLoading,
    isConnected: instanceQuery.data?.connection_status === 'connected',
    isConnecting: instanceQuery.data?.connection_status === 'connecting',
    
    // Actions
    createInstance: createInstanceMutation.mutateAsync,
    saveConfig: saveConfigMutation.mutateAsync,
    
    // Mutation states
    isCreatingInstance: createInstanceMutation.isPending,
    isSavingConfig: saveConfigMutation.isPending,
  };
}
```

---

## Fase 4: Componentes

### Estrutura de Arquivos
```
src/components/sdr/
├── SDRConnectionStatus.tsx    # Badge de status de conexão
├── SDRQRCodeDisplay.tsx       # Exibe QR ou redireciona para conector
├── SDRConfigForm.tsx          # Formulário principal de configuração
├── SDRPromptPreview.tsx       # Preview do prompt gerado
└── index.ts                   # Exports
```

### Componente Principal: `SDRConfigForm.tsx`

Seguir padrão existente com:
- Zod schema para validação
- React Hook Form para gerenciamento
- Componentes ShadcnUI (FormField, Input, Textarea, Select, Switch)
- Tabs para organizar seções (Básico, Mensagens, Qualificação, Avançado)

Campos do formulário:
1. **Aba Básico**: agent_name, company_name, business_type, target_audience, main_products_services
2. **Aba Mensagens**: greeting_message, fallback_message, closing_message
3. **Aba Qualificação**: qualification_questions (array dinâmico)
4. **Aba Avançado**: custom_prompt, business_hours, auto_schedule_meetings, calendar_link

---

## Fase 5: Página `AgenteSDR.tsx`

```typescript
// src/pages/AgenteSDR.tsx
import { ProtectedFeature } from '@/components/ProtectedFeature';
import { useSDRAgent } from '@/hooks/useSDRAgent';
import { SDRConnectionStatus } from '@/components/sdr/SDRConnectionStatus';
import { SDRQRCodeDisplay } from '@/components/sdr/SDRQRCodeDisplay';
import { SDRConfigForm } from '@/components/sdr/SDRConfigForm';

export default function AgenteSDR() {
  const { instance, isConnected, isLoading } = useSDRAgent();
  
  return (
    <ProtectedFeature
      permission="canAccessWhatsApp"
      featureName="Agente SDR"
      showUpgradePrompt={true}
    >
      <div className="container mx-auto p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-bold">Agente SDR</h1>
          <p className="text-muted-foreground">
            Configure seu agente de vendas automatizado
          </p>
        </header>
        
        <SDRConnectionStatus />
        
        {!isConnected ? (
          <SDRQRCodeDisplay />
        ) : (
          <SDRConfigForm />
        )}
      </div>
    </ProtectedFeature>
  );
}
```

### Rota em `App.tsx`

```typescript
const AgenteSDR = lazy(() => import("./pages/AgenteSDR"));

// Dentro das rotas
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

## Fase 6: Edge Functions

### `create-evolution-instance`

```typescript
// supabase/functions/create-evolution-instance/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Verificar autenticação
  const authHeader = req.headers.get('Authorization');
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader?.replace('Bearer ', '')
  );
  
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  // Buscar cliente e verificar plano
  const { data: cliente } = await supabase
    .from('clientes')
    .select('phone, plan_id')
    .eq('auth_user_id', user.id)
    .single();
  
  if (!cliente || !['business', 'premium'].includes(cliente.plan_id)) {
    return new Response(JSON.stringify({ error: 'Plan not allowed' }), { status: 403 });
  }
  
  // Gerar nome e token da instância
  const instanceName = `meuagente_${cliente.phone}_${Date.now()}`;
  const instanceToken = crypto.randomUUID();
  
  // Opção 1: Chamar N8N para criar instância
  const n8nResponse = await fetch(Deno.env.get('N8N_CREATE_INSTANCE_WEBHOOK')!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instance_name: instanceName,
      phone: cliente.phone,
    }),
  });
  
  if (!n8nResponse.ok) {
    return new Response(JSON.stringify({ error: 'Failed to create instance' }), { status: 500 });
  }
  
  // Salvar no banco
  const { error: insertError } = await supabase
    .from('evolution_instances')
    .insert({
      phone: cliente.phone,
      instance_name: instanceName,
      instance_token: instanceToken,
      connection_status: 'disconnected',
    });
  
  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }
  
  return new Response(JSON.stringify({
    instance_name: instanceName,
    instance_token: instanceToken,
    connector_url: `${Deno.env.get('CONNECTOR_APP_URL')}?token=${instanceToken}`,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

---

## Fase 7: Fluxo N8N

### Webhook: Criar Instância na Evolution API

1. **Trigger**: Webhook recebe `{ instance_name, phone }`
2. **HTTP Request**: POST para Evolution API criar instância
3. **Resposta**: Retorna QR Code URL (se disponível)

### Webhook: Atualizar Status de Conexão

1. **Trigger**: Evolution API chama webhook quando status muda
2. **Supabase Node**: UPDATE `evolution_instances` com novo status
3. **(Opcional)**: Enviar notificação push para o usuário

### Fluxo do Agente SDR

1. **Trigger**: Webhook da Evolution API (mensagem recebida)
2. **Supabase Node**: SELECT `sdr_agent_config` WHERE `phone` = número conectado
3. **Agente de IA**: Usar `custom_prompt` + contexto como system prompt
4. **HTTP Request**: Enviar resposta via Evolution API

---

## Variáveis de Ambiente

### Frontend (`.env`)
```env
VITE_EVOLUTION_CONNECTOR_URL=https://seu-conector.com
```

### Edge Functions (Supabase Secrets)
```
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-secreta
N8N_CREATE_INSTANCE_WEBHOOK=https://n8n.../webhook/create-instance
N8N_STATUS_UPDATE_WEBHOOK=https://n8n.../webhook/status-update
CONNECTOR_APP_URL=https://seu-conector.com
```

---

## Estimativa de Tempo

| Fase | Descrição | Tempo Estimado |
|------|-----------|----------------|
| 1 | Migrations Supabase | 2-3 horas |
| 2 | Tipos TypeScript | 1-2 horas |
| 3 | Hook useSDRAgent | 4-6 horas |
| 4 | Componentes SDR | 6-8 horas |
| 5 | Página AgenteSDR | 2-3 horas |
| 6 | Edge Functions | 4-6 horas |
| 7 | Fluxos N8N | 4-6 horas |
| 8 | Testes e Ajustes | 3-4 horas |
| **Total** | | **26-38 horas** |

---

## Pontos de Decisão Pendentes

1. **Criação de instância**: Edge Function chama N8N ou Evolution API diretamente?
2. **Conector externo**: Integrar via iframe, popup, ou redirect com callback?
3. **Webhook de status**: Evolution API suporta webhook ou precisamos fazer polling?
4. **Armazenamento de segredos**: Onde guardar tokens da Evolution API?

---

## Próximos Passos

1. ✅ Plano aprovado
2. ⏳ Criar migrations no Supabase
3. ⏳ Implementar tipos e hook
4. ⏳ Criar componentes de UI
5. ⏳ Configurar Edge Functions
6. ⏳ Configurar fluxos N8N
7. ⏳ Testes end-to-end
