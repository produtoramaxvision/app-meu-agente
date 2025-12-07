# 🚀 PLANO DE IMPLANTAÇÃO FINAL - Agente SDR + Evolution API

## 📋 Resumo Executivo

**Versão:** 2.0  
**Data:** 07/12/2025  
**Status:** AGUARDANDO APROVAÇÃO  
**Atualização:** Componentes modernos via MAGIC-MCP + Estrutura JSON para N8N

Este documento detalha o plano de implantação completo para integração do **Agente SDR com Evolution API** no app "Meu Agente", permitindo que usuários dos planos **Business** e **Premium** conectem seu WhatsApp via QR Code/Pairing Code diretamente na interface e configurem um Agente SDR automatizado.

---

## 🎨 COMPONENTES MODERNOS (MAGIC-MCP)

### Sliders para Configurações de IA
Todos os parâmetros numéricos utilizarão **sliders modernos** com as seguintes características:

#### 1. Slider com Tooltip (Recomendado)
```tsx
// Slider com tooltip que mostra o valor ao arrastar
<SliderWithTooltip
  value={temperature}
  onChange={setTemperature}
  min={0}
  max={2}
  step={0.1}
  showTooltip={true}
  label="Temperatura"
  description="Controla a criatividade das respostas"
/>
```

#### 2. Slider com Input Combinado
```tsx
// Hook useSliderWithInput para combinar slider + input
const { value, sliderProps, inputProps } = useSliderWithInput({
  defaultValue: 0.7,
  min: 0,
  max: 2,
  step: 0.1,
});
```

#### Componentes de Slider Necessários:
| Parâmetro | Min | Max | Step | Tooltip |
|-----------|-----|-----|------|---------|
| `temperature` | 0.0 | 2.0 | 0.1 | "0.0 = Determinístico, 2.0 = Muito criativo" |
| `top_p` | 0.0 | 1.0 | 0.05 | "Nucleus sampling" |
| `frequency_penalty` | -2.0 | 2.0 | 0.1 | "Negativo repete, Positivo diversifica" |
| `presence_penalty` | -2.0 | 2.0 | 0.1 | "Controla novos tópicos" |
| `max_tokens` | 50 | 4000 | 50 | "Limite de tokens na resposta" |

### Textarea com Contador de Caracteres
```tsx
// Para prompts e mensagens longas
<TextareaWithCharacterLimit
  value={customPrompt}
  onChange={setCustomPrompt}
  maxLength={5000}
  label="Prompt Personalizado"
  placeholder="Você é um assistente SDR..."
/>
```

### Dependências Necessárias:
```json
{
  "@radix-ui/react-slider": "latest",
  "@radix-ui/react-tooltip": "latest"
}
```

---

## 🎯 Descoberta Chave: Eliminação do Conector Externo

Após análise detalhada da documentação da Evolution API, confirmamos que é possível **eliminar completamente o app conector externo**:

### Endpoints da Evolution API Disponíveis:

1. **`GET /instance/connect/{instance}`** - Retorna:
   - `pairingCode`: Código de 8 dígitos (ex: "WZYEH1YY")
   - `code`: String longa para geração de QR Code
   - `count`: Contador de tentativas

2. **`POST /instance/create`** - Cria instância com:
   - `qrcode: true` → Gera QR Code automaticamente
   - `webhook.url` → URL para receber eventos
   - `webhook.events` → Eventos a escutar (QRCODE_UPDATED, CONNECTION_UPDATE, etc.)

3. **Webhook `QRCODE_UPDATED`** - Envia QR Code em Base64 quando configurado com `webhook_base64: true`

### Benefícios:
- ✅ UX simplificada (tudo dentro do app)
- ✅ Sem redirecionamentos externos
- ✅ Controle total do fluxo
- ✅ Pairing Code como alternativa ao QR (mais fácil de implementar)

---

## 🏗️ Arquitetura Final

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                          │
├─────────────────────────────────────────────────────────────────────┤
│  Página: /agente-sdr (ProtectedFeature: canAccessWhatsApp)          │
│                                                                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │
│  │ Aba: Conexão    │ │ Aba: Config     │ │ Aba: Playground │       │
│  │ - QR Code/Pair  │ │ - Prompt SDR    │ │ - Testar Agente │       │
│  │ - Status Badge  │ │ - AI Settings   │ │ - Chat Simulado │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  │ Edge Functions
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                                │
├─────────────────────────────────────────────────────────────────────┤
│  Edge Functions:                                                    │
│  ├── create-evolution-instance → Cria instância na Evolution API   │
│  ├── get-connection-status → Busca status/QR Code                   │
│  └── evolution-webhook → Recebe eventos (QR_UPDATE, CONNECTION)     │
│                                                                     │
│  Tabelas:                                                           │
│  ├── evolution_instances → Instâncias WhatsApp                     │
│  └── sdr_agent_config → Configurações do Agente SDR                │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  │ REST API
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EVOLUTION API                                     │
├─────────────────────────────────────────────────────────────────────┤
│  POST /instance/create                                              │
│  GET  /instance/connect/{instance}                                   │
│  GET  /instance/connectionState/{instance}                           │
│  → Webhooks: QRCODE_UPDATED, CONNECTION_UPDATE, MESSAGES_UPSERT    │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  │ Webhook → Mensagens WhatsApp
                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    N8N (Agente SDR)                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Fluxo: Mensagem Recebida → Busca Config → AI Agent → Resposta     │
│  Configurações usadas: temperature, topP, maxTokens, prompt, etc.   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Parâmetros do AI Agent (N8N)

### 📄 ANÁLISE DO PROMPT EXAMPLE

