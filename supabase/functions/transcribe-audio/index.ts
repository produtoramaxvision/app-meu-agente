/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-csrf-token',
};

interface TranscribeRequest {
  audioData: string; // Base64 encoded audio
  mimeType?: string;
  languageCode?: string;
}

/**
 * Edge Function para transcrever áudio usando Google Cloud Speech-to-Text
 * 
 * Recebe áudio em múltiplos formatos (WebM, MP3, WAV, FLAC, OGG) e 
 * transcreve usando a API do Google com configurações otimizadas para pt-BR
 * 
 * Formatos suportados:
 * - WebM/Opus (gravação do navegador)
 * - MP3 (upload de arquivo)
 * - WAV/PCM (upload de arquivo)
 * - FLAC (recomendado, melhor qualidade)
 * - OGG/Opus (upload de arquivo)
 * 
 * Formatos NÃO suportados (API v1):
 * - M4A/AAC (requer conversão prévia ou uso da API v2)
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ✅ JWT já foi validado pelo Supabase (verify_jwt: true)
    // Não precisa fazer validação manual aqui!
    
    // Parse request body
    const { audioData, mimeType = 'audio/webm', languageCode = 'pt-BR' }: TranscribeRequest = await req.json();

    if (!audioData) {
      return new Response(
        JSON.stringify({ error: 'Missing audioData' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter API Key do Google
    const googleApiKey = Deno.env.get('GOOGLE_SPEECH_API_KEY');
    if (!googleApiKey) {
      console.error('GOOGLE_SPEECH_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Speech API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing audio transcription, language: ${languageCode}, mimeType: ${mimeType}`);

    // Converter base64 para bytes
    const audioBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    
    // Determinar encoding baseado no mimeType
    let encoding = 'WEBM_OPUS';
    let sampleRateHertz = 48000; // WebM/Opus padrão
    
    if (mimeType.includes('webm')) {
      encoding = 'WEBM_OPUS';
      sampleRateHertz = 48000;
    } else if (mimeType.includes('flac')) {
      encoding = 'FLAC';
      sampleRateHertz = 16000;
    } else if (mimeType.includes('wav') || mimeType.includes('wave')) {
      encoding = 'LINEAR16';
      sampleRateHertz = 16000;
    } else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
      encoding = 'MP3';
      sampleRateHertz = 16000; // Será ajustado automaticamente pela API
    } else if (mimeType.includes('ogg') || mimeType.includes('opus')) {
      encoding = 'OGG_OPUS';
      sampleRateHertz = 16000;
    } else if (mimeType.includes('m4a') || mimeType.includes('mp4') || mimeType.includes('aac')) {
      // M4A/AAC não são diretamente suportados pela API v1
      // Tentaremos usar LINEAR16 como fallback ou retornar erro
      console.warn('M4A/AAC format detected. API v1 does not support it directly. Consider using v2 API or converting to FLAC/WAV.');
      return new Response(
        JSON.stringify({ 
          error: 'Unsupported format',
          message: 'Formato M4A/AAC não é suportado diretamente. Por favor, use MP3, WAV, FLAC, OGG ou WebM.',
          details: 'Consider converting the audio to a supported format like FLAC or WAV.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Formato desconhecido, tentar WebM como padrão
      console.warn(`Unknown mime type: ${mimeType}. Defaulting to WEBM_OPUS`);
      encoding = 'WEBM_OPUS';
      sampleRateHertz = 48000;
    }

    // Preparar request para Google Speech-to-Text API v1
    const googleRequest = {
      config: {
        encoding,
        sampleRateHertz,
        languageCode,
        enableAutomaticPunctuation: true,
        model: 'default',
        useEnhanced: true, // Usar modelo aprimorado quando disponível
        // Configurações para melhor qualidade
        audioChannelCount: 1,
        enableSeparateRecognitionPerChannel: false,
        profanityFilter: false,
        enableWordConfidence: true,
        enableWordTimeOffsets: false,
      },
      audio: {
        content: audioData, // Base64 string
      },
    };

    console.log('Calling Google Speech-to-Text API...');

    // Chamar Google Cloud Speech-to-Text API
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', response.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Transcription failed', 
          details: errorText,
          status: response.status 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    console.log('Google API response:', JSON.stringify(result, null, 2));

    // Extrair transcrição
    if (!result.results || result.results.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No transcription found',
          transcript: '',
          message: 'O áudio pode estar muito baixo ou sem fala detectável'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Concatenar todas as transcrições
    const transcript = result.results
      .map((r: any) => r.alternatives[0]?.transcript || '')
      .join(' ')
      .trim();

    // Calcular confiança média
    const confidence = result.results.reduce((sum: number, r: any) => {
      return sum + (r.alternatives[0]?.confidence || 0);
    }, 0) / result.results.length;

    console.log(`Transcription successful: "${transcript.substring(0, 50)}..." (confidence: ${confidence.toFixed(2)})`);

    return new Response(
      JSON.stringify({
        transcript,
        confidence,
        languageCode,
        resultsCount: result.results.length,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in transcribe-audio function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
