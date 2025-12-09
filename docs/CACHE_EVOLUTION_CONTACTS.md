# 📋 Sistema de Cache de Contatos da Evolution API

## ✅ **Problema Resolvido**

Sincronização de contatos do WhatsApp (via Evolution API) com **TTL de 1 hora** balanceando eficiência e freshness.

### Estratégia de Sincronização

| Aspecto | Valor | Vantagem |
|---------|-------|----------|
| **TTL padrão** | 60 minutos | Reduz carga API ✅ |
| **Auto-refresh** | Ao expirar | Dados sempre frescos ✅ |
| **Refresh manual** | Botão disponível | Controle do usuário ✅ |
| **Refresh no login** | Automático | Dados atualizados ✅ |

---

## 🏗️ **Arquitetura Implementada**

### Opção 3 + Estratégia On-Demand

```
┌─────────────────────────────────────────┐
│  Usuário acessa página de contatos     │
└──────────────┬──────────────────────────┘
               ↓
     ┌─────────────────────┐
     │ 1. Busca no cache   │ ← Supabase (evolution_contacts_cache)
     │    TTL: 60 minutos  │
     └────────┬────────────┘
              │
      Cache válido? ──YES──> Retorna dados (rápido ⚡)
              │
             NO (expirou ou primeiro acesso)
              ↓
     ┌─────────────────────┐
     │ 2. Busca Evolution  │ ← POST /chat/findContacts
     │    API              │
     └────────┬────────────┘
              ↓
     ┌─────────────────────┐
     │ 3. Salva cache +    │
     │    retorna dados    │
     └─────────────────────┘
```

---

## 📊 **TTL Recomendado por Caso de Uso**

| TTL | Uso | API calls/h | Ideal para |
|-----|-----|-------------|------------|
| 2 min | Alta sync | 30 | Vendas ultra-ágeis |
| 5 min | Média sync | 12 | Atendimento rápido |
| 15 min | Baixa sync | 4 | Suporte geral |
| **60 min** ⚡ | Padrão | 1 | **CRM geral** ✅ |

> **Nota:** TTL de 1 hora balanceia eficiência da API com freshness dos dados. Auto-refresh ao expirar garante dados atualizados, e botão manual permite refresh imediato quando necessário.

---

## 🚀 **Como Usar**

### 1. Rodar Migration

```bash
# Aplicar migration no Supabase
supabase db push
```

Ou manualmente no Supabase Dashboard → SQL Editor:
```sql
-- Copiar e colar o conteúdo de:
supabase/migrations/20251209000003_create_evolution_contacts_cache.sql
```

### 2. Usar o Componente

```tsx
import { EvolutionContactsList } from '@/components/sdr/EvolutionContactsList';

function MinhaPagina() {
  return (
    <EvolutionContactsList
      instanceId="uuid-da-instancia"
      evolutionApiUrl="https://evolution-api.com"
      evolutionApiKey="sua-api-key"
      cacheTtlMinutes={60} // 1 hora (padrão) - balance entre freshness e API load
      onContactClick={(contact) => {
        console.log('Contato clicado:', contact);
      }}
    />
  );
}
```

### 3. Usar o Hook (Avançado)

```tsx
import { useEvolutionContacts } from '@/hooks/useEvolutionContacts';

function ComponenteCustomizado() {
  const {
    contacts,
    loading,
    refreshing,
    cacheValid,
    refresh,
    invalidateCache,
    updateContact,
  } = useEvolutionContacts({
    instanceId: 'uuid',
    evolutionApiUrl: 'https://...',
    evolutionApiKey: 'key',
    cacheTtlMinutes: 60, // 1 hora (padrão)
  });

  return (
    <div>
      <button onClick={() => refresh(true)}>
        Atualizar agora
      </button>
      
      {contacts.map(contact => (
        <div key={contact.id}>
          {contact.push_name}
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 **Recursos Implementados**

### ✅ Cache Inteligente
- TTL configurável (padrão: 60 minutos / 1 hora)
- Verificação automática de expiração
- Auto-refresh ao expirar
- Refresh automático no login
- Invalidação manual

### ✅ Auto-Refresh
- Contador em tempo real (segundos desde última sync)
- Auto-refresh quando cache expira
- Loading states separados (inicial vs refresh)

### ✅ Filtros
- Busca por nome ou número
- Filtrar favoritos
- Mostrar/ocultar grupos

### ✅ Campos CRM Extras
- `crm_notes`: Anotações
- `crm_tags`: Tags customizadas
- `crm_favorite`: Marcar como favorito
- `crm_lead_status`: Status do lead (novo, contatado, negociando, ganho, perdido)
- `crm_lead_score`: Pontuação do lead (0-100)
- `crm_last_interaction_at`: Última interação

### ✅ UI/UX
- Badge de status do cache
- Botão "Atualizar" manual
- Animação de loading
- Avatar com foto de perfil
- Indicadores visuais (grupos, favoritos, lead status)

---

## 🔄 **Estratégias para Reduzir AINDA MAIS o Delay**

### 1. Invalidar Cache ao Enviar Mensagem

```tsx
const handleSendMessage = async (contactJid: string) => {
  // Envia mensagem
  await evolutionAPI.sendMessage(contactJid, 'Olá!');
  
  // Invalida cache para forçar refresh
  await invalidateCache();
};
```

**Resultado**: Cache atualizado imediatamente após enviar mensagem.

---

### 2. TTL Dinâmico por Hora do Dia

```tsx
// Horário comercial = 30min (mais frequente)
// Fora do horário = 2 horas (economiza API)
const getTTL = () => {
  const hour = new Date().getHours();
  const isBusinessHours = hour >= 9 && hour <= 18;
  return isBusinessHours ? 30 : 120;
};

