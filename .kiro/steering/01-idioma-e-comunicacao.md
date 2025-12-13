---
inclusion: always
---

# Idioma e Comunicação

## Regra Principal de Idioma

**SEMPRE responda em português brasileiro (pt-BR)** para todas as interações com o usuário, incluindo:
- Respostas e explicações
- Comentários em código
- Mensagens de commit
- Documentação
- Mensagens de erro e validação
- Logs e debug

## Exceções

Mantenha em inglês apenas:
- Nomes de variáveis, funções e classes no código
- Imports e exports
- Nomes de bibliotecas e pacotes
- Comandos de terminal
- URLs e endpoints de API

## Exemplos

✅ **Correto:**
```typescript
// Valida se o usuário tem permissão para acessar este recurso
function validateUserPermission(userId: string): boolean {
  // Implementação
}
```

❌ **Incorreto:**
```typescript
// Validates if user has permission to access this resource
function validateUserPermission(userId: string): boolean {
  // Implementation
}
```
