# 🗑️ Migrations Obsoletas - Arquivadas em 10/12/2025

## ⚠️ ATENÇÃO: NÃO APLICAR ESTAS MIGRATIONS EM PRODUÇÃO

Estas migrations foram criadas durante a **fase de prototipagem (Outubro 2025)** e continham **políticas RLS inseguras**. TODAS foram **sobrescritas** por migrations posteriores (Janeiro e Dezembro 2025).

---

## 📋 Lista de Migrations Obsoletas

### 1. `20251002052924_b2d85c15-3e11-420c-8806-0f266447148e.sql`
**Data:** 02/10/2025 05:29:24  
**Problema:** Storage avatars usando `auth.uid()` (modelo incompatível com phone)  
**Severidade:** 🟡 MÉDIO  
**Substituída por:** `20251210100000_fix_security_audit_issues.sql`

---

### 2. `20251002055412_8fe811c7-5278-40df-8f83-03d426b81502.sql`
**Data:** 02/10/2025 05:54:12  
**Problema:** Storage avatars com `phone IN (SELECT phone FROM clientes)` (não valida usuário autenticado)  
**Severidade:** 🟡 MÉDIO  
**Substituída por:** `20251210100000_fix_security_audit_issues.sql`

---

### 3. `20251002060814_be732cb1-3aaf-49c4-bc50-cc42ee4a588c.sql`
**Data:** 02/10/2025 06:08:14  
**Problema:** Storage avatars com "Anyone can..." (acesso público total)  
**Severidade:** 🔴 CRÍTICO  
**Substituída por:** `20251210100000_fix_security_audit_issues.sql`

---

### 4. `20251002075234_a40cd9b7-3703-4d50-8935-732a5c55bc91.sql`
**Data:** 02/10/2025 07:52:34  
**Problema:** Políticas `TO authenticated USING (true)` em financeiro_registros  
**Severidade:** 🔴 CRÍTICO  
**Substituída por:** `20250116000003_update_all_rls_policies.sql`

```sql
-- VULNERABILIDADE: Qualquer usuário autenticado vê TODOS os dados
CREATE POLICY ... FOR SELECT TO authenticated USING (true)
```

---

### 5. `20251002075858_b51ba5cc-4e71-4f52-83ad-a9a4467458db.sql`
**Data:** 02/10/2025 07:58:58  
**Problema:** Políticas `TO public USING (true)` em financeiro_registros  
**Severidade:** 🔴 CRÍTICO+ (pior que a anterior)  
**Substituída por:** `20250116000003_update_all_rls_policies.sql`

```sql
-- VULNERABILIDADE: Qualquer pessoa (não autenticada) tem acesso total
CREATE POLICY ... FOR SELECT TO public USING (true)
```

---

### 6. `20251004052406_22f31362-0807-4cb6-8bc7-153fde8d3944.sql`
**Data:** 04/10/2025 05:24:06  
**Problema:** Expandiu `USING (true)` para múltiplas tabelas (metas, notifications)  
**Severidade:** 🔴 CRÍTICO  
**Substituída por:** `20250116000003_update_all_rls_policies.sql`

---

### 7. `20250106000002_fix_rls_policies.sql`
**Data:** 06/01/2025  
**Problema:** Modelo antigo `auth.uid()::text = telefone_usuario` (incompatível com auth.users)  
**Severidade:** 🟡 MÉDIO  
**Substituída por:** `20250116000003_update_all_rls_policies.sql`

---

## 📈 Histórico de Correções

### Janeiro 2025
- **Migration `20250116000003`** implementou a função `get_user_phone_optimized()`
- Estabeleceu o padrão correto: `auth.users.id → clientes.auth_user_id → clientes.phone`
- Aplicou políticas seguras em 8+ tabelas principais

### Dezembro 2025
- **Migration `20251210100000`** corrigiu storage avatars e adicionou DELETE policy
- Protegeu 100% das funções SECURITY DEFINER com `SET search_path = ''`
- Adicionou `WITH CHECK` em todas as políticas UPDATE

---

## 🛡️ Estado Atual do Banco (Dezembro 2025)

**✅ SEGURO**: Todas as políticas antigas foram **dropadas** e **substituídas** por políticas seguras.

**Padrão atual:**
```sql
-- Função helper segura
CREATE FUNCTION get_user_phone_optimized()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT c.phone FROM clientes c WHERE c.auth_user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE;

-- Políticas seguras
CREATE POLICY "auth_<tabela>_select"
ON public.<tabela>
FOR SELECT TO authenticated
USING (phone = (SELECT public.get_user_phone_optimized()));
```

---

## 📊 Impacto das Migrations Obsoletas

| Migration | Risco | Estado Atual | Impacto |
|-----------|-------|--------------|---------|
| 20251002052924 | 🟡 MÉDIO | ✅ DROPADA | NENHUM |
| 20251002055412 | 🟡 MÉDIO | ✅ DROPADA | NENHUM |
| 20251002060814 | 🔴 CRÍTICO | ✅ DROPADA | NENHUM |
| 20251002075234 | 🔴 CRÍTICO | ✅ DROPADA | NENHUM |
| 20251002075858 | 🔴 CRÍTICO+ | ✅ DROPADA | NENHUM |
| 20251004052406 | 🔴 CRÍTICO | ✅ DROPADA | NENHUM |
| 20250106000002 | 🟡 MÉDIO | ✅ DROPADA | NENHUM |

**Total de vulnerabilidades corrigidas:** 7  
**Risco atual:** ✅ ZERO (todas sobrescritas)

---

## 🎯 Política de Retenção

### Por que mantemos estas migrations?

1. **Histórico e Aprendizado**: Documentar a evolução do sistema de segurança
2. **Auditoria**: Rastreabilidade de mudanças críticas
3. **Referência**: Exemplos de "o que NÃO fazer" para futuros desenvolvedores

### O que NÃO fazer com estas migrations:

- ❌ **NÃO aplicar** em nenhum ambiente (dev, staging, produção)
- ❌ **NÃO copiar** políticas destas migrations
- ❌ **NÃO usar** como referência para novas tabelas

### O que fazer:

- ✅ **Usar** como referência de problemas corrigidos
- ✅ **Consultar** o relatório de auditoria para contexto completo
- ✅ **Seguir** o template de políticas em `20250116000003`

---

## 📖 Documentação Completa

Para análise detalhada, consulte:
- `docs/RELATORIO_AUDITORIA_RLS_COMPLETO_2025_12_10.md`
- `docs/PLANO_ACAO_RLS_SUPABASE.md`

---

## 🔐 Segurança Atual

**Score de Conformidade:** 🟢 **98%** (Excelente)

- ✅ 29 tabelas com RLS habilitado
- ✅ 100% funções SECURITY DEFINER protegidas
- ✅ Padrão consistente em todas as tabelas
- ✅ Zero vulnerabilidades ativas

---

**Arquivado em:** 10 de Dezembro de 2025  
**Próxima auditoria:** Março de 2026 (Trimestral)  
**Responsável:** Equipe de Segurança
