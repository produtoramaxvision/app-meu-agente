# Plano Técnico: Sistema de Tags Relacional para CRM

> **VERSÃO:** 2.0 | **DATA:** 2025-12-18 | **STATUS:** Aprovado para Implementação
> 
> ⚠️ **ABORDAGEM CAUTELOSA:** Este plano prioriza estabilidade sobre velocidade. Cada etapa inclui validação obrigatória antes de avançar.

---

## 🎯 Resumo Executivo

Migração do sistema de tags de array (`text[]`) para modelo relacional normalizado, permitindo gestão centralizada, cores customizáveis e melhor performance em filtros.

**Impacto:** Médio | **Risco:** Controlado (migração reversível) | **Tempo Estimado:** 5-7 dias

---

## 1. Análise de Arquitetura e Dados

### 1.1 Estado Atual
As tags são armazenadas como array de strings (`text[]`) na coluna `crm_tags` da tabela `evolution_contacts`.

**Limitações identificadas:**
- ❌ Renomear tag exige `UPDATE` em todos os leads afetados
- ❌ Cores calculadas por hash no frontend (não customizáveis)
- ❌ Listar tags disponíveis requer varredura de todos os leads
- ❌ Queries com `@>` (array contains) menos eficientes que JOINs

### 1.2 Mudança Proposta (Modelo Relacional)

#### Tabela `crm_tags` — Definição das Tags
| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador único |
| `name` | TEXT | NOT NULL | Nome da tag |
| `color` | TEXT | NOT NULL, DEFAULT '#6366f1' | Cor em hex |
| `owner_phone` | TEXT | FK → clientes.phone, NOT NULL | Multi-tenancy |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Data criação |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Última atualização |

**Constraint:** `UNIQUE(owner_phone, name)` — Nome único por cliente

#### Tabela `crm_lead_tags` — Relacionamento Many-to-Many
| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `lead_id` | UUID | FK → evolution_contacts.id, ON DELETE CASCADE | Lead associado |
| `tag_id` | UUID | FK → crm_tags.id, ON DELETE CASCADE | Tag associada |
| `assigned_at` | TIMESTAMPTZ | DEFAULT now() | Data da associação |

**Primary Key Composta:** `(lead_id, tag_id)`

#### Índices para Performance
```sql
CREATE INDEX idx_crm_tags_owner ON crm_tags(owner_phone);
CREATE INDEX idx_crm_lead_tags_lead ON crm_lead_tags(lead_id);
CREATE INDEX idx_crm_lead_tags_tag ON crm_lead_tags(tag_id);
```

### 1.3 Estratégia de Migração de Dados

**Fase 1 — Coexistência (2 semanas):**
- Criar novas tabelas SEM remover coluna `crm_tags`
- Migrar dados existentes para modelo relacional
- Frontend lê do novo modelo, mas mantém sync com array

**Fase 2 — Depreciação:**
- Marcar coluna `crm_tags` como deprecated
- Trigger de sync pode ser desativado

**Fase 3 — Remoção (após validação completa):**
- Remover coluna `crm_tags` via nova migração

---

## 2. Proposta de UX/UI

### 2.1 Análise da Sugestão Original
> "Inserir tags em uma nova aba 'Detalhes do Lead'"

O código atual já possui aba "Tags" no `LeadDetailsSheet`. Embora funcional, esconde informação que deveria ser "First-Class Citizen".

### 2.2 Recomendação (Abordagem Híbrida)

#### Visualização (Leitura) — Zero Cliques
| Local | Comportamento |
|-------|---------------|
| **KanbanCard** | Exibe até 3 chips coloridos + indicador "+N" |
| **Cabeçalho LeadDetailsSheet** | Exibe todas as tags como chips clicáveis |
| **FilterPanel** | Seletor múltiplo de tags para filtrar pipeline |

#### Edição (Escrita) — 1 Clique
| Ação | Componente |
|------|------------|
| **Edição Rápida** | Botão `+` ao lado das tags → abre Popover com `TagsEditor` |
| **Gestão Completa** | Aba "Tags" mantida para criação com cores, renomear, excluir |

**Benefício:** Reduz de 2 cliques (mudar aba → clicar input) para 1 clique.

---

## 3. Definição de API e Backend

### 3.1 RLS Policies (CRÍTICO — Correção do Plano Original)

⚠️ **ATENÇÃO:** `auth.uid()` retorna UUID, não phone. Policy correta:

