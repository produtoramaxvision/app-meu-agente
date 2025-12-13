---
inclusion: always
---

# Performance e Otimização

## Core Web Vitals - Metas

Sempre manter estas métricas:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTI (Time to Interactive)**: < 3.8s

## Otimização de Componentes

### Usar React.memo para componentes pesados
```typescript
// ✅ Correto - memoizar componentes que renderizam frequentemente
const ExpensiveChart = React.memo(({ data }: { data: ChartData[] }) => {
  return <Recharts data={data} />
})

// Usar useMemo para cálculos pesados
const totalAmount = useMemo(() => {
  return accounts.reduce((sum, acc) => sum + acc.amount, 0)
}, [accounts])
```

### Lazy loading de rotas
```typescript
// ✅ Correto - carregar rotas sob demanda
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Reports = lazy(() => import('@/pages/Reports'))

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/reports" element={<Reports />} />
  </Routes>
</Suspense>
```

## Otimização de Queries

### Usar select específico
```typescript
// ✅ Correto - selecionar apenas campos necessários
const { data } = await supabase
  .from('accounts')
  .select('id, description, amount, date')
  .eq('user_id', userId)

// ❌ Incorreto - select *
const { data } = await supabase
  .from('accounts')
  .select('*')
```

### Implementar paginação
```typescript
// ✅ Correto - paginar resultados grandes
const PAGE_SIZE = 20

const { data } = await supabase
  .from('accounts')
  .select('*')
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  .order('date', { ascending: false })
```

### Cache com React Query
```typescript
// ✅ Correto - configurar cache adequadamente
const { data } = useQuery({
  queryKey: ['accounts', userId],
  queryFn: fetchAccounts,
  staleTime: 5 * 60 * 1000, // 5 minutos
  cacheTime: 10 * 60 * 1000, // 10 minutos
})
```

## Otimização de Imagens

### Usar formatos modernos
```typescript
// ✅ Correto - usar WebP com fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Descrição" loading="lazy" />
</picture>
```

### Lazy loading de imagens
```typescript
// ✅ Correto - carregar imagens sob demanda
<img src="image.jpg" loading="lazy" alt="Descrição" />
```

## Bundle Size

### Importar apenas o necessário
```typescript
// ✅ Correto - importação específica
import { format } from 'date-fns'

// ❌ Incorreto - importar tudo
import * as dateFns from 'date-fns'
```

### Code splitting
```typescript
// ✅ Correto - dividir código por rota
const AdminPanel = lazy(() => import('@/pages/AdminPanel'))

// Carregar apenas quando necessário
if (user.role === 'admin') {
  return <AdminPanel />
}
```

## Debounce e Throttle

### Usar debounce em buscas
```typescript
// ✅ Correto - debounce em input de busca
import { useDebouncedValue } from '@/hooks/useDebounce'

const [search, setSearch] = useState('')
const debouncedSearch = useDebouncedValue(search, 500)

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch)
  }
}, [debouncedSearch])
```

### Throttle em scroll events
```typescript
// ✅ Correto - throttle em eventos de scroll
import { useThrottle } from '@/hooks/useThrottle'

const handleScroll = useThrottle(() => {
  // lógica de scroll
}, 200)
```

## Otimização de Renderização

### Evitar re-renders desnecessários
```typescript
// ✅ Correto - useCallback para funções passadas como props
const handleClick = useCallback(() => {
  // lógica
}, [dependencies])

// ✅ Correto - extrair componentes estáticos
const StaticHeader = () => <header>...</header>

const Page = () => {
  const [count, setCount] = useState(0)
  return (
    <>
      <StaticHeader /> {/* Não re-renderiza */}
      <div>{count}</div>
    </>
  )
}
```

## Monitoramento

### Implementar métricas de performance
```typescript
// ✅ Correto - medir performance de operações críticas
const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now()
  fn()
  const end = performance.now()
  console.log(`${name} levou ${end - start}ms`)
}

measurePerformance('Carregar dashboard', loadDashboard)
```

## Otimização de Animações

### Usar CSS transforms
```typescript
// ✅ Correto - usar transform para animações
className="transition-transform hover:scale-105"

// ❌ Incorreto - animar propriedades pesadas
className="transition-all hover:w-full"
```

### Preferir will-change
```typescript
// ✅ Correto - otimizar animações complexas
<div className="will-change-transform">
  {/* conteúdo animado */}
</div>
```
