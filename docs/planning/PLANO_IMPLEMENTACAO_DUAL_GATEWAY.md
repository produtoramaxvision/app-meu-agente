# Plano de Implementação: Dual-Gateway WhatsApp (Meta + Evolution)

Este documento descreve o roteiro passo-a-passo para implementar a arquitetura híbrida de mensageria.

## 📅 Fase 1: Preparação e Banco de Dados (Dia 1-2)

### 1.1. Modelagem de Dados
- [ ] Criar migração SQL para tabela `whatsapp_providers`:
    ```sql
    CREATE TABLE whatsapp_providers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cliente_id UUID REFERENCES clientes(id),
      provider_type VARCHAR(20) CHECK (provider_type IN ('meta', 'evolution')),
      is_active BOOLEAN DEFAULT true,
      priority INT DEFAULT 1, -- Menor número = maior prioridade
      
      -- Configurações Meta
      meta_phone_id VARCHAR(50),
      meta_waba_id VARCHAR(50),
      meta_access_token TEXT, -- Criptografado (Vault)
      
      -- Configurações Evolution (Referência)
      evolution_instance_id UUID REFERENCES evolution_instances(id),
      
      created_at TIMESTAMPTZ DEFAULT now()
    );
    ```
- [ ] Criar migração SQL para tabela `whatsapp_message_logs` (Auditoria unificada).

### 1.2. Configuração de Ambiente
- [ ] Configurar variáveis de ambiente no Supabase para a Meta App (App ID, App Secret).
- [ ] Criar Bucket no Supabase Storage para mídias temporárias (`whatsapp-media`).

## 🛠️ Fase 2: Backend e Edge Functions (Dia 3-5)

### 2.1. Edge Function: `send-whatsapp-message` (Core)
- [ ] Criar nova função Deno.
- [ ] Implementar lógica de seleção de provedor (consulta `whatsapp_providers`).
- [ ] Implementar adaptador Meta Cloud API (axios/fetch).
- [ ] Implementar adaptador Evolution API (migrar lógica existente).
- [ ] Implementar lógica de Fallback (Meta falha -> Tenta Evolution).

### 2.2. Edge Function: `webhook-whatsapp-gateway`
- [ ] Criar nova função para receber POSTs.
- [ ] Implementar validação de assinatura (HMAC) para Meta.
- [ ] Implementar validação de API Key para Evolution.
- [ ] Implementar normalizadores (`normalizeMetaMessage`, `normalizeEvolutionMessage`).
- [ ] Configurar despacho para n8n (URL via env var).

## 💻 Fase 3: Frontend e UI (Dia 6-7)

### 3.1. Configuração de Provedores
- [ ] Criar nova página/aba em "Configurações" -> "Canais de Mensagem".
- [ ] Formulário para adicionar credenciais da Meta Cloud API.
- [ ] Listagem de provedores ativos com toggle de prioridade.

### 3.2. Atualização do `SendWhatsAppDialog`
- [ ] Refatorar para usar a nova Edge Function `send-whatsapp-message`.
- [ ] Remover lógica específica de instância Evolution do frontend (abstrair para o backend).
- [ ] Adicionar indicador visual de qual provedor está sendo usado (opcional, para debug).

## 🧪 Fase 4: Testes e Validação (Dia 8)

### 4.1. Testes Unitários
- [ ] Testar normalização de mensagens de texto, imagem e áudio.
- [ ] Testar lógica de fallback (simular erro na Meta).

### 4.2. Testes de Integração
- [ ] Enviar mensagem via Meta -> Verificar recebimento no celular.
- [ ] Receber mensagem no celular -> Verificar webhook no n8n.
- [ ] Testar fluxo híbrido: Enviar via Meta, Receber resposta, Enviar via Evolution (simulando queda Meta).

## 🚀 Fase 5: Deploy e Monitoramento (Dia 9)

- [ ] Deploy das Edge Functions.
- [ ] Executar migrações de banco em produção.
- [ ] Configurar Webhook na Meta App Dashboard (Developer Portal).
- [ ] Monitorar logs no Supabase Dashboard.

---

**Estimativa Total:** 9 Dias Úteis
**Recursos Necessários:** 1 Desenvolvedor Full-Stack Sênior