```sql
-- Função helper reutilizável
CREATE OR REPLACE FUNCTION auth_user_phone()
RETURNS TEXT AS $$
  SELECT phone FROM clientes WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Policy para crm_tags
CREATE POLICY "Users can manage own tags"
ON crm_tags FOR ALL
USING (owner_phone = auth_user_phone())
WITH CHECK (owner_phone = auth_user_phone());

-- Policy para crm_lead_tags (via JOIN)
CREATE POLICY "Users can manage own lead tags"
ON crm_lead_tags FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM crm_tags t
    WHERE t.id = crm_lead_tags.tag_id
    AND t.owner_phone = auth_user_phone()
  )
);
```

### 3.2 Operações CRUD

| Operação | Endpoint/Query | Descrição |
|----------|----------------|-----------|
| **Listar Tags** | `SELECT * FROM crm_tags` | RLS filtra por owner |
| **Criar Tag** | `INSERT INTO crm_tags (name, color, owner_phone)` | Retorna objeto criado |
| **Atualizar Tag** | `UPDATE crm_tags SET name, color WHERE id` | Propaga para todos os leads |
| **Excluir Tag** | `DELETE FROM crm_tags WHERE id` | CASCADE remove associações |
| **Associar Tag** | `INSERT INTO crm_lead_tags (lead_id, tag_id)` | ON CONFLICT DO NOTHING |
| **Desassociar Tag** | `DELETE FROM crm_lead_tags WHERE lead_id AND tag_id` | — |
| **Tags do Lead** | `SELECT t.* FROM crm_tags t JOIN crm_lead_tags lt ON...` | Com lead_id |

---

## 4. Implementação no Frontend

### 4.1 Novos Tipos TypeScript

```typescript
// src/types/crm.ts
export interface CrmTag {
  id: string;
  name: string;
  color: string;
  owner_phone: string;
  created_at: string;
  updated_at: string;
}

export interface CrmLeadTag {
  lead_id: string;
  tag_id: string;
  assigned_at: string;
  tag?: CrmTag; // Populated via JOIN
}
```

### 4.2 Hook `useCrmTags`

```typescript
// Funcionalidades:
- useQuery(['crm-tags']) → lista todas as tags do usuário
- useMutation para criar/atualizar/excluir tags
- Invalidação automática do cache
- Optimistic updates para UX fluida
```

### 4.3 Hook `useLeadTags` (Refatorado)

```typescript
// Funcionalidades:
- useQuery(['lead-tags', leadId]) → tags de um lead específico
- useMutation para associar/desassociar
- Sync com cache de leads para atualização em tempo real
```

### 4.4 Componentes

| Componente | Alteração |
|------------|-----------|
| `TagsEditor.tsx` | Aceitar `CrmTag[]` ao invés de `string[]`, adicionar ColorPicker |
| `TagChip.tsx` | Novo componente para exibição consistente |
| `TagsManager.tsx` | Novo componente para CRUD global de tags |
| `LeadDetailsSheet.tsx` | Integrar hooks refatorados |
| `KanbanCard.tsx` | Usar `CrmTag` com cores do banco |
| `FilterPanel.tsx` | Adicionar seletor de tags |

---

## 5. Plano de Execução Detalhado

### 🔴 REGRAS DE SEGURANÇA (OBRIGATÓRIAS)

1. **Antes de cada etapa:** Validar contexto com `context7-mcp`
2. **Após cada etapa:** Testar com `chrome-devtools-mcp`
3. **Banco de dados:** Usar exclusivamente `supabase-mcp`
4. **UI Components:** Buscar com `magic-mcp` antes de criar do zero
5. **Rollback:** Cada migração deve ter script de reversão documentado

---

### Etapa 1: Migração SQL — Criar Estrutura
**Ferramentas:** `supabase-mcp`, `context7-mcp`

- [ ] 1.1 Criar função `auth_user_phone()`
- [ ] 1.2 Criar tabela `crm_tags` com constraints
- [ ] 1.3 Criar tabela `crm_lead_tags` com FKs CASCADE
- [ ] 1.4 Criar índices de performance
- [ ] 1.5 Criar RLS policies
- [ ] 1.6 **CHECKPOINT:** Validar estrutura no Supabase Dashboard

**Rollback:** `DROP TABLE crm_lead_tags; DROP TABLE crm_tags; DROP FUNCTION auth_user_phone;`

---

