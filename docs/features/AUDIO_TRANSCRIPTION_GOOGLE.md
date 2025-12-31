# Configuração Google Speech-to-Text

Este documento descreve como configurar a transcrição de áudio usando Google Cloud Speech-to-Text API.

## 🎯 Objetivo

Transcrever mensagens de áudio gravadas no chat usando o Google Cloud Speech-to-Text com formato otimizado (FLAC) mantendo alta qualidade.

## 📋 Pré-requisitos

1. Conta no Google Cloud Platform
2. Projeto criado no GCP
3. Billing habilitado no projeto

## 🔑 Obter API Key

### 1. Acessar Google Cloud Console
Acesse: https://console.cloud.google.com/

### 2. Criar/Selecionar Projeto
- Crie um novo projeto ou selecione um existente
- Anote o **Project ID**

### 3. Habilitar Speech-to-Text API
```
1. No menu lateral, vá em "APIs & Services" > "Library"
2. Busque por "Cloud Speech-to-Text API"
3. Clique em "Enable"
```

### 4. Criar API Key
```
1. Vá em "APIs & Services" > "Credentials"
2. Clique em "+ CREATE CREDENTIALS"
3. Selecione "API key"
4. Copie a chave gerada
```

### 5. Restringir API Key (Recomendado)
Para segurança, restrinja a chave:

**Restrições de API:**
- Selecione "Restrict key"
- Escolha apenas "Cloud Speech-to-Text API"

**Restrições de Aplicação (opcional):**
- HTTP referrers: Adicione seus domínios
  - `http://localhost:8080/*` (desenvolvimento)
  - `https://seudominio.com/*` (produção)

## ⚙️ Configurar no Projeto

### 1. Adicionar Chave no Backend

Edite o arquivo de configuração do Supabase:

```bash
# Em supabase/.env ou via Supabase Dashboard
GOOGLE_SPEECH_API_KEY=AIzaSy...
```

**Via Supabase Dashboard:**
```
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "Settings" > "Edge Functions"
4. Em "Environment Variables", adicione:
   - Name: GOOGLE_SPEECH_API_KEY
   - Value: [sua chave]
```

### 2. Deploy da Edge Function

```bash
# Fazer deploy da função de transcrição
supabase functions deploy transcribe-audio
```

**✅ Importante:** A função valida automaticamente o JWT via `supabase.auth.getUser()`, garantindo que apenas usuários autenticados possam transcrever áudio.

### 3. Adicionar Variável no Frontend (Opcional)

Se quiser exibir a chave no frontend (NÃO RECOMENDADO para produção):

```bash
# .env.local
VITE_GOOGLE_SPEECH_API_KEY=AIzaSy...
```

## 🎤 Como Funciona

### Fluxo de Transcrição

```mermaid
graph LR
A[Usuário clica no mic] --> B[MediaRecorder captura áudio]
B --> C[WebM/Opus gravado]
C --> D[Blob convertido para Base64]
D --> E[Edge Function recebe]
E --> F[Google Speech-to-Text]
F --> G[Transcrição retornada]
G --> H[Mensagem enviada no chat]
```

### Formato de Áudio

- **Captura:** WebM/Opus (navegador)
- **Transmissão:** Base64
- **Processamento:** Google aceita WebM diretamente
- **Qualidade:** 128kbps, mono, 48kHz

### Otimizações Aplicadas

1. **Áudio:**
   - Sample rate: 48kHz (padrão WebM)
   - Bits per second: 128kbps
   - Canais: 1 (mono)
   - Echo cancellation: ✅
   - Noise suppression: ✅
   - Auto gain control: ✅

2. **API Google:**
   - Pontuação automática: ✅
   - Modelo aprimorado: ✅
   - Word confidence: ✅
   - Idioma: pt-BR

## 📊 Custos

**Google Cloud Speech-to-Text Pricing (2025):**

- **Primeiro uso:** 60 minutos grátis/mês
- **Modelo padrão:** $0.006 por 15 segundos
- **Modelo aprimorado:** $0.009 por 15 segundos

**Exemplo:**
- 100 mensagens de áudio (30s cada) = 50 minutos
- Custo mensal: ~$1.20 - $1.80