<EvolutionContactsList cacheTtlMinutes={getTTL()} />
```

**Resultado**: Economiza API calls fora do horário comercial mantendo freshness durante trabalho.

---

### 3. Webhook Real-Time (OPCIONAL)

Configure webhook na Evolution para atualização instantânea:

```typescript
// supabase/functions/evolution-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { event, data } = await req.json()
  
  if (event === 'contacts.upsert') {
    await supabase.from('evolution_contacts_cache').upsert({
      remote_jid: data.remoteJid,
      push_name: data.pushName,
      profile_pic_url: data.profilePicUrl,
      instance_id: data.instanceId,
      last_synced_at: new Date().toISOString(),
      sync_source: 'webhook' // ← Indica origem webhook
    }, {
      onConflict: 'instance_id,remote_jid'
    })
  }
  
  return new Response('OK')
})
```

**Resultado**: ~1-2 segundos de delay (quase real-time).

---

### 4. Prefetch ao Abrir Modal

```tsx
const [modalOpen, setModalOpen] = useState(false);

useEffect(() => {
  if (modalOpen) {
    refresh(false); // Começa a buscar antes de mostrar
  }
}, [modalOpen]);
```

**Resultado**: Dados já carregados quando modal abre.

---

## 📈 **Impacto no Desempenho**

### Cenário 1: Vendedor Ativo (10 acessos/hora)

| Métrica | Valor |
|---------|-======|
| Acessos/hora | 10 |
| Cache hits | 9-10 (90-100%) |
| API calls | 1 |
| Delay máximo | 60 minutos |

### Cenário 2: Vendedor Muito Ativo (30 acessos/hora)

| Métrica | Valor |
|---------|-======|
| Acessos/hora | 30 |
| Cache hits | 29-30 (97-100%) |
| API calls | 1 |
| Delay máximo | 60 minutos |

### Cenário 3: Usuário Retorna Após 24h

| Métrica | Valor |
|---------|-======|
| Cache status | Expirado |
| Comportamento | Auto-refresh automático ✅ |
| API call | 1 (ao montar componente) |
| Delay | ~2s (carregamento API) |

### Cenário 4: Com Webhook (Real-time)

| Métrica | Valor |
|---------|-======|
| Delay | 1-2 segundos ⚡ |
| API calls | 0 (webhooks) |
| Cache hits | 100% |

---

## 🔧 **Manutenção**

### Limpar Cache Expirado (Cron)

```sql
-- Executar diariamente via pg_cron
SELECT cron.schedule(
  'cleanup-contacts-cache',
  '0 3 * * *', -- Todo dia às 3h da manhã
  $$
    SELECT cleanup_expired_contacts_cache();
  $$
);
```

### Forçar Refresh de uma Instância

```sql
-- Via SQL
SELECT invalidate_contacts_cache('uuid-da-instancia');
```

```typescript
// Via código
await supabase.rpc('invalidate_contacts_cache', {
  p_instance_id: 'uuid-da-instancia'
});
```

---

## 📊 **Monitoramento**

### View com Estatísticas

```sql
-- Ver contatos com cache expirado
SELECT 
  instance_id,
  COUNT(*) as total_contacts,
  COUNT(*) FILTER (WHERE is_contact_cache_valid(last_synced_at, cache_ttl_minutes)) as valid_cache,
  AVG(EXTRACT(EPOCH FROM (NOW() - last_synced_at))) as avg_seconds_since_sync