### Etapa 2: Migração de Dados — Array → Relacional
**Ferramentas:** `supabase-mcp`

- [ ] 2.1 Script para extrair tags únicas de `evolution_contacts.crm_tags`
- [ ] 2.2 Inserir em `crm_tags` com cores geradas (hash → hex)
- [ ] 2.3 Popular `crm_lead_tags` baseado nos arrays existentes
- [ ] 2.4 **CHECKPOINT:** Comparar contagem array vs relacional

**Rollback:** `TRUNCATE crm_lead_tags; TRUNCATE crm_tags;`

---

### Etapa 3: Atualizar Tipos TypeScript
**Ferramentas:** `context7-mcp`

- [ ] 3.1 Adicionar interfaces `CrmTag` e `CrmLeadTag` em `src/types/crm.ts`
- [ ] 3.2 Regenerar tipos Supabase se necessário
- [ ] 3.3 **CHECKPOINT:** `npm run lint` sem erros

---

### Etapa 4: Criar Hooks de Dados
**Ferramentas:** `context7-mcp` (React Query docs)

- [ ] 4.1 Criar `src/hooks/useCrmTags.ts`
- [ ] 4.2 Refatorar `src/hooks/useLeadTags.ts`
- [ ] 4.3 **CHECKPOINT:** Console sem warnings, dados carregando

---

### Etapa 5: Buscar e Criar Componentes UI
**Ferramentas:** `magic-mcp`, `context7-mcp`

- [ ] 5.1 Buscar componente de Tag/Badge/Chip no 21st.dev
- [ ] 5.2 Buscar componente de ColorPicker
- [ ] 5.3 Criar `TagChip.tsx` e `TagsManager.tsx`
- [ ] 5.4 **CHECKPOINT:** Storybook/preview visual OK

---

### Etapa 6: Refatorar TagsEditor
**Ferramentas:** `context7-mcp`, `chrome-devtools-mcp`

- [ ] 6.1 Atualizar props para `CrmTag[]`
- [ ] 6.2 Integrar ColorPicker na criação
- [ ] 6.3 Manter retrocompatibilidade temporária com `string[]`
- [ ] 6.4 **CHECKPOINT:** Criar tag, alterar cor, excluir — tudo funcional

---

### Etapa 7: Atualizar Componentes de Visualização
**Ferramentas:** `chrome-devtools-mcp`

- [ ] 7.1 `KanbanCard.tsx` — usar cores do banco
- [ ] 7.2 `LeadDetailsSheet.tsx` — botão de edição rápida no header
- [ ] 7.3 `FilterPanel.tsx` — seletor de tags
- [ ] 7.4 **CHECKPOINT:** Fluxo completo no CRM sem erros

---

### Etapa 8: Testes End-to-End
**Ferramentas:** `chrome-devtools-mcp`

- [ ] 8.1 Criar tag nova com cor customizada
- [ ] 8.2 Associar tag a lead via edição rápida
- [ ] 8.3 Filtrar pipeline por tag
- [ ] 8.4 Renomear tag e verificar propagação
- [ ] 8.5 Excluir tag e verificar CASCADE
- [ ] 8.6 **CHECKPOINT FINAL:** Todos os cenários passando

---

## 6. Checklist de Validação Final

- [ ] Nenhum erro no console do browser
- [ ] RLS policies bloqueando acesso cross-tenant
- [ ] Performance de listagem < 200ms
- [ ] Cores persistindo corretamente
- [ ] Filtros funcionando com múltiplas tags
- [ ] Coluna `crm_tags` antiga ainda intacta (fallback)
- [ ] Documentação atualizada

---

## 7. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Dados perdidos na migração | Baixa | Manter coluna antiga por 2 semanas |
| Performance degradada | Média | Índices + monitoring |
| RLS mal configurada | Alta | Testes manuais por tenant |
| UI quebrada | Média | Feature flag para rollback |

---

## Apêndice: Scripts de Rollback

### Rollback Completo (Emergência)
```sql
-- Reverter para sistema de array
DROP TABLE IF EXISTS crm_lead_tags;
DROP TABLE IF EXISTS crm_tags;
DROP FUNCTION IF EXISTS auth_user_phone;
-- Coluna crm_tags em evolution_contacts permanece intacta
```

### Rollback Parcial (Apenas dados)
```sql
TRUNCATE crm_lead_tags;
TRUNCATE crm_tags CASCADE;
-- Re-executar migração de dados se necessário
```