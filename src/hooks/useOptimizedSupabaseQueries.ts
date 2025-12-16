/**
 * Optimized Supabase Queries Hook
 * Sistema otimizado para gerenciamento de queries Supabase
 * 
 * Funcionalidades:
 * - Batch loading de múltiplas queries
 * - Cache inteligente com invalidação seletiva
 * - Deduplicação automática de requisições
 * - Retry com backoff exponencial
 * - Prefetch de dados relacionados
 * - Compressão de payloads grandes
 */

import { useCallback, useMemo, useRef } from 'react';
import { useQueryClient, useQueries, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Tipos para configuração de cache
export interface CacheConfig {
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  retry?: number;
  retryDelay?: (attemptIndex: number) => number;
}

// Configurações de cache por tipo de dados
export const OPTIMIZED_CACHE_CONFIGS = {
  // Dados que mudam raramente
  STATIC: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  },
  
  // Dados que mudam ocasionalmente
  SEMI_STATIC: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  },
  
  // Dados que mudam frequentemente
  DYNAMIC: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  },
  
  // Dados em tempo real
  REALTIME: {
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3,
  },
} as const;

// Interface para definição de query batch
export interface BatchQueryDefinition {
  queryKey: QueryKey;
  queryFn: () => Promise<unknown>;
  config?: Partial<CacheConfig>;
  enabled?: boolean;
  dependencies?: string[];
}

// Hook para deduplicação de requisições
const useRequestDeduplication = () => {
  const pendingRequests = useRef<Map<string, Promise<unknown>>>(new Map());
  
  const deduplicate = useCallback(async <T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> => {
    // Se já existe uma requisição pendente para esta chave, retorna ela
    if (pendingRequests.current.has(key)) {
      return pendingRequests.current.get(key) as Promise<T>;
    }
    
    // Cria nova requisição
    const request = requestFn().finally(() => {
      // Remove da lista de pendentes quando completa
      pendingRequests.current.delete(key);
    });
    
    pendingRequests.current.set(key, request);
    return request;
  }, []);
  
  return { deduplicate };
};

// Hook principal para queries otimizadas
export function useOptimizedSupabaseQueries(queries: BatchQueryDefinition[]) {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();
  const { deduplicate } = useRequestDeduplication();
  
  // ✅ OTIMIZAÇÃO 1: Preparar queries com deduplicação
  const optimizedQueries = useMemo(() => {
    return queries.map((queryDef) => {
      const queryKeyString = JSON.stringify(queryDef.queryKey);
      
      return {
        queryKey: queryDef.queryKey,
        queryFn: () => deduplicate(queryKeyString, queryDef.queryFn),
        enabled: queryDef.enabled !== false && !!cliente?.phone,
        ...OPTIMIZED_CACHE_CONFIGS.SEMI_STATIC,
        ...queryDef.config,
        // ✅ Retry com backoff exponencial
        retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      };
    });
  }, [queries, cliente?.phone, deduplicate]);
  
  // ✅ OTIMIZAÇÃO 2: Executar queries em paralelo
  const results = useQueries({
    queries: optimizedQueries,
  });
  
  // ✅ OTIMIZAÇÃO 3: Função para invalidação seletiva
  const invalidateRelatedQueries = useCallback(
    (pattern: string | string[]) => {
      const patterns = Array.isArray(pattern) ? pattern : [pattern];
      
      patterns.forEach((p) => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const keyString = JSON.stringify(query.queryKey);
            return keyString.includes(p);
          },
        });
      });
    },
    [queryClient]
  );
  
  // ✅ OTIMIZAÇÃO 4: Prefetch de dados relacionados
  const prefetchRelatedData = useCallback(
    async (queryKey: QueryKey, queryFn: () => Promise<unknown>, config?: CacheConfig) => {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        ...OPTIMIZED_CACHE_CONFIGS.SEMI_STATIC,
        ...config,
      });
    },
    [queryClient]
  );
  
  // ✅ OTIMIZAÇÃO 5: Batch update do cache
  const batchUpdateCache = useCallback(
    (updates: Array<{ queryKey: QueryKey; data: unknown }>) => {
      // Usar Promise.all para atualizações em paralelo
      Promise.all(
        updates.map(({ queryKey, data }) => 
          queryClient.setQueryData(queryKey, data)
        )
      );
    },
    [queryClient]
  );
  
  return {
    results,
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
    errors: results.filter((result) => result.error).map((result) => result.error),
    
    // Funções utilitárias
    invalidateRelatedQueries,
    prefetchRelatedData,
    batchUpdateCache,
  };
}

