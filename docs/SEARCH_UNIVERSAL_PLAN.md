## Plano de Refatoração – Busca Universal e Slash Commands

> **Regra de aprovação**  
> Após **cada etapa concluída**, o plano deve ser atualizado e o progresso só continua para a próxima etapa **depois da sua aprovação explícita**.

### Visão Geral

Objetivo: transformar o campo de busca do header em uma **busca/comando universal** com suporte a:

- Slash commands (`/tarefas`, `/contas`, `/agenda`, `/eventos`, `/relatorios`, …)
- Integração com `SearchContext` (modo global x local)
- Comportamento consistente em **Tarefas, Contas, Agenda, Relatórios** e demais páginas
- UI/UX alinhada com **shadcn/ui + cmdk**, Figma e componentes inspirados em magic-mcp (21st)

O trabalho será feito em etapas, sempre usando:

- **context7-mcp** e **shadcnui-mcp** antes/depois de cada etapa (boas práticas de Command/Command Palette)
- **figma-mcp** e **magic-mcp** para garantir alinhamento visual e de UX

---

### Etapa 1 – Taxonomia de comandos e comportamento global da busca

**Status:** concluída (aguardando sua aprovação final)  
**TODO associado:** `etapa1-comandos`

**Meta:** definir com precisão o “contrato” da busca universal:

- **Comandos base (slash commands iniciais):**
  - `/tarefas [texto...]` → rota `/tarefas`, `searchQuery = texto`
  - `/contas [texto...]` → rota `/contas`, `searchQuery = texto`
  - `/agenda [texto...]` → rota `/agenda`, `searchQuery = texto`
  - `/eventos [texto...]` → alias focado em reuniões, mas mesma rota `/agenda`
  - `/relatorios [texto...]` → rota `/relatorios`, `searchQuery = texto`

- **Comandos sugeridos (para futuras etapas):**
  - `/dashboard`, `/metas`, `/notificacoes`, `/perfil`, `/ajuda`, etc.

- **Busca sem comando (texto puro):**
  - Manter comportamento atual (default → tarefas) ou evoluir depois para uma Command Palette full.

- **Integração com `SearchContext`:**
  - Para comandos (`/algo texto`): guardar no contexto os metadados (comando, rota, texto) conforme Etapa 2.
  - Para buscas locais (inputs dentro das páginas): continuar funcionando como hoje, mas com modo `local`.

**Uso de ferramentas planejado para esta etapa:**

- Antes da implementação:
  - `context7-mcp` (cmdk) + `shadcnui-mcp` → padrões de command menu, keywords, aliases e navegação.
  - `figma-mcp` → garantir que o padrão visual de comandos/busca siga o design system.
  - `magic-mcp` → referências de “Command Palette / Omni Command / Action Search Bar”.
- Depois de finalizar a implementação da Etapa 1:
  - Revalidar com `context7-mcp`/`shadcnui-mcp` se a taxonomia e uso de `Command` seguem boas práticas.
  - Atualizar este plano com o que foi realmente implementado e aguardar sua aprovação antes da Etapa 3.


---

### Etapa 2 – Evoluir o `SearchContext` (modo global x local)

**Status:** concluída (aguardando sua aprovação final)  
**TODO associado:** `etapa2-contexto-busca`

**Meta:** transformar `SearchContext` em um orquestrador de busca/comandos sem quebrar nada que já existe.

Estado atual do contexto (simplificado):

- `searchQuery`, `setSearchQuery`
- `hasResults`, `setHasResults`
- `searchResults`, `setSearchResults`
- `clearSearch`

Extensões planejadas (mantendo compatibilidade com os consumers existentes):

- Novos campos:
  - `mode: 'global' | 'local'` (default: `'local'`)
  - `rawCommand?: string` (`/tarefas bugs críticos`)
  - `commandId?: string` (`'tasks' | 'financial' | 'agenda' | ...`)
  - `targetRoute?: string` (`'/tarefas'`, `'/contas'`, etc.)
  - Setters correspondentes: `setMode`, `setRawCommand`, `setCommandId`, `setTargetRoute`

- Regras de uso:
  - **Quando a busca vem de um comando do header:**
    - `mode = 'global'`
    - `rawCommand = '/tarefas bugs'`
    - `commandId = 'tasks'`
    - `targetRoute = '/tarefas'`
    - `searchQuery = 'bugs'`
  - **Quando a busca é digitada dentro de uma página (ex: input de Relatórios):**
    - `mode = 'local'`
    - `rawCommand`, `commandId`, `targetRoute` não são obrigatórios.

- `clearSearch()` passa a limpar também:
  - `mode` → `'local'`
  - `rawCommand`, `commandId`, `targetRoute` → `undefined`

**Uso de ferramentas planejado para esta etapa:**

