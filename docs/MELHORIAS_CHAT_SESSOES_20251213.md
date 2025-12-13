# Melhorias no Sistema de Chat - 13/12/2025

## Visão Geral
Este documento descreve as melhorias implementadas no sistema de chat para resolver problemas de UX e gerenciamento de conversas.

## 1. Correção do Auto-Load de Sessão

### Problema Original
- Quando o usuário abria a página Chat IA, automaticamente carregava a conversa mais recente
- Usuário não conseguia iniciar uma nova conversa facilmente
- Comportamento confuso e não intuitivo

### Solução Implementada
- Modificado `useChatAgent.ts` para **não** carregar automaticamente a sessão mais recente
- Agora a página Chat IA sempre abre com uma **nova conversa em branco**
- Conversas antigas só são carregadas quando o usuário **clica explicitamente** no histórico

### Arquivos Modificados
- `src/hooks/useChatAgent.ts`:
  - Removido auto-load na query `chat-session`
  - Query agora só busca sessão se `currentSessionId` existir
  - Adicionado `createNewSession()` para limpar estado e iniciar nova conversa
  - Adicionado `selectSession()` para carregar conversa específica do histórico

## 2. Menu de Contexto no Histórico

### Funcionalidade Adicionada
- **Botão direito** nas conversas do histórico abre menu de contexto
- Opções disponíveis:
  - ✅ **Abrir conversa**: Carrega a conversa selecionada
  - 🗑️ **Deletar conversa**: Remove a conversa e todas suas mensagens

### Implementação Técnica
- Utilizado componente `ContextMenu` do shadcn/ui (já existente no projeto)
- Menu integrado em `ChatHistoryMenu` dentro do `PromptInputBox.tsx`
- Função `deleteSession()` implementada no hook `useChatAgent.ts`
- Cascade delete: ao deletar sessão, todas as mensagens são removidas automaticamente

### Arquivos Modificados
- `src/components/chat/PromptInputBox.tsx`:
  - Adicionado `ContextMenu` nas conversas
  - Prop `onDeleteSession` adicionada ao componente
  - Botão para limpar conversas vazias no cabeçalho do histórico
- `src/hooks/useChatAgent.ts`:
  - Mutation `deleteSessionMutation` criada
  - Função pública `deleteSession()` exportada

## 3. Limpeza de Conversas Vazias

### Problema Identificado
- Histórico continha conversas com título "Nova conversa" e **0 mensagens**
- Essas sessões órfãs eram criadas mas nunca utilizadas
- Poluíam o histórico e confundiam o usuário

### Soluções Implementadas

#### 3.1. Botão de Limpeza Rápida (UI)
- Ícone de lixeira aparece no cabeçalho do histórico quando há conversas vazias
- Ao clicar, **deleta todas as conversas com 0 mensagens**
- Feedback imediato via toast notification

#### 3.2. Script SQL para Limpeza Manual
- Criado script `scripts/cleanup-empty-sessions.sql`
- Pode ser executado diretamente no Supabase SQL Editor
- Permite visualizar antes de deletar

**Como usar:**
1. Acesse o Supabase Dashboard → SQL Editor
2. Abra o arquivo `scripts/cleanup-empty-sessions.sql`
3. Execute a primeira query para ver as conversas vazias
4. Descomente e execute o DELETE para remover

### Arquivos Criados/Modificados
- `scripts/cleanup-empty-sessions.sql` (novo)
- `src/components/chat/PromptInputBox.tsx`:
  - `handleDeleteEmptySessions()` no componente `ChatHistoryMenu`
  - Botão com ícone `Trash2` no cabeçalho

## 4. Fluxo de Uso Atualizado

### Cenário 1: Usuário Abre Chat IA
```
1. Usuário clica em "Chat IA" no menu
2. Página abre com tela de introdução (animação)
3. Campo de input está vazio e pronto para nova conversa
4. Histórico disponível no botão lateral
```

### Cenário 2: Usuário Quer Continuar Conversa Anterior
```
1. Usuário clica no botão "History" (ícone de relógio)
2. Popover abre mostrando conversas recentes
3. Usuário clica na conversa desejada
4. Conversa carrega com todo o histórico de mensagens
```

### Cenário 3: Usuário Quer Deletar Conversa
```
Opção A - Menu de Contexto:
1. Usuário clica com botão direito na conversa
2. Menu abre com opções "Abrir" e "Deletar"
3. Usuário clica em "Deletar conversa"
4. Confirmação via toast: "Conversa deletada com sucesso"

Opção B - Limpar Todas Vazias:
1. Usuário abre histórico
2. Vê ícone de lixeira no cabeçalho (se houver conversas vazias)
3. Clica no ícone
4. Todas as conversas com 0 mensagens são deletadas
```

## 5. Benefícios das Mudanças

### UX Melhorada
- ✅ Comportamento previsível: sempre inicia com conversa nova
- ✅ Controle total do usuário sobre quando carregar conversas antigas
- ✅ Histórico limpo e organizado
- ✅ Feedback visual claro em todas as ações

### Manutenção de Dados
- ✅ Limpeza automática de dados órfãos
- ✅ Redução de registros desnecessários no banco
- ✅ Função SQL reutilizável para manutenção periódica

### Código
- ✅ Hook `useChatAgent` mais modular e testável
- ✅ Separação clara de responsabilidades
- ✅ Funções públicas bem nomeadas e documentadas

## 6. Checklist de Teste

### Testes Funcionais
- [ ] Abrir página Chat IA → deve mostrar tela de introdução
- [ ] Enviar primeira mensagem → deve criar nova sessão
- [ ] Abrir histórico → deve listar conversas recentes
- [ ] Clicar em conversa no histórico → deve carregar mensagens
- [ ] Botão direito em conversa → deve abrir menu de contexto
- [ ] Deletar conversa → deve remover e atualizar lista
- [ ] Limpar conversas vazias → deve remover apenas sessões com 0 msgs
- [ ] Título de nova conversa → deve gerar automaticamente da 1ª mensagem

### Testes de Integração
- [ ] Deletar sessão atual → deve voltar para tela de introdução
- [ ] Criar nova sessão enquanto há outra ativa → deve funcionar
- [ ] Query invalidation → histórico deve atualizar após mudanças

### Testes SQL
- [ ] Executar `cleanup_empty_sessions('telefone')` → deve retornar IDs deletados
- [ ] Executar `cleanup_empty_sessions()` → deve limpar todas vazias
- [ ] Verificar cascade delete → mensagens devem ser deletadas junto

## 7. Próximos Passos (Opcional)

### Melhorias Futuras Sugeridas
1. **Confirmação antes de deletar**: Modal de confirmação para ações destrutivas
2. **Desfazer deleção**: Soft delete com opção de recuperar por 30 dias
3. **Busca no histórico**: Campo de busca para filtrar conversas
4. **Organização por data**: Separar conversas por "Hoje", "Esta semana", "Mais antigas"
5. **Export de conversas**: Botão para exportar conversa em PDF/TXT

---

## Referências

- Documentação anterior: `docs/CORRECAO_TITULOS_SESSOES.md`
- Hook principal: `src/hooks/useChatAgent.ts`
- Componente de histórico: `src/components/chat/PromptInputBox.tsx`
- Página principal: `src/pages/Chat.tsx`
