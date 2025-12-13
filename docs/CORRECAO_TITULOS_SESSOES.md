# Correção: Títulos de Sessões de Chat

## Problema Identificado

As sessões de chat estavam aparecendo como "Nova conversa" no histórico porque o campo `title` na tabela `chat_ia_sessions` estava com valor `null`.

### Causa Raiz

A lógica original de criação de sessões não incluía a geração automática de título baseado na primeira mensagem do usuário.

## Solução Implementada

### 1. Correção no Código (useChatAgent.ts)

Foi corrigida a lógica de contagem de mensagens no hook `useChatAgent`:

**ANTES (bugado):**
```typescript
const { data: messageCount } = await supabase
  .from('chat_ia_messages')
  .select('id', { count: 'exact', head: true })
  .eq('session_id', sessionId);

if (messageCount && (messageCount as any).count === 1) {
  // ...
}
```

**DEPOIS (correto):**
```typescript
const { count: messageCount, error: countError } = await supabase
  .from('chat_ia_messages')
  .select('*', { count: 'exact', head: true })
  .eq('session_id', sessionId);

if (!countError && messageCount === 1) {
  const title = content.trim().slice(0, 50) + (content.length > 50 ? '...' : '');
  
  console.log('📝 Gerando título para sessão:', { sessionId, title });
  
  const { error: updateError } = await supabase
    .from('chat_ia_sessions')
    .update({ title })
    .eq('id', sessionId);
  
  if (updateError) {
    console.error('❌ Erro ao atualizar título:', updateError);
  } else {
    console.log('✅ Título atualizado com sucesso');
    queryClient.invalidateQueries({ queryKey: ['chat-sessions-all', phone] });
  }
}
```

### 2. Script de Migração (fix-session-titles.ts)

Criado script para corrigir sessões antigas que não possuem título.

#### Como usar:

1. Configure as variáveis de ambiente:
```bash
# .env ou .env.local
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

2. Execute o script:
```bash
npx tsx scripts/fix-session-titles.ts
```

O script irá:
- Buscar todas as sessões com `title = null`
- Para cada sessão, buscar a primeira mensagem do usuário
- Gerar um título baseado nos primeiros 50 caracteres da mensagem
- Atualizar o título no banco de dados

## Como Testar

### Testando com Chrome DevTools

1. Inicie o servidor: `npm run dev`
2. Abra o Chrome DevTools (F12)
3. Vá para a aba Network
4. Crie uma nova conversa escrevendo uma mensagem
5. Verifique nos logs do console se aparece:
   - `📝 Gerando título para sessão`
   - `✅ Título atualizado com sucesso`
6. Verifique nas requisições de rede se houve um PATCH para `chat_ia_sessions`
7. Abra o histórico de conversas e veja se o título foi gerado corretamente

### Validando no Supabase

Execute a query no SQL Editor do Supabase:

```sql
-- Ver sessões com e sem título
SELECT 
  id,
  phone,
  title,
  created_at,
  updated_at
FROM chat_ia_sessions
WHERE phone = 'SEU_TELEFONE'
ORDER BY updated_at DESC
LIMIT 20;
```

## Comportamento Esperado

- **Nova sessão**: Quando o usuário envia a primeira mensagem em uma nova sessão, o título é gerado automaticamente baseado no conteúdo da mensagem
- **Sessões antigas**: Precisam ser corrigidas manualmente executando o script `fix-session-titles.ts`
- **Histórico**: O histórico de conversas agora mostra o título real ao invés de "Nova conversa"

## Observações Importantes

1. O sistema **reutiliza a sessão mais recente** ao invés de criar uma nova a cada acesso. Isso é intencional.
2. Para criar uma nova conversa, você precisa limpar o histórico ou ter uma funcionalidade de "Nova Conversa" explícita.
3. O título é gerado apenas na **primeira mensagem** da sessão.
4. Mensagens posteriores não alteram o título.

## Arquivos Modificados

- `src/hooks/useChatAgent.ts` - Correção da lógica de geração de título
- `scripts/fix-session-titles.ts` - Script para corrigir sessões antigas
