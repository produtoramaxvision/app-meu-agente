# Plano de Correção de Erros de Lint - Meu Agente

**Data**: 15 de dezembro de 2025  
**Total de Problemas**: 275 (189 erros JS/TS + 66 warnings + 20 erros CSS)  
**Arquivos Afetados**: 50+  
**Status**: Em Execução - Fase por Fase

---

## 📊 RESUMO EXECUTIVO

- **Impacto em Funcionalidades**: Zero (se corrigido corretamente)
- **Impacto em Design**: Zero (correções são tipagem e padrões)
- **Responsividade**: Mantida em todas as correções
- **Estratégia**: Correção incremental com validação a cada fase

---

## 🎯 FASES DE EXECUÇÃO

### **FASE 1: Erros Críticos** ⭐⭐⭐ (Prioridade Máxima)
**Tempo Estimado**: 1h  
**Arquivos**: 4  
**Impacto**: Bloqueadores de build/runtime

#### A) OptimizedLoadingComponents.tsx - Linha 210
**Erro**: `Parsing error: ',' expected`  
**Causa**: TypeScript 5.6+ requer vírgula em generics de arrow functions  
**Correção**:
```typescript
// Linha 209
const executeWithLoading = React.useCallback(async <T,>( // Adicionar vírgula após T
  operation: () => Promise<T>,
```
**Risco**: ⚠️ Baixo - Sintaxe pura, sem impacto funcional

---

#### B) HelpAndSupport.tsx - Linha 189
**Erro**: `react-hooks/rules-of-hooks` - Hook chamado condicionalmente  
**Impacto**: ⚠️⚠️ Alto - Pode causar comportamento inesperado  
**Correção**:
```typescript
// ANTES (ERRADO):
export function HelpAndSupport({ mode }: HelpAndSupportProps) {
  if (mode === 'sidebar') {
    const { effectiveCollapsed } = useSidebar(); // ❌ Condicional
    return <HelpAndSupportContent mode={mode} collapsed={effectiveCollapsed} />;
  }
  return <HelpAndSupportContent mode={mode} collapsed={false} />;
}

// DEPOIS (CORRETO):
export function HelpAndSupport({ mode }: HelpAndSupportProps) {
  const { effectiveCollapsed } = useSidebar(); // ✅ Sempre executado
  const collapsed = mode === 'sidebar' ? effectiveCollapsed : false;
  return <HelpAndSupportContent mode={mode} collapsed={collapsed} />;
}
```
**Testes Necessários**:
- ✅ Help & Support em modo sidebar (desktop)
- ✅ Help & Support em modo floatingAuth (tela de login)
- ✅ Responsividade mobile/tablet

---

#### C) SupportTabs.tsx - Linha 289
**Erro**: `react-hooks/rules-of-hooks` - Hook após early return  
**Impacto**: ⚠️⚠️ Alto - Pode causar comportamento inesperado  
**Correção**: Mover `useForm` para ANTES do bloco de verificação de assinatura
```typescript
// ANTES (linhas 275-295):
if (subscription !== 'premium') {
  return (
    <Card>...</Card>
  );
}

const form = useForm<SupportTicketData>({ // ❌ Após early return
  resolver: zodResolver(supportTicketSchema),
  // ...
});

// DEPOIS:
const form = useForm<SupportTicketData>({ // ✅ Antes do early return
  resolver: zodResolver(supportTicketSchema),
  defaultValues: {
    type: 'support',
    subject: '',
    description: '',
    priority: 'medium',
  },
});

if (subscription !== 'premium') {
  return (
    <Card>...</Card>
  );
}
```
**Testes Necessários**:
- ✅ Aba de Suporte com assinatura free/starter
- ✅ Aba de Suporte com assinatura premium
- ✅ Formulário de ticket funcional

---

#### D) docs/EXEMPLO_USO_EVOLUTION_CONTACTS.tsx - Linha 199
**Erro**: Hook no top-level (arquivo de exemplo)  
**Solução**: Adicionar ao `.eslintignore`
```
# Arquivos de documentação/exemplos
docs/**/*.tsx
docs/**/*.ts
```
**Risco**: Zero - É apenas documentação

---

### **FASE 2: Quick Wins** ✨ (Correções Rápidas)
**Tempo Estimado**: 30min  
**Arquivos**: 10  
**Impacto**: Zero funcionalidade

#### A) Prefer-const (13 erros)
**Correção**: Automática via `npm run lint -- --fix`