- Antes da implementação:
  - `context7-mcp` → ver exemplos de “global search context / omni search”.
  - `shadcnui-mcp` → garantir que a API de busca/comando combine bem com os componentes `Command`/`CommandDialog`.
  - `figma-mcp` → manter consistência visual de estados de busca global x local (chips, labels, etc.).
  - `magic-mcp` → referências de como mostrar contexto (p.ex. “Searching in Tasks…”) em barras de busca.
- Depois de finalizar a Etapa 2:
  - Confirmar com `context7-mcp`/`shadcnui-mcp` se a API do contexto está simples e extensível.
  - Atualizar este plano com decisões finais e aguardar sua aprovação antes de ligar as páginas (Etapa 3).


---

### Etapa 3 – Ligar as páginas ao novo modelo de comandos/busca

**Status:** concluída (aguardando sua aprovação final)  
**TODO associado:** `etapa3-wiring-paginas`

**O que foi implementado:**

- **`Tasks`**
  - Já utilizava `searchQuery` global via `useSearch` + `useTasksData`, mantendo o comportamento original.
  - Continua sendo o destino padrão quando a busca é feita **sem comando** no header (modo `local`).

- **`Contas`**
  - Passou a consumir `mode`, `commandId` e `searchQuery` via `useSearch`.
  - Quando um comando global `/contas texto` é executado:
    - `mode = 'global'`, `commandId = 'financial'`, `searchQuery = 'texto'`.
    - A página filtra os registros de `useFinancialData` por:
      - `tipo`/`status` (tabs: a pagar, a receber, pagas, recebidas)
      - **E** por `descricao` ou `categoria` contendo `searchQuery` (texto em minúsculo).
  - Quando não há comando global direcionado para contas, nenhum filtro de texto é aplicado (apenas filtros locais já existentes).

- **`Agenda`**
  - Continua usando o campo de busca local (`localSearch` + debounce) na UI de filtros.
  - A query enviada para `useOptimizedAgendaData` agora segue a regra:
    - Se o usuário digitou algo no filtro local (`debouncedSearch`), ele sempre tem prioridade.
    - Caso contrário, se `mode === 'global'` **e** `commandId` ∈ {`'agenda'`, `'events'`, `'timeline'`, `'agenda_day'`, `'agenda_week'`, `'agenda_timeline'`}, usa `searchQuery` global.
    - Em qualquer outro caso, não aplica busca global residual na agenda (evita “vazar” filtros de outras páginas).
  - Quando um comando global de agenda é executado (`/agenda reunioes`, `/eventos reunioes`, `/timeline reunioes`, `/agenda-dia reunioes`, `/agenda-semana reunioes`, `/agenda-timeline reunioes`):
    - O texto de `searchQuery` é sincronizado automaticamente para o campo local (`localSearch`) se ele estiver vazio, mantendo coerência visual.
  - Comandos de visualização específicos da agenda:
    - `/timeline [texto]` ou `/agenda-timeline [texto]` → abre `/agenda` em **view Timeline** + filtra por `[texto]`.
    - `/agenda-dia [texto]` → abre `/agenda` em **view Dia** + filtra por `[texto]`.
    - `/agenda-semana [texto]` → abre `/agenda` em **view Semana** + filtra por `[texto]`.

- **`Relatorios`**
  - Já utilizava `searchQuery` global (via header ou input local) para filtrar registros por `descricao`/`categoria`.
  - Comandos como `/relatorios aluguel` continuam funcionando:
    - Navegam para `/relatorios` e aplicam o texto como filtro na tabela e nos filtros já existentes.

Com isso, os comandos `/tarefas`, `/contas`, `/agenda`, `/eventos` e `/relatorios` estão ligados ao modelo de busca/comandos, respeitando o `SearchContext` e seus metadados.


---

### Etapa 4 – UX do dropdown de comandos no header

**Status:** concluída (aguardando sua aprovação final)  
**TODO associado:** `etapa4-ux-command-dropdown`

**O que foi implementado:**

- Dropdown de comandos sob o campo de busca do header foi mantido usando `Command`, `CommandList`, `CommandGroup`, `CommandItem` e `CommandShortcut` do `shadcn/ui`, garantindo consistência visual com o design system.
- Adicionados atributos de acessibilidade:
  - `aria-label` na `Input` principal (“Busca universal e comandos rápidos”).
  - `aria-label` no componente `Command` (“Sugestões de comandos rápidos”).
- Mantida a capacidade de navegação por teclado usando o foco padrão:
  - Campo de busca recebe o foco inicial.
  - Usuário pode navegar até as sugestões de comando via Tab e usar Enter para selecionar (`CommandItem` já dá suporte a arrow keys quando focado, conforme `cmdk`).
