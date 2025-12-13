---
inclusion: always
---

# Padrões de Código

## Estrutura de Arquivos

```
src/
├── components/       # Componentes reutilizáveis
│   ├── ui/          # Componentes shadcn/ui
│   └── layout/      # Layouts da aplicação
├── pages/           # Páginas/views completas
├── hooks/           # Custom hooks
├── contexts/        # Context providers globais
├── integrations/    # Integrações externas (Supabase, etc)
├── lib/             # Utilitários e helpers
└── types/           # Definições de tipos TypeScript
```

## Regras de Componentes

### 1. Sempre use componentes shadcn/ui
```typescript
// ✅ Correto
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// ❌ Incorreto - não criar componentes customizados para UI básica
const CustomButton = () => <button>...</button>
```

### 2. Componentes pequenos e focados
```typescript
// ✅ Correto - componente com responsabilidade única
const UserAvatar = ({ user }: { user: User }) => {
  return <Avatar>...</Avatar>
}

// ❌ Incorreto - componente fazendo muitas coisas
const UserProfile = () => {
  // Lógica de avatar, formulário, validação, etc...
}
```

### 3. Use TypeScript rigorosamente
```typescript
// ✅ Correto - tipos explícitos
interface UserCardProps {
  user: User
  onEdit: (id: string) => void
}

const UserCard = ({ user, onEdit }: UserCardProps) => {
  // Implementação
}

// ❌ Incorreto - any ou sem tipos
const UserCard = ({ user, onEdit }: any) => {
  // Implementação
}
```

## Estilização

### NUNCA escrever CSS customizado
```typescript
// ✅ Correto - usar Tailwind
<div className="bg-surface border border-border rounded-lg p-4">
  <h2 className="text-xl font-semibold text-text">Título</h2>
</div>

// ❌ Incorreto - CSS customizado
<div style={{ backgroundColor: '#fff', border: '1px solid #ccc' }}>
  <h2 style={{ fontSize: '20px' }}>Título</h2>
</div>
```

### Usar variáveis do design system
```typescript
// ✅ Correto - usar variáveis definidas
className="bg-surface text-text border-border"

// ❌ Incorreto - cores hardcoded
className="bg-white text-black border-gray-300"
```

## Gerenciamento de Estado

### 1. Estado do servidor com custom hooks
```typescript
// ✅ Correto - hook customizado para dados do Supabase
const useFinancialData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financial-data'],
    queryFn: async () => {
      const { data } = await supabase.from('accounts').select('*')
      return data
    }
  })
  return { data, isLoading, error }
}
```

### 2. Estado global com Context
```typescript
// ✅ Correto - usar contexts existentes
const { user } = useAuth()
const { theme } = useTheme()

// ❌ Incorreto - não adicionar Redux, Zustand, etc
```

### 3. Estado local com useState
```typescript
// ✅ Correto - estado local do componente
const [isOpen, setIsOpen] = useState(false)
```

## Formulários

### Sempre usar React Hook Form + Zod
```typescript
// ✅ Correto
const formSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres")
})

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema)
})

// ❌ Incorreto - validação manual
const [email, setEmail] = useState("")
const validateEmail = (email: string) => {
  // validação manual...
}
```

## Supabase

### Sempre usar o cliente configurado
```typescript
// ✅ Correto
import { supabase } from "@/integrations/supabase/client"

const { data } = await supabase.from('accounts').select('*')

// ❌ Incorreto - criar novo cliente
import { createClient } from '@supabase/supabase-js'
const client = createClient(url, key)
```

## Roteamento

### Usar React Router
```typescript
// ✅ Correto - navegação com Link
import { Link } from "react-router-dom"
<Link to="/dashboard">Dashboard</Link>

// ✅ Correto - navegação programática
const navigate = useNavigate()
navigate('/dashboard')

// ❌ Incorreto - window.location
window.location.href = '/dashboard'
```

## Ícones e Notificações

### Usar Lucide React para ícones
```typescript
// ✅ Correto
import { User, Settings, LogOut } from "lucide-react"
<User className="w-4 h-4" />

// ❌ Incorreto - outras bibliotecas de ícones
import { FaUser } from "react-icons/fa"
```

### Usar Sonner para notificações
```typescript
// ✅ Correto
import { toast } from "sonner"
toast.success("Operação realizada com sucesso!")
toast.error("Erro ao processar solicitação")

// ❌ Incorreto - alerts nativos
alert("Sucesso!")
```
