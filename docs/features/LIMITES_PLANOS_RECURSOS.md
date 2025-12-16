# 📊 Limites de Planos e Recursos

> **Última Atualização:** 15 de Dezembro de 2025  
> **Versão do App:** 2.0.0  
> **Autor:** Equipe Meu Agente

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Matriz Comparativa Completa](#matriz-comparativa-completa)
3. [Detalhamento por Plano](#detalhamento-por-plano)
4. [Validações Implementadas](#validações-implementadas)
5. [Componentes de Bloqueio](#componentes-de-bloqueio)
6. [Exemplos de Uso](#exemplos-de-uso)
7. [FAQ](#faq)

---

## 🎯 Visão Geral

O **Meu Agente** oferece 4 planos distintos com recursos progressivos. Este documento detalha TODOS os limites, restrições e validações implementadas no sistema.

### Planos Disponíveis

| Plano | Preço | Público-Alvo |
|-------|-------|--------------|
| **Free** | Gratuito | Usuários experimentando o app |
| **Basic** | R$ 97,90/mês | Pequenos negócios iniciantes |
| **Business** | R$ 497,00/mês | Empresas em crescimento |
| **Premium** | R$ 1.497,00/mês | Empresas estabelecidas |

### Conceito de Período de Arrependimento

⚠️ **IMPORTANTE:** Planos pagos NÃO usam trial gratuito do Stripe.

**Como funciona:**
- ✅ Cobrança é realizada **imediatamente** no checkout
- ✅ Cliente tem **7 dias** para cancelar e receber reembolso total
- ✅ Conforme Código de Defesa do Consumidor (CDC) Art. 49
- ✅ Campo `refund_period_ends_at` controla prazo

**Exemplo:**
```
Assinatura: 10/12/2025 10:00
Cobrança: R$ 497,00 (imediata)
Período arrependimento: até 17/12/2025 10:00
Banner no app: "Você tem 7 dias para cancelar..."
```

---

## 📊 Matriz Comparativa Completa

### Recursos Principais

| Recurso | Free | Basic | Business | Premium |
|---------|------|-------|----------|---------|
| **Acesso ao App** | ✅ | ✅ | ✅ | ✅ |
| **Dashboard Financeiro** | ✅ | ✅ | ✅ | ✅ |
| **Registros Financeiros** | Ilimitado | Ilimitado | Ilimitado | Ilimitado |
| **Contas a Pagar/Receber** | ✅ | ✅ | ✅ | ✅ |
| **Metas Financeiras** | ✅ | ✅ | ✅ | ✅ |
| **Agenda Completa** | ✅ | ✅ | ✅ | ✅ |
| **Tarefas** | ✅ | ✅ | ✅ | ✅ |
| **Chat IA** | ✅ | ✅ | ✅ | ✅ |
| **Notificações** | ✅ | ✅ | ✅ | ✅ |
| **Alertas Financeiros** | ✅ | ✅ | ✅ | ✅ |

### Recursos Avançados (Diferenciadores)

| Recurso | Free | Basic | Business | Premium |
|---------|------|-------|----------|---------|
| **Agente SDR (WhatsApp)** | ❌ | ❌ | ✅ | ✅ |
| **Instâncias WhatsApp** | 0 | 0 | **2** | **5** |
| **CRM Pipeline** | ❌ | ❌ | ✅ | ✅ |
| **Importação Contatos** | ❌ | ❌ | ✅ | ✅ |
| **Exportação de Dados** | ❌ | ❌ | ✅ CSV | ✅ CSV/Excel/PDF |
| **Relatórios Avançados** | ❌ | ❌ | ✅ Básicos | ✅ Completos |
| **Integrações** | ❌ | ❌ | Google Workspace | Google + Mais |
| **IA com Web Search** | ❌ | ❌ | ❌ | ✅ |
| **Data Scraping** | ❌ | ❌ | ❌ | ✅ |
| **API Access** | ❌ | ❌ | ❌ | ✅ |

### Suporte

| Recurso | Free | Basic | Business | Premium |
|---------|------|-------|----------|---------|
| **Email** | ❌ | ✅ (48h) | ✅ (24h) | ✅ (4h) |
| **Chat** | ❌ | ❌ | ✅ | ✅ |
| **WhatsApp** | ❌ | ❌ | ✅ 24/7 | ✅ 24/7 Prioritário |
| **Telefone** | ❌ | ❌ | ❌ | ✅ |
| **Onboarding Dedicado** | ❌ | ❌ | ❌ | ✅ |
| **Account Manager** | ❌ | ❌ | ❌ | ✅ |

### Limites Técnicos

| Limite | Free | Basic | Business | Premium |
|--------|------|-------|----------|---------|
| **Usuários** | 1 | 1 | 1 | 1 |
| **Sessões Chat IA** | Ilimitado | Ilimitado | Ilimitado | Ilimitado |
| **Mensagens/mês (SDR)** | - | - | 10.000 | 50.000 |
| **Armazenamento** | 100MB | 1GB | 10GB | 50GB |
| **Leads no CRM** | - | - | Ilimitado | Ilimitado |
| **Webhooks** | - | - | 5 | 20 |

---

## 📱 Detalhamento por Plano

### 🆓 Free (Gratuito)

**Ideal para:** Testar o app e funcionalidades básicas.

#### ✅ Incluído
- Dashboard financeiro completo
- Registros, contas, metas
- Agenda e tarefas
- Chat IA (N8N + OpenAI)
- Notificações e alertas

#### ❌ NÃO Incluído
- Agente SDR
- CRM de vendas
- Exportação de dados
- Suporte prioritário
- Integrações

#### 💰 Upgrade
```
Free → Basic: R$ 97,90/mês (+82% recursos)
Free → Business: R$ 497,00/mês (+95% recursos + SDR)
Free → Premium: R$ 1.497,00/mês (100% recursos)
```

---

### 💼 Basic (R$ 97,90/mês)

**Ideal para:** Freelancers e pequenos negócios.

⚠️ **Nota:** Plano em desenvolvimento. Ainda não disponível para venda.

#### ✅ Incluído
- Tudo do Free
- Exportação CSV básica
- Suporte por email (48h)

#### ❌ NÃO Incluído
- Agente SDR
- CRM de vendas
- Integrações
- Suporte 24/7

---

### 🚀 Business (R$ 497,00/mês)

**Ideal para:** Empresas em crescimento que precisam de automação de vendas.

#### ✅ Incluído
- **Tudo do Basic**
- **Agente SDR com IA**
- **2 Instâncias WhatsApp**
- **CRM Pipeline completo**
- **Importação de contatos**
- **Exportação CSV/Excel**
- **Relatórios básicos**
- **Google Workspace integração**
- **10.000 mensagens/mês**
- **10GB armazenamento**
- **Suporte 24/7 (Chat + WhatsApp)**
- **5 webhooks**

#### Limitações
- Máximo 2 WhatsApps conectados
- Sem Web Search na IA
- Sem Data Scraping
- Sem API access

#### 💡 Casos de Uso
- Produtoras de vídeo
- Consultorias
- Prestadores de serviço
- Imobiliárias
- Agências de marketing

---

### 👑 Premium (R$ 1.497,00/mês)

**Ideal para:** Empresas estabelecidas com alto volume de leads.

#### ✅ Incluído
- **Tudo do Business**
- **5 Instâncias WhatsApp** (vs 2)
- **50.000 mensagens/mês** (vs 10k)
- **50GB armazenamento** (vs 10GB)
- **IA com Web Search** 🌐
- **Data Scraping** 🤖
- **API Access** 🔌
- **Exportação PDF**
- **Relatórios avançados**
- **Integrações ilimitadas**
- **20 webhooks** (vs 5)
- **Suporte telefone**
- **Onboarding dedicado**
- **Account Manager**

#### 💡 Casos de Uso
- Empresas de médio/grande porte
- E-commerces
- Redes de franquias
- Call centers
- Software houses

---

## 🔒 Validações Implementadas

### 1. Frontend (React)

#### Hook: `usePlanInfo`

**Arquivo:** `src/hooks/usePlanInfo.ts`

```typescript
export const usePlanInfo = () => {
  const { user } = useAuth();
  
  const planId = user?.plan_id || 'free';
  const isBusinessOrPremium = ['business', 'premium'].includes(planId);
  
  return {
    planId,
    planName: PLAN_NAMES[planId],
    
    // Permissions
    canExport: isBusinessOrPremium,
    canAccessWhatsApp: isBusinessOrPremium,
    canAccessSDRAgent: isBusinessOrPremium,
    canAccessCRM: isBusinessOrPremium,
    canAccessSupport: isBusinessOrPremium,
    canAccessAdvancedFeatures: isBusinessOrPremium,
    canAccessAIFeatures: isBusinessOrPremium,
    canAccessWebSearch: planId === 'premium',
    canAccessDataScraping: planId === 'premium',
    canAccessAPI: planId === 'premium',
    
    // Limits
    maxWhatsAppInstances: planId === 'premium' ? 5 : (isBusinessOrPremium ? 2 : 0),
    maxMessagesPerMonth: planId === 'premium' ? 50000 : (planId === 'business' ? 10000 : 0),
    maxStorage: planId === 'premium' ? 50 : (planId === 'business' ? 10 : 1), // GB
    maxWebhooks: planId === 'premium' ? 20 : (planId === 'business' ? 5 : 0),
  };
};
```

#### Componente: `ProtectedFeature`

**Arquivo:** `src/components/ProtectedFeature.tsx`

```typescript
interface ProtectedFeatureProps {
  permission: keyof ReturnType<typeof usePlanInfo>;
  featureName: string;
  children: React.ReactNode;
}

export const ProtectedFeature = ({ permission, featureName, children }: ProtectedFeatureProps) => {
  const planInfo = usePlanInfo();
  const hasAccess = planInfo[permission];
  
  if (!hasAccess) {
    return (
      <Card className="p-6 text-center">
        <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          🔒 Recurso Bloqueado
        </h3>
        <p className="text-muted-foreground mb-4">
          {featureName} está disponível apenas nos planos Business e Premium.
        </p>
        <Badge variant="outline" className="mb-4">
          {planInfo.planId === 'free' ? 'Plano Free' : 'Plano Basic'}
        </Badge>
        <Button asChild>
          <Link to="/perfil?tab=plans">
            Ver Planos Disponíveis
          </Link>
        </Button>
      </Card>
    );
  }
  
  return <>{children}</>;
};
```

#### Uso nos Componentes

```tsx
// AgenteSDR.tsx
<ProtectedFeature 
  permission="canAccessSDRAgent" 
  featureName="Agente SDR"
>
  {/* Conteúdo do Agente SDR */}
</ProtectedFeature>

// CRM.tsx
<ProtectedFeature 
  permission="canAccessCRM" 
  featureName="CRM de Vendas"
>
  {/* Conteúdo do CRM */}
</ProtectedFeature>

// Reports.tsx - Botão de Exportar
{planInfo.canExport ? (
  <Button onClick={handleExport}>
    <Download /> Exportar CSV
  </Button>
) : (
  <Button onClick={() => navigate('/perfil?tab=plans')} variant="outline">
    <Lock /> Upgrade para Exportar
  </Button>
)}
```

---

### 2. Backend (Edge Functions)

#### Validação em Edge Function

**Arquivo:** `supabase/functions/create-evolution-instance/index.ts`

```typescript
Deno.serve(async (req) => {
  // 1. Autenticação JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization' }),
      { status: 401 }
    );
  }
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401 }
    );
  }
  
  // 2. Buscar cliente e verificar plano
  const { data: cliente, error: clienteError } = await supabaseClient
    .from('clientes')
    .select('phone, plan_id, subscription_active')
    .eq('auth_user_id', user.id)
    .single();
  
  if (clienteError || !cliente) {
    return new Response(
      JSON.stringify({ error: 'Client not found' }),
      { status: 404 }
    );
  }
  
  // 3. Validar plano adequado
  if (!['business', 'premium'].includes(cliente.plan_id || '')) {
    return new Response(
      JSON.stringify({ 
        error: 'WhatsApp integration requires Business or Premium plan',
        current_plan: cliente.plan_id,
        required_plans: ['business', 'premium']
      }),
      { status: 403 }
    );
  }
  
  // 4. Validar assinatura ativa
  if (!cliente.subscription_active) {
    return new Response(
      JSON.stringify({ error: 'Subscription is not active' }),
      { status: 402 } // Payment Required
    );
  }
  
  // 5. Verificar limite de instâncias
  const maxInstances = cliente.plan_id === 'premium' ? 5 : 2;
  
  const { count: currentInstances } = await supabaseClient
    .from('evolution_instances')
    .select('*', { count: 'exact', head: true })
    .eq('phone', cliente.phone);
  
  if ((currentInstances || 0) >= maxInstances) {
    return new Response(
      JSON.stringify({ 
        error: 'Maximum instances reached',
        current: currentInstances,
        max: maxInstances,
        plan: cliente.plan_id
      }),
      { status: 429 } // Too Many Requests
    );
  }
  
  // 6. Prosseguir com criação da instância
  // ...
});
```

#### Validação Genérica (Reutilizável)

```typescript
// supabase/functions/_shared/validatePlan.ts
export const validatePlan = async (
  supabase: SupabaseClient,
  userId: string,
  requiredPlans: string[]
) => {
  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('phone, plan_id, subscription_active')
    .eq('auth_user_id', userId)
    .single();
  
  if (error || !cliente) {
    throw new Error('Client not found');
  }
  
  if (!requiredPlans.includes(cliente.plan_id || '')) {
    throw new Error(`Required plans: ${requiredPlans.join(', ')}`);
  }
  
  if (!cliente.subscription_active) {
    throw new Error('Subscription not active');
  }
  
  return cliente;
};

// Uso:
const cliente = await validatePlan(supabase, user.id, ['business', 'premium']);
```

---

### 3. Banco de Dados (RLS)

#### Políticas de Segurança

```sql
-- evolution_instances: Apenas Business/Premium
CREATE POLICY "Business/Premium can manage WhatsApp instances"
  ON evolution_instances
  FOR ALL
  USING (
    phone = get_user_phone_optimized()
    AND (
      SELECT plan_id FROM clientes 
      WHERE phone = get_user_phone_optimized()
    ) IN ('business', 'premium')
  );

-- evolution_contacts: Apenas Business/Premium
CREATE POLICY "Business/Premium can access contacts"
  ON evolution_contacts
  FOR ALL
  USING (
    phone = get_user_phone_optimized()
    AND (
      SELECT plan_id FROM clientes 
      WHERE phone = get_user_phone_optimized()
    ) IN ('business', 'premium')
  );

-- sdr_agent_config: Apenas Business/Premium
CREATE POLICY "Business/Premium can manage SDR config"
  ON sdr_agent_config
  FOR ALL
  USING (
    phone = get_user_phone_optimized()
    AND (
      SELECT plan_id FROM clientes 
      WHERE phone = get_user_phone_optimized()
    ) IN ('business', 'premium')
  );
```

---

## 🧩 Componentes de Bloqueio

### Upgrade Prompt

**Arquivo:** `src/components/UpgradePrompt.tsx`

```tsx
export const UpgradePrompt = ({ feature }: { feature: string }) => {
  const { planId } = usePlanInfo();
  const navigate = useNavigate();
  
  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Crown className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-900">
        Upgrade Necessário
      </AlertTitle>
      <AlertDescription className="text-amber-800">
        <p className="mb-2">
          {feature} está disponível nos planos Business e Premium.
        </p>
        <p className="text-sm mb-3">
          Seu plano atual: <Badge variant="outline">{planId}</Badge>
        </p>
        <Button 
          onClick={() => navigate('/perfil?tab=plans')}
          className="bg-amber-600 hover:bg-amber-700"
        >
          Ver Planos e Preços
        </Button>
      </AlertDescription>
    </Alert>
  );
};
```

### Banner de Período de Arrependimento

**Arquivo:** `src/components/RefundPeriodBanner.tsx`

```tsx
export const RefundPeriodBanner = () => {
  const { user } = useAuth();
  
  if (!user?.refund_period_ends_at) return null;
  
  const endsAt = new Date(user.refund_period_ends_at);
  const now = new Date();
  const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft <= 0) return null;
  
  return (
    <Alert className="border-blue-200 bg-blue-50 mb-4">
      <Info className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-blue-900">
        Período de Arrependimento (CDC)
      </AlertTitle>
      <AlertDescription className="text-blue-800">
        <p>
          Você tem <strong>{daysLeft} dias</strong> para cancelar sua assinatura 
          e receber reembolso total, conforme o Código de Defesa do Consumidor.
        </p>
        <p className="text-sm mt-2">
          Válido até: {endsAt.toLocaleDateString('pt-BR')} às {endsAt.toLocaleTimeString('pt-BR')}
        </p>
      </AlertDescription>
    </Alert>
  );
};
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Bloqueio de Exportação

```tsx
// Reports.tsx
const ReportsPage = () => {
  const { canExport } = usePlanInfo();
  
  const handleExport = () => {
    if (!canExport) {
      toast.error("🔒 Recurso Business/Premium", {
        description: "Exportação de dados está disponível apenas nos planos Business e Premium.",
        action: {
          label: "Ver Planos",
          onClick: () => navigate('/perfil?tab=plans')
        }
      });
      return;
    }
    
    // Prosseguir com exportação
    exportToCSV(data);
  };
  
  return (
    <Button onClick={handleExport}>
      {canExport ? (
        <>
          <Download /> Exportar CSV
        </>
      ) : (
        <>
          <Lock /> Upgrade para Exportar
        </>
      )}
    </Button>
  );
};
```

### Exemplo 2: Limite de Instâncias

```tsx
// AgenteSDR.tsx
const AgenteSDR = () => {
  const { maxWhatsAppInstances } = usePlanInfo();
  const { data: instances } = useQuery(['evolution-instances']);
  
  const canCreateMore = (instances?.length || 0) < maxWhatsAppInstances;
  
  return (
    <Button 
      onClick={handleCreateInstance}
      disabled={!canCreateMore}
    >
      + Nova Conexão
      {!canCreateMore && (
        <Tooltip>
          <TooltipContent>
            Você atingiu o limite de {maxWhatsAppInstances} instâncias do seu plano.
            Faça upgrade para Premium para ter até 5 instâncias.
          </TooltipContent>
        </Tooltip>
      )}
    </Button>
  );
};
```

---

## ❓ FAQ

**Q: Posso fazer downgrade de Premium para Business?**  
R: ✅ Sim, mas perde acesso a recursos Premium (Web Search, API, etc). Vigora no próximo ciclo.

**Q: O que acontece se eu exceder o limite de mensagens?**  
R: ⚠️ Agente SDR é pausado automaticamente. Você recebe email para fazer upgrade ou aguardar próximo ciclo.

**Q: Posso comprar instâncias WhatsApp adicionais?**  
R: 🔜 Em breve. Por enquanto, upgrade para Premium.

**Q: Free tem limitação de tempo?**  
R: ❌ Não. Plano Free é permanente.

**Q: Posso usar cupom de desconto?**  
R: 🔜 Sistema de cupons em desenvolvimento (ver [PLANO_IMPLANTACAO_CUPOM_INFLUENCER.md](./PLANO_IMPLANTACAO_CUPOM_INFLUENCER.md))

---

## 📚 Recursos Adicionais

### Documentação Relacionada

- [Período de Arrependimento CDC](./PERIODO_ARREPENDIMENTO_CDC.md)
- [Guia Completo do Agente SDR](./GUIA_COMPLETO_AGENTE_SDR.md)
- [Implementação Trial 7 Dias](./IMPLANTACAO_TRIAL_7_DIAS.md)

---

**Documento mantido por:** Equipe Meu Agente  
**Última revisão:** 15/12/2025  
**Próxima revisão prevista:** 15/01/2026
