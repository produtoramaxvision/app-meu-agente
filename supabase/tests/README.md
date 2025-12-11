# 🎯 Instruções para Executar Testes pgTAP

## ⚡ Quick Start (5 minutos)

### Passo 1: Instalar Supabase CLI

**Windows (PowerShell como Admin):**
```powershell
scoop install supabase
```

**Se não tiver Scoop instalado:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
scoop install supabase
```

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Linux:**
```bash
curl -fsSL https://cli.supabase.com/install.sh | sh
```

---

### Passo 2: Linkar Projeto

```bash
cd c:\Users\MaxVision\Desktop\cursor-oficial\app-meu-agente
supabase link --project-ref <seu-project-ref>
```

**Como encontrar `project-ref`:**
1. Acesse https://supabase.com/dashboard/project/_/settings/general
2. Copie o **Reference ID** (formato: `abcdefghijklmnop`)

---

### Passo 3: Executar Testes

```bash
supabase test db
```

**Saída esperada (sucesso):**
```
supabase/tests/000-setup-tests-hooks.sql ................... ok
supabase/tests/001-schema-wide-rls-enabled.test.sql ........ ok
supabase/tests/002-rls-clientes.test.sql ................... ok
supabase/tests/003-rls-financeiro-registros.test.sql ....... ok
supabase/tests/004-rls-storage-avatars.test.sql ............ ok
supabase/tests/005-rls-tasks.test.sql ...................... ok
supabase/tests/006-rls-metas.test.sql ...................... ok
supabase/tests/007-security-definer-functions.test.sql ..... ok
supabase/tests/008-rls-privacy-settings.test.sql ........... ok

All tests successful.
Files=9, Tests=60+, 2-5 wallclock secs
Result: PASS ✅
```

---

## 🔧 Comandos Úteis

### Executar Teste Específico
```bash
supabase test db supabase/tests/002-rls-clientes.test.sql
```

### Executar Localmente (Docker)
```bash
supabase start
supabase test db --local
```

### Ver Logs Detalhados
```bash
supabase test db --debug
```

### Parar Ambiente Local
```bash
supabase stop
```

---

## 🐛 Troubleshooting

### Erro: "supabase: command not found"
**Solução:**
- Reinicie o terminal após instalação
- Verifique PATH: `echo $env:PATH` (Windows) ou `echo $PATH` (Unix)

### Erro: "Project not linked"
**Solução:**
```bash
supabase link --project-ref <seu-project-ref>
```

### Erro: "extension pgtap does not exist"
**Solução:**
As migrations já foram aplicadas! Execute:
```bash
supabase db push
```

### Teste Falhando?
1. Verifique qual teste falhou
2. Leia a mensagem de erro
3. Consulte `docs/TESTES_PGTAP_RLS_COMPLETO.md` para diagnóstico

---

## 📊 Interpretando Resultados

### ✅ Sucesso (todos testes passaram)
```
All tests successful.
Files=9, Tests=60, 2 wallclock secs
Result: PASS
```
✅ **Ação:** Nenhuma! Seu RLS está seguro.

### ❌ Falha (teste falhou)
```
supabase/tests/002-rls-clientes.test.sql ......... FAILED
Test 4: User 1 cannot update User 2 data - Expected 0 rows, got 1
```
🚨 **CRÍTICO:** Há um vazamento de dados! Usuário consegue ver/editar dados de outro.

**Ação Imediata:**
1. Revise as políticas RLS da tabela afetada
2. NÃO faça deploy em produção
3. Corrija a política e execute testes novamente

---

## 🎓 Documentação Completa

Para entender cada teste em detalhes, consulte:
📄 `docs/TESTES_PGTAP_RLS_COMPLETO.md`

---

**Data:** 10/12/2025  
**Status:** ✅ Pronto para executar