Baseado na análise do arquivo `docs/prompt_example.md`, identificamos os seguintes campos dinâmicos que o usuário precisa configurar:

#### Variáveis Identificadas no Prompt:
| Variável | Seção | Descrição | Tipo Campo |
|----------|-------|-----------|------------|
| Nome do Agente | `<identidade>` | "Manu Lens" - Nome do agente SDR | Input text |
| Nome da Empresa | `<identidade>` | "Produtora MaxVision" | Input text |
| Descrição da Empresa | `<identidade>` | Especialidades e serviços | Textarea |
| Modelos de Apresentação | `<apresentacao>` | Frases de abertura | Textarea (múltiplas) |
| Regras de Condução | `<conducao>` | Como conduzir a conversa | Textarea |
| Qualificação Mínima | `<qualificacao_minima>` | Requisitos para agendar | Checklist |
| Steps de Mapeamento | `<mapeamento_de_leads>` | Perguntas sequenciais | Lista editável |
| Técnicas de Objeção | `<manejo_de_objeções>` | Frases de contorno | Textarea |
| Limitações | `<limitações>` | O que o agente NÃO faz | Textarea |
| Formatação | `<uso_de_linguagem>` | Regras de formatação | Toggles |

### 🔗 JSON SCHEMA PARA N8N

O N8N receberá um JSON estruturado com toda a configuração do agente:

```json
{
  "agente_config": {
    "identidade": {
      "nome_agente": "Manu Lens",
      "nome_empresa": "Produtora MaxVision",
      "descricao_empresa": "especializado em técnicas de venda consultiva...",
      "missao": "criar uma conexão humana e genuína, coletar informações essenciais..."
    },
    "apresentacao": {
      "modelos": [
        "Oi, tudo bem? Me chamo {nome_agente} da equipe {nome_empresa}...",
        "Olá, eu sou a {nome_agente} da {nome_empresa}, especialista em..."
      ]
    },
    "conducao": {
      "regras": [
        "Faça uma pergunta por vez e aguarde a resposta",
        "Intercale perguntas com comentários de validação",
        "Use informações do lead para conectar soluções"
      ],
      "usar_reacoes": true,
      "frequencia_reacoes": 3
    },
    "qualificacao": {
      "requisitos_minimos": [
        "Informar endereço/local",
        "Data de gravação",
        "Objetivo do vídeo",
        "Nome da empresa (se projeto empresarial)"
      ],
      "perguntas_mapeamento": [
        {
          "ordem": 1,
          "pergunta": "Pode me passar o endereço do local, a data e o horário previsto?",
          "tipo": "texto",
          "obrigatoria": true
        },
        {
          "ordem": 2,
          "pergunta": "Me conta um pouco sobre o que você e/ou a sua empresa faz?",
          "tipo": "texto",
          "obrigatoria": true
        }
      ]
    },
    "mensagens": {
      "saudacao": null,
      "fallback": "Desculpe, não entendi sua mensagem. Pode reformular?",
      "encerramento": null,
      "fora_horario": null
    },
    "ia_config": {
      "model": "gpt-4o-mini",
      "temperature": 0.7,
      "top_p": 0.9,
      "frequency_penalty": 0.0,
      "presence_penalty": 0.0,
      "max_tokens": 500
    },
    "comportamento": {
      "horario_atendimento": {
        "inicio": "09:00",
        "fim": "18:00",
        "dias": [1, 2, 3, 4, 5]
      },
      "agendamento_automatico": false,
      "link_calendario": null
    },
    "objecoes": {
      "tecnicas": [
        "Isso faz sentido... e é exatamente por isso que...",
        "Entendi que [ponto positivo] é importante para você, certo?"
      ]
    },
    "limitacoes": [
      "Não responda perguntas fora do escopo",
      "Não mostre dados de outros clientes",
      "Nunca recomende concorrentes"
    ]
  },
  "metadata": {
    "versao": "1.0",
    "atualizado_em": "2025-01-07T10:00:00Z",
    "ativo": true
  }
}
```

### 📊 Estrutura da Tabela `sdr_agent_config` (ATUALIZADA)

Com base no JSON Schema acima, a tabela será estruturada assim:

```sql
-- Coluna principal: config_json JSONB
-- Armazena toda a configuração em formato JSON
-- Permite flexibilidade e versionamento
```

---

Baseado na documentação do N8N e padrões de LLM, os parâmetros configuráveis serão:

### Parâmetros Básicos (Obrigatórios)
| Parâmetro | Tipo | Descrição | Valor Padrão |
|-----------|------|-----------|--------------|
| `agent_name` | string | Nome do agente SDR | "Assistente SDR" |
| `company_name` | string | Nome da empresa | - |
| `custom_prompt` | text | System prompt personalizado | - |
| `greeting_message` | text | Mensagem de boas-vindas | - |

### Parâmetros de IA Avançados (Aba Avançado)
| Parâmetro | Tipo | Descrição | Valor Padrão | Range |
|-----------|------|-----------|--------------|-------|
| `temperature` | number | Controla aleatoriedade | 0.7 | 0.0 - 2.0 |
| `top_p` | number | Nucleus sampling | 0.9 | 0.0 - 1.0 |
| `frequency_penalty` | number | Penaliza repetição de palavras | 0.0 | -2.0 - 2.0 |
| `presence_penalty` | number | Penaliza novos tópicos | 0.0 | -2.0 - 2.0 |
| `max_tokens` | integer | Máximo de tokens na resposta | 500 | 50 - 4000 |
| `model` | select | Modelo LLM a usar | "gpt-4o-mini" | - |