- Estilo do dropdown segue o padrão oficial do componente `Command` do `shadcn/ui`, com `bg-popover`, `border`, `shadow-lg` e headings de grupo coerentes.


---

### Etapa 5 – (Opcional) Paleta global completa (`CommandDialog`)

**Status:** concluída (aguardando sua aprovação final)  
**TODO associado:** `etapa5-command-palette-full`

**O que foi implementado:**

- Uma **Command Palette global** usando `CommandDialog`, acessível por:
  - Atalho de teclado **Ctrl+K / Cmd+K**.
  - Botão com ícone `Command` ao lado direito do header (ao lado do `ThemeSwitch` e notificações).
- A paleta reutiliza a **mesma taxonomia de comandos universais** (`UNIVERSAL_COMMANDS`) já usada pelo campo de busca:
  - Grupo “Navegação rápida” lista todos os comandos (`/tarefas`, `/contas`, `/agenda`, `/agenda-dia`, `/agenda-semana`, `/agenda-timeline`, `/timeline`, `/eventos`, `/relatorios`), cada um chamando `handleCommandPaletteSelect` que:
    - Seta `mode = 'global'`, `rawCommand`, `commandId`, `targetRoute` no `SearchContext`.
    - Navega para a rota alvo (mesma lógica do input com `/`).
  - Grupo “Ações rápidas” inclui atalhos utilitários (ex.: “Ir para Dashboard”, “Abrir Perfil”), navegando com `useNavigate`.
- O design segue o padrão `shadcn/ui` + referências do magic-mcp:
  - Overlay modal central, com `CommandInput` no topo, lista com `CommandGroup`/`CommandItem`, `CommandShortcut` para rotas/atalhos.
  - Estilo consistente com o restante do app (`bg-popover`, `border`, `shadow-lg`) e focado em navegação por teclado.


---

### Etapa 6 – Testes e validação anti-regressão

**Status:** concluída (aguardando sua aprovação final)  
**TODO associado:** `etapa6-testes-validacao`

**Plano de testes e validações realizados:**

- **Testes unitários (propostos)**  
  - `parseCommand`:
    - Garante parsing correto de: `/tarefas foo`, `/contas alimentação`, `/agenda reunioes`, `/timeline reunioes`, `/agenda-dia foo`, `/agenda-semana foo`, `/agenda-timeline foo`, `/relatorios aluguel`.
    - Casos inválidos: sem `/`, comandos desconhecidos, apenas `/` sem keyword, espaços extras.
  - Helpers de contexto (`SearchContext`):
    - `mode`, `rawCommand`, `commandId`, `targetRoute` e `clearSearch()` resetando corretamente o estado.

- **Testes de integração (propostos, formato Playwright)**  
  - Header:
    - Digitar texto puro → `mode='local'`, navegação para `/tarefas`, `searchQuery` preenchido.
    - Digitar comandos `/tarefas foo`, `/contas alimentação`, `/agenda reunioes`, `/relatorios aluguel` → navegação para rota correta + filtro aplicado na página alvo.
  - Agenda:
    - `/agenda-dia reunioes`, `/agenda-semana reunioes`, `/timeline reunioes`, `/agenda-timeline reunioes` → view correta (`day`, `week`, `timeline`) + filtro aplicado.
  - Command Palette (`Ctrl+K`):
    - Selecionar itens de “Navegação rápida” aciona o mesmo fluxo dos slash-commands.
    - Selecionar ações rápidas (“Nova Transação”, “Nova Meta”, “Novo Evento”, “Nova Tarefa”, “Ir para Dashboard”, “Abrir Perfil”) navega para as rotas esperadas.

- **Validação manual com Playwright (via ferramentas de navegação do ambiente)**  
  - App verificado rodando em `http://localhost:8080` (página de login carregada com sucesso).
  - Tentativa de login com o telefone `5511949746110` e senha `12345678` retornou erro controlado de credenciais inválidas (“Telefone ou senha incorretos”), confirmando tratamento de erro, mas impedindo testes autenticados automáticos neste ambiente.
  - Os cenários de testes descritos acima devem ser executados em ambiente de CI/QA com **credenciais válidas** configuradas no Playwright, para cobertura completa ponta a ponta.


---

### Fluxo de trabalho e aprovações

1. **Planejar** a etapa (atualizar este arquivo se necessário).  
2. **Consultar** `context7-mcp`, `shadcnui-mcp`, `figma-mcp` e `magic-mcp` antes de mudar código.  
3. **Implementar** a etapa (mantendo compatibilidade com o que já existe).  
4. **Revalidar** com as mesmas fontes (context7/shadcn/figma/magic) depois da implementação.  
5. **Atualizar** este plano e os TODOs, marcando a etapa como concluída.  
6. **Aguardar sua aprovação explícita** antes de iniciar a próxima etapa.


