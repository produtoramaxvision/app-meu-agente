# 🔧 Correção do Erro 404 na Evolution API

## Problema Identificado

Ao clicar no botão "Atualizar" na aba Contatos do Agente SDR, ocorriam dois erros 404:

### Erro 1: Body Inválido
```
Evolution API error: 404
```
**Causa:** Enviando `{ "where": { "remoteJid": { "contains": "..." } } }` ao invés de `{ "where": {} }`.

### Erro 2: Instance Not Found ⚠️ **CRÍTICO**
```
Evolution API error: 404 - {"status":404,"error":"Not Found","response":{"message":["The \"af59adcf-7779-4678-9dd8-127dc6f4cac7\" instance does not exist"]}}
```
**Causa:** Passando o **UUID** (`instance.id`) ao invés do **nome** (`instance.instance_name`) da instância.

## Causa Raiz

A Evolution API identifica instâncias pelo **nome** (instanceName), não pelo UUID. O endpoint correto é:

```
POST /chat/findContacts/{instanceName}
                         ^^^^^^^^^^^^
                         Nome, não UUID!
```

**Exemplo:**
```
✅ CORRETO: POST /chat/findContacts/meu-whatsapp
❌ ERRADO:  POST /chat/findContacts/af59adcf-7779-4678-9dd8-127dc6f4cac7
```

## Solução Implementada

### 1. Corrigir o Body da Requisição

```typescript
// ANTES (ERRADO) ❌
body: JSON.stringify({
  where: onlyContacts ? { remoteJid: { contains: '@s.whatsapp.net' } } : {},
})

// DEPOIS (CORRETO) ✅
body: JSON.stringify({
  where: {}, // Busca todos os contatos (Evolution filtra por instanceId automaticamente)
})
```

### 2. Filtrar no Client-Side

Como a Evolution API já retorna todos os contatos da instância, fazemos o filtro no frontend:

```typescript
// Filtrar apenas contatos (não grupos) se onlyContacts=true
const filteredContacts = onlyContacts
  ? evolutionContacts.filter((c: any) => c.remoteJid?.includes('@s.whatsapp.net'))
  : evolutionContacts;
```

### 3. Melhorar Mensagens de Erro

```typescript
if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`Evolution API error: ${response.status} - ${errorText}`);
}
```

## Como Funciona Agora

1. **Usuário clica "Atualizar"**
2. **Request para Evolution API:**
   ```
   POST https://evolution-api.com/chat/findContacts/minha-instancia
   Body: { "where": {} }
   Headers: { "apikey": "..." }
   ```

3. **Evolution API busca do banco Prisma:**
   - Filtra automaticamente por `instanceId`
   - Retorna todos os contatos salvos

4. **Frontend processa:**
   - Filtra grupos se `onlyContacts=true`
   - Salva no cache Supabase
   - Exibe na lista

## Endpoints Relacionados da Evolution API

| Endpoint | Método | Finalidade |
|----------|--------|------------|
| `/chat/findContacts/{instance}` | POST | Busca contatos **do banco Evolution** (✅ usamos este) |
| `/group/fetchAllGroups/{instance}` | GET | Busca grupos **direto do WhatsApp** |
| `/chat/fetchProfile/{instance}` | POST | Busca perfil **direto do WhatsApp** |

## Estrutura de Retorno

A Evolution API retorna:

```typescript
[
  {
    id: "uuid",
    remoteJid: "5511999999999@s.whatsapp.net",
    pushName: "João Silva",
    profilePicUrl: "https://...",
    instanceId: "uuid-instancia",
    isGroup: false,
    isSaved: true,
    type: "contact",  // 'contact' | 'group' | 'group_member'
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
]
```

## Testes Recomendados

1. ✅ **Testar busca de todos os contatos**
   - Clicar "Atualizar" sem filtros
   - Verificar se retorna todos os contatos

2. ✅ **Testar filtro de grupos**
   - Usar `onlyContacts={true}` no componente
   - Verificar se grupos são filtrados

3. ✅ **Testar cache TTL**
   - Esperar 1 hora
   - Verificar se auto-refresh funciona

4. ✅ **Testar refresh no login**
   - Fazer logout e login
   - Verificar se busca contatos automaticamente

## Documentação da Evolution API

- **GitHub**: https://github.com/evolutionapi/evolution-api
- **Documentação v2**: https://doc.evolution-api.com/v2
- **Código Controller**: `src/api/controllers/chat.controller.ts`
- **Código Service**: `src/api/services/channel.service.ts`

## Arquivos Modificados

- `src/hooks/useEvolutionContacts.ts` - Corrigido body da requisição e filtro client-side
- `docs/CORRECAO_EVOLUTION_API_404.md` - Esta documentação

## Comportamento Esperado

✅ **Funciona agora:**
- Busca todos os contatos da instância
- Cache por 1 hora
- Auto-refresh ao expirar
- Refresh no login
- Botão manual de atualização

❌ **Não funciona (limitações da Evolution API):**
- Buscar contatos **não salvos** no WhatsApp
- Buscar contatos de outras instâncias
- Filtros avançados por tags/categorias (precisa cache local)

## Próximos Passos (Opcional)

Se precisar buscar **todos os contatos do WhatsApp** (incluindo não salvos):

1. **Usar a base PostgreSQL da Evolution diretamente**
   - Conectar via `psql` ou ORM
   - Tabela: `Contact`
   - Filtro: `WHERE instanceId = 'uuid'`

2. **Implementar webhook CONTACTS_UPSERT**
   - Receber atualizações em tempo real
   - Atualizar cache automaticamente

3. **Usar método interno do Baileys**
   - Requer acesso ao código Evolution
   - `client.store.contacts.all()`