### Parâmetros de Comportamento
| Parâmetro | Tipo | Descrição | Valor Padrão |
|-----------|------|-----------|--------------|
| `fallback_message` | text | Mensagem quando não entende | "Desculpe, não entendi..." |
| `closing_message` | text | Mensagem de encerramento | - |
| `business_hours` | json | Horário de atendimento | {"start":"09:00","end":"18:00","days":[1,2,3,4,5]} |
| `out_of_hours_message` | text | Mensagem fora do horário | - |
| `auto_schedule_meetings` | boolean | Agendar reuniões automaticamente | false |
| `calendar_link` | string | Link do calendário | - |

### Parâmetros de Qualificação
| Parâmetro | Tipo | Descrição | Valor Padrão |
|-----------|------|-----------|--------------|
| `target_audience` | text | Público-alvo | - |
| `main_products_services` | text | Produtos/serviços principais | - |
| `unique_value_proposition` | text | Proposta de valor | - |
| `qualification_questions` | json[] | Perguntas de qualificação | [] |

---

## 🎨 Design da Interface

### Aba 1: Conexão WhatsApp

```
┌─────────────────────────────────────────────────────────────────┐
│  🔗 Conexão WhatsApp                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Status: ● Desconectado / ● Conectando / ● Conectado           │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │                                                 │           │
│  │     [QR CODE BASE64 ou PAIRING CODE]           │           │
│  │                                                 │           │
│  │     Escaneie com WhatsApp ou digite:           │           │
│  │     Código: WZYEH1YY                           │           │
│  │                                                 │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  [📱 Regenerar QR Code]  [🔄 Verificar Conexão]                │
│                                                                 │
│  Número conectado: +55 11 99999-9999 (se conectado)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Aba 2: Configuração do Agente (ATUALIZADO COM TABS DETALHADAS)

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ Configuração do Agente SDR                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Identidade|Apresentação|Condução|Qualificação|Mensagens|     │
│   IA Config|Comportamento|Objeções|Limitações]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Tab 1: Identidade
```
┌─────────────────────────────────────────────────┐
│  👤 Identidade do Agente                        │
│                                                 │
│  Nome do Agente:                               │
│  ┌─────────────────────────────────────────┐   │
│  │ Manu Lens                               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Nome da Empresa:                              │
│  ┌─────────────────────────────────────────┐   │
│  │ Produtora MaxVision                     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Descrição da Empresa:                    📊   │
│  ┌─────────────────────────────────────────┐   │
│  │ Especializada em produção de vídeos,   │   │
│  │ drones FPV e soluções empresariais     │   │
│  │ com Inteligência Artificial.           │   │
│  └─────────────────────────────────────────┘   │
│  147/500 caracteres restantes                  │
│                                                 │
│  Missão do Agente:                        📊   │
│  ┌─────────────────────────────────────────┐   │
│  │ Criar conexão humana e genuína,        │   │
│  │ coletar informações essenciais e       │   │
│  │ agendar reuniões de forma natural.     │   │
│  └─────────────────────────────────────────┘   │
│  250/1000 caracteres restantes                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Tab 6: IA Config (SLIDERS MAGIC-MCP)
```
┌─────────────────────────────────────────────────┐
│  🤖 Configurações de IA                         │
│                                                 │
│  Modelo de IA:                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ GPT-4o Mini (Recomendado)           ▼  │   │
│  └─────────────────────────────────────────┘   │
│  ℹ️ Rápido e econômico                         │
│                                                 │
│  ═══════════════════════════════════════════   │
│                                                 │
│  Temperatura                             0.7   │
│  ○═══════════════●═══════════════════○        │
│  ℹ️ 0 = Determinístico, 2 = Muito criativo     │
│                                                 │
│  Top P (Nucleus Sampling)                0.9   │
│  ○═══════════════════════════●═══════○        │
│  ℹ️ Controla diversidade de tokens             │
│                                                 │
│  Penalidade de Frequência                0.0   │
│  ○═══════════●═══════════════════════○        │
│  ℹ️ Negativo repete, Positivo diversifica      │
│                                                 │
│  Penalidade de Presença                  0.0   │
│  ○═══════════●═══════════════════════○        │
│  ℹ️ Controla introdução de novos tópicos       │
│                                                 │
│  Máximo de Tokens                        500   │
│  ○════●══════════════════════════════○        │
│  ℹ️ 50 - 4000                                  │
│                                                 │
│  [🔄 Restaurar Padrões]  [💾 Salvar]           │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Tab 4: Qualificação (Lista Editável)
```
┌─────────────────────────────────────────────────┐
│  ✅ Qualificação de Leads                       │
│                                                 │
│  Requisitos Mínimos para Agendar:              │
│  ┌─────────────────────────────────────────┐   │
│  │ ☑ Informar endereço/local          [✕] │   │
│  │ ☑ Data de gravação                 [✕] │   │
│  │ ☑ Objetivo do vídeo                [✕] │   │
│  │ ☑ Nome da empresa (se empresarial) [✕] │   │
│  │ [+ Adicionar requisito]                │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Perguntas de Mapeamento:                      │
│  ┌─────────────────────────────────────────┐   │
│  │ 1. Pode me passar o endereço...    [⋮] │   │
│  │    Tipo: Texto | Obrigatória ✓         │   │
│  │                                         │   │
│  │ 2. Me conta sobre sua empresa?     [⋮] │   │
│  │    Tipo: Texto | Obrigatória ✓         │   │
│  │                                         │   │
│  │ 3. Vocês usam redes sociais?       [⋮] │   │
│  │    Tipo: Texto | Opcional              │   │
│  │                                         │   │
│  │ [+ Adicionar pergunta]                  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Aba 3: Playground (Teste do Agente)