**Arquivos afetados**:
- `EventForm.tsx` (linhas 79, 81)
- `AnimatedSlider.tsx` (linhas 47, 48, 79, 189, 197)
- `Reports.tsx` (linha 292)
- `useOptimizedAgendaData.ts` (linha 261)

**Exemplo**:
```typescript
// ❌ ERRADO
let hours = match[1];
let minutes = match[2];

// ✅ CORRETO
const hours = match[1];
const minutes = match[2];
```
**Risco**: Zero - Apenas constness

---

#### B) Escape Characters (4 erros)
**Arquivos**:
- `password-strength-meter.tsx` (linha 18)
- `Signup.tsx` (linha 38)
- `sanitize.ts` (linha 82)

**Correção**:
```typescript
// ❌ ERRADO
/(?=.*[!@#$%^&*()_+\-\=\[\]{}|;:'"<>,.\/?])/

// ✅ CORRETO
/(?=.*[!@#$%^&*()_+\-=[\]{}|;:'"<>,.\/?])/
```
**Risco**: Zero - Regex permanece idêntica

---

#### C) Interfaces Vazias (3 erros)
**Arquivos**:
- `PromptInputBox.tsx` (linha 377)
- `command.tsx` (linha 24)
- `textarea.tsx` (linha 5)

**Correção**:
```typescript
// ❌ ERRADO
interface CommandEmpty extends CommandPrimitive.Empty {}

// ✅ CORRETO
type CommandEmpty = CommandPrimitive.Empty;
```
**Risco**: Zero - Apenas nomenclatura

---

#### D) Tailwind Config (1 erro)
**Arquivo**: `tailwind.config.ts` linha 221

**Correção**:
```typescript
// ❌ ERRADO
const plugin = require('tailwindcss/plugin');

// ✅ CORRETO
import plugin from 'tailwindcss/plugin';
```
**Risco**: Zero - Import equivalente

---

### **FASE 3: Tipos `any`** 🎯 (189 ocorrências)
**Tempo Estimado**: 3-4h  
**Arquivos**: 40+  
**Impacto**: Melhoria de type safety, zero funcionalidade

#### Padrão 1: Event Handlers (40+ ocorrências)
**Arquivos**: Componentes com formulários, botões, inputs

**Tabela de Substituições**:
| Situação | Tipo Correto |
|----------|-------------|
| `onClick` em button | `MouseEvent<HTMLButtonElement>` |
| `onChange` em input | `ChangeEvent<HTMLInputElement>` |
| `onChange` em select | `ChangeEvent<HTMLSelectElement>` |
| `onChange` em textarea | `ChangeEvent<HTMLTextAreaElement>` |
| `onSubmit` em form | `FormEvent<HTMLFormElement>` |
| `onKeyDown` | `KeyboardEvent<HTMLInputElement>` |

**Exemplo de Correção**:
```typescript
// ❌ ERRADO
const handleClick = (e: any) => {
  console.log(e.currentTarget.value);
}

// ✅ CORRETO
import { MouseEvent } from 'react';
const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
  console.log(e.currentTarget.value);
}
```

**Arquivos Críticos** (requerem mais atenção):
- `AgendaGridDay.tsx` (8 ocorrências)
- `EventQuickCreatePopover.tsx` (3 ocorrências)
- `FinanceRecordForm.tsx` (2 ocorrências)
- `GoalForm.tsx` (3 ocorrências)

**Risco**: ⚠️ Baixo - Apenas tipagem, comportamento idêntico

---

#### Padrão 2: Blocos catch (30+ ocorrências)
**Arquivos**: Hooks, utils, Edge Functions

**Correção Padrão**:
```typescript
// ❌ ERRADO
catch (error: any) {
  console.log(error.message);
}

// ✅ CORRETO
catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.log('Unknown error:', error);
  }
}
```

**Arquivos**:
- `errorHandling.ts` (5 ocorrências)
- `useSDRAgent.ts` (13 ocorrências)
- `useEvolutionContacts.ts` (4 ocorrências)
- Edge Functions (20+ ocorrências)

**Risco**: ⚠️ Médio - Requer validação de error handling

---

#### Padrão 3: Dados de API/DB (20+ ocorrências)
**Arquivos**: Hooks de dados

**Estratégia**:
1. Identificar estrutura de dados
2. Criar interface específica
3. Substituir `any` por tipo concreto

