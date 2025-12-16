# 🔧 Troubleshooting - Resolução de Problemas

> **Última Atualização:** 15 de Dezembro de 2025  
> **Versão do App:** 2.0.0  
> **Autor:** Equipe Meu Agente

---

## 📋 Índice

1. [Problemas de Autenticação](#problemas-de-autenticação)
2. [Problemas com Agente SDR](#problemas-com-agente-sdr)
3. [Problemas com CRM](#problemas-com-crm)
4. [Problemas com Chat IA](#problemas-com-chat-ia)
5. [Problemas de Sincronização](#problemas-de-sincronização)
6. [Problemas de Performance](#problemas-de-performance)
7. [Erros de Pagamento](#erros-de-pagamento)
8. [Como Obter Suporte](#como-obter-suporte)

---

## 🔐 Problemas de Autenticação

### ❌ Não consigo fazer login

**Sintomas:**
- Mensagem: "Credenciais inválidas"
- Botão de login não responde
- Redireciona para login após já estar logado

**Causas Possíveis:**

1. **Telefone ou senha incorretos**
2. **Conta bloqueada por tentativas**
3. **Cache desatualizado**
4. **Token JWT expirado**

**Soluções:**

#### 1. Verificar Telefone e Senha

```typescript
// Formato correto do telefone
✅ Correto: 5511999999999 (DDD + número, sem espaços/parênteses)
❌ Errado: (11) 99999-9999
❌ Errado: 11999999999 (sem código do país)
```

#### 2. Resetar Senha

1. Clique em "Esqueci minha senha"
2. Digite seu telefone
3. Receberá email em `{telefone}@meuagente.api.br`
4. Siga link do email
5. Defina nova senha

#### 3. Limpar Cache do Navegador

```javascript
// Via Console do Navegador (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

#### 4. Bloqueio Temporário

Se tentou login 5+ vezes com senha errada:

- ⏰ Aguarde 15 minutos
- Ou use "Esqueci minha senha"

---

### ❌ Deslogado automaticamente

**Sintomas:**
- Ao recarregar página, volta para tela de login
- Sessão expira muito rápido

**Causas:**

1. **Token JWT expirou** (24h padrão)
2. **localStorage bloqueado** (navegador privado)
3. **Conflito de abas** (múltiplas abas abertas)

**Soluções:**

#### 1. Verificar Modo Navegação

```
❌ Evite usar modo privado/anônimo
✅ Use navegador normal com cookies habilitados
```

#### 2. Verificar localStorage

```javascript
// Console do navegador
console.log(localStorage.getItem('sb-access-token'));
// Deve retornar um JWT longo
```

#### 3. Fazer Login Novamente

```
Sessão expira após 24h por segurança.
Faça login novamente para renovar.
```

---

## 🤖 Problemas com Agente SDR

### ❌ Não consigo conectar WhatsApp

**Sintomas:**
- QR Code não aparece
- QR Code expirou
- WhatsApp escaneado mas não conecta

**Soluções:**

#### 1. QR Code Não Aparece

**Verificar plano:**
```typescript
// Apenas Business e Premium têm acesso
if (planId !== 'business' && planId !== 'premium') {
  // Upgrade necessário
}
```

**Verificar limite de instâncias:**
```sql
-- Via Supabase SQL Editor
SELECT COUNT(*) FROM evolution_instances 
WHERE phone = 'SEU_TELEFONE';

-- Business: máximo 2
-- Premium: máximo 5
```

**Regenerar QR Code:**
1. Clique em "🔄 Atualizar"
2. Novo QR Code será gerado
3. Válido por 60 segundos

#### 2. QR Code Expirou

```
Tempo de expiração: 60 segundos

Solução:
1. Clique "Atualizar"
2. Escaneie rapidamente
3. Ou use Pairing Code (5 minutos de validade)
```

#### 3. WhatsApp Não Conecta

**Limite de dispositivos:**
```
WhatsApp permite máximo 4 dispositivos vinculados.

Solução:
1. WhatsApp > Dispositivos Conectados
2. Remova dispositivos antigos
3. Tente novamente
```

**Bloqueio do WhatsApp:**
```
Se foi bloqueado por uso de API não oficial:

1. Aguarde 24-48 horas
2. Use número diferente
3. Considere WhatsApp Business API oficial
```

---

### ❌ Agente não responde mensagens

**Sintomas:**
- Toggle está ativo
- WhatsApp conectado
- Mas mensagens não são respondidas

**Debug Passo a Passo:**

#### 1. Verificar Status de Conexão

```
Status deve estar: 🟢 Online

Se estiver 🔴 Offline:
1. Desconecte WhatsApp
2. Escaneie QR Code novamente
3. Aguarde status mudar para Online
```

#### 2. Verificar Webhook

```bash
# Via Supabase SQL Editor
SELECT instance_name FROM evolution_instances 
WHERE phone = 'SEU_TELEFONE' AND connection_status = 'connected';

# Copie o instance_name e teste webhook manualmente
curl -X POST https://webhook.meuagente.api.br/webhook/agente-sdr \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "INSTANCE_NAME_AQUI",
    "data": {
      "key": {"remoteJid": "teste@s.whatsapp.net", "fromMe": false},
      "message": {"conversation": "teste"}
    }
  }'
```

#### 3. Verificar N8N Workflow

```
1. Acesse N8N Dashboard
2. Vá em Executions
3. Veja se há execuções recentes
4. Se há erros, veja detalhes
```

Erros comuns:
- `OpenAI API key invalid` → Atualizar chave
- `Supabase timeout` → Verificar RLS policies
- `Evolution API 404` → Verificar instance_name

#### 4. Verificar Configuração Salva

```sql
SELECT 
  is_active,
  config_json->>'identidade' as identidade
FROM sdr_agent_config sac
JOIN evolution_instances ei ON ei.id = sac.instance_id
WHERE ei.phone = 'SEU_TELEFONE';

-- Deve retornar is_active = true
-- E identidade deve estar preenchida
```

---

### ❌ Mensagens genéricas/ruins da IA

**Sintomas:**
- Agente responde mas ignora contexto
- Respostas muito curtas
- Não faz perguntas de qualificação

**Soluções:**

#### 1. Ajustar Parâmetros de IA

```typescript
// Recomendações por caso de uso

// Conversação Natural
temperature: 0.7
top_p: 0.9
max_tokens: 500

// Mais Criativo
temperature: 1.0
top_p: 0.95
max_tokens: 800

// Mais Formal/Objetivo
temperature: 0.5
top_p: 0.8
max_tokens: 300
```

#### 2. Melhorar Descrição da Empresa

```markdown
❌ Ruim:
"Somos uma empresa de vídeo"

✅ Bom:
"Somos a Filmadora Pro, produtora especializada em filmagem 
de casamentos, formaturas e eventos corporativos. Oferecemos 
pacotes completos com foto, vídeo 4K, drone e livestream. 
Atuamos em São Paulo há 10 anos e já filmamos mais de 500 eventos."
```

#### 3. Adicionar Exemplos de Objeções

```typescript
{
  objecoes: {
    tecnicas: [
      {
        nome: "Preço alto",
        exemplo: "Entendo! Trabalhamos com qualidade premium. 
        Posso mostrar nosso portfólio? Muitos clientes veem que 
        o investimento vale a pena quando conhecem nosso trabalho."
      }
    ]
  }
}
```

---

## 📊 Problemas com CRM

### ❌ Leads do WhatsApp não aparecem

**Sintomas:**
- Contatos sincronizados
- Mas não aparecem no CRM

**Causas:**

1. **Campo `crm_lead_status` é null**
2. **Filtro aplicado**
3. **Cache desatualizado**

**Soluções:**

#### 1. Popular Status Null

```sql
-- Via Supabase SQL Editor
UPDATE evolution_contacts
SET crm_lead_status = 'novo'
WHERE crm_lead_status IS NULL
  AND phone = 'SEU_TELEFONE';

-- Verificar quantos foram atualizados
SELECT COUNT(*) FROM evolution_contacts
WHERE crm_lead_status = 'novo' AND phone = 'SEU_TELEFONE';
```

#### 2. Limpar Filtros

```
No CRM:
1. Clique em "Limpar Filtros"
2. Remova busca de texto
3. Selecione "Todos" no filtro de instâncias
```

#### 3. Forçar Atualização

```typescript
// Console do navegador (F12)
import { queryClient } from '@/lib/react-query';
queryClient.invalidateQueries(['evolution-contacts']);
queryClient.invalidateQueries(['crm-pipeline']);
```

---

### ❌ Drag & Drop não funciona

**Sintomas:**
- Não consegue arrastar cards
- Card volta para posição original
- Erro ao soltar

**Soluções:**

#### 1. Verificar Navegador

```
✅ Suportados:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

❌ Não suportados:
- IE11
- Chrome < 90
```

#### 2. Desabilitar Extensões

```
Algumas extensões bloqueiam drag & drop:

1. Abra modo anônimo (Ctrl+Shift+N)
2. Teste se funciona
3. Se sim, desabilite extensões uma a uma
```

#### 3. Limpar Cache

```bash
# Via DevTools (F12)
Application > Storage > Clear site data
```

---

## 💬 Problemas com Chat IA

### ❌ Chat não carrega

**Sintomas:**
- Tela branca
- Loading infinito
- Erro "Failed to load"

**Soluções:**

#### 1. Verificar Sessões

```sql
-- Ver sessões do usuário
SELECT * FROM chat_ia_sessions 
WHERE phone = 'SEU_TELEFONE'
ORDER BY created_at DESC
LIMIT 10;

-- Se tiver muitas sessões (>100), pode estar lento
-- Deletar sessões antigas
DELETE FROM chat_ia_sessions
WHERE phone = 'SEU_TELEFONE'
  AND created_at < NOW() - INTERVAL '30 days'
  AND (
    SELECT COUNT(*) FROM chat_ia_messages 
    WHERE session_id = chat_ia_sessions.id
  ) = 0;
```

#### 2. Limpar Sessões Vazias

```sql
-- Deletar sessões sem mensagens
DELETE FROM chat_ia_sessions
WHERE id IN (
  SELECT s.id FROM chat_ia_sessions s
  LEFT JOIN chat_ia_messages m ON m.session_id = s.id
  WHERE m.id IS NULL
    AND s.phone = 'SEU_TELEFONE'
);
```

---

### ❌ IA não responde ou resposta demora

**Sintomas:**
- Mensagem enviada mas sem resposta
- Loading infinito após enviar
- Erro após timeout

**Soluções:**

#### 1. Verificar N8N Webhook

```bash
# Testar webhook manualmente
curl -X POST https://webhook.meuagente.api.br/webhook/chat-ia \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-123",
    "message": "Olá",
    "phone": "5511999999999"
  }'

# Deve retornar resposta da IA em ~3 segundos
```

#### 2. Verificar OpenAI API

```bash
# Testar API da OpenAI diretamente
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4-turbo-preview",
    "messages": [{"role": "user", "content": "teste"}]
  }'
```

#### 3. Ver Logs N8N

```
1. Acesse N8N Dashboard
2. Executions > Últimas execuções
3. Veja se há erros
4. Tempo de execução normal: 2-5 segundos
```

---

## 🔄 Problemas de Sincronização

### ❌ Sincronização de contatos falha

**Sintomas:**
- Erro 404 ou 500
- Timeout
- Contatos não aparecem após sync

**Soluções:**

#### 1. Erro 404 "Instance not found"

```typescript
// Usar instance_name, NÃO UUID
// ❌ ERRADO
const url = `/chat/findContacts/${instance.id}`;

// ✅ CORRETO
const url = `/chat/findContacts/${instance.instance_name}`;
```

Referência: [CORRECAO_EVOLUTION_API_404.md](./CORRECAO_EVOLUTION_API_404.md)

#### 2. Timeout (>30s)

```
Causas:
- Muitos contatos (>5000)
- Evolution API lenta
- Rede instável

Soluções:
1. Sincronize em horários de menor tráfego
2. Divida em lotes (futuro)
3. Aguarde e tente novamente
```

#### 3. Contatos Duplicados

```sql
-- Remover duplicatas
DELETE FROM evolution_contacts a
USING evolution_contacts b
WHERE 
  a.remote_jid = b.remote_jid
  AND a.instance_id = b.instance_id
  AND a.created_at < b.created_at;
```

---

## ⚡ Problemas de Performance

### ❌ App lento/travado

**Sintomas:**
- Páginas demoram para carregar
- Scroll travando
- CPU/memória alta

**Soluções:**

#### 1. Limpar Cache do React Query

```typescript
// Console do navegador
import { queryClient } from '@/lib/react-query';
queryClient.clear();
location.reload();
```

#### 2. Reduzir Dados Carregados

```typescript
// Se tem muitos registros financeiros/leads
// Aplicar filtros de data

// Exemplo: últimos 30 dias apenas
const { data } = useFinancialData({
  startDate: subDays(new Date(), 30),
  endDate: new Date()
});
```

#### 3. Desabilitar Animações

```css
/* Via DevTools > Styles */
* {
  animation: none !important;
  transition: none !important;
}
```

---

## 💳 Erros de Pagamento

### ❌ Checkout do Stripe falha

**Sintomas:**
- Erro ao clicar "Assinar"
- Redireciona mas checkout não abre
- Erro "Payment failed"

**Soluções:**

#### 1. Verificar Price ID

```typescript
// Verificar se Price IDs estão corretos
STRIPE_PRICE_BASIC=price_1SbygeDUMJkQwpuNfKOSWoRL
STRIPE_PRICE_BUSINESS=price_1SWpI2DUMJkQwpuNYUAcU5ay
STRIPE_PRICE_PREMIUM=price_1SWpI4DUMJkQwpuN9NfkqZzL
```

#### 2. Ver Logs da Edge Function

```bash
supabase functions logs create-checkout-session --tail
```

#### 3. Testar Stripe Webhook

```bash
# Via Stripe CLI
stripe listen --forward-to https://seu-projeto.supabase.co/functions/v1/stripe-webhook

# Fazer teste de checkout
# Ver se webhook foi recebido
```

---

### ❌ Assinatura não ativa após pagamento

**Sintomas:**
- Pagamento confirmado no Stripe
- Mas plano ainda aparece como Free
- Recursos bloqueados

**Verificação:**

#### 1. Checar Webhook

```sql
-- Ver se webhook atualizou o cliente
SELECT 
  plan_id,
  subscription_active,
  refund_period_ends_at
FROM clientes
WHERE phone = 'SEU_TELEFONE';

-- Deve ter:
-- plan_id: 'business' ou 'premium'
-- subscription_active: true
-- refund_period_ends_at: 7 dias no futuro
```

#### 2. Ver Logs Stripe Webhook

```bash
supabase functions logs stripe-webhook --tail

# Procurar por erros
# Se não há logs, webhook não foi disparado
```

#### 3. Atualização Manual (Emergência)

```sql
-- APENAS SE WEBHOOK FALHOU
-- Verificar pagamento no Stripe Dashboard primeiro
UPDATE clientes
SET 
  plan_id = 'business',
  subscription_active = true,
  refund_period_ends_at = NOW() + INTERVAL '7 days'
WHERE phone = 'SEU_TELEFONE';
```

---

## 📞 Como Obter Suporte

### Suporte por Plano

| Plano | Canais | SLA |
|-------|--------|-----|
| Free | Nenhum | - |
| Basic | Email | 48h |
| Business | Email, Chat, WhatsApp | 24h |
| Premium | Email, Chat, WhatsApp, Telefone | 4h |

### Informações para Fornecer

Ao entrar em contato com suporte, tenha em mãos:

```markdown
1. **Plano:** Free / Basic / Business / Premium
2. **Telefone da conta:** 5511999999999
3. **Problema:** Descrição clara
4. **Quando ocorreu:** Data e hora
5. **Print de tela:** Se aplicável
6. **Mensagem de erro:** Texto completo
7. **Já tentou:** O que já fez para resolver
```

### Canais de Suporte

**📧 Email**
```
suporte@meuagente.api.br
Anexe prints e logs se possível
```

**💬 Chat (Business/Premium)**
```
Botão de chat no canto inferior direito do app
```

**📱 WhatsApp (Business/Premium)**
```
(11) 99999-9999
Apenas planos Business e Premium
Horário: 24/7
```

**📞 Telefone (Premium)**
```
(11) 3000-0000
Apenas plano Premium
Horário: Seg-Sex 9h-18h
```

---

## 📚 Recursos Adicionais

### Documentação Relacionada

- [Guia Completo do Agente SDR](./GUIA_COMPLETO_AGENTE_SDR.md)
- [Guia Completo do CRM Pipeline](./GUIA_COMPLETO_CRM_PIPELINE.md)
- [Importação de Contatos WhatsApp](./IMPORTACAO_CONTATOS_WHATSAPP.md)
- [Deployment](./DEPLOYMENT.md)

### Status do Sistema

🌐 **Status Page:** https://status.meuagente.api.br  
Ver uptime, incidentes e manutenções programadas

---

**Documento mantido por:** Equipe Meu Agente  
**Última revisão:** 15/12/2025  
**Próxima revisão prevista:** 15/01/2026