## 🔒 Segurança

### Recomendações

1. ✅ **Nunca exponha a API key no frontend**
2. ✅ **Use Edge Function para processar transcrição**
3. ✅ **Restrinja a API key no Google Console**
4. ✅ **Habilite autenticação na Edge Function**
5. ✅ **Monitore uso no GCP Dashboard**

### Verificar Autenticação

A Edge Function verifica:
- Header `Authorization` presente
- Token JWT válido do Supabase
- Usuário autenticado existe

## 🧪 Testar Localmente

### 1. Configurar Ambiente

```bash
# .env.local
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### 2. Iniciar Supabase Local

```bash
supabase start
supabase functions serve transcribe-audio --env-file .env.local
```

### 3. Testar no Navegador

```bash
npm run dev
```

1. Faça login no app
2. Clique no ícone de microfone no chat
3. Permita acesso ao microfone
4. Grave uma mensagem
5. Aguarde transcrição automática

## 🐛 Troubleshooting

### Erro: "Speech API not configured"

**Causa:** Variável `GOOGLE_SPEECH_API_KEY` não configurada

**Solução:**
```bash
# Adicionar no Supabase Dashboard ou .env
GOOGLE_SPEECH_API_KEY=sua_chave_aqui
```

### Erro: "Permissão de microfone negada"

**Causa:** Usuário bloqueou acesso ao microfone

**Solução:**
1. Chrome: `chrome://settings/content/microphone`
2. Permitir para `localhost:8080`
3. Recarregar página

### Erro: "Transcription failed"

**Causas possíveis:**
1. API Key inválida ou expirada
2. API não habilitada no GCP
3. Billing não configurado
4. Quota excedida

**Solução:**
```bash
# Verificar logs da Edge Function
supabase functions logs transcribe-audio

# Verificar quota no GCP
https://console.cloud.google.com/apis/api/speech.googleapis.com/quotas
```

### Áudio muito baixo

**Causa:** Nível de entrada do microfone baixo

**Solução:**
- Falar mais próximo ao microfone
- Aumentar volume de entrada no sistema
- Verificar se microfone está selecionado corretamente

### Erro: "API_KEY_SERVICE_BLOCKED"

**Causa:** A API Key do Google não tem permissão para acessar a Cloud Speech-to-Text API

**Mensagem de erro completa:**
```json
{
  "error": {
    "code": 403,
    "message": "Requests to this API speech.googleapis.com method google.cloud.speech.v1.Speech.Recognize are blocked.",
    "status": "PERMISSION_DENIED",
    "details": [
      {
        "reason": "API_KEY_SERVICE_BLOCKED",
        "domain": "googleapis.com"
      }
    ]
  }
}
```

