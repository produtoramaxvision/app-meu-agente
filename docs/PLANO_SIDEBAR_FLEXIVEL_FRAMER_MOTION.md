# Plano: Sidebar Flexível com Framer Motion

> **Objetivo:** Refatorar o sidebar atual para expandir/recolher com animações suaves usando `framer-motion`, seguindo o padrão do componente de referência (hover para expandir no desktop, overlay animado no mobile).

**Data:** 13/12/2025  
**Status:** Planejado  
**Complexidade:** Média-Alta  
**Tempo estimado:** 4-6 horas

---

## TL;DR

Criar um `SidebarContext` global para gerenciar estado open/collapsed, refatorar `AppSidebar.tsx` para usar `motion.div` do framer-motion com animação de largura (60px ↔ 256px), implementar expansão por hover no desktop e manter overlay animado no mobile. Os labels dos links usarão `motion.span` para fade in/out suave.

---

## 📋 Arquivos a Modificar

| Arquivo | Ação | Prioridade |
|---------|------|------------|
| `src/contexts/SidebarContext.tsx` | **CRIAR** | 🔴 Alta |
| `src/components/layout/AppSidebar.tsx` | **REFATORAR** | 🔴 Alta |
| `src/components/layout/AppLayout.tsx` | **MODIFICAR** | 🔴 Alta |
| `src/components/QuickActions.tsx` | **ADAPTAR** | 🟡 Média |
| `src/components/HelpAndSupport.tsx` | **ADAPTAR** | 🟡 Média |
| `src/components/Logo.tsx` | **ADAPTAR** | 🟡 Média |

---

## 🔧 Steps de Implementação

### Step 1: Criar `SidebarContext.tsx`

**Arquivo:** `src/contexts/SidebarContext.tsx`

Criar contexto global para gerenciar estado do sidebar com suporte a controle externo (controlled/uncontrolled pattern).

```typescript
// Interface do contexto
interface SidebarContextProps {
  open: boolean;           // Estado expandido/recolhido
  setOpen: (open: boolean) => void;
  animate: boolean;        // Flag para habilitar/desabilitar animações
  isMobile: boolean;       // Detectar se é mobile
}
```

**Funcionalidades:**
- Estado controlado ou interno (pattern do componente de referência)
- Hook `useSidebar()` para consumir o contexto
- Detecção automática de mobile via `useMediaQuery` ou `window.matchMedia`
- Persistência opcional em `localStorage` para lembrar preferência do usuário

---

### Step 2: Refatorar `AppSidebar.tsx` para usar Framer Motion

**Arquivo:** `src/components/layout/AppSidebar.tsx`

**Mudanças principais:**

1. **Substituir `<aside>` por `<motion.aside>`** com animação de largura:
   ```tsx
   <motion.aside
     animate={{ width: open ? "256px" : "64px" }}
     transition={{ duration: 0.3, ease: "easeInOut" }}
     onMouseEnter={() => setOpen(true)}
     onMouseLeave={() => setOpen(false)}
   >
   ```

2. **Remover props `collapsed` e `onToggle`** - migrar para contexto:
   ```tsx
   // ANTES
   interface AppSidebarProps {
     collapsed: boolean;
     onToggle: () => void;
     showCloseButton?: boolean;
   }
   
   // DEPOIS
   interface AppSidebarProps {
     showCloseButton?: boolean;  // Apenas para mobile
   }
   ```

3. **Criar componente `SidebarLink`** para links com animação:
   ```tsx
   // Labels com fade animado
   <motion.span
     animate={{
       opacity: open ? 1 : 0,
       display: open ? "inline-block" : "none",
     }}
     transition={{ duration: 0.2 }}
   >
     {label}
   </motion.span>
   ```

4. **Separar `DesktopSidebar` e `MobileSidebar`** internamente:
   - Desktop: `hidden md:flex` com hover expand
   - Mobile: `flex md:hidden` com overlay `AnimatePresence`

---

### Step 3: Adaptar `AppLayout.tsx`

**Arquivo:** `src/components/layout/AppLayout.tsx`

**Mudanças:**

1. **Envolver com `SidebarProvider`**:
   ```tsx
   <SidebarProvider>
     <div className="flex flex-col h-screen">
       {/* ... */}
     </div>
   </SidebarProvider>
   ```

2. **Remover estados locais** (`sidebarCollapsed`, `sidebarOpen`, `isClosing`):
   - Migrar para `useSidebar()` do contexto

3. **Simplificar integração do sidebar**:
   ```tsx
   // ANTES
   <AppSidebar 
     collapsed={sidebarCollapsed} 
     onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
   />
   
   // DEPOIS
   <AppSidebar />
   ```

4. **Mobile overlay** movido para dentro do `AppSidebar` (ou `MobileSidebar`)

---

### Step 4: Adaptar Componentes Filhos

#### 4.1 `QuickActions.tsx`

**Mudança:** Substituir prop `collapsed` por hook `useSidebar()`:
```tsx
// ANTES
export function QuickActions({ collapsed }: { collapsed: boolean })

// DEPOIS  
export function QuickActions() {
  const { open } = useSidebar();
  const collapsed = !open;
  // ...
}
```

#### 4.2 `HelpAndSupport.tsx`

**Mudança:** Mesma adaptação - usar contexto ao invés de prop.

#### 4.3 `Logo.tsx`

