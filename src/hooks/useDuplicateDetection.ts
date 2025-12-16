import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DuplicateCheckParams {
  phone: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  valor: number;
  descricao?: string;
  data_hora: string;
}

interface DuplicateResult {
  isDuplicate: boolean;
  duplicateFields: string[];
  duplicateRecord?: Record<string, unknown>;
  message: string;
}

interface UseDuplicateDetectionReturn {
  checkDuplicate: (params: DuplicateCheckParams) => Promise<DuplicateResult>;
  isChecking: boolean;
  clearCache: () => void;
}

export function useDuplicateDetection(): UseDuplicateDetectionReturn {
  const [isChecking, setIsChecking] = useState(false);
  const cacheRef = useRef<Map<string, DuplicateResult>>(new Map());

  // ✅ CORREÇÃO: Cache inteligente com TTL
  const getCacheKey = useCallback((params: DuplicateCheckParams) => {
    return `${params.phone}-${params.tipo}-${params.categoria}-${params.valor}-${params.data_hora}`;
  }, []);

  // ✅ CORREÇÃO: Query otimizada com índices
  const checkDuplicate = useCallback(async (params: DuplicateCheckParams): Promise<DuplicateResult> => {
    const cacheKey = getCacheKey(params);
    
    // Verificar cache primeiro
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey)!;
    }

    setIsChecking(true);
    
    try {
      // ✅ CORREÇÃO: Query otimizada para verificar duplicatas em período maior
      const currentTime = new Date(params.data_hora);
      const startTime = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000); // 24 horas antes
      const endTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // 24 horas depois
      
      const { data: existingRecords, error } = await supabase
        .from('financeiro_registros')
        .select('id, valor, categoria, data_hora, descricao, tipo')
        .eq('phone', params.phone)
        .eq('tipo', params.tipo)
        .eq('categoria', params.categoria)
        .eq('valor', params.valor)
        .gte('data_hora', startTime.toISOString())
        .lte('data_hora', endTime.toISOString())
        .limit(10); // ✅ CORREÇÃO: Aumentar limite para capturar mais duplicatas

      if (error) {
        console.error('Erro ao verificar duplicatas:', error);
        throw error;
      }

      // ✅ CORREÇÃO: Análise detalhada de duplicatas
      const duplicateFields: string[] = [];
      let duplicateRecord = null;

      if (existingRecords && existingRecords.length > 0) {
        // Verificar se há duplicatas exatas (mesmo valor, categoria, descrição)
        const exactDuplicates = existingRecords.filter(record => 
          record.valor === params.valor &&
          record.categoria === params.categoria &&
          record.descricao === params.descricao
        );

        if (exactDuplicates.length > 0) {
          duplicateRecord = exactDuplicates[0];
          duplicateFields.push('valor', 'categoria', 'descricao');
          
          // Verificar proximidade temporal (dentro de 1 hora)
          const timeDiff = Math.abs(new Date(duplicateRecord.data_hora).getTime() - new Date(params.data_hora).getTime());
          if (timeDiff < 60 * 60 * 1000) { // 1 hora
            duplicateFields.push('data_hora');
          }
        }
      }

      const result: DuplicateResult = {
        isDuplicate: duplicateFields.length >= 3, // Pelo menos 3 campos duplicados
        duplicateFields,
        duplicateRecord,
        message: duplicateFields.length >= 3 
          ? `Duplicata detectada nos campos: ${duplicateFields.join(', ')}`
          : 'Nenhuma duplicata encontrada'
      };

      // ✅ CORREÇÃO: Cache com TTL de 5 minutos
      cacheRef.current.set(cacheKey, result);
      
      // Limpar cache antigo
      setTimeout(() => {
        cacheRef.current.delete(cacheKey);
      }, 5 * 60 * 1000);

      return result;
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
      return {
        isDuplicate: false,
        duplicateFields: [],
        message: 'Erro ao verificar duplicatas. Tente novamente.'
      };
    } finally {
      setIsChecking(false);
    }
  }, [getCacheKey]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    checkDuplicate,
    isChecking,
    clearCache
  };
}