```
┌─────────────────────────────────────────────────────────────────┐
│  🎮 Playground - Testar Agente                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │                                                 │           │
│  │  🤖 Olá! Sou o assistente da [Empresa].        │           │
│  │     Como posso ajudar você hoje?               │           │
│  │                                                 │           │
│  │                          Olá, tenho interesse  │           │
│  │                          nos seus produtos! 👤 │           │
│  │                                                 │           │
│  │  🤖 Que ótimo! Posso te ajudar com isso.       │           │
│  │     Qual produto você tem interesse?           │           │
│  │                                                 │           │
│  │  ─────────────────────────────────────────     │           │
│  │  │ Digite uma mensagem...              📎 🎤│  │           │
│  │  ─────────────────────────────────────────     │           │
│  │                                                 │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  ℹ️ Este é um ambiente de teste. As mensagens não são          │
│     enviadas para o WhatsApp conectado.                        │
│                                                                 │
│  [🔄 Reiniciar Conversa]  [📊 Ver Métricas]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Etapas de Implementação

### FASE 1: Banco de Dados (Supabase Migrations)
**Prioridade:** Alta  
**Estimativa:** 2-3 horas  
**Status:** ⏳ Aguardando

#### 1.1 Migration: `evolution_instances`
```sql
CREATE TABLE public.evolution_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL REFERENCES public.clientes(phone) ON DELETE CASCADE,
    instance_name VARCHAR(100) UNIQUE NOT NULL,
    instance_token VARCHAR(255),
    connection_status VARCHAR(20) DEFAULT 'disconnected',
    whatsapp_number VARCHAR(20),
    qr_code TEXT,
    pairing_code VARCHAR(20),
    last_qr_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    connected_at TIMESTAMPTZ,
    
    CONSTRAINT valid_status CHECK (connection_status IN ('disconnected', 'connecting', 'connected', 'error'))
);

-- Índices
CREATE INDEX idx_evolution_instances_phone ON public.evolution_instances(phone);

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

CREATE POLICY "evolution_instances_delete" ON public.evolution_instances
FOR DELETE TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()));

-- Trigger para updated_at
CREATE TRIGGER set_evolution_instances_updated_at
    BEFORE UPDATE ON public.evolution_instances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

#### 1.2 Migration: `sdr_agent_config` (ATUALIZADO COM JSON)
```sql
-- Tabela simplificada usando JSONB para máxima flexibilidade
-- O campo config_json armazena toda a configuração do agente
-- Isso permite versionamento e extensibilidade sem migrations

CREATE TABLE public.sdr_agent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL REFERENCES public.clientes(phone) ON DELETE CASCADE,
    instance_id UUID REFERENCES public.evolution_instances(id) ON DELETE SET NULL,
    
    -- Configuração completa do agente em JSON
    -- Schema: AgenteConfigJSON (ver types/sdr.ts)
    config_json JSONB NOT NULL DEFAULT '{
      "identidade": {
        "nome_agente": "Assistente SDR",
        "nome_empresa": "",
        "descricao_empresa": "",
        "missao": "Criar conexão humana e genuína, coletar informações essenciais e agendar reuniões"
      },
      "apresentacao": { "modelos": [] },
      "conducao": {
        "regras": [],
        "usar_reacoes": true,
        "frequencia_reacoes": 3
      },
      "qualificacao": {
        "requisitos_minimos": [],
        "perguntas_mapeamento": []
      },
      "mensagens": {
        "saudacao": null,
        "fallback": "Desculpe, não entendi sua mensagem. Pode reformular?",
        "encerramento": null,
        "fora_horario": null
      },
      "ia_config": {
        "model": "gpt-4o-mini",
        "temperature": 0.7,
        "top_p": 0.9,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "max_tokens": 500
      },
      "comportamento": {
        "horario_atendimento": {
          "inicio": "09:00",
          "fim": "18:00",
          "dias": [1,2,3,4,5]
        },
        "agendamento_automatico": false,
        "link_calendario": null
      },
      "objecoes": { "tecnicas": [] },
      "limitacoes": [
        "Não responda perguntas fora do escopo",
        "Não mostre dados de outros clientes",
        "Nunca recomende concorrentes"
      ]
    }'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_phone_config UNIQUE (phone)
);

-- Índices para queries em campos JSONB
CREATE INDEX idx_sdr_agent_config_phone ON public.sdr_agent_config(phone);
CREATE INDEX idx_sdr_agent_config_instance ON public.sdr_agent_config(instance_id);
CREATE INDEX idx_sdr_agent_config_is_active ON public.sdr_agent_config(is_active);
-- Índice GIN para busca em JSONB (se necessário no futuro)
CREATE INDEX idx_sdr_agent_config_json ON public.sdr_agent_config USING GIN (config_json);

-- RLS Policies
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

-- Trigger para updated_at
CREATE TRIGGER set_sdr_agent_config_updated_at
    BEFORE UPDATE ON public.sdr_agent_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FUNÇÕES AUXILIARES PARA MANIPULAÇÃO DO JSON
-- ============================================================================

-- Função para atualizar seção específica do config_json
CREATE OR REPLACE FUNCTION public.update_sdr_config_section(
    p_phone VARCHAR(20),
    p_section TEXT,
    p_data JSONB
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    UPDATE public.sdr_agent_config
    SET config_json = jsonb_set(config_json, ARRAY[p_section], p_data),
        updated_at = now()
    WHERE phone = p_phone
    RETURNING config_json INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter configuração completa para N8N
CREATE OR REPLACE FUNCTION public.get_sdr_config_for_n8n(
    p_phone VARCHAR(20)
) RETURNS JSONB AS $$
DECLARE
    v_config JSONB;
BEGIN
    SELECT jsonb_build_object(
        'agente_config', config_json,
        'metadata', jsonb_build_object(
            'versao', '1.0',
            'atualizado_em', updated_at,
            'ativo', is_active
        )
    )
    INTO v_config
    FROM public.sdr_agent_config
    WHERE phone = p_phone AND is_active = true;
    
    RETURN COALESCE(v_config, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Validação Fase 1:**
- [ ] Tabelas criadas sem erros
- [ ] RLS policies funcionando
- [ ] Triggers de updated_at ativos
- [ ] Índices criados

---

### FASE 2: Tipos TypeScript
**Prioridade:** Alta  
**Estimativa:** 1-2 horas  
**Status:** ⏳ Aguardando

#### 2.1 Arquivo: `src/types/sdr.ts`

```typescript
// =============================================================================
// TIPOS PARA EVOLUTION API
// =============================================================================

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface EvolutionInstance {
  id: string;
  phone: string;
  instance_name: string;
  instance_token: string | null;
  connection_status: ConnectionStatus;
  whatsapp_number: string | null;
  qr_code: string | null;
  pairing_code: string | null;
  last_qr_update: string | null;
  created_at: string;
  updated_at: string;
  connected_at: string | null;
}

