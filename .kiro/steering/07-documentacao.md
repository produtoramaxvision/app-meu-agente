---
inclusion: always
---

# Documentação e Comentários

## Princípios de Documentação

### Documentar o "porquê", não o "o quê"
```typescript
// ✅ Correto - explica o motivo
// Usamos debounce aqui para evitar múltiplas chamadas à API
// enquanto o usuário ainda está digitando
const debouncedSearch = useDebouncedValue(search, 500)

// ❌ Incorreto - apenas descreve o código
// Cria uma variável debouncedSearch
const debouncedSearch = useDebouncedValue(search, 500)
```

### Comentários em português brasileiro
```typescript
// ✅ Correto
// Valida se o valor está dentro do limite permitido
function validateAmount(amount: number): boolean {
  return amount > 0 && amount <= 9999999999.99
}

// ❌ Incorreto
// Validates if the value is within the allowed limit
function validateAmount(amount: number): boolean {
  return amount > 0 && amount <= 9999999999.99
}
```

## JSDoc para Funções Complexas

### Documentar funções públicas e utilitárias
```typescript
/**
 * Formata um valor numérico para o formato de moeda brasileira
 * 
 * @param value - Valor numérico a ser formatado
 * @param showSymbol - Se deve exibir o símbolo R$ (padrão: true)
 * @returns String formatada no padrão brasileiro (ex: "R$ 1.234,56")
 * 
 * @example
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency(1234.56, false) // "1.234,56"
 */
export function formatCurrency(value: number, showSymbol = true): string {
  // Implementação
}
```

### Documentar tipos complexos
```typescript
/**
 * Representa uma conta financeira no sistema
 */
interface Account {
  /** ID único da conta */
  id: string
  /** Descrição da transação */
  description: string
  /** Valor em reais */
  amount: number
  /** Categoria da transação */
  category: AccountCategory
  /** Data da transação */
  date: Date
  /** ID do usuário proprietário */
  user_id: string
}
```

## README e Documentação de Projeto

### Estrutura de README
```markdown
# Nome do Projeto

## Descrição
Breve descrição do que o projeto faz

## Instalação
```bash
npm install
```

## Configuração
Passos necessários para configurar o ambiente

## Uso
Exemplos de como usar o projeto

## Tecnologias
Lista das principais tecnologias utilizadas

## Contribuição
Como contribuir com o projeto
```

## Documentação de APIs

### Documentar endpoints e integrações
```typescript
/**
 * API do Chat com IA
 * 
 * Endpoint: POST /webhook/chat-ia
 * 
 * Body:
 * {
 *   message: string,
 *   sessionId: string,
 *   userId: string
 * }
 * 
 * Response:
 * {
 *   reply: string,
 *   timestamp: string
 * }
 */
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  // Implementação
}
```

## Comentários TODO e FIXME

### Usar tags padronizadas
```typescript
// TODO: Implementar paginação para melhorar performance
// FIXME: Corrigir bug de duplicação ao salvar rapidamente
// HACK: Solução temporária até refatorar o componente
// NOTE: Este código depende da versão 2.0 da API
```

## Documentação de Componentes

### Documentar props e comportamento
```typescript
interface ButtonProps {
  /** Texto exibido no botão */
  label: string
  /** Função chamada ao clicar */
  onClick: () => void
  /** Variante visual do botão */
  variant?: 'primary' | 'secondary' | 'danger'
  /** Se o botão está desabilitado */
  disabled?: boolean
}

/**
 * Botão customizado com variantes visuais
 * 
 * @example
 * <Button 
 *   label="Salvar" 
 *   onClick={handleSave}
 *   variant="primary"
 * />
 */
export function Button({ label, onClick, variant = 'primary', disabled }: ButtonProps) {
  // Implementação
}
```

## Changelog

### Manter histórico de mudanças
```markdown
# Changelog

## [2.0.0] - 2025-01-16

### Adicionado
- Sistema de Chat com IA
- Agente SDR com WhatsApp
- Dashboard com gráficos interativos

### Modificado
- Melhorias de performance no carregamento
- Atualização do design system

### Corrigido
- Bug de duplicação de transações
- Problema de overflow numérico
```

## Documentação de Migrações

### Documentar mudanças no banco de dados
```sql
-- Migration: add_trial_period
-- Data: 2025-01-16
-- Descrição: Adiciona suporte a período de trial de 7 dias

-- Adiciona coluna trial_ends_at na tabela users
ALTER TABLE users 
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Atualiza usuários existentes com trial de 7 dias
UPDATE users 
SET trial_ends_at = NOW() + INTERVAL '7 days'
WHERE created_at > NOW() - INTERVAL '1 day';
```

## Documentação de Configuração

### Documentar variáveis de ambiente
```typescript
/**
 * Configurações do ambiente
 * 
 * Variáveis obrigatórias:
 * - VITE_SUPABASE_URL: URL do projeto Supabase
 * - VITE_SUPABASE_ANON_KEY: Chave pública do Supabase
 * 
 * Variáveis opcionais:
 * - VITE_N8N_WEBHOOK_URL: URL do webhook n8n para Chat IA
 * - VITE_EVOLUTION_API_URL: URL da Evolution API para WhatsApp
 */
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  n8n: {
    webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL,
  },
}
```

## Documentação de Hooks

### Documentar hooks customizados
```typescript
/**
 * Hook para gerenciar dados financeiros do usuário
 * 
 * Busca e mantém em cache as contas, metas e transações
 * do usuário autenticado.
 * 
 * @returns {Object} Objeto contendo:
 *   - accounts: Lista de contas
 *   - goals: Lista de metas
 *   - isLoading: Estado de carregamento
 *   - error: Erro caso ocorra
 *   - refetch: Função para recarregar dados
 * 
 * @example
 * const { accounts, isLoading } = useFinancialData()
 * 
 * if (isLoading) return <Loading />
 * return <AccountList accounts={accounts} />
 */
export function useFinancialData() {
  // Implementação
}
```

## Documentação de Testes

### Documentar casos de teste
```typescript
describe('AccountForm', () => {
  /**
   * Testa se o formulário valida corretamente valores negativos
   * 
   * Cenário:
   * 1. Usuário preenche valor negativo
   * 2. Tenta submeter formulário
   * 3. Deve exibir mensagem de erro
   */
  it('deve rejeitar valores negativos', async () => {
    // Teste
  })
})
```

## Evitar Comentários Óbvios

```typescript
// ❌ Incorreto - comentário óbvio
// Incrementa o contador
setCount(count + 1)

// ✅ Correto - sem comentário (código é autoexplicativo)
setCount(count + 1)

// ✅ Correto - comentário útil quando necessário
// Incrementa apenas se não atingiu o limite diário
if (count < DAILY_LIMIT) {
  setCount(count + 1)
}
```