**Solução:**
1. Acesse [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Localize sua API Key (a mesma definida em `GOOGLE_SPEECH_API_KEY`)
3. Clique em "Edit" (ícone de lápis)
4. Em "API restrictions", escolha uma das opções:
   - **Opção A (Recomendada para produção):** Selecione "Restrict key" e adicione "Cloud Speech-to-Text API" à lista
   - **Opção B (Rápida para testes):** Selecione "Don't restrict key"
5. Clique em "Save"
6. Aguarde ~5 minutos para propagação das mudanças
7. Teste novamente a transcrição

**⚠️ Importante:** Se você tem dois tipos de APIs (v1 e v2), certifique-se de habilitar:
- "Cloud Speech-to-Text API" (v1) - É a que usamos
- ~~"Cloud Speech-to-Text API v2"~~ - Não é necessária

### Loop Infinito de Toasts (Corrigido em v2.1.1)

**Problema:** Após transcrever o primeiro áudio, ao gravar um segundo áudio, múltiplos toasts aparecem em loop:
- "🎤 Gravação iniciada" (repetido)
- "⏳ Processando áudio..." (repetido)
- "🎙️ Transcrevendo áudio..." (repetido)
- "❌ Erro ao transcrever" (repetido)

**Causa Raiz:**
1. O `audioBlob` não era limpo após processamento
2. `useEffect` que monitora `audioBlob` continuava disparando
3. `handleTranscription` era recriado a cada render, causando mais disparos

**Solução (v2.1.1):**
- ✅ Adicionada função `clearAudioBlob()` que é chamada após transcrição
- ✅ Removida dependência `handleTranscription` do useEffect
- ✅ Blob é limpo automaticamente no `finally` block

**Se ainda ocorrer (improvável):**
```bash
# Limpar cache e recarregar
1. Pressione Ctrl+Shift+R (força reload sem cache)
2. Ou limpe cache: F12 → Application → Clear Storage → Clear site data
3. Faça login novamente
```

## 📚 Referências

- [Google Speech-to-Text Docs](https://cloud.google.com/speech-to-text/docs)
- [Speech-to-Text Pricing](https://cloud.google.com/speech-to-text/pricing)
- [Supported Languages](https://cloud.google.com/speech-to-text/docs/languages)
- [Best Practices](https://cloud.google.com/speech-to-text/docs/best-practices)

## 📝 Notas de Implementação

### Arquivos Criados/Modificados

1. ✅ `src/hooks/useAudioRecorder.ts` - Hook de captura de áudio
2. ✅ `src/lib/transcription.ts` - Serviço de transcrição
3. ✅ `supabase/functions/transcribe-audio/index.ts` - Edge Function
4. ✅ `src/components/chat/PromptInputBox.tsx` - UI do chat
5. ✅ `.env.example` - Variável de exemplo

### Features Implementadas

**Core (v2.1.0):**
- ✅ Captura de áudio com MediaRecorder API
- ✅ Feedback visual durante gravação (timer + barras animadas)
- ✅ Tratamento de erros de permissão do microfone
- ✅ Transcrição automática ao finalizar gravação
- ✅ Envio da transcrição como mensagem no chat
- ✅ Toast notifications em português com ícones
- ✅ Confiança da transcrição exibida (confidence score)
- ✅ Otimização de áudio (mono, 128kbps, 48kHz)
- ✅ Verificação de permissões (plano Business/Premium)
- ✅ Edge Function com autenticação JWT
- ✅ Suporte a formato WebM/Opus nativo do navegador

**Melhorias de UI (v2.1.1):**
- ✅ **Botões Separados:** Cancelar (descarta áudio) vs Enviar (transcreve)
- ✅ Estilização visual distinta (vermelho para cancelar, verde para enviar)
- ✅ Feedback tátil com borders e hover states
- ✅ Ícones intuitivos (X para cancelar, Send para enviar)
- ✅ Tooltips explicativos em cada botão

**Correções de Bugs (v2.1.1):**
- ✅ **Loop infinito de toasts corrigido** (bug crítico)
- ✅ Limpeza automática de audioBlob após processamento
- ✅ Flag `wasCancelled` para prevenir processamento de áudio descartado
- ✅ useEffect otimizado para evitar re-renders desnecessários

**Tratamento de Erros:**
- ✅ Permissão de microfone negada (com instruções)
- ✅ Microfone não encontrado ou ocupado
- ✅ Falha na transcrição com retry button
- ✅ API Key bloqueada (com guia de solução)
- ✅ Timeout de rede (com mensagem amigável)

### Próximas Melhorias (Opcional)

**Backend:**
- [ ] Converter para FLAC no backend (requer ffmpeg no Edge Function)
- [ ] Cache de áudio temporário para retry sem regravar
- [ ] Histórico de transcrições no perfil do usuário
- [ ] Estatísticas de uso (minutos transcritos, custo estimado)

**Frontend:**
- [ ] Suporte a múltiplos idiomas com seletor UI (pt-BR, en-US, es-ES)
- [ ] Visualizador de forma de onda FFT em tempo real
- [ ] Atalho de teclado ESC para cancelar gravação
- [ ] Limite de duração configurável por plano (2min Basic, 5min Business, 10min Premium)
- [ ] Preview de áudio antes de enviar para transcrição
- [ ] Indicador de volume/nível do microfone durante gravação

**Otimizações:**
- [ ] Compressão de áudio no frontend antes de enviar
- [ ] Streaming de áudio (enviar chunks durante gravação)
- [ ] Cache de API responses para áudios idênticos
- [ ] Debounce de clicks no botão de microfone
