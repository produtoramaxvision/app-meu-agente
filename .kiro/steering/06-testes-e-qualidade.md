---
inclusion: always
---

# Testes e Qualidade de Código

## Princípios de Teste

### Pirâmide de Testes
1. **Testes Unitários** (70%): Funções, hooks, utilitários
2. **Testes de Integração** (20%): Componentes com contexto
3. **Testes E2E** (10%): Fluxos críticos do usuário

## Testes Unitários

### Testar funções utilitárias
```typescript
// ✅ Correto - testar lógica de negócio
describe('formatCurrency', () => {
  it('deve formatar valor em reais', () => {
    expect(formatCurrency(1234.56)).toBe('R$ 1.234,56')
  })
  
  it('deve lidar com valores negativos', () => {
    expect(formatCurrency(-100)).toBe('-R$ 100,00')
  })
})
```

### Testar hooks customizados
```typescript
// ✅ Correto - testar hooks com renderHook
import { renderHook } from '@testing-library/react'

describe('useFinancialData', () => {
  it('deve carregar dados financeiros', async () => {
    const { result } = renderHook(() => useFinancialData())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.data).toBeDefined()
  })
})
```

## Testes de Componentes

### Testar renderização e interação
```typescript
// ✅ Correto - testar comportamento do componente
import { render, screen, fireEvent } from '@testing-library/react'

describe('AccountForm', () => {
  it('deve exibir erro para valor inválido', async () => {
    render(<AccountForm />)
    
    const input = screen.getByLabelText('Valor')
    fireEvent.change(input, { target: { value: '-100' } })
    
    const submitButton = screen.getByRole('button', { name: 'Salvar' })
    fireEvent.click(submitButton)
    
    expect(await screen.findByText('Valor deve ser maior que zero')).toBeInTheDocument()
  })
})
```

## Validação Manual

### Checklist de Validação
Antes de considerar uma funcionalidade completa, validar:

- [ ] Funcionalidade básica funciona
- [ ] Validações de formulário funcionam
- [ ] Mensagens de erro são claras
- [ ] Loading states são exibidos
- [ ] Responsividade mobile funciona
- [ ] Acessibilidade (navegação por teclado)
- [ ] Performance (sem lags)
- [ ] RLS está funcionando corretamente

### Testar Cenários de Erro
```typescript
// ✅ Correto - testar casos de erro
describe('createAccount', () => {
  it('deve lidar com erro de rede', async () => {
    // Simular erro de rede
    vi.spyOn(supabase, 'from').mockRejectedValue(new Error('Network error'))
    
    const result = await createAccount(mockAccount)
    
    expect(result).toBeNull()
    expect(toast.error).toHaveBeenCalledWith('Erro ao criar conta')
  })
})
```

## Qualidade de Código

### ESLint e TypeScript
```typescript
// ✅ Correto - seguir regras do ESLint
// Sem any, sem variáveis não usadas, sem console.log em produção

// ❌ Incorreto
const data: any = fetchData() // usar tipo específico
const unusedVar = 123 // remover variáveis não usadas
console.log('debug') // usar apenas em desenvolvimento
```

### Code Review Checklist
Antes de fazer commit, verificar:

- [ ] Código segue padrões do projeto
- [ ] Tipos TypeScript estão corretos
- [ ] Não há console.logs desnecessários
- [ ] Comentários estão em português
- [ ] Imports estão organizados
- [ ] Não há código comentado
- [ ] Variáveis têm nomes descritivos

## Testes de Segurança

### Testar RLS
```sql
-- ✅ Correto - testar políticas RLS
BEGIN;
  SELECT plan(3);
  
  -- Testar que usuário só vê seus dados
  SELECT results_eq(
    'SELECT id FROM accounts WHERE user_id = auth.uid()',
    ARRAY[1, 2, 3],
    'User should only see their own accounts'
  );
  
  -- Testar que não pode ver dados de outros
  SELECT is_empty(
    'SELECT id FROM accounts WHERE user_id != auth.uid()',
    'User should not see other users accounts'
  );
  
  SELECT * FROM finish();
ROLLBACK;
```

## Documentação de Testes

### Documentar casos de teste importantes
```typescript
/**
 * Testa o fluxo completo de criação de conta:
 * 1. Preenche formulário
 * 2. Valida duplicatas
 * 3. Verifica overflow numérico
 * 4. Salva no banco
 * 5. Exibe notificação de sucesso
 */
describe('Fluxo completo de criação de conta', () => {
  // testes...
})
```

## Cobertura de Testes

### Metas de Cobertura
- **Funções críticas**: 100% (validações, cálculos financeiros)
- **Componentes UI**: 80%
- **Hooks customizados**: 90%
- **Utilitários**: 100%

### Gerar relatório de cobertura
```bash
# Executar testes com cobertura
npm run test:coverage

# Visualizar relatório
open coverage/index.html
```