// =============================================================================
// JSON SCHEMA PARA N8N - CONFIGURAÇÃO DO AGENTE SDR
// =============================================================================

/** Modelo de apresentação do agente */
export interface ModeloApresentacao {
  id: string;
  texto: string;
  ativo: boolean;
}

/** Regra de condução de conversa */
export interface RegraConducao {
  id: string;
  regra: string;
  ativa: boolean;
}

/** Pergunta de mapeamento de leads */
export interface PerguntaMapeamento {
  id: string;
  ordem: number;
  pergunta: string;
  tipo: 'texto' | 'sim_nao' | 'multipla_escolha';
  opcoes?: string[];
  obrigatoria: boolean;
}

/** Técnica de contorno de objeções */
export interface TecnicaObjecao {
  id: string;
  tecnica: string;
  exemplo?: string;
}

/** Configuração de horário de atendimento */
export interface HorarioAtendimento {
  inicio: string; // "09:00"
  fim: string;    // "18:00"
  dias: number[]; // [1,2,3,4,5] = seg-sex
}

/** Configuração de IA */
export interface IAConfig {
  model: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo';
  temperature: number;     // 0.0 - 2.0
  top_p: number;           // 0.0 - 1.0
  frequency_penalty: number; // -2.0 - 2.0
  presence_penalty: number;  // -2.0 - 2.0
  max_tokens: number;        // 50 - 4000
}

/** Schema JSON completo para N8N */
export interface AgenteConfigJSON {
  identidade: {
    nome_agente: string;
    nome_empresa: string;
    descricao_empresa: string;
    missao: string;
  };
  apresentacao: {
    modelos: ModeloApresentacao[];
  };
  conducao: {
    regras: RegraConducao[];
    usar_reacoes: boolean;
    frequencia_reacoes: number; // A cada X mensagens
  };
  qualificacao: {
    requisitos_minimos: string[];
    perguntas_mapeamento: PerguntaMapeamento[];
  };
  mensagens: {
    saudacao: string | null;
    fallback: string;
    encerramento: string | null;
    fora_horario: string | null;
  };
  ia_config: IAConfig;
  comportamento: {
    horario_atendimento: HorarioAtendimento;
    agendamento_automatico: boolean;
    link_calendario: string | null;
  };
  objecoes: {
    tecnicas: TecnicaObjecao[];
  };
  limitacoes: string[];
}

/** Metadados da configuração */
export interface ConfigMetadata {
  versao: string;
  atualizado_em: string;
  ativo: boolean;
}

// =============================================================================
// TIPOS PARA BANCO DE DADOS (SUPABASE)
// =============================================================================

export interface SDRAgentConfig {
  id: string;
  phone: string;
  instance_id: string | null;
  
  // JSON com toda configuração do agente
  config_json: AgenteConfigJSON;
  
  // Metadados
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// TIPOS PARA FORMS (Separados por Tab)
// =============================================================================

/** Tab: Identidade do Agente */
export interface FormIdentidade {
  nome_agente: string;
  nome_empresa: string;
  descricao_empresa: string;
  missao: string;
}

/** Tab: Apresentação */
export interface FormApresentacao {
  modelos: ModeloApresentacao[];
}

/** Tab: Condução da Conversa */
export interface FormConducao {
  regras: RegraConducao[];
  usar_reacoes: boolean;
  frequencia_reacoes: number;
}

/** Tab: Qualificação de Leads */
export interface FormQualificacao {
  requisitos_minimos: string[];
  perguntas_mapeamento: PerguntaMapeamento[];
}

/** Tab: Mensagens */
export interface FormMensagens {
  saudacao: string;
  fallback: string;
  encerramento: string;
  fora_horario: string;
}

/** Tab: Configurações de IA (SLIDERS) */
export interface FormIAConfig {
  model: IAConfig['model'];
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
}

/** Tab: Comportamento */
export interface FormComportamento {
  horario_atendimento: HorarioAtendimento;
  agendamento_automatico: boolean;
  link_calendario: string;
}

/** Tab: Objeções */
export interface FormObjecoes {
  tecnicas: TecnicaObjecao[];
}

/** Tab: Limitações */
export interface FormLimitacoes {
  limitacoes: string[];
}

// =============================================================================
// TIPOS PARA PLAYGROUND
// =============================================================================

export interface PlaygroundMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reacao?: string; // Emoji de reação
}

export interface PlaygroundSession {
  messages: PlaygroundMessage[];
  isLoading: boolean;
  leadsColetados: Record<string, string>; // Dados coletados do lead
}

