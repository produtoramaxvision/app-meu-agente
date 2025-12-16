# 🤝 Guia de Contribuição

> **Última Atualização:** 15 de Dezembro de 2025  
> **Versão do App:** 2.0.0  
> **Autor:** Equipe Meu Agente

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Como Contribuir](#como-contribuir)
3. [Padrões de Código](#padrões-de-código)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Git Workflow](#git-workflow)
6. [Pull Request Process](#pull-request-process)
7. [Code Review](#code-review)
8. [Testes](#testes)
9. [Documentação](#documentação)
10. [FAQ](#faq)

---

## 🎯 Visão Geral

Obrigado por considerar contribuir com o **Meu Agente**! Este documento contém as diretrizes para manter a qualidade e consistência do código.

### Tipos de Contribuição

Aceitamos contribuições de:

- 🐛 **Correção de bugs**
- ✨ **Novos recursos**
- 📝 **Melhorias de documentação**
- 🎨 **Melhorias de UI/UX**
- ⚡ **Otimizações de performance**
- 🔒 **Correções de segurança**
- 🧪 **Testes**

---

## 🚀 Como Contribuir

### 1. Fork e Clone

```bash
# Fork o repositório via GitHub

# Clone seu fork
git clone https://github.com/SEU-USUARIO/app-meu-agente.git
cd app-meu-agente

# Adicione upstream
git remote add upstream https://github.com/meuagente/app-meu-agente.git
```

### 2. Instalar Dependências

```bash
# Instalar pacotes
npm install

# Copiar .env de exemplo
cp .env.example .env.local

# Configurar variáveis de ambiente
# Edite .env.local com suas credenciais
```

### 3. Criar Branch

```bash
# Sempre crie branch a partir de main atualizada
git checkout main
git pull upstream main

# Criar branch com nome descritivo
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/descricao-do-bug
```

### 4. Desenvolver

```bash
# Rodar dev server
npm run dev

# Em outra aba, rodar linter
npm run lint:watch
```

### 5. Commitar

Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/):

```bash
# Formato
<tipo>(<escopo>): <descrição>

# Tipos permitidos
feat:     # Novo recurso
fix:      # Correção de bug
docs:     # Documentação
style:    # Formatação (não afeta código)
refactor: # Refatoração
perf:     # Performance
test:     # Testes
chore:    # Manutenção

# Exemplos
git commit -m "feat(sdr): adicionar suporte a múltiplas instâncias"
git commit -m "fix(crm): corrigir drag and drop no Kanban"
git commit -m "docs(readme): atualizar instruções de instalação"
```

### 6. Push e Pull Request

```bash
# Push para seu fork
git push origin feature/nome-da-feature

# Criar Pull Request no GitHub
# Base: main <- Compare: feature/nome-da-feature
```

---

## 📐 Padrões de Código

### TypeScript

#### Tipagem Forte

```typescript
// ✅ BOM - Tipos explícitos
interface Usuario {
  id: string;
  nome: string;
  telefone: string;
  planId: 'free' | 'basic' | 'business' | 'premium';
}

const buscarUsuario = async (id: string): Promise<Usuario | null> => {
  // ...
};

// ❌ RUIM - Tipos implícitos/any
const buscarUsuario = async (id) => {
  // ...
};
```

#### Evitar `any`

```typescript
// ❌ RUIM
const dados: any = await fetch(...);

// ✅ BOM - Criar interface
interface ApiResponse {
  success: boolean;
  data: Usuario;
}

const dados: ApiResponse = await fetch(...);

// ✅ ALTERNATIVA - Unknown com type guard
const dados: unknown = await fetch(...);
if (isApiResponse(dados)) {
  // TypeScript sabe que dados é ApiResponse aqui
}
```

#### Nomenclatura

```typescript
// Interfaces e Types: PascalCase
interface ContatoWhatsApp {}
type LeadStatus = 'novo' | 'contatado' | 'qualificado';

// Variáveis e funções: camelCase
const nomeCompleto = "João Silva";
function buscarContatos() {}

// Constantes: SCREAMING_SNAKE_CASE
const MAX_TENTATIVAS = 5;
const API_BASE_URL = "https://api.example.com";

// Componentes React: PascalCase
const AgenteSdrCard = () => {};

// Hooks customizados: camelCase com prefixo use
const useEvolutionContacts = () => {};
```

### React

#### Componentes Funcionais

```tsx
// ✅ BOM - Function declaration
export const MeuComponente = ({ prop1, prop2 }: Props) => {
  return <div>...</div>;
};

// ❌ RUIM - Const arrow function export default
export default ({ prop1 }) => <div>...</div>;
```

#### Props com Interface

```tsx
// ✅ BOM
interface CardLeadProps {
  lead: EvolutionContact;
  onEdit: (id: string) => void;
  isLoading?: boolean;
}

export const CardLead = ({ lead, onEdit, isLoading = false }: CardLeadProps) => {
  // ...
};

// ❌ RUIM - Props inline
export const CardLead = ({ lead, onEdit }: { lead: any, onEdit: Function }) => {
  // ...
};
```

#### Hooks

```tsx
// ✅ BOM - Ordem consistente
const MeuComponente = () => {
  // 1. Context
  const { user } = useAuth();
  
  // 2. State
  const [count, setCount] = useState(0);
  
  // 3. Refs
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 4. React Query
  const { data } = useQuery(['key'], fetcher);
  
  // 5. Effects
  useEffect(() => {
    // ...
  }, []);
  
  // 6. Handlers
  const handleClick = () => {
    setCount(c => c + 1);
  };
  
  // 7. Render
  return <div>...</div>;
};
```

### CSS/Tailwind

#### Ordem de Classes

```tsx
// ✅ BOM - Agrupado logicamente
<div className="
  flex items-center justify-between
  px-4 py-2
  bg-white border border-gray-200 rounded-lg
  hover:bg-gray-50
  transition-colors
">
```

#### Evitar Estilos Inline

```tsx
// ❌ RUIM
<div style={{ color: 'red', fontSize: '16px' }}>

// ✅ BOM
<div className="text-red-500 text-base">
```

---

## 📁 Estrutura do Projeto

### Organização de Arquivos

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (Shadcn)
│   ├── AgenteSdr/      # Componentes específicos do SDR
│   └── ...
├── hooks/              # Custom hooks
│   ├── useAuth.ts
│   ├── useChatAgent.ts
│   └── ...
├── pages/              # Páginas (rotas)
│   ├── Dashboard.tsx
│   ├── AgenteSDR.tsx
│   └── ...
├── lib/                # Utilitários e configurações
│   ├── supabase.ts
│   ├── react-query.ts
│   └── ...
├── types/              # Definições de tipos
│   ├── database.ts
│   ├── evolution.ts
│   └── ...
├── contexts/           # React Contexts
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── ...
└── utils/              # Funções auxiliares
    ├── format.ts
    ├── validation.ts
    └── ...
```

### Onde Criar Novos Arquivos

| Tipo | Localização | Exemplo |
|------|-------------|---------|
| Componente reutilizável | `src/components/` | `Button.tsx` |
| Componente de página | `src/pages/` | `Relatorios.tsx` |
| Hook customizado | `src/hooks/` | `usePlanos.ts` |
| Tipo/Interface | `src/types/` | `crm.ts` |
| Função auxiliar | `src/utils/` | `formatPhone.ts` |
| Constante | `src/constants/` | `plans.ts` |
| Context | `src/contexts/` | `NotificationContext.tsx` |

---

## 🌿 Git Workflow

### Branch Naming

```bash
# Features
feature/nome-da-feature
feature/agente-sdr-multiplas-instancias

# Bugfixes
fix/nome-do-bug
fix/crm-drag-and-drop

# Documentação
docs/nome-do-doc
docs/atualizar-readme

# Hotfix (produção)
hotfix/descricao
hotfix/corrigir-autenticacao
```

### Commit Messages

```bash
# Estrutura
<tipo>(<escopo>): <mensagem curta>

[corpo opcional]

[footer opcional]

# Exemplo completo
feat(crm): adicionar filtro por data

Implementa filtro de intervalo de datas no CRM Pipeline.
Permite selecionar data inicial e final para filtrar leads.

Closes #123
```

#### Tipos de Commit

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `feat` | Novo recurso | `feat(sdr): adicionar pairing code` |
| `fix` | Correção de bug | `fix(auth): corrigir validação de telefone` |
| `docs` | Documentação | `docs(readme): atualizar instruções` |
| `style` | Formatação | `style: formatar com Prettier` |
| `refactor` | Refatoração | `refactor(hooks): simplificar useAuth` |
| `perf` | Performance | `perf(crm): otimizar query de leads` |
| `test` | Testes | `test(sdr): adicionar testes do webhook` |
| `chore` | Manutenção | `chore: atualizar dependências` |

---

## 🔄 Pull Request Process

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças.

## Tipo de Mudança
- [ ] 🐛 Bug fix
- [ ] ✨ Nova feature
- [ ] 🔨 Refatoração
- [ ] 📝 Documentação
- [ ] 🎨 UI/UX
- [ ] ⚡ Performance

## Como Testar
1. Passo 1
2. Passo 2
3. Resultado esperado

## Screenshots (se aplicável)
![imagem](url)

## Checklist
- [ ] Código segue os padrões do projeto
- [ ] Self-review feito
- [ ] Comentários adicionados em código complexo
- [ ] Documentação atualizada
- [ ] Testes adicionados/atualizados
- [ ] Lint passa sem erros
- [ ] Build passa sem erros
```

### Antes de Submeter

```bash
# 1. Atualizar com main
git checkout main
git pull upstream main
git checkout sua-branch
git rebase main

# 2. Rodar lint
npm run lint
npm run lint:css

# 3. Rodar build
npm run build

# 4. Testar localmente
npm run preview
```

---

## 👀 Code Review

### Para Reviewers

#### Checklist de Review

- [ ] **Funcionalidade:** Código faz o que deveria?
- [ ] **Testes:** Tem testes adequados?
- [ ] **Performance:** Algum gargalo óbvio?
- [ ] **Segurança:** Há vulnerabilidades?
- [ ] **Estilo:** Segue padrões do projeto?
- [ ] **Documentação:** Código complexo está comentado?
- [ ] **Breaking Changes:** Quebra alguma funcionalidade existente?

#### Como Dar Feedback

```markdown
# ✅ BOM - Construtivo e específico
Sugestão: Em vez de usar `any` aqui, podemos criar uma interface `ApiResponse`.
Isso melhora a type safety e facilita manutenção.

```typescript
interface ApiResponse {
  success: boolean;
  data: unknown;
}
```

# ❌ RUIM - Vago e negativo
Isso está errado.
```

### Para Contributors

#### Respondendo a Reviews

- ✅ Agradeça o feedback
- ✅ Pergunte se não entender
- ✅ Explique suas decisões se necessário
- ✅ Faça as mudanças solicitadas
- ❌ Não leve para o pessoal
- ❌ Não ignore comentários

```markdown
# Exemplo de resposta
> Sugestão: Mover essa lógica para um hook separado.

Boa ideia! Criei o `useLeadFilters` e refatorei. Commit abc123
```

---

## 🧪 Testes

### Estrutura de Testes

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts
└── utils/
    ├── format.ts
    └── format.test.ts
```

### Exemplo de Teste (Vitest)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renderiza com texto correto', () => {
    render(<Button>Clique Aqui</Button>);
    expect(screen.getByText('Clique Aqui')).toBeInTheDocument();
  });
  
  it('chama onClick quando clicado', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clique</Button>);
    
    screen.getByText('Clique').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Rodar Testes

```bash
# Todos os testes
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Testes específicos
npm test Button.test.tsx
```

---

## 📝 Documentação

### Comentários em Código

```typescript
// ✅ BOM - Explica o "porquê"
// Usamos telefone como email sintético pois Supabase Auth
// requer email, mas queremos autenticação via telefone.
const email = `${phone}@meuagente.api.br`;

// ❌ RUIM - Explica o óbvio
// Define email como telefone concatenado com domínio
const email = `${phone}@meuagente.api.br`;
```

### JSDoc para Funções Complexas

```typescript
/**
 * Sincroniza contatos do WhatsApp com o banco de dados.
 * 
 * @param instanceId - UUID da instância Evolution
 * @param options - Opções de sincronização
 * @param options.includeGroups - Se deve incluir grupos (padrão: false)
 * @param options.batchSize - Tamanho do lote para insert (padrão: 500)
 * @returns Promise com quantidade de contatos sincronizados
 * 
 * @example
 * ```typescript
 * const count = await syncContacts(instanceId, { includeGroups: false });
 * console.log(`${count} contatos sincronizados`);
 * ```
 */
export const syncContacts = async (
  instanceId: string,
  options: SyncOptions = {}
): Promise<number> => {
  // ...
};
```

### Documentação de Features

Ao adicionar feature complexa, crie documento em `docs/`:

```markdown
docs/
├── NOVA_FEATURE.md
└── ...
```

Estrutura sugerida:

```markdown
# Nome da Feature

## Visão Geral
Breve descrição.

## Como Funciona
Detalhamento técnico.

## Exemplos de Uso
Código exemplo.

## Troubleshooting
Problemas comuns.
```

---

## ❓ FAQ

**Q: Posso trabalhar em múltiplas features simultaneamente?**  
R: ✅ Sim, mas use branches separadas para cada uma.

**Q: Meu PR pode ter múltiplos commits?**  
R: ✅ Sim, mas mantenha commits atômicos e bem descritos.

**Q: Preciso escrever testes para tudo?**  
R: ⚠️ Idealmente sim, mas priorize:
- Lógica de negócio crítica
- Funções utilitárias
- Componentes reutilizáveis

**Q: Posso usar bibliotecas externas?**  
R: ⚠️ Consulte antes. Prefira bibliotecas:
- Bem mantidas (commits recentes)
- Popular (muitos downloads)
- Com TypeScript support
- Licença compatível (MIT, Apache)

**Q: Como reportar um bug?**  
R: Abra uma Issue no GitHub com template:
```markdown
**Descrição do bug**
O que aconteceu?

**Reproduzir**
1. Passo 1
2. Passo 2
3. Erro

**Esperado**
O que deveria acontecer?

**Screenshots**
Se aplicável.

**Ambiente**
- Navegador: Chrome 120
- OS: Windows 11
- Versão do app: 2.0.0
```

---

## 🙏 Agradecimentos

Obrigado por contribuir com o **Meu Agente**! Toda contribuição, por menor que seja, é valiosa.

---

## 📚 Recursos Adicionais

### Guias de Estilo

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [React Best Practices](https://react.dev/learn)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Ferramentas

- [Prettier](https://prettier.io/) - Formatação automática
- [ESLint](https://eslint.org/) - Linting
- [Vitest](https://vitest.dev/) - Testes

---

**Documento mantido por:** Equipe Meu Agente  
**Última revisão:** 15/12/2025  
**Próxima revisão prevista:** 15/01/2026