**Exemplo**:
```typescript
// ❌ ERRADO
const processData = (data: any) => {
  return data.map((item: any) => item.id);
}

// ✅ CORRETO
interface DataItem {
  id: string;
  name: string;
  created_at: string;
}

const processData = (data: DataItem[]) => {
  return data.map((item) => item.id);
}
```

**Arquivos Prioritários**:
- `useAgendaData.ts` (4 ocorrências)
- `useOptimizedAgendaData.ts` (20 ocorrências)
- `useOptimizedSupabaseQueries.ts` (6 ocorrências)

**Risco**: ⚠️⚠️ Médio-Alto - Requer entendimento da estrutura de dados

---

### **FASE 4: React Hooks Dependencies** 🔄 (66 warnings)
**Tempo Estimado**: 2-3h  
**Arquivos**: Contexts, hooks, páginas  
**Impacto**: Prevenir bugs futuros, sem impacto imediato

#### Categoria 1: Functions não memoizadas
**Arquivos**: `AuthContext.tsx`, `NotificationContext.tsx`

**Problema**:
```typescript
// As funções são recriadas a cada render
const login = () => { ... };
const logout = () => { ... };

const value = useMemo(() => ({
  login, logout // ⚠️ Warning: dependencies mudam sempre
}), [login, logout]);
```

**Solução**:
```typescript
const login = useCallback(() => { ... }, [/* deps */]);
const logout = useCallback(() => { ... }, [/* deps */]);

const value = useMemo(() => ({
  login, logout // ✅ Agora são stable
}), [login, logout]);
```

**Risco**: ⚠️ Médio - Requer identificação correta de dependencies

---

#### Categoria 2: Dependencies complexas
**Arquivos**: `useAgendaData.ts`, `Agenda.tsx`

**Problema**:
```typescript
useMemo(() => {
  // ...
}, [options.calendarIds, options.categories]) // ⚠️ Complex expression
```

**Solução**:
```typescript
const { calendarIds, categories } = options;
useMemo(() => {
  // ...
}, [calendarIds, categories]) // ✅ Extracted
```

**Risco**: ⚠️ Baixo - Extração direta

---

#### Categoria 3: Missing dependencies
**Arquivos**: Vários componentes

**Estratégia**:
1. Analisar se dependency é realmente necessária
2. Adicionar se causar bug
3. Adicionar comentário `eslint-disable` se intencional

**Risco**: ⚠️⚠️ Médio - Pode causar re-renders extras

---

### **FASE 5: CSS e React-refresh** 🎨 (32 warnings)
**Tempo Estimado**: 1h  
**Arquivos**: CSS, components UI  
**Impacto**: Zero funcionalidade

#### A) CSS - Pseudo-elements experimentais (7 erros)
**Solução**: Configurar stylelint para aceitar view-transitions

**Criar/Editar** `.stylelintrc.json`:
```json
{
  "extends": "stylelint-config-standard",
  "rules": {
    "selector-pseudo-element-no-unknown": [
      true,
      {
        "ignorePseudoElements": [
          "view-transition-old",
          "view-transition-new",
          "view-transition-group"
        ]
      }
    ]
  }
}
```

**Risco**: Zero - View Transitions funcionam no Chrome

---

#### B) CSS - Class naming (13 erros)
**Arquivos**: `src/index.css`

**Correção**: Renomear classes com `_` para `-`
```css
/* ❌ ERRADO */
.lucide_icon { ... }
.task_status { ... }

/* ✅ CORRETO */
.lucide-icon { ... }
.task-status { ... }
```

**⚠️ ATENÇÃO**: Verificar se essas classes são usadas em componentes!

**Risco**: ⚠️⚠️⚠️ Alto - Pode quebrar estilos se não atualizar refs

---

#### C) React-refresh (12 warnings)
**Arquivos**: Components UI, contexts

**Problema**: Exportar constantes com componentes
```typescript
// ❌ CAUSA WARNING
export const RECURRING_OPTIONS = [...];
export function Component() { ... }
```

**Solução**: Mover constantes para arquivo separado
```typescript
// constants/event-options.ts
export const RECURRING_OPTIONS = [...];

// Component.tsx
import { RECURRING_OPTIONS } from '@/constants/event-options';
export function Component() { ... }
```

**Risco**: ⚠️ Baixo - Apenas organização de código

---

### **FASE 6: Validação Final** ✅
**Tempo Estimado**: 1h  
**Checklist Completo**