// =============================================================================
// CONSTANTES
// =============================================================================

export const AI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recomendado)', description: 'Rápido e econômico' },
  { value: 'gpt-4o', label: 'GPT-4o (Mais Avançado)', description: 'Melhor qualidade' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Mais rápido' },
] as const;

export const SLIDER_CONFIGS = {
  temperature: {
    min: 0,
    max: 2,
    step: 0.1,
    default: 0.7,
    label: 'Temperatura',
    description: '0 = Determinístico, 2 = Muito criativo',
  },
  top_p: {
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.9,
    label: 'Top P (Nucleus Sampling)',
    description: 'Controla diversidade de tokens',
  },
  frequency_penalty: {
    min: -2,
    max: 2,
    step: 0.1,
    default: 0,
    label: 'Penalidade de Frequência',
    description: 'Negativo repete palavras, Positivo diversifica',
  },
  presence_penalty: {
    min: -2,
    max: 2,
    step: 0.1,
    default: 0,
    label: 'Penalidade de Presença',
    description: 'Controla introdução de novos tópicos',
  },
  max_tokens: {
    min: 50,
    max: 4000,
    step: 50,
    default: 500,
    label: 'Máximo de Tokens',
    description: 'Limite de tokens na resposta',
  },
} as const;

export const DEFAULT_IA_CONFIG: IAConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  top_p: 0.9,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: 500,
};

export const DEFAULT_HORARIO: HorarioAtendimento = {
  inicio: '09:00',
  fim: '18:00',
  dias: [1, 2, 3, 4, 5],
};

export const DEFAULT_CONFIG_JSON: AgenteConfigJSON = {
  identidade: {
    nome_agente: 'Assistente SDR',
    nome_empresa: '',
    descricao_empresa: '',
    missao: 'Criar conexão humana e genuína, coletar informações essenciais e agendar reuniões',
  },
  apresentacao: {
    modelos: [
      {
        id: '1',
        texto: 'Oi, tudo bem? Me chamo {nome_agente} da equipe {nome_empresa}.',
        ativo: true,
      },
    ],
  },
  conducao: {
    regras: [
      { id: '1', regra: 'Faça uma pergunta por vez e aguarde a resposta', ativa: true },
      { id: '2', regra: 'Intercale perguntas com comentários de validação', ativa: true },
    ],
    usar_reacoes: true,
    frequencia_reacoes: 3,
  },
  qualificacao: {
    requisitos_minimos: [],
    perguntas_mapeamento: [],
  },
  mensagens: {
    saudacao: null,
    fallback: 'Desculpe, não entendi sua mensagem. Pode reformular?',
    encerramento: null,
    fora_horario: null,
  },
  ia_config: DEFAULT_IA_CONFIG,
  comportamento: {
    horario_atendimento: DEFAULT_HORARIO,
    agendamento_automatico: false,
    link_calendario: null,
  },
  objecoes: {
    tecnicas: [],
  },
  limitacoes: [
    'Não responda perguntas fora do escopo',
    'Não mostre dados de outros clientes',
    'Nunca recomende concorrentes',
  ],
};
```

**Validação Fase 2:**
- [ ] Arquivo criado sem erros de TypeScript
- [ ] Tipos correspondem às tabelas do banco
- [ ] Constantes exportadas corretamente

---

### FASE 3: Edge Functions
**Prioridade:** Alta  
**Estimativa:** 4-6 horas  
**Status:** ⏳ Aguardando

#### 3.1 Edge Function: `create-evolution-instance`
- Criar instância na Evolution API
- Configurar webhook para receber eventos
- Salvar dados no Supabase
- Retornar pairing_code e qr_code

#### 3.2 Edge Function: `get-connection-status`
- Buscar status atual da instância
- Atualizar QR Code se necessário
- Retornar dados de conexão

#### 3.3 Edge Function: `evolution-webhook`
- Receber eventos da Evolution API
- Atualizar status de conexão
- Processar mensagens recebidas

**Validação Fase 3:**
- [ ] Functions deployadas sem erros
- [ ] Comunicação com Evolution API funcionando
- [ ] Webhook recebendo eventos
- [ ] Banco atualizado corretamente

---

### FASE 4: Hook useSDRAgent
**Prioridade:** Alta  
**Estimativa:** 4-6 horas  
**Status:** ⏳ Aguardando

#### 4.1 Arquivo: `src/hooks/useSDRAgent.ts`
- Query para buscar instância
- Query para buscar configuração
- Mutation para criar instância
- Mutation para salvar configuração
- Realtime subscription para status
- Polling para atualizar QR Code

**Validação Fase 4:**
- [ ] Hook criado e exportado
- [ ] Queries funcionando
- [ ] Mutations funcionando
- [ ] Realtime atualizando

---

### FASE 5: Componentes SDR
**Prioridade:** Alta  
**Estimativa:** 8-12 horas  
**Status:** ⏳ Aguardando

#### 5.1 Estrutura:
```
src/components/sdr/
├── SDRConnectionCard.tsx       # Card de conexão WhatsApp
├── SDRQRCodeDisplay.tsx        # Exibe QR Code ou Pairing Code
├── SDRStatusBadge.tsx          # Badge de status
├── SDRConfigForm.tsx           # Form de configuração
├── SDRConfigBasicTab.tsx       # Tab Básico
├── SDRConfigMessagesTab.tsx    # Tab Mensagens
├── SDRConfigQualificationTab.tsx # Tab Qualificação
├── SDRConfigAdvancedTab.tsx    # Tab IA Avançado
├── SDRPlayground.tsx           # Playground de teste
├── SDRPlaygroundChat.tsx       # Interface de chat
├── SDRPlaygroundMessage.tsx    # Componente de mensagem
├── AISettingsSlider.tsx        # Slider customizado para configs IA (MAGIC-MCP)
├── SliderWithTooltip.tsx       # Slider com tooltip (MAGIC-MCP)
├── TextareaWithCharacterLimit.tsx # Textarea com contador (MAGIC-MCP)
├── useSliderWithInput.ts       # Hook slider + input (MAGIC-MCP)
├── useCharacterLimit.ts        # Hook contador de caracteres (MAGIC-MCP)
└── index.ts                    # Exports
```

#### 5.2 Componentes MAGIC-MCP a Implementar:

##### SliderWithTooltip.tsx
```tsx
"use client";

