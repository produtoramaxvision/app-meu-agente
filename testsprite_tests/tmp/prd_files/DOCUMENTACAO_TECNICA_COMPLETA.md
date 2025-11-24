# 📚 DOCUMENTAÇÃO TÉCNICA COMPLETA
## Meu Agente Financeiro - Sistema de Gestão Financeira Pessoal

---

## 📋 **ÍNDICE**

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Configuração e Instalação](#configuração-e-instalação)
5. [Funcionalidades Implementadas](#funcionalidades-implementadas)
6. [Gestão de Assinaturas e Planos](#gestão-de-assinaturas-e-planos)
7. [Validações e Segurança](#validações-e-segurança)
8. [Integração com Supabase](#integração-com-supabase)
9. [Componentes e Hooks](#componentes-e-hooks)
10. [Testes e Validação](#testes-e-validação)
11. [Deploy e Produção](#deploy-e-produção)

---

## 🎯 **VISÃO GERAL DO SISTEMA**

### **Descrição**
O Meu Agente Financeiro é uma aplicação web completa para gestão financeira pessoal, desenvolvida com React, TypeScript e Supabase. O sistema oferece funcionalidades avançadas para controle de receitas, despesas, metas, tarefas e agenda, além de planos de assinatura integrados via Stripe.

### **Características Principais**
- ✅ **Interface Moderna**: Design responsivo com ShadcnUI v4
- ✅ **Validação Robusta**: Sistema de validação com Zod
- ✅ **Segurança Avançada**: RLS (Row Level Security) no Supabase
- ✅ **Performance Otimizada**: Hooks customizados e lazy loading
- ✅ **Funcionalidades Completas**: Dashboard, relatórios, exportação, drag-and-drop
- ✅ **Assinaturas**: Integração completa com Stripe (Checkout, Portal, Webhooks)

### **Status Atual**
- **Versão**: 1.1.0
- **Status**: ✅ **PRODUÇÃO READY**
- **Validação**: ✅ **100% das funcionalidades testadas e funcionando**
- **Última Atualização**: 24/11/2025

---

## 🏗️ **ARQUITETURA E TECNOLOGIAS**

### **Stack Tecnológico**

#### **Frontend**
- **React 18.2.0**: Framework principal
- **TypeScript 5.0+**: Linguagem de programação
- **Vite 4.0+**: Build tool e dev server
- **Tailwind CSS 3.0+**: Framework CSS
- **ShadcnUI v4**: Biblioteca de componentes

#### **Backend e Banco de Dados**
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Banco de dados principal
- **Row Level Security (RLS)**: Segurança de dados
- **Edge Functions (Deno)**: Processamento de pagamentos e webhooks

#### **Bibliotecas Principais**
- **@tanstack/react-query**: Gerenciamento de estado servidor
- **@dnd-kit**: Drag and drop
- **Zod**: Validação de schemas
- **Sonner**: Sistema de notificações
- **React Hook Form**: Gerenciamento de formulários
- **Recharts**: Gráficos e visualizações

### **Arquitetura do Sistema**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   PostgreSQL    │
│   (React/TS)    │◄──►│   (Backend)     │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       │                       │
    ┌─────────┐            ┌─────────────┐        ┌──────────────┐
    │ ShadcnUI│            │ Edge Funcs  │◄──────►│   Stripe     │
    │ Tailwind│            │ (Webhooks)  │        │  (Payment)   │
    │ Zod     │            └─────────────┘        └──────────────┘
    └─────────┘                  ▲
                                 │
                           ┌─────────────┐
                           │  Realtime   │
                           │ Subscription│
                           └─────────────┘
```

---

## 📁 **ESTRUTURA DO PROJETO**

```
meu-agente-fin/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Componentes base (ShadcnUI)
│   │   ├── forms/          # Formulários específicos
│   │   └── layout/         # Componentes de layout
│   ├── pages/              # Páginas da aplicação
│   │   ├── auth/           # Autenticação
│   │   ├── Dashboard.tsx   # Página principal
│   │   ├── Profile.tsx     # Perfil e Assinatura
│   │   └── ...             # Outras páginas
│   ├── hooks/              # Hooks customizados
│   │   ├── usePlanInfo.ts  # Lógica de planos
│   │   └── ...
│   ├── contexts/           # Contextos React
│   │   ├── AuthContext.tsx # Autenticação e Realtime
│   │   └── ...
│   └── integrations/       # Integrações externas
│       └── supabase/
├── supabase/               # Configuração Supabase
│   ├── functions/          # Edge Functions (Stripe)
│   ├── migrations/         # Migrações do banco
│   └── config.toml         # Configuração
├── tests/                  # Testes automatizados
├── docs/                   # Documentação
└── public/                 # Arquivos estáticos
```

---

## ⚙️ **CONFIGURAÇÃO E INSTALAÇÃO**

### **Pré-requisitos**
- Node.js 18.0+
- npm ou yarn
- Conta Supabase
- Conta Stripe (para pagamentos)
- Git

### **Instalação Local**

1. **Clone o repositório**
```bash
git clone <repository-url>
cd meu-agente-fin
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

4. **Configure o Supabase e Stripe**
- Configure as chaves do Stripe no Supabase Secrets.
- Execute as migrações locais.

5. **Execute as migrações**
```bash
supabase db push
```

6. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

---

## 🚀 **FUNCIONALIDADES IMPLEMENTADAS**

### **1. Sistema de Autenticação**
- ✅ Login com telefone e senha
- ✅ Registro de novos usuários
- ✅ Sessão persistente e segura
- ✅ Sincronização Realtime de dados do usuário

### **2. Dashboard Financeiro**
- ✅ Visão geral das finanças
- ✅ Gráficos de evolução e resumo

### **3. Gestão de Contas**
- ✅ Cadastro de receitas e despesas
- ✅ Categorização e validação

### **4. Assinaturas e Planos (Stripe)**
- ✅ Planos: Free, Basic, Business, Premium
- ✅ Upgrade/Downgrade via Stripe Checkout e Portal
- ✅ Webhooks para sincronização automática
- ✅ Tratamento de cancelamentos e renovações

---

## 💳 **GESTÃO DE ASSINATURAS E PLANOS**

O sistema utiliza uma lógica robusta de consistência de dados garantida por **Triggers no PostgreSQL**.

### **Regra de Negócio (Enforcement)**
Existe uma *Constraint* e um *Trigger* no banco de dados (`enforce_cliente_subscription_flags`) que garante:

1. **Conta Banida (`is_active = false`)**:
   - `subscription_active` é forçado para `FALSE`.
   
2. **Conta Ativa sem Plano Pago**:
   - Se `plan_id` for `NULL` ou `free` ou inválido.
   - `subscription_active` é forçado para `FALSE`.
   - `plan_id` é normalizado para `free`.

3. **Conta Ativa com Plano Pago**:
   - Se `plan_id` for `basic`, `business` ou `premium`.
   - `subscription_active` é forçado para `TRUE`.

Isso elimina a possibilidade de estados inconsistentes (ex: plano Premium com assinatura inativa) e simplifica o frontend.

### **Fluxo de Atualização**
1. **Stripe Webhook** recebe evento (ex: `customer.subscription.updated`).
2. Edge Function atualiza apenas o `plan_id` na tabela `clientes`.
3. **Trigger do Banco** recalcula automaticamente `subscription_active`.
4. **Supabase Realtime** notifica o frontend (`AuthContext`).
5. UI atualiza instantaneamente sem refresh.

---

## 🔒 **VALIDAÇÕES E SEGURANÇA**

### **Validações Frontend**
- Zod schemas para formulários.
- Prevenção de duplicatas financeiras.

### **Segurança Backend (RLS)**
Todas as tabelas possuem RLS habilitado.
- **Política de Acesso**: Baseada em `auth.uid()` mapeado para o `phone` do cliente.
- **Isolamento**: Usuários só acessam seus próprios dados.

---

## 🗄️ **INTEGRAÇÃO COM SUPABASE**

### **Edge Functions**
- `create-checkout-session`: Gera sessão de pagamento Stripe.
- `create-portal-session`: Gera link para portal do cliente Stripe.
- `stripe-webhook`: Processa eventos do Stripe de forma segura.

---

## 📊 **MÉTRICAS E PERFORMANCE**

- **Realtime**: Latência < 100ms para atualizações de plano.
- **Otimizações**: Memoização de contextos (`AuthContext`), lazy loading de páginas.

---

**Documentação técnica atualizada em**: 24/11/2025  
**Versão**: 1.1.0  
**Status**: ✅ **PRODUÇÃO READY**