**Mudança:** Adicionar animação no texto com `motion.span`:
```tsx
<motion.span
  animate={{ opacity: showText ? 1 : 0, width: showText ? "auto" : 0 }}
  className="overflow-hidden"
>
  Meu Agente
</motion.span>
```

---

### Step 5: Implementar Animações Mobile

**Componente:** `MobileSidebar` (dentro de `AppSidebar.tsx`)

Usar `AnimatePresence` do framer-motion para overlay:
```tsx
<AnimatePresence>
  {open && (
    <>
      {/* Backdrop com fade */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setOpen(false)}
      />
      
      {/* Sidebar com slide */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed left-0 top-0 h-full w-64 z-50"
      >
        {children}
      </motion.aside>
    </>
  )}
</AnimatePresence>
```

---

### Step 6: Testes e Ajustes Finais

1. **Testar hover expand/collapse** no desktop
2. **Testar touch/click** no mobile
3. **Verificar submenus** (Collapsible) funcionando com animações
4. **Validar acessibilidade** (focus trap no mobile, aria-expanded)
5. **Testar persistência** de estado (se implementado)
6. **Performance**: verificar se animações rodam a 60fps

---

## 🎨 Especificações de Animação

| Elemento | Propriedade | Duração | Easing |
|----------|-------------|---------|--------|
| Sidebar width | `width` | 300ms | `easeInOut` |
| Labels opacity | `opacity` | 200ms | `linear` |
| Mobile backdrop | `opacity` | 300ms | `easeInOut` |
| Mobile slide | `x` | 300ms | `easeInOut` |
| Ícone hover | `scale` | 200ms | CSS transition |

---

## 📐 Larguras do Sidebar

| Estado | Largura | Tailwind |
|--------|---------|----------|
| Colapsado | 64px | `w-16` |
| Expandido | 256px | `w-64` |
| Mobile (expandido) | 256px | `w-64` |

---

## ⚠️ Pontos de Atenção

### 1. Conflito com Submenus
O sidebar atual usa `Collapsible` do Radix. Ao colapsar o sidebar, os submenus devem:
- **Opção A:** Fechar automaticamente quando sidebar colapsar
- **Opção B:** Mostrar como tooltip/popover quando colapsado (mais complexo)

**Recomendação:** Opção A (mais simples, menos bugs)

### 2. Área Clicável no Sidebar Colapsado
Atualmente existe lógica complexa (linhas 100-140) para detectar cliques e evitar conflitos com NavLinks. Com framer-motion + hover, essa lógica pode ser **removida** no desktop.

### 3. Badge de Notificações
O badge de notificações no ícone de "Notificações" deve continuar visível quando colapsado.

### 4. Mobile Header
O botão X e Logo no mobile sidebar devem usar `AnimatePresence` para entrada/saída suave.

### 5. Persistência de Estado
Considerar salvar preferência do usuário em `localStorage`:
```typescript
const SIDEBAR_STATE_KEY = 'meuagente:sidebar:collapsed';
```

---

## 🔄 Migração Gradual (Opcional)

Se preferir migração mais segura:

1. **Fase 1:** Criar `SidebarContext` sem quebrar código existente
2. **Fase 2:** Migrar `AppLayout` para usar contexto
3. **Fase 3:** Refatorar `AppSidebar` com framer-motion
4. **Fase 4:** Adaptar componentes filhos
5. **Fase 5:** Remover código legado

---

## 📦 Dependências

| Pacote | Versão | Status |
|--------|--------|--------|
| `framer-motion` | ^12.23.25 | ✅ Já instalado |
| `@radix-ui/react-collapsible` | ^1.1.11 | ✅ Já instalado |
| `lucide-react` | ^0.462.0 | ✅ Já instalado |

**Nenhuma nova dependência necessária!**

---

## 📝 Checklist de Implementação

- [ ] Criar `src/contexts/SidebarContext.tsx`
- [ ] Adicionar `SidebarProvider` no `AppLayout.tsx`
- [ ] Refatorar `AppSidebar.tsx` com `motion.aside`
- [ ] Implementar `DesktopSidebar` com hover expand
- [ ] Implementar `MobileSidebar` com `AnimatePresence`
- [ ] Criar componente `SidebarLink` com `motion.span`
- [ ] Adaptar `QuickActions.tsx` para usar contexto
- [ ] Adaptar `HelpAndSupport.tsx` para usar contexto
- [ ] Adaptar `Logo.tsx` com animação de texto
- [ ] Testar em desktop (Chrome, Firefox, Safari)
- [ ] Testar em mobile (iOS Safari, Android Chrome)
- [ ] Validar acessibilidade (keyboard navigation, screen readers)
- [ ] Documentar mudanças no código

---

## 🎯 Resultado Esperado

### Desktop
- Sidebar inicia **colapsado** (64px) mostrando apenas ícones
- Ao passar o mouse (**hover**), expande suavemente para 256px
- Labels aparecem com fade in
- Ao tirar o mouse, colapsa suavemente
- Submenus funcionam apenas quando expandido

### Mobile
- Sidebar **oculto** por padrão
- Botão hambúrguer no header abre overlay
- Sidebar desliza da esquerda com animação
- Backdrop escuro com fade
- Botão X fecha com animação de saída
- Touch no backdrop também fecha

---

## 📚 Referências

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Aceternity UI Sidebar Component](https://ui.aceternity.com/components/sidebar)
- [Radix UI Collapsible](https://www.radix-ui.com/docs/primitives/components/collapsible)