import * as Slider from "@radix-ui/react-slider";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useState, useRef, useEffect } from "react";

interface SliderWithTooltipProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  description?: string;
  formatValue?: (value: number) => string;
}

export function SliderWithTooltip({
  value,
  onChange,
  min,
  max,
  step,
  label,
  description,
  formatValue = (v) => v.toFixed(1),
}: SliderWithTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <span className="text-sm font-mono text-muted-foreground">
          {formatValue(value)}
        </span>
      </div>
      <Tooltip.Provider>
        <Tooltip.Root open={showTooltip}>
          <Tooltip.Trigger asChild>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[value]}
              onValueChange={([v]) => onChange(v)}
              max={max}
              min={min}
              step={step}
              onPointerDown={() => setShowTooltip(true)}
              onPointerUp={() => setShowTooltip(false)}
            >
              <Slider.Track className="bg-secondary relative grow rounded-full h-2">
                <Slider.Range className="absolute bg-primary rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-5 h-5 bg-background border-2 border-primary rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" />
            </Slider.Root>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm shadow-md"
              sideOffset={5}
            >
              {formatValue(value)}
              <Tooltip.Arrow className="fill-popover" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
```

##### TextareaWithCharacterLimit.tsx
```tsx
"use client";

import { useId, useState, ChangeEvent } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TextareaWithCharacterLimitProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  label: string;
  placeholder?: string;
  rows?: number;
}

export function TextareaWithCharacterLimit({
  value,
  onChange,
  maxLength,
  label,
  placeholder,
  rows = 4,
}: TextareaWithCharacterLimitProps) {
  const id = useId();
  const remaining = maxLength - value.length;
  const isNearLimit = remaining < maxLength * 0.1;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-describedby={`${id}-description`}
      />
      <p
        id={`${id}-description`}
        className={`text-right text-xs ${
          isNearLimit ? "text-destructive" : "text-muted-foreground"
        }`}
        role="status"
        aria-live="polite"
      >
        <span className="tabular-nums">{remaining}</span> caracteres restantes
      </p>
    </div>
  );
}
```

##### useSliderWithInput.ts (Hook)
```tsx
"use client";

import { useState, useCallback, ChangeEvent } from "react";

interface UseSliderWithInputOptions {
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
}