FROM evolution_contacts_cache
GROUP BY instance_id;
```

---

## 🎬 **Próximos Passos**

1. ✅ **Migration aplicada** → Rodar `supabase db push`
2. ✅ **Componente criado** → Usar `<EvolutionContactsList />`
3. ✅ **TTL configurado** → 60 minutos (1 hora) como padrão
4. 🔜 **Testar em produção** → Validar comportamento de refresh
5. 🔜 **Configurar webhook** (opcional) → Para real-time
6. 🔜 **Ajustar TTL** se necessário → Baseado no uso real

---

## 💡 **Dicas**

### Ajustar TTL Baseado em Métricas

```typescript
// Monitorar cache hit rate
const cacheHitRate = cacheHits / totalRequests;

if (cacheHitRate < 0.7) {
  // Cache expirando muito rápido, aumentar TTL
  cacheTtlMinutes = 5;
} else if (cacheHitRate > 0.9) {
  // Cache muito eficiente, pode reduzir TTL
  cacheTtlMinutes = 1;
}
```

### Priorizar Contatos Importantes

```sql
-- Cache com TTL menor para contatos VIP
UPDATE evolution_contacts_cache
SET cache_ttl_minutes = 1 -- 1 minuto para VIPs
WHERE crm_favorite = TRUE OR crm_lead_score > 80;
```

---

## 🆘 **Troubleshooting**

### Problema: Cache nunca expira

**Solução**: Verificar se `last_synced_at` está sendo atualizado:
```sql
SELECT * FROM evolution_contacts_cache ORDER BY last_synced_at DESC LIMIT 5;
```

### Problema: Muitas chamadas à API

**Solução**: Aumentar TTL ou implementar webhook.

### Problema: Dados desatualizados

**Solução**: Reduzir TTL ou usar botão "Atualizar" manual.

### Problema: Erro 42501 (RLS) ao salvar no cache

**Causa**: Políticas RLS estavam usando JWT `user_metadata.phone` que pode ser modificado pelo usuário (inseguro).

**Solução CORRIGIDA**: Policies agora buscam `phone` diretamente de `auth.users` via `auth.uid()`, evitando vulnerabilidades. 
- Migration inicial com falha de segurança: `20251209001000_fix_evolution_contacts_cache_rls.sql` (DESCONTINUADA)
- Migration correta e segura: `20251209002000_fix_evolution_security_issues.sql` ✅

**Problemas de segurança corrigidos**:
1. ❌ RLS usando `user_metadata` (usuário pode modificar)
2. ✅ RLS usando `auth.users.phone` via subquery (seguro)
3. ✅ Funções com `search_path` definido (previne ataques)
4. ✅ View sem `SECURITY DEFINER` (previne escalação de privilégios)

---

## 📚 **Arquivos Criados**

1. **Migration**: `supabase/migrations/20251209000003_create_evolution_contacts_cache.sql`
2. **Hook**: `src/hooks/useEvolutionContacts.ts`
3. **Componente**: `src/components/sdr/EvolutionContactsList.tsx`
4. **Tipos**: `src/types/sdr.ts` (atualizado)
5. **Exemplo**: `docs/EXEMPLO_USO_EVOLUTION_CONTACTS.tsx`
6. **Documentação**: `docs/CACHE_EVOLUTION_CONTACTS.md` (este arquivo)
7. **Correção Erro 404**: `docs/CORRECAO_EVOLUTION_API_404.md` (detalhes técnicos)

---

## 🎉 **Resultado Final**

✅ **TTL de 60 minutos** (1 hora) balanceando eficiência e freshness  
✅ **Auto-refresh** quando cache expira (resolve cenário de 24h)  
✅ **Refresh no login** garante dados frescos ao entrar no app  
✅ **Botão manual** de atualização sempre disponível  
✅ **Campos CRM** extras (tags, status, score, favorite)  
✅ **Performance** otimizada com cache inteligente  
✅ **Escalável** para webhooks real-time

### Como Funciona o Cenário de Ausência Prolongada?

**Exemplo:** Usuário sai às 18h e retorna às 10h do dia seguinte (16 horas depois)

1. **Login/Acesso**: Component monta com `refreshOnMount={true}`
2. **Verificação**: Hook detecta cache expirado (16h > 1h)
3. **Ação**: Busca automática da Evolution API
4. **Resultado**: Dados atualizados sem intervenção do usuário ✅

**Delay máximo: 60 minutos** (balance ideal entre API load e data freshness) 🚀