#### Lint Checks
- [ ] `npm run lint` → 0 erros
- [ ] `npm run lint:css` → 0 erros
- [ ] `npm run build` → Sucesso

#### Testes Funcionais
##### Autenticação
- [ ] Login com telefone/email
- [ ] Signup novo usuário
- [ ] Logout
- [ ] Reset password

##### Dashboard
- [ ] Carregamento de cards
- [ ] Gráficos renderizam
- [ ] Navegação entre seções

##### Agenda
- [ ] Views: Dia, Semana, Mês, Ano
- [ ] Criar evento
- [ ] Editar evento
- [ ] Deletar evento
- [ ] Filtros funcionam

##### Tarefas
- [ ] Lista carrega
- [ ] Criar tarefa
- [ ] Marcar como concluída
- [ ] Filtros

##### Finanças
- [ ] Lista de transações
- [ ] Adicionar receita/despesa
- [ ] Gráficos

##### Metas
- [ ] Lista de metas
- [ ] Criar meta
- [ ] Atualizar progresso

##### CRM/Leads
- [ ] Lista carrega
- [ ] Filtros funcionam
- [ ] Detalhes do lead

##### Chat IA
- [ ] Enviar mensagem
- [ ] Receber resposta
- [ ] Histórico persiste

##### SDR Agent
- [ ] Configurações
- [ ] Playground
- [ ] Evolution API integration

##### Perfil
- [ ] Dados do usuário
- [ ] Upload de avatar
- [ ] Alterar senha
- [ ] Planos e assinaturas

#### Responsividade
##### Mobile (375px)
- [ ] Menu hamburger funciona
- [ ] Sidebar colapsa
- [ ] Cards empilham corretamente
- [ ] Formulários são usáveis
- [ ] Tabelas scrollam horizontalmente
- [ ] Modais não ultrapassam viewport

##### Tablet (768px)
- [ ] Layout híbrido funciona
- [ ] Sidebar persiste/colapsa adequadamente
- [ ] Grid adapta colunas
- [ ] Touch targets são adequados

##### Desktop (1024px+)
- [ ] Sidebar sempre visível
- [ ] Multi-column layouts
- [ ] Hover states funcionam

#### Performance
- [ ] Lighthouse Score > 90
- [ ] Nenhum console.error em produção
- [ ] Bundle size não aumentou significativamente

---

## 📝 NOTAS IMPORTANTES

### Prioridades de Teste
1. **CRÍTICO**: Auth, Navegação, CRUD básico
2. **ALTO**: Filtros, Gráficos, Formulários complexos
3. **MÉDIO**: Animações, Transições, UX polish

### Áreas de Risco Elevado
- `AuthContext.tsx` - Coração da autenticação
- `useAgendaData.ts` / `useOptimizedAgendaData.ts` - Lógica complexa de calendário
- `useSDRAgent.ts` - Integração externa (Evolution API)
- Componentes UI que exportam constantes - Risco de fast-refresh quebrar

### Estratégia de Rollback
- Commit após cada fase concluída
- Se algo quebrar: `git reset --hard HEAD~1`
- Manter branch `backup-pre-lint-fixes` antes de iniciar

### Documentação Adicional
- View Transitions: https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
- React Event Types: https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/forms_and_events
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Antes | Meta |
|---------|-------|------|
| Erros ESLint | 189 | 0 |
| Warnings ESLint | 66 | <5 |
| Erros Stylelint | 20 | 0 |
| Build Time | N/A | Sem regressão |
| Bundle Size | N/A | Sem aumento |
| Type Coverage | ~60% | ~95% |

---

## 🚀 EXECUÇÃO

**Status**: 🟡 Em Progresso  
**Fase Atual**: Fase 1 - Erros Críticos  
**Última Atualização**: 15/12/2025

### Log de Execução
- [ ] Fase 1 iniciada
- [ ] Fase 1 concluída e validada
- [ ] Fase 2 iniciada
- [ ] Fase 2 concluída e validada
- [ ] Fase 3 iniciada
- [ ] Fase 3 concluída e validada
- [ ] Fase 4 iniciada
- [ ] Fase 4 concluída e validada
- [ ] Fase 5 iniciada
- [ ] Fase 5 concluída e validada
- [ ] Fase 6 - Validação final completa
- [ ] ✅ Projeto 100% lint-free

---

**Documentado por**: GitHub Copilot  
**Projeto**: Meu Agente - Sistema de Gestão Pessoal e Empresarial  
**Versão do Plano**: 1.0
