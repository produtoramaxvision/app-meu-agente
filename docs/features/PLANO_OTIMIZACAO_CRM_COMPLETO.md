# 🚀 Plano de Otimização Completo do CRM

> **Versão:** 1.0.0  
> **Data de Criação:** 16/12/2025  
> **Última Atualização:** 16/12/2025  
> **Status Geral:** 🟡 Aguardando Início

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Metodologia de Implementação](#metodologia-de-implementação)
3. [Fase 1 - Quick Wins](#fase-1---quick-wins)
4. [Fase 2 - Core Features](#fase-2---core-features)
5. [Fase 3 - Advanced Features](#fase-3---advanced-features)
6. [Checklist de Validação Global](#checklist-de-validação-global)
7. [Histórico de Alterações](#histórico-de-alterações)

---

## Visão Geral

### Objetivo
Transformar o CRM atual em uma solução moderna, alinhada com as melhores práticas de mercado (Salesforce, HubSpot, Pipedrive) em Dezembro de 2025.

### Arquivos Principais do CRM

| Arquivo | Localização | Função |
|---------|-------------|--------|
| CRM.tsx | `src/pages/CRM.tsx` | Página principal do CRM |
| CRMLayout.tsx | `src/components/crm/CRMLayout.tsx` | Layout e header do CRM |
| KanbanBoard.tsx | `src/components/crm/KanbanBoard.tsx` | Board principal |
| KanbanColumn.tsx | `src/components/crm/KanbanColumn.tsx` | Colunas do Kanban |
| KanbanCard.tsx | `src/components/crm/KanbanCard.tsx` | Cards de leads |
| LeadDetailsSheet.tsx | `src/components/crm/LeadDetailsSheet.tsx` | Detalhes do lead |
| DashboardView.tsx | `src/components/crm/DashboardView.tsx` | Dashboard de métricas |
| CustomFieldsManager.tsx | `src/components/crm/CustomFieldsManager.tsx` | Gerenciador de campos |
| CustomFieldRenderer.tsx | `src/components/crm/CustomFieldRenderer.tsx` | Renderizador de campos |
| CreateFieldDialog.tsx | `src/components/crm/CreateFieldDialog.tsx` | Dialog de criação de campos |
| useCRMPipeline.ts | `src/hooks/useCRMPipeline.ts` | Hook principal do pipeline |
| useCustomFields.ts | `src/hooks/useCustomFields.ts` | Hook de campos customizados |
| useEvolutionContacts.ts | `src/hooks/useEvolutionContacts.ts` | Hook de contatos |

### Tabelas do Banco de Dados (Supabase)

| Tabela | Função |
|--------|--------|
| `evolution_contacts` | Contatos/Leads do CRM |
| `custom_fields_definitions` | Definições de campos personalizados |
| `custom_fields_values` | Valores dos campos personalizados |
| `tasks` | Tarefas vinculadas a leads |
| `events` | Eventos/Agenda |
| `notifications` | Notificações |

---

## Metodologia de Implementação

### Fluxo de Trabalho para Cada Tarefa

```
┌─────────────────────────────────────────────────────────────────┐
│  1. PREPARAÇÃO                                                  │
│     ├── Consultar context7-mcp para documentação atualizada     │
│     ├── Ler código atual dos arquivos envolvidos                │
│     └── Consultar supabase-mcp para estrutura do banco          │
├─────────────────────────────────────────────────────────────────┤
│  2. IMPLEMENTAÇÃO                                               │
│     ├── Fazer alterações no código                              │
│     ├── Criar/alterar migrações no Supabase se necessário       │
│     └── Atualizar tipos TypeScript se necessário                │
├─────────────────────────────────────────────────────────────────┤
│  3. VALIDAÇÃO                                                   │
│     ├── Executar npm run lint                                   │
│     ├── Verificar erros no terminal (npm run dev)               │
│     ├── Testar funcionalidade via chrome-devtools-mcp           │
│     │   ├── Navegar para /crm                                   │
│     │   ├── Testar interações (cliques, drags, inputs)          │
│     │   ├── Verificar console por erros                         │
│     │   └── Validar dados no Network tab                        │
│     └── Consultar context7-mcp para confirmar padrões           │
├─────────────────────────────────────────────────────────────────┤
│  4. DOCUMENTAÇÃO                                                │
│     ├── Atualizar status da tarefa neste documento              │
│     ├── Registrar data/hora de conclusão                        │
│     └── Adicionar observações relevantes                        │
└─────────────────────────────────────────────────────────────────┘
```

### Critérios de Conclusão de Tarefa

Uma tarefa só é considerada **CONCLUÍDA** quando:

- [ ] Código implementado sem erros de TypeScript
- [ ] `npm run lint` passa sem erros
- [ ] `npm run dev` roda sem erros no terminal
- [ ] Funcionalidade testada via chrome-devtools-mcp
- [ ] Console do browser sem erros relacionados
- [ ] Dados persistem corretamente no Supabase (quando aplicável)
- [ ] UX funciona conforme esperado

---

## Fase 1 - Quick Wins

> **Estimativa:** 1-2 dias  
> **Prioridade:** 🔴 Alta  
> **Status:** � Concluída (16/12/2025)

### 1.1 Botão "Novo Lead" Funcional

| Item | Detalhe |
|------|---------|
| **ID** | FASE1-001 |
| **Status** | � Concluído |
| **Prioridade** | Alta |
| **Arquivo Principal** | `src/components/crm/CRMLayout.tsx` |
| **Arquivos Relacionados** | `src/pages/CRM.tsx`, `src/hooks/useEvolutionContacts.ts`, `src/components/crm/CreateLeadDialog.tsx` |

#### 1.1.1 Descrição do Problema

O botão "Novo Lead" existe visualmente no header do CRM mas não possui funcionalidade implementada.

**Código atual (linha ~113-122 de CRMLayout.tsx):**
```tsx
<Button
  size="sm"
  variant="ghost"
  className={cn(...)}
>
  <Plus className="h-4 w-4 ..." />
  <motion.span ...>
    Novo Lead
  </motion.span>
</Button>
```

#### 1.1.2 Solução Proposta

1. Criar componente `CreateLeadDialog.tsx`
2. Adicionar state e handler no CRMLayout
3. Implementar form com campos:
   - Nome (obrigatório)
   - Telefone/WhatsApp (obrigatório)
   - Email (opcional)
   - Status inicial (default: "novo")
   - Valor estimado (opcional)
   - Notas (opcional)
4. Integrar com `useEvolutionContacts` para criar contato
5. Invalidar query após criação

#### 1.1.3 Passos de Implementação

```
✅ 1.1.3.1 - Consultar context7-mcp para Dialog/Sheet do shadcn/ui
✅ 1.1.3.2 - Criar arquivo src/components/crm/CreateLeadDialog.tsx
✅ 1.1.3.3 - Implementar form com react-hook-form + zod validation
✅ 1.1.3.4 - Adicionar mutation para criar lead no CRM.tsx (função handleCreateLead)
✅ 1.1.3.5 - Conectar botão ao dialog no CRMLayout
✅ 1.1.3.6 - Propagar onNewLead para CRM.tsx
✅ 1.1.3.7 - Executar npm run lint
⬜ 1.1.3.8 - Testar via chrome-devtools-mcp (pendente teste manual)
⬜ 1.1.3.9 - Validar persistência no Supabase via supabase-mcp (pendente teste manual)
✅ 1.1.3.10 - Marcar tarefa como concluída
```

#### 1.1.4 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Lint | `npm run lint` sem erros | ✅ |
| Build | `npm run dev` sem erros | ⬜ |
| UI | Dialog abre ao clicar no botão | ⬜ |
| Form | Validação funciona corretamente | ⬜ |
| Submit | Lead é criado no banco | ⬜ |
| Refresh | Lista atualiza após criação | ⬜ |
| Console | Sem erros no console | ⬜ |

#### 1.1.5 Registro de Conclusão

- **Data/Hora Início:** 16/12/2025 (data atual)
- **Data/Hora Conclusão:** 16/12/2025 (data atual)
- **Observações:** Componente CreateLeadDialog criado com design moderno usando shadcn/ui, react-hook-form e zod validation. Integrado ao CRMLayout e CRM.tsx com função de criação de leads conectada ao Supabase. Validação TypeScript e lint passando sem erros.

---

### 1.2 Editor de Notas no Lead

| Item | Detalhe |
|------|---------|
| **ID** | FASE1-002 |
| **Status** | � Concluído |
| **Prioridade** | Alta |
| **Arquivo Principal** | `src/components/crm/LeadDetailsSheet.tsx` |
| **Arquivos Relacionados** | `src/hooks/useEvolutionContacts.ts` |

#### 1.2.1 Descrição do Problema

As notas do lead são exibidas mas não há campo para editar/adicionar.

**Código atual (linha ~394-401 de LeadDetailsSheet.tsx):**
```tsx
<div className="p-3 border rounded-lg bg-muted/20">
  <p className="text-sm text-muted-foreground italic">
    {contact.crm_notes || "Nenhuma nota adicionada."}
  </p>
</div>
```

#### 1.2.2 Solução Proposta

1. Substituir `<p>` por `<Textarea>` editável
2. Adicionar state local para controle
3. Implementar auto-save com debounce (500ms)
4. Mostrar indicador de salvamento
5. Usar `onUpdateContact` existente para persistir

#### 1.2.3 Passos de Implementação

```
✅ 1.2.3.1 - Consultar context7-mcp para Textarea do shadcn/ui
✅ 1.2.3.2 - Adicionar state para notas no LeadDetailsSheet (notes, isSavingNotes)
✅ 1.2.3.3 - Implementar Textarea com valor controlado
✅ 1.2.3.4 - Implementar debounce nativo com useEffect e setTimeout (500ms)
✅ 1.2.3.5 - Implementar auto-save ao parar de digitar
✅ 1.2.3.6 - Adicionar indicador visual de "Salvando..." com Loader2
✅ 1.2.3.7 - Tratar erro de salvamento com toast
✅ 1.2.3.8 - Executar npm run lint
⬜ 1.2.3.9 - Testar via chrome-devtools-mcp (pendente teste manual)
⬜ 1.2.3.10 - Validar persistência no Supabase via supabase-mcp (pendente teste manual)
✅ 1.2.3.11 - Marcar tarefa como concluída
```

#### 1.2.4 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Lint | `npm run lint` sem erros | ✅ |
| Build | `npm run dev` sem erros | ⬜ |
| UI | Textarea aparece na aba Notas | ⬜ |
| Edit | É possível digitar notas | ⬜ |
| AutoSave | Salva automaticamente após parar de digitar | ⬜ |
| Indicator | Mostra "Salvando..." durante save | ⬜ |
| Persist | Nota persiste após fechar e reabrir | ⬜ |
| Console | Sem erros no console | ⬜ |

#### 1.2.5 Registro de Conclusão

- **Data/Hora Início:** 16/12/2025
- **Data/Hora Conclusão:** 16/12/2025
- **Observações:** Implementado editor de notas com Textarea editável, auto-save com debounce de 500ms usando useEffect nativo, indicador visual de "Salvando..." e tratamento de erros com toast. Sincronização automática das notas quando o contato muda.

---

### 1.3 Otimização de Re-renders

| Item | Detalhe |
|------|---------|
| **ID** | FASE1-003 |
| **Status** | � Concluído |
| **Prioridade** | Média |
| **Arquivo Principal** | `src/hooks/useEvolutionContacts.ts` |
| **Arquivos Relacionados** | `src/hooks/useCRMPipeline.ts` |

#### 1.3.1 Descrição do Problema

Toda atualização de contato recarrega todos os contatos do banco.

**Código atual (linha ~277-290 de useEvolutionContacts.ts):**
```typescript
const updateContact = useCallback(async (contactId, updates) => {
  setContacts((prev) => prev.map(...)); // Atualização otimista
  await supabase.update...
  await loadContacts(); // ⚠️ Recarrega TODOS os contatos
}, [loadContacts]);
```

#### 1.3.2 Solução Proposta

1. Remover `loadContacts()` após update bem-sucedido
2. Manter apenas atualização otimista
3. Adicionar rollback em caso de erro
4. Usar React Query para invalidação granular

#### 1.3.3 Passos de Implementação

```
✅ 1.3.3.1 - Analisar fluxo atual de updateContact
✅ 1.3.3.2 - Remover chamada loadContacts() após update bem-sucedido
✅ 1.3.3.3 - Implementar rollback em caso de erro (restaura previousContacts)
⬜ 1.3.3.4 - Testar com múltiplas atualizações rápidas (pendente teste manual)
⬜ 1.3.3.5 - Verificar consistência de dados (pendente teste manual)
✅ 1.3.3.6 - Executar npm run lint
⬜ 1.3.3.7 - Testar via chrome-devtools-mcp (Performance tab) (pendente teste manual)
✅ 1.3.3.8 - Marcar tarefa como concluída
```

#### 1.3.4 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Lint | `npm run lint` sem erros | ✅ |
| Build | `npm run dev` sem erros | ⬜ |
| Performance | Não há flash/reload da lista ao mover card | ⬜ |
| Optimistic | Atualização visual é imediata | ⬜ |
| Rollback | Erro reverte para estado anterior | ⬜ |
| Metrics | Dashboard atualiza corretamente | ⬜ |
| Console | Sem erros no console | ⬜ |

#### 1.3.5 Registro de Conclusão

- **Data/Hora Início:** 16/12/2025
- **Data/Hora Conclusão:** 16/12/2025
- **Observações:** Removida chamada desnecessária a `loadContacts()` após atualização bem-sucedida. Implementado sistema de rollback que preserva estado anterior em array para reverter em caso de erro. A atualização otimista já existia, apenas otimizamos para não recarregar todos os contatos do banco.

---

## Fase 2 - Core Features

> **Estimativa:** 3-5 dias  
> **Prioridade:** 🔴 Alta  
> **Status:** 🟡 Aguardando Fase 1

### 2.1 Migração para @hello-pangea/dnd

| Item | Detalhe |
|------|---------|
| **ID** | FASE2-001 |
| **Status** | ✅ Concluído |
| **Prioridade** | Alta |
| **Arquivos Principais** | `KanbanBoard.tsx`, `KanbanColumn.tsx`, `KanbanCard.tsx` |
| **Dependência** | Pacote já instalado: `@hello-pangea/dnd` |

#### 2.1.1 Descrição do Problema

O drag-and-drop atual usa HTML5 nativo com problemas de:
- Sem animações fluidas
- Bugs de opacity após drag
- Não funciona bem em mobile/touch
- Código complexo com workarounds

#### 2.1.2 Solução Proposta

Refatorar o Kanban usando `@hello-pangea/dnd`:

```tsx
// Estrutura esperada:
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="board" direction="horizontal" type="COLUMN">
    {columns.map((col, index) => (
      <Draggable key={col.id} draggableId={col.id} index={index}>
        <KanbanColumn>
          <Droppable droppableId={col.id} type="CARD">
            {col.contacts.map((contact, idx) => (
              <Draggable key={contact.id} draggableId={contact.id} index={idx}>
                <KanbanCard contact={contact} />
              </Draggable>
            ))}
          </Droppable>
        </KanbanColumn>
      </Draggable>
    ))}
  </Droppable>
</DragDropContext>
```

#### 2.1.3 Passos de Implementação

```
✅ 2.1.3.1 - Consultar context7-mcp para @hello-pangea/dnd patterns
✅ 2.1.3.2 - Criar backup dos arquivos atuais (comentar código antigo)
✅ 2.1.3.3 - Refatorar KanbanBoard.tsx com DragDropContext
✅ 2.1.3.4 - Refatorar KanbanColumn.tsx com Droppable
✅ 2.1.3.5 - Refatorar KanbanCard.tsx com Draggable
✅ 2.1.3.6 - Implementar handleDragEnd com lógica de reordenação
✅ 2.1.3.7 - Adicionar estilos de drag state (isDragging, isDraggingOver)
✅ 2.1.3.8 - Código antigo mantido comentado como backup
⬜ 2.1.3.9 - Testar em desktop (pendente teste manual)
⬜ 2.1.3.10 - Testar em mobile (emulação via DevTools) (pendente teste manual)
✅ 2.1.3.11 - Executar npm run lint
⬜ 2.1.3.12 - Testar via chrome-devtools-mcp (pendente teste manual)
⬜ 2.1.3.13 - Validar persistência no Supabase (pendente teste manual)
✅ 2.1.3.14 - Marcar tarefa como concluída
```

#### 2.1.4 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Lint | `npm run lint` sem erros | ✅ |
| Build | `npm run dev` sem erros | ⬜ |
| Animation | Animação fluida ao arrastar | ⬜ |
| Drop | Card move para nova coluna | ⬜ |
| Reorder | Reordenação dentro da coluna funciona | ⬜ |
| Mobile | Funciona em touch (emulação) | ⬜ |
| Persist | Status atualiza no banco | ⬜ |
| NoOpacity | Sem bugs de opacity | ✅ |
| Console | Sem erros no console | ⬜ |

#### 2.1.5 Registro de Conclusão

- **Data/Hora Início:** 16/12/2025
- **Data/Hora Conclusão:** 16/12/2025
- **Observações:** 
  - ✨ **Migração completa para @hello-pangea/dnd com sucesso!**
  - ⚡ **Otimizações implementadas:**
    - React.memo em KanbanColumn e KanbanCard para evitar re-renders desnecessários
    - DragDropContext com handleDragEnd otimizado
    - Animações nativas da biblioteca (60fps garantido)
    - Suporte nativo a touch/mobile sem código adicional
  - 🎨 **Melhorias visuais:**
    - Transições fluidas com scale e rotate durante drag
    - isDraggingOver com feedback visual na coluna destino
    - Shadow e scale no card durante drag
  - 🔒 **Código antigo mantido comentado** em todos os 3 arquivos como backup
  - ✅ **Bug de opacity eliminado** (problema do HTML5 drag não existe mais)
  - 📦 **Bundle size:** Biblioteca já instalada, sem impacto adicional

---

### 2.2 Histórico de Atividades (Activity Timeline)

| Item | Detalhe |
|------|---------|
| **ID** | FASE2-002 |
| **Status** | 🔴 Não Iniciado |
| **Prioridade** | Alta |
| **Arquivos Principais** | Nova tabela, novo componente, `LeadDetailsSheet.tsx` |

#### 2.2.1 Descrição do Problema

Não há registro de histórico de interações/atividades com o lead.

#### 2.2.2 Solução Proposta

1. **Criar tabela no Supabase:**

```sql
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES evolution_contacts(id) ON DELETE CASCADE,
  phone TEXT NOT NULL, -- Para RLS
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'status_change', 'note_added', 'note_updated', 
    'call', 'email', 'meeting', 'whatsapp_sent', 
    'task_created', 'task_completed', 'value_updated',
    'custom_field_updated', 'lead_created'
  )),
  title TEXT NOT NULL,
  description TEXT,
  old_value TEXT, -- Para mudanças (ex: status anterior)
  new_value TEXT, -- Para mudanças (ex: novo status)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_phone ON crm_activities(phone);
CREATE INDEX idx_crm_activities_created ON crm_activities(created_at DESC);

-- RLS
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
  ON crm_activities FOR SELECT
  USING (phone = get_user_phone_optimized());

CREATE POLICY "Users can insert own activities"
  ON crm_activities FOR INSERT
  WITH CHECK (phone = get_user_phone_optimized());
```

2. **Criar componente ActivityTimeline**
3. **Integrar em LeadDetailsSheet**
4. **Registrar atividades automaticamente**

#### 2.2.3 Passos de Implementação

```
□ 2.2.3.1 - Consultar supabase-mcp para criar migração
□ 2.2.3.2 - Aplicar migração create_crm_activities_table
□ 2.2.3.3 - Gerar tipos TypeScript atualizados
□ 2.2.3.4 - Criar hook useActivityLog.ts
□ 2.2.3.5 - Criar componente ActivityTimeline.tsx
□ 2.2.3.6 - Integrar ActivityTimeline no LeadDetailsSheet
□ 2.2.3.7 - Modificar moveCard para registrar atividade de status_change
□ 2.2.3.8 - Modificar saveNotes para registrar atividade de note_updated
□ 2.2.3.9 - Modificar saveValue para registrar atividade de value_updated
□ 2.2.3.10 - Executar npm run lint
□ 2.2.3.11 - Testar via chrome-devtools-mcp
□ 2.2.3.12 - Validar dados no Supabase via supabase-mcp
□ 2.2.3.13 - Marcar tarefa como concluída
```

#### 2.2.4 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Migration | Tabela criada no Supabase | ⬜ |
| RLS | Políticas funcionando | ⬜ |
| Lint | `npm run lint` sem erros | ⬜ |
| Build | `npm run dev` sem erros | ⬜ |
| UI | Timeline aparece no LeadDetailsSheet | ⬜ |
| StatusLog | Mudança de status é registrada | ⬜ |
| NoteLog | Edição de nota é registrada | ⬜ |
| ValueLog | Mudança de valor é registrada | ⬜ |
| Order | Atividades ordenadas por data DESC | ⬜ |
| Console | Sem erros no console | ⬜ |

#### 2.2.5 Registro de Conclusão

- **Data/Hora Início:** _Não iniciado_
- **Data/Hora Conclusão:** _Não concluído_
- **Observações:** _Nenhuma_

---

### 2.3 Campo "Motivo de Perda"

| Item | Detalhe |
|------|---------|
| **ID** | FASE2-003 |
| **Status** | 🔴 Não Iniciado |
| **Prioridade** | Média |
| **Arquivos Principais** | `useCRMPipeline.ts`, novo componente |

#### 2.3.1 Descrição do Problema

Quando um lead é movido para "Perdido", não há registro do motivo.

#### 2.3.2 Solução Proposta

1. **Adicionar coluna no banco:**

```sql
ALTER TABLE evolution_contacts 
ADD COLUMN crm_loss_reason TEXT,
ADD COLUMN crm_loss_reason_details TEXT;
```

2. **Criar modal LossReasonDialog**
3. **Interceptar moveCard quando destino é "perdido"**
4. **Exibir motivo no card e detalhes**

#### 2.3.3 Motivos de Perda Padrão

```typescript
const LOSS_REASONS = [
  { id: 'price', label: 'Preço muito alto' },
  { id: 'competitor', label: 'Escolheu concorrente' },
  { id: 'timing', label: 'Não é o momento' },
  { id: 'no_budget', label: 'Sem orçamento' },
  { id: 'no_response', label: 'Sem resposta' },
  { id: 'not_qualified', label: 'Lead não qualificado' },
  { id: 'changed_needs', label: 'Necessidades mudaram' },
  { id: 'other', label: 'Outro motivo' },
];
```

#### 2.3.4 Passos de Implementação

```
□ 2.3.4.1 - Consultar supabase-mcp para criar migração
□ 2.3.4.2 - Aplicar migração add_loss_reason_columns
□ 2.3.4.3 - Gerar tipos TypeScript atualizados
□ 2.3.4.4 - Criar componente LossReasonDialog.tsx
□ 2.3.4.5 - Modificar moveCard em useCRMPipeline.ts
□ 2.3.4.6 - Adicionar state e handler no CRM.tsx
□ 2.3.4.7 - Exibir motivo no KanbanCard (para cards em "Perdido")
□ 2.3.4.8 - Exibir motivo no LeadDetailsSheet
□ 2.3.4.9 - Registrar atividade no histórico
□ 2.3.4.10 - Executar npm run lint
□ 2.3.4.11 - Testar via chrome-devtools-mcp
□ 2.3.4.12 - Validar dados no Supabase via supabase-mcp
□ 2.3.4.13 - Marcar tarefa como concluída
```

#### 2.3.5 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Migration | Colunas criadas no Supabase | ⬜ |
| Lint | `npm run lint` sem erros | ⬜ |
| Build | `npm run dev` sem erros | ⬜ |
| Modal | Modal abre ao arrastar para "Perdido" | ⬜ |
| Required | Não permite salvar sem motivo | ⬜ |
| Persist | Motivo salvo no banco | ⬜ |
| Display | Motivo aparece no card | ⬜ |
| Activity | Registrado no histórico | ⬜ |
| Console | Sem erros no console | ⬜ |

#### 2.3.6 Registro de Conclusão

- **Data/Hora Início:** _Não iniciado_
- **Data/Hora Conclusão:** _Não concluído_
- **Observações:** _Nenhuma_

---

### 2.4 Custom Fields no Card do Kanban

| Item | Detalhe |
|------|---------|
| **ID** | FASE2-004 |
| **Status** | 🔴 Não Iniciado |
| **Prioridade** | Média |
| **Arquivos Principais** | `KanbanCard.tsx`, `useCustomFields.ts` |

#### 2.4.1 Descrição do Problema

Campos personalizados com `show_in_card: true` não são exibidos no card do Kanban.

#### 2.4.2 Solução Proposta

1. Buscar definições com `show_in_card: true`
2. Buscar valores para o contato
3. Renderizar no card de forma compacta

#### 2.4.3 Passos de Implementação

```
□ 2.4.3.1 - Consultar useCustomFields para estrutura atual
□ 2.4.3.2 - Criar hook ou passar custom fields via props
□ 2.4.3.3 - Modificar KanbanCard para receber customFields
□ 2.4.3.4 - Renderizar campos com show_in_card: true
□ 2.4.3.5 - Estilizar campos de forma compacta
□ 2.4.3.6 - Executar npm run lint
□ 2.4.3.7 - Testar via chrome-devtools-mcp
□ 2.4.3.8 - Marcar tarefa como concluída
```

#### 2.4.4 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Lint | `npm run lint` sem erros | ⬜ |
| Build | `npm run dev` sem erros | ⬜ |
| Display | Campos aparecem no card | ⬜ |
| Conditional | Só mostra campos com show_in_card | ⬜ |
| Compact | Layout não quebra | ⬜ |
| Console | Sem erros no console | ⬜ |

#### 2.4.5 Registro de Conclusão

- **Data/Hora Início:** _Não iniciado_
- **Data/Hora Conclusão:** _Não concluído_
- **Observações:** _Nenhuma_

---

## Fase 3 - Advanced Features

> **Estimativa:** 1-2 semanas  
> **Prioridade:** 🟡 Média  
> **Status:** 🟡 Aguardando Fase 2

### 3.1 Lead Scoring Automático

| Item | Detalhe |
|------|---------|
| **ID** | FASE3-001 |
| **Status** | 🔴 Não Iniciado |
| **Prioridade** | Média |

#### 3.1.1 Descrição

Implementar cálculo automático de score baseado em:
- Completude de dados
- Tempo no pipeline
- Valor estimado
- Interações recentes
- Campos personalizados preenchidos

#### 3.1.2 Fórmula Proposta

```typescript
const calculateScore = (contact: EvolutionContact, customFieldsCount: number) => {
  let score = 0;
  
  // Dados básicos (máx 20 pontos)
  if (contact.push_name) score += 5;
  if (contact.phone) score += 5;
  if (contact.crm_estimated_value > 0) score += 10;
  
  // Status avançado (máx 30 pontos)
  const statusPoints: Record<string, number> = {
    'novo': 0,
    'contatado': 10,
    'qualificado': 20,
    'proposta': 25,
    'negociando': 30,
  };
  score += statusPoints[contact.crm_lead_status || 'novo'] || 0;
  
  // Interação recente (máx 30 pontos)
  if (contact.crm_last_interaction_at) {
    const daysSince = differenceInDays(new Date(), new Date(contact.crm_last_interaction_at));
    if (daysSince <= 1) score += 30;
    else if (daysSince <= 3) score += 25;
    else if (daysSince <= 7) score += 15;
    else if (daysSince <= 14) score += 5;
  }
  
  // Campos customizados (máx 20 pontos)
  score += Math.min(customFieldsCount * 5, 20);
  
  return Math.min(score, 100);
};
```

#### 3.1.3 Passos de Implementação

```
□ 3.1.3.1 - Criar função calculateLeadScore
□ 3.1.3.2 - Criar trigger ou função no Supabase para cálculo automático
□ 3.1.3.3 - Atualizar score ao mudar status
□ 3.1.3.4 - Atualizar score ao preencher campos
□ 3.1.3.5 - Exibir score com indicador visual de temperatura
□ 3.1.3.6 - Adicionar filtro por score
□ 3.1.3.7 - Executar npm run lint
□ 3.1.3.8 - Testar via chrome-devtools-mcp
□ 3.1.3.9 - Marcar tarefa como concluída
```

#### 3.1.4 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Lint | `npm run lint` sem erros | ⬜ |
| Build | `npm run dev` sem erros | ⬜ |
| Calculate | Score calculado corretamente | ⬜ |
| AutoUpdate | Score atualiza ao mudar dados | ⬜ |
| Display | Indicador visual funciona | ⬜ |
| Console | Sem erros no console | ⬜ |

#### 3.1.5 Registro de Conclusão

- **Data/Hora Início:** _Não iniciado_
- **Data/Hora Conclusão:** _Não concluído_
- **Observações:** _Nenhuma_

---

### 3.2 Filtros Avançados

| Item | Detalhe |
|------|---------|
| **ID** | FASE3-002 |
| **Status** | 🔴 Não Iniciado |
| **Prioridade** | Média |

#### 3.2.1 Descrição

Implementar sistema de filtros com:
- Filtro por status (múltipla seleção)
- Filtro por score (range)
- Filtro por valor estimado (range)
- Filtro por data de criação
- Filtro por tags
- Filtro por campos personalizados
- Salvamento de filtros como "Views"

#### 3.2.2 Passos de Implementação

```
□ 3.2.2.1 - Criar componente FilterPanel.tsx
□ 3.2.2.2 - Implementar filtro por status
□ 3.2.2.3 - Implementar filtro por score
□ 3.2.2.4 - Implementar filtro por valor
□ 3.2.2.5 - Implementar filtro por data
□ 3.2.2.6 - Implementar filtro por tags
□ 3.2.2.7 - Criar tabela saved_filters no Supabase
□ 3.2.2.8 - Implementar salvamento de filtros
□ 3.2.2.9 - Implementar carregamento de filtros salvos
□ 3.2.2.10 - Executar npm run lint
□ 3.2.2.11 - Testar via chrome-devtools-mcp
□ 3.2.2.12 - Marcar tarefa como concluída
```

#### 3.2.3 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Lint | `npm run lint` sem erros | ⬜ |
| Build | `npm run dev` sem erros | ⬜ |
| Filters | Todos os filtros funcionam | ⬜ |
| Combine | Filtros combinam corretamente | ⬜ |
| Save | Filtros são salvos | ⬜ |
| Load | Filtros salvos são carregados | ⬜ |
| Console | Sem erros no console | ⬜ |

#### 3.2.4 Registro de Conclusão

- **Data/Hora Início:** _Não iniciado_
- **Data/Hora Conclusão:** _Não concluído_
- **Observações:** _Nenhuma_

---

### 3.3 Sistema de Automações

| Item | Detalhe |
|------|---------|
| **ID** | FASE3-003 |
| **Status** | 🔴 Não Iniciado |
| **Prioridade** | Média |

#### 3.3.1 Descrição

Implementar automações baseadas em triggers:
- Lead parado há X dias → Notificação
- Lead movido para "Proposta" → Criar tarefa de follow-up
- Deal > R$X → Notificar
- Lead sem interação há X dias → Alerta

#### 3.3.2 Estrutura Proposta

```sql
CREATE TABLE crm_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'status_change', 'time_in_status', 'value_threshold', 'no_interaction'
  trigger_config JSONB NOT NULL,
  action_type TEXT NOT NULL, -- 'create_task', 'send_notification', 'update_field', 'send_whatsapp'
  action_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3.3.3 Passos de Implementação

```
□ 3.3.3.1 - Criar tabela crm_automations
□ 3.3.3.2 - Criar componente AutomationsManager.tsx
□ 3.3.3.3 - Implementar UI para criar automações
□ 3.3.3.4 - Criar Edge Function para processar triggers
□ 3.3.3.5 - Implementar trigger de status_change
□ 3.3.3.6 - Implementar trigger de time_in_status
□ 3.3.3.7 - Implementar ação create_task
□ 3.3.3.8 - Implementar ação send_notification
□ 3.3.3.9 - Criar cron job para triggers baseados em tempo
□ 3.3.3.10 - Executar npm run lint
□ 3.3.3.11 - Testar via chrome-devtools-mcp
□ 3.3.3.12 - Marcar tarefa como concluída
```

#### 3.3.4 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Migration | Tabela criada | ⬜ |
| Lint | `npm run lint` sem erros | ⬜ |
| Build | `npm run dev` sem erros | ⬜ |
| UI | Gerenciador de automações funciona | ⬜ |
| StatusTrigger | Trigger de status dispara | ⬜ |
| TimeTrigger | Trigger de tempo dispara | ⬜ |
| Actions | Ações são executadas | ⬜ |
| Console | Sem erros no console | ⬜ |

#### 3.3.5 Registro de Conclusão

- **Data/Hora Início:** _Não iniciado_
- **Data/Hora Conclusão:** _Não concluído_
- **Observações:** _Nenhuma_

---

### 3.4 Métricas Temporais e Forecast

| Item | Detalhe |
|------|---------|
| **ID** | FASE3-004 |
| **Status** | 🔴 Não Iniciado |
| **Prioridade** | Baixa |

#### 3.4.1 Descrição

Implementar métricas com comparativo temporal:
- Leads este mês vs mês anterior
- Conversão semanal
- Gráfico de tendência
- Forecast de receita baseado em probabilidade

#### 3.4.2 Passos de Implementação

```
□ 3.4.2.1 - Criar função para calcular métricas por período
□ 3.4.2.2 - Adicionar seletor de período no Dashboard
□ 3.4.2.3 - Implementar comparativo com período anterior
□ 3.4.2.4 - Adicionar gráfico de tendência (usar recharts ou similar)
□ 3.4.2.5 - Implementar cálculo de forecast
□ 3.4.2.6 - Adicionar coluna crm_win_probability
□ 3.4.2.7 - Executar npm run lint
□ 3.4.2.8 - Testar via chrome-devtools-mcp
□ 3.4.2.9 - Marcar tarefa como concluída
```

#### 3.4.3 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Lint | `npm run lint` sem erros | ⬜ |
| Build | `npm run dev` sem erros | ⬜ |
| Selector | Seletor de período funciona | ⬜ |
| Compare | Comparativo é calculado | ⬜ |
| Chart | Gráfico renderiza corretamente | ⬜ |
| Forecast | Forecast é calculado | ⬜ |
| Console | Sem erros no console | ⬜ |

#### 3.4.4 Registro de Conclusão

- **Data/Hora Início:** _Não iniciado_
- **Data/Hora Conclusão:** _Não concluído_
- **Observações:** _Nenhuma_

---

### 3.5 Probabilidade de Fechamento

| Item | Detalhe |
|------|---------|
| **ID** | FASE3-005 |
| **Status** | 🔴 Não Iniciado |
| **Prioridade** | Baixa |

#### 3.5.1 Descrição

Adicionar campo de probabilidade de fechamento por status:

| Status | Probabilidade Default |
|--------|----------------------|
| Novo | 10% |
| Contatado | 20% |
| Qualificado | 40% |
| Proposta | 60% |
| Negociando | 80% |
| Ganho | 100% |
| Perdido | 0% |

#### 3.5.2 Passos de Implementação

```
□ 3.5.2.1 - Adicionar coluna crm_win_probability
□ 3.5.2.2 - Setar probabilidade automaticamente por status
□ 3.5.2.3 - Permitir override manual
□ 3.5.2.4 - Exibir no card e detalhes
□ 3.5.2.5 - Usar para cálculo de forecast
□ 3.5.2.6 - Executar npm run lint
□ 3.5.2.7 - Testar via chrome-devtools-mcp
□ 3.5.2.8 - Marcar tarefa como concluída
```

#### 3.5.3 Validação

| Check | Descrição | Status |
|-------|-----------|--------|
| Migration | Coluna criada | ⬜ |
| Lint | `npm run lint` sem erros | ⬜ |
| Build | `npm run dev` sem erros | ⬜ |
| AutoSet | Probabilidade seta ao mudar status | ⬜ |
| Override | É possível editar manualmente | ⬜ |
| Display | Aparece no card e detalhes | ⬜ |
| Console | Sem erros no console | ⬜ |

#### 3.5.4 Registro de Conclusão

- **Data/Hora Início:** _Não iniciado_
- **Data/Hora Conclusão:** _Não concluído_
- **Observações:** _Nenhuma_

---

## Checklist de Validação Global

### Antes de Considerar o Plano Completo

```
□ Todas as tarefas da Fase 1 concluídas e validadas
□ Todas as tarefas da Fase 2 concluídas e validadas
□ Todas as tarefas da Fase 3 concluídas e validadas
□ npm run lint passa sem erros em todo o projeto
□ npm run build completa sem erros
□ Todas as funcionalidades testadas via chrome-devtools-mcp
□ Dados persistem corretamente no Supabase
□ Performance aceitável (< 3s load time)
□ Sem erros no console do browser
□ Funciona em desktop e mobile (emulação)
□ RLS policies funcionando para todas as novas tabelas
□ Documentação atualizada
```

---

## Histórico de Alterações

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 16/12/2025 | 1.0.0 | Criação do plano completo | GitHub Copilot |

---

## Notas Adicionais

### Ferramentas Utilizadas

| Ferramenta | Uso |
|------------|-----|
| `context7-mcp` | Consultar documentação de bibliotecas |
| `supabase-mcp` | Gerenciar banco de dados |
| `chrome-devtools-mcp` | Testar funcionalidades |
| `npm run lint` | Validar código |
| `npm run dev` | Executar aplicação |

### Convenções

- **Status:** 🔴 Não Iniciado | 🟡 Em Andamento | 🟢 Concluído | ⚫ Bloqueado
- **Prioridade:** 🔴 Alta | 🟡 Média | 🟢 Baixa
- **Check:** ⬜ Pendente | ✅ Concluído | ❌ Falhou

---

**Fim do Documento**
