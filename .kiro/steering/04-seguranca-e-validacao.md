---
inclusion: always
---

# Segurança e Validação

## Row Level Security (RLS)

### Sempre considerar RLS nas queries
```sql
-- ✅ Correto - RLS garante isolamento por usuário
CREATE POLICY "Users can only see their own data"
ON accounts FOR SELECT
USING (auth.uid() = user_id);

-- Todas as tabelas DEVEM ter políticas RLS ativas
```

### Verificar permissões no frontend
```typescript
// ✅ Correto - verificar permissões antes de ações sensíveis
const { user } = useAuth()
if (!user) {
  toast.error("Você precisa estar autenticado")
  return
}

// Verificar plano do usuário para funcionalidades premium
if (user.plan === 'free' && feature.isPremium) {
  toast.error("Esta funcionalidade requer plano Premium")
  return
}
```

## Validação de Dados

### Sempre validar com Zod
```typescript
// ✅ Correto - schema Zod completo
const accountSchema = z.object({
  description: z.string().min(3, "Mínimo 3 caracteres"),
  amount: z.number()
    .min(0.01, "Valor deve ser maior que zero")
    .max(9999999999.99, "Valor máximo excedido"),
  category: z.enum(['food', 'transport', 'health', 'education']),
  date: z.date()
})

// ❌ Incorreto - validação manual ou incompleta
if (amount > 0) {
  // salvar...
}
```

### Validar duplicatas
```typescript
// ✅ Correto - verificar duplicatas antes de inserir
const checkDuplicate = async (account: Account) => {
  const { data } = await supabase
    .from('accounts')
    .select('*')
    .eq('description', account.description)
    .eq('amount', account.amount)
    .eq('date', account.date)
    .single()
  
  if (data) {
    toast.error("Transação duplicada detectada")
    return true
  }
  return false
}
```

## Proteção de Dados Sensíveis

### NUNCA expor credenciais
```typescript
// ✅ Correto - usar variáveis de ambiente
const apiKey = import.meta.env.VITE_API_KEY

// ❌ Incorreto - hardcoded
const apiKey = "sk_live_123456789"
```

### Sanitizar inputs do usuário
```typescript
// ✅ Correto - sanitizar antes de usar
const sanitizedInput = input.trim().toLowerCase()

// Usar bibliotecas de sanitização para HTML
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userInput)
```

## Autenticação

### Sempre verificar sessão
```typescript
// ✅ Correto - verificar autenticação em rotas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" />
  
  return <>{children}</>
}
```

### Logout seguro
```typescript
// ✅ Correto - limpar sessão completamente
const handleLogout = async () => {
  await supabase.auth.signOut()
  // Limpar cache local
  queryClient.clear()
  navigate('/login')
}
```

## Limites e Rate Limiting

### Implementar limites por plano
```typescript
// ✅ Correto - verificar limites antes de criar recursos
const canCreateTicket = async (userId: string) => {
  const { data: tickets } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
  
  const { data: user } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single()
  
  const limits = {
    free: 2,
    basic: 5,
    business: 10,
    premium: Infinity
  }
  
  if (tickets.length >= limits[user.plan]) {
    toast.error("Limite de tickets atingido para seu plano")
    return false
  }
  
  return true
}
```

## Tratamento de Erros

### Sempre tratar erros adequadamente
```typescript
// ✅ Correto - tratamento completo de erros
try {
  const { data, error } = await supabase
    .from('accounts')
    .insert(newAccount)
  
  if (error) throw error
  
  toast.success("Conta criada com sucesso!")
  return data
} catch (error) {
  console.error("Erro ao criar conta:", error)
  toast.error("Erro ao criar conta. Tente novamente.")
  return null
}

// ❌ Incorreto - ignorar erros
const { data } = await supabase.from('accounts').insert(newAccount)
// sem verificar error
```

## HTTPS e Comunicação Segura

### Sempre usar HTTPS em produção
```typescript
// ✅ Correto - verificar protocolo em produção
if (import.meta.env.PROD && window.location.protocol !== 'https:') {
  window.location.href = window.location.href.replace('http:', 'https:')
}
```

### Validar URLs externas
```typescript
// ✅ Correto - validar URLs antes de usar
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}
```
