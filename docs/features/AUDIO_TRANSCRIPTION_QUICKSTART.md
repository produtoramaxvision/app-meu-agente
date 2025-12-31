# 🎤 Guia Rápido: Transcrição de Áudio no Chat

## ✅ Implementação Concluída

A funcionalidade de transcrição de áudio usando **Google Cloud Speech-to-Text** foi implementada com sucesso!

## 📦 Arquivos Criados/Modificados

### Frontend
- ✅ [`src/hooks/useAudioRecorder.ts`](../src/hooks/useAudioRecorder.ts) - Hook para captura de áudio
- ✅ [`src/lib/transcription.ts`](../src/lib/transcription.ts) - Serviço de transcrição
- ✅ [`src/components/chat/PromptInputBox.tsx`](../src/components/chat/PromptInputBox.tsx) - Componente do chat atualizado

### Backend
- ✅ [`supabase/functions/transcribe-audio/index.ts`](../../supabase/functions/transcribe-audio/index.ts) - Edge Function

### Configuração
- ✅ [`.env.example`](../../.env.example) - Variável `VITE_GOOGLE_SPEECH_API_KEY` adicionada
- ✅ [`docs/features/AUDIO_TRANSCRIPTION_GOOGLE.md`](./AUDIO_TRANSCRIPTION_GOOGLE.md) - Documentação completa

## 🚀 Como Usar

### 1. Configurar API Key

#### Obter Chave do Google Cloud:
1. Acesse: https://console.cloud.google.com/
2. Crie/selecione um projeto
3. Habilite **Cloud Speech-to-Text API**
4. Crie uma **API Key** em "Credentials"
5. Copie a chave gerada

#### Configurar no Supabase:
```bash
# Via Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Settings > Edge Functions > Environment Variables
4. Adicione:
   Name: GOOGLE_SPEECH_API_KEY
   Value: [sua chave aqui]
```

### 2. Deploy da Edge Function

```bash
# No terminal, na raiz do projeto:
supabase functions deploy transcribe-audio
```

✅ **Deploy concluído com sucesso!** A função está ativa e validando JWT automaticamente.

### 3. Testar no App

```bash
# Iniciar servidor de desenvolvimento
npm run dev
```

1. Faça login no app
2. Vá para o chat
3. Clique no ícone de **microfone** 🎤 (canto inferior direito)
4. **Permita** acesso ao microfone quando solicitado
5. Fale sua mensagem
6. Clique novamente para **parar** a gravação
7. Aguarde alguns segundos
8. ✅ Sua mensagem será transcrita e enviada automaticamente!

## 🎯 Funcionalidades Implementadas

### Captura de Áudio
- ✅ Gravação em formato WebM/Opus (otimizado)
- ✅ Timer visual durante gravação
- ✅ Visualizador de áudio com barras animadas
- ✅ Indicador pulsante vermelho
- ✅ Otimizações de qualidade:
  - Echo cancellation
  - Noise suppression
  - Auto gain control
  - 128kbps, mono, 48kHz

### Transcrição
- ✅ Google Speech-to-Text API v1
- ✅ Idioma: Português Brasil (pt-BR)
- ✅ Pontuação automática
- ✅ Modelo aprimorado (enhanced)
- ✅ Confiança da transcrição exibida
- ✅ Processamento no backend (seguro)

### Experiência do Usuário
- ✅ Feedback visual durante todas as etapas:
  - 🎤 "Gravação iniciada"
  - ⏳ "Processando áudio..."
  - 🎙️ "Transcrevendo áudio..."
  - ✅ "Áudio transcrito com 95% de confiança"
- ✅ Tratamento de erros amigável:
  - Permissão de microfone negada
  - Microfone não encontrado
  - Microfone em uso por outro app
  - Erro de transcrição
- ✅ Restrição por plano (Business/Premium)
- ✅ Botão de retry em caso de erro

## 🎨 UI/UX

### Estados do Botão de Microfone

| Estado | Visual | Descrição |
|--------|--------|-----------|
| **Idle** | 🎤 (cinza) | Pronto para gravar |
| **Hover** | 🎤 (azul) | Destaque ao passar mouse |
| **Recording** | 🔴 (vermelho pulsante) | Gravando áudio |
| **Transcribing** | 🔵 (azul) | Processando transcrição |
| **Locked** | 🔒 (com tooltip) | Plano não permite |

### Borda do Input

- **Normal:** Cinza (#444444)
- **Gravando:** Vermelho (#ef4444/70)
- **Transcrevendo:** Azul (#3b82f6/70)

## 📊 Custos Estimados

### Google Speech-to-Text
- **Grátis:** 60 minutos/mês
- **Modelo padrão:** $0.006 por 15 segundos
- **Modelo aprimorado:** $0.009 por 15 segundos (usando este)

### Exemplo de Uso
100 mensagens de 30s cada = 50 minutos
- **Custo mensal:** ~$1.80
- **Por mensagem:** ~$0.018

💡 Muito acessível para a maioria dos casos de uso!

## 🐛 Troubleshooting

### "Permissão de microfone negada"
**Solução:**
1. Chrome: Clique no ícone de cadeado na barra de endereço
2. Permitir acesso ao microfone
3. Recarregar a página

### "Speech API not configured"
**Solução:**
Verifique se `GOOGLE_SPEECH_API_KEY` foi configurada no Supabase Dashboard

### "Nenhuma fala foi detectada"
**Possíveis causas:**
- Volume do microfone muito baixo
- Silêncio durante gravação
- Ruído ambiente muito alto

**Solução:**
- Falar mais próximo ao microfone
- Verificar nível de entrada no sistema
- Tentar novamente em ambiente mais silencioso

## 📚 Documentação Completa

Para informações detalhadas sobre configuração, segurança e otimizações, consulte:

👉 [AUDIO_TRANSCRIPTION_GOOGLE.md](./AUDIO_TRANSCRIPTION_GOOGLE.md)

## ✨ Próximos Passos (Opcional)

### Melhorias Futuras
- [ ] Seletor de idioma na UI
- [ ] Converter para FLAC no backend (melhor qualidade)
- [ ] Cache de áudio para retry
- [ ] Histórico de transcrições
- [ ] Limite de duração configurável
- [ ] Cancelar gravação (ESC)
- [ ] Suporte a áudio de upload (não só gravação)

### Integrações
- [ ] Salvar áudio original no Supabase Storage
- [ ] Análise de sentimento da transcrição
- [ ] Tradução automática para outros idiomas
- [ ] Integração com n8n para processar áudio

## 🎉 Pronto!

Sua funcionalidade de transcrição de áudio está **100% operacional**!

Basta configurar a API key e fazer o deploy da Edge Function.

---

**Dúvidas?** Consulte a [documentação completa](./AUDIO_TRANSCRIPTION_GOOGLE.md) ou os comentários no código.
