import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: (cancel?: boolean) => void;
  clearAudioBlob: () => void;
  error: string | null;
  clearError: () => void;
  wasCancelled: boolean;
}

/**
 * Hook para capturar áudio usando MediaRecorder API
 * Captura em formato WebM/Opus para posterior conversão otimizada
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [wasCancelled, setWasCancelled] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cancelledRef = useRef<boolean>(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setWasCancelled(false);
      cancelledRef.current = false;
      chunksRef.current = [];

      // Solicitar permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000, // Otimizado para transcrição
        }
      });

      streamRef.current = stream;

      // Criar MediaRecorder com formato WebM/Opus
      // Será convertido para FLAC no backend para melhor qualidade com Google
      const mimeType = 'audio/webm;codecs=opus';
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error('Formato de áudio não suportado pelo navegador');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000, // 128kbps - bom equilíbrio qualidade/tamanho
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Se foi cancelado, não salvar o blob
        if (cancelledRef.current) {
          setAudioBlob(null);
          setWasCancelled(true);
        } else {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          setWasCancelled(false);
        }
        
        // Parar timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Liberar stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('Erro no MediaRecorder:', event);
        setError('Erro ao gravar áudio');
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Iniciar gravação
      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Atualizar duração a cada segundo
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 1000);

    } catch (err) {
      console.error('Erro ao iniciar gravação:', err);
      
      // Tratamento específico para erro de permissão
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Permissão de microfone negada. Por favor, permita o acesso ao microfone nas configurações do navegador.');
        } else if (err.name === 'NotFoundError') {
          setError('Nenhum microfone encontrado. Verifique se um microfone está conectado.');
        } else if (err.name === 'NotReadableError') {
          setError('Não foi possível acessar o microfone. Ele pode estar sendo usado por outro aplicativo.');
        } else {
          setError(`Erro ao acessar microfone: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro desconhecido ao acessar microfone');
      }
      
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback((cancel: boolean = false) => {
    if (mediaRecorderRef.current && isRecording) {
      // Definir flag de cancelamento antes de parar
      cancelledRef.current = cancel;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const clearAudioBlob = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
  }, []);

  return {
    isRecording,
    audioBlob,
    duration,
    startRecording,
    stopRecording,
    clearAudioBlob,
    error,
    clearError,
    wasCancelled,
  };
}
