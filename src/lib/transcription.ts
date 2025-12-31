import { supabase } from '@/integrations/supabase/client';

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  languageCode: string;
  resultsCount: number;
}

export interface TranscriptionError {
  error: string;
  message?: string;
  details?: string;
}

/**
 * Transcreve um Blob ou File de áudio usando Google Speech-to-Text via Edge Function
 * 
 * @param audioBlob - Blob ou File contendo o áudio (WebM, MP3, WAV, FLAC, M4A, OGG, etc)
 * @param languageCode - Código do idioma (padrão: 'pt-BR')
 * @returns Promise com o texto transcrito e metadados
 * @throws Error se a transcrição falhar
 */
export async function transcribeAudio(
  audioBlob: Blob | File,
  languageCode: string = 'pt-BR'
): Promise<TranscriptionResult> {
  try {
    // Converter Blob para Base64
    const base64Audio = await blobToBase64(audioBlob);
    
    // Remover prefixo data:audio/webm;base64, se existir
    const audioData = base64Audio.includes(',') 
      ? base64Audio.split(',')[1] 
      : base64Audio;

    const fileName = audioBlob instanceof File ? audioBlob.name : 'audio';
    
    console.log('Transcribing audio:', {
      fileName,
      size: audioBlob.size,
      type: audioBlob.type,
      languageCode,
      base64Length: audioData.length
    });

    // Chamar Edge Function
    const { data, error } = await supabase.functions.invoke<TranscriptionResult | TranscriptionError>(
      'transcribe-audio',
      {
        body: {
          audioData,
          mimeType: audioBlob.type || 'audio/webm',
          languageCode,
        },
      }
    );

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(`Erro ao transcrever: ${error.message}`);
    }

    if (!data) {
      throw new Error('Resposta vazia da API de transcrição');
    }

    // Verificar se há erro na resposta
    if ('error' in data) {
      const errorData = data as TranscriptionError;
      console.error('Transcription error:', errorData);
      
      // Mensagens de erro mais amigáveis
      if (errorData.message?.includes('muito baixo')) {
        throw new Error('Não foi possível detectar fala no áudio. Tente falar mais alto.');
      }
      
      throw new Error(errorData.message || errorData.error || 'Erro ao transcrever áudio');
    }

    const result = data as TranscriptionResult;

    // Validar resultado
    if (!result.transcript || result.transcript.trim().length === 0) {
      throw new Error('Nenhuma fala foi detectada no áudio. Tente novamente.');
    }

    console.log('Transcription successful:', {
      transcript: result.transcript.substring(0, 50) + '...',
      confidence: result.confidence,
      resultsCount: result.resultsCount
    });

    return result;

  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Erro desconhecido ao transcrever áudio');
  }
}

/**
 * Converte um Blob para string Base64
 * @param blob - Blob a ser convertido
 * @returns Promise com a string Base64 (com prefixo data:)
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading blob'));
    };
    
    reader.readAsDataURL(blob);
  });
}

/**
 * Valida se o navegador suporta gravação de áudio
 * @returns true se suportar, false caso contrário
 */
export function isAudioRecordingSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    window.MediaRecorder
  );
}

/**
 * Verifica se o usuário já concedeu permissão para o microfone
 * @returns Promise com o estado da permissão
 */
export async function checkMicrophonePermission(): Promise<PermissionState | null> {
  try {
    if (!navigator.permissions) {
      return null;
    }
    
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state;
  } catch (error) {
    console.warn('Could not check microphone permission:', error);
    return null;
  }
}