export function useSliderWithInput({
  defaultValue,
  min,
  max,
  step = 1,
}: UseSliderWithInputOptions) {
  const [value, setValue] = useState(defaultValue);

  const handleSliderChange = useCallback((newValue: number[]) => {
    setValue(newValue[0]);
  }, []);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (!isNaN(newValue) && newValue >= min && newValue <= max) {
        setValue(newValue);
      }
    },
    [min, max]
  );

  return {
    value,
    setValue,
    sliderProps: {
      value: [value],
      onValueChange: handleSliderChange,
      min,
      max,
      step,
    },
    inputProps: {
      type: "number",
      value: value.toString(),
      onChange: handleInputChange,
      min,
      max,
      step,
    },
  };
}
```

**Validação Fase 5:**
- [ ] Componentes renderizando
- [ ] Forms validando com Zod
- [ ] Sliders funcionando
- [ ] Playground simulando conversas

---

### FASE 6: Página AgenteSDR
**Prioridade:** Alta  
**Estimativa:** 3-4 horas  
**Status:** ⏳ Aguardando

#### 6.1 Arquivo: `src/pages/AgenteSDR.tsx`
- Layout com Tabs (Conexão, Configuração, Playground)
- Proteção com ProtectedFeature
- Integração com useSDRAgent

#### 6.2 Atualização: `src/App.tsx`
- Adicionar rota /agente-sdr
- Lazy loading do componente

#### 6.3 Atualização: Menu Lateral
- Adicionar link para Agente SDR (apenas Business/Premium)

**Validação Fase 6:**
- [ ] Página acessível pela rota
- [ ] ProtectedFeature bloqueando Free/Basic
- [ ] Menu lateral atualizado
- [ ] Navegação entre tabs funcionando

---

### FASE 7: Testes e Validação
**Prioridade:** Alta  
**Estimativa:** 4-6 horas  
**Status:** ⏳ Aguardando

#### 7.1 Testes Manuais:
- [ ] Fluxo completo de conexão WhatsApp
- [ ] Salvamento de configurações
- [ ] Playground funcionando
- [ ] Permissões por plano

#### 7.2 Validação de Segurança:
- [ ] RLS policies testadas
- [ ] Tokens não expostos no frontend
- [ ] Edge functions com autenticação

---

## 📅 Cronograma Estimado

| Fase | Descrição | Tempo | Dependência |
|------|-----------|-------|-------------|
| 1 | Migrations Supabase | 2-3h | - |
| 2 | Tipos TypeScript | 1-2h | Fase 1 |
| 3 | Edge Functions | 4-6h | Fase 1 |
| 4 | Hook useSDRAgent | 4-6h | Fases 1,2,3 |
| 5 | Componentes SDR | 8-12h | Fases 2,4 |
| 6 | Página AgenteSDR | 3-4h | Fase 5 |
| 7 | Testes e Validação | 4-6h | Todas |
| **Total** | | **26-39 horas** | |

---

## 🔧 Variáveis de Ambiente Necessárias

### Supabase Edge Functions (Secrets)
```env
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-secreta
EVOLUTION_WEBHOOK_SECRET=secret-para-validar-webhooks
N8N_SDR_WEBHOOK_URL=https://n8n.../webhook/sdr-agent
```

### Frontend (.env)
```env
# Nenhuma variável nova necessária
# Edge functions são chamadas via supabase.functions.invoke()
```

---

## 📦 Dependências NPM a Instalar

### Componentes MAGIC-MCP (Sliders e Textarea)
```bash
npm install @radix-ui/react-slider @radix-ui/react-tooltip
```

### QR Code (para exibir o QR da Evolution API)
```bash
npm install qrcode.react
```

### Tipos do QR Code
```bash
npm install -D @types/qrcode.react
```

### Resumo das Novas Dependências:
```json
{
  "dependencies": {
    "@radix-ui/react-slider": "^1.x.x",
    "@radix-ui/react-tooltip": "^1.x.x",
    "qrcode.react": "^3.x.x"
  },
  "devDependencies": {
    "@types/qrcode.react": "^1.x.x"
  }
}
```

---

## ✅ Critérios de Aceitação

1. **Conexão WhatsApp:**
   - [ ] Usuário consegue ver QR Code ou Pairing Code
   - [ ] Status atualiza em tempo real
   - [ ] Reconexão funciona após desconexão

2. **Configuração SDR:**
   - [ ] Todas as abas funcionando
   - [ ] Sliders de IA responsivos
   - [ ] Validação de campos obrigatórios
   - [ ] Salvamento persistente

3. **Playground:**
   - [ ] Simulação de conversa funciona
   - [ ] Usa configurações salvas
   - [ ] Resposta da IA em tempo adequado

4. **Segurança:**
   - [ ] Apenas Business/Premium acessam
   - [ ] Dados isolados por usuário
   - [ ] Tokens protegidos

---

## 📢 IMPORTANTE: Processo de Implantação

### Regras de Execução:

1. **Etapa por Etapa:** Cada fase deve ser implementada completamente antes de passar para a próxima

2. **Validação Obrigatória:** Após cada fase, todos os itens de validação devem ser confirmados

3. **Uso de Context7-MCP:** Sempre consultar documentação atualizada antes de implementar

4. **Documentação:** Atualizar este plano com detalhes de implementação após cada fase

5. **Aprovação:** Aguardar aprovação explícita do usuário antes de prosseguir

---

## 📝 Log de Implementação

### Fase 1 - Migrations Supabase
**Status:** ⏳ Aguardando aprovação para iniciar  
**Implementado em:** -  
**Detalhes:** -

### Fase 2 - Tipos TypeScript
**Status:** ⏳ Aguardando  
**Implementado em:** -  
**Detalhes:** -

### Fase 3 - Edge Functions
**Status:** ⏳ Aguardando  
**Implementado em:** -  
**Detalhes:** -

### Fase 4 - Hook useSDRAgent
**Status:** ⏳ Aguardando  
**Implementado em:** -  
**Detalhes:** -

### Fase 5 - Componentes SDR
**Status:** ⏳ Aguardando  
**Implementado em:** -  
**Detalhes:** -

### Fase 6 - Página AgenteSDR
**Status:** ⏳ Aguardando  
**Implementado em:** -  
**Detalhes:** -

### Fase 7 - Testes e Validação
**Status:** ⏳ Aguardando  
**Implementado em:** -  
**Detalhes:** -

---

## 🚀 PRÓXIMO PASSO

### ✅ Atualizações Realizadas (v2.0):
1. **Componentes MAGIC-MCP**: Sliders com tooltip, textarea com contador
2. **JSON Schema para N8N**: Estrutura completa baseada no `prompt_example.md`
3. **Tipos TypeScript**: Atualizados com interfaces para JSON
4. **Migration JSONB**: Tabela flexível com funções auxiliares
5. **9 Tabs de Configuração**: Identidade, Apresentação, Condução, Qualificação, Mensagens, IA Config, Comportamento, Objeções, Limitações
6. **Código dos Componentes**: SliderWithTooltip, TextareaWithCharacterLimit, hooks customizados

### 📋 Campos Identificados (baseado no prompt_example.md):

| Seção | Campos | Componente UI |
|-------|--------|---------------|
| Identidade | nome_agente, nome_empresa, descricao_empresa, missao | Input + Textarea com contador |
| Apresentação | modelos[] | Lista editável de textareas |
| Condução | regras[], usar_reacoes, frequencia_reacoes | Lista + Toggle + Slider |
| Qualificação | requisitos_minimos[], perguntas_mapeamento[] | Checklists + Lista editável |
| Mensagens | saudacao, fallback, encerramento, fora_horario | Textareas com contador |
| IA Config | model, temperature, top_p, frequency_penalty, presence_penalty, max_tokens | Select + 5 Sliders |
| Comportamento | horario_atendimento, agendamento_automatico, link_calendario | Time inputs + Toggle + Input |
| Objeções | tecnicas[] | Lista editável |
| Limitações | limitacoes[] | Lista editável |

**Aguardando sua aprovação para iniciar a Fase 1: Migrations Supabase**

Confirme com "Aprovar" para iniciar a implementação.

---

*Documento criado em: 07/12/2025*  
*Versão: 2.0 (Atualizado com MAGIC-MCP e JSON Schema)*  
*Autor: GitHub Copilot + MaxVision*