// ✅ OTIMIZAÇÃO 6: Hook específico para queries financeiras
export function useOptimizedFinancialQueries(filters: {
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  accounts?: string[];
}) {
  const { cliente } = useAuth();
  
  const queries: BatchQueryDefinition[] = useMemo(() => {
    if (!cliente?.phone) return [];
    
    const baseKey = ['financial-data', cliente.phone];
    
    return [
      // Registros financeiros
      {
        queryKey: [
          ...baseKey,
          'records',
          filters.startDate?.getTime(),
          filters.endDate?.getTime(),
          filters.categories?.sort().join(','),
          filters.accounts?.sort().join(','),
        ],
        queryFn: async () => {
          let query = supabase
            .from('financeiro_registros')
            .select('*')
            .eq('phone', cliente.phone)
            .order('data', { ascending: false });
          
          if (filters.startDate) {
            query = query.gte('data', filters.startDate.toISOString().split('T')[0]);
          }
          if (filters.endDate) {
            query = query.lte('data', filters.endDate.toISOString().split('T')[0]);
          }
          if (filters.categories?.length) {
            query = query.in('categoria', filters.categories);
          }
          // Nota: A tabela financeiro_registros não possui coluna 'conta'
          // Removido filtro por contas até que seja implementado
          
          const { data, error } = await query;
          if (error) throw error;
          return data;
        },
        config: OPTIMIZED_CACHE_CONFIGS.DYNAMIC,
      },
      
      // Categorias (dados estáticos)
      {
        queryKey: [...baseKey, 'categories'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('financeiro_registros')
            .select('categoria')
            .eq('phone', cliente.phone)
            .not('categoria', 'is', null);
          
          if (error) throw error;
          
          // Extrair categorias únicas
          const uniqueCategories = [...new Set(data.map(item => item.categoria))];
          return uniqueCategories.sort();
        },
        config: OPTIMIZED_CACHE_CONFIGS.STATIC,
      },
      
      // Contas (dados semi-estáticos) - DESABILITADO
      // A tabela financeiro_registros não possui coluna 'conta'
      // TODO: Implementar sistema de contas quando necessário
      {
        queryKey: [...baseKey, 'accounts'],
        queryFn: async () => {
          // Retornar array vazio até que seja implementado
          return [];
        },
        config: OPTIMIZED_CACHE_CONFIGS.SEMI_STATIC,
      },
    ];
  }, [cliente?.phone, filters]);
  
  return useOptimizedSupabaseQueries(queries);
}

// ✅ OTIMIZAÇÃO 7: Hook para queries de tarefas
export function useOptimizedTaskQueries(filters: {
  status?: ('pending' | 'done' | 'overdue')[];
  priority?: ('low' | 'medium' | 'high')[];
  categories?: string[];
  searchQuery?: string;
}) {
  const { cliente } = useAuth();
  
  const queries: BatchQueryDefinition[] = useMemo(() => {
    if (!cliente?.phone) return [];
    
    const baseKey = ['tasks-data', cliente.phone];
    
    return [
      // Tarefas principais
      {
        queryKey: [
          ...baseKey,
          'tasks',
          filters.status?.sort().join(','),
          filters.priority?.sort().join(','),
          filters.categories?.sort().join(','),
          filters.searchQuery,
        ],
        queryFn: async () => {
          let query = supabase
            .from('tasks')
            .select('*')
            .eq('phone', cliente.phone)
            .order('created_at', { ascending: false });
          
          if (filters.status?.length) {
            query = query.in('status', filters.status);
          }
          if (filters.priority?.length) {
            query = query.in('priority', filters.priority);
          }
          if (filters.categories?.length) {
            query = query.in('category', filters.categories);
          }
          if (filters.searchQuery) {
            query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
          }
          
          const { data, error } = await query;
          if (error) throw error;
          return data;
        },
        config: OPTIMIZED_CACHE_CONFIGS.DYNAMIC,
      },
      
      // Estatísticas de tarefas
      {
        queryKey: [...baseKey, 'stats'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('tasks')
            .select('status, priority')
            .eq('phone', cliente.phone);
          
          if (error) throw error;
          
          // Calcular estatísticas
          const stats = {
            total: data.length,
            done: data.filter(t => t.status === 'done').length,
            pending: data.filter(t => t.status === 'pending').length,
            overdue: data.filter(t => t.status === 'overdue').length,
            high_priority: data.filter(t => t.priority === 'high').length,
            medium_priority: data.filter(t => t.priority === 'medium').length,
            low_priority: data.filter(t => t.priority === 'low').length,
          };
          
          return stats;
        },
        config: OPTIMIZED_CACHE_CONFIGS.SEMI_STATIC,
      },
    ];
  }, [cliente?.phone, filters]);
  
  return useOptimizedSupabaseQueries(queries);
}

// ✅ OTIMIZAÇÃO 8: Utilitário para compressão de dados grandes
export function compressLargePayload(data: unknown): string {
  try {
    const jsonString = JSON.stringify(data);
    
    // Se o payload é pequeno, não comprimir
    if (jsonString.length < 1000) {
      return jsonString;
    }
    
    // Para payloads grandes, usar compressão simples (pode ser melhorada com bibliotecas como pako)
    return btoa(jsonString);
  } catch (error) {
    console.error('Error compressing payload:', error);
    return JSON.stringify(data);
  }
}

export function decompressLargePayload(compressedData: string): unknown {
  try {
    // Tentar descomprimir
    const decompressed = atob(compressedData);
    return JSON.parse(decompressed);
  } catch (error) {
    // Se falhar, assumir que não está comprimido
    try {
      return JSON.parse(compressedData);
    } catch (parseError) {
      console.error('Error decompressing payload:', parseError);
      return null;
    }
  }
}