/**
 * Optimized Financial Data Hook
 * Hook otimizado para dados financeiros com paginação e cache
 * 
 * Melhorias:
 * - Paginação automática
 * - Cache inteligente
 * - Performance monitoring
 * - Retry automático
 */

import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePaginatedData, useCachedQuery, useRetryQuery } from './useOptimizedQueries';
import { usePerformanceScan } from '@/lib/performance-monitor';

export interface FinancialRecord {
  id: number;
  phone: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  valor: number;
  descricao: string | null;
  data_hora: string;
  created_at: string;
  status: string | null;
  data_vencimento: string | null;
  recorrente: boolean | null;
  recorrencia_fim: string | null;
  updated_at: string | null;
}

export interface DailyData {
  date: string;
  entradas: number;
  saidas: number;
}

export interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  entradas: number;
  saidas: number;
}

export interface FinancialMetrics {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  totalTransacoes: number;
}

// Hook otimizado para dados financeiros paginados
export function useOptimizedFinancialData(
  periodDays?: number,
  categoryFilter?: string,
  typeFilter?: 'entrada' | 'saida' | 'all',
  pageSize: number = 20
) {
  const { user } = useAuth();
  
  // Monitorar performance deste hook
  usePerformanceScan('useOptimizedFinancialData');

  // Query function para dados paginados
  const fetchFinancialRecords = useCallback(async (offset: number, limit: number): Promise<FinancialRecord[]> => {
    if (!user?.phone) return [];

    let query = supabase
      .from('financeiro_registros')
      .select('*')
      .eq('phone', user.phone)
      .order('data_hora', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (periodDays) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      query = query.gte('data_hora', startDate.toISOString());
    }

    if (categoryFilter) {
      query = query.eq('categoria', categoryFilter);
    }

    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('tipo', typeFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching financial records:', error);
      throw error;
    }

    return data || [];
  }, [user?.phone, periodDays, categoryFilter, typeFilter]);

  // Usar hook paginado otimizado
  const {
    data: records,
    loading: recordsLoading,
    hasMore: hasMoreRecords,
    error: recordsError,
    loadMore: loadMoreRecords,
    refresh: refreshRecords,
    isStale: recordsStale,
  } = usePaginatedData(fetchFinancialRecords, pageSize, {
    enabled: !!user?.phone,
    staleTime: 2 * 60 * 1000, // 2 minutos
    retry: 3,
  });

  // Hook otimizado para métricas (com cache)
  const fetchMetrics = useCallback(async (): Promise<FinancialMetrics> => {
    if (!user?.phone) {
      return { totalReceitas: 0, totalDespesas: 0, saldo: 0, totalTransacoes: 0 };
    }

    let query = supabase
      .from('financeiro_registros')
      .select('tipo, valor')
      .eq('phone', user.phone);

    if (periodDays) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      query = query.gte('data_hora', startDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }

    const metrics = data?.reduce(
      (acc, record) => {
        if (record.tipo === 'entrada') {
          acc.totalReceitas += record.valor;
        } else {
          acc.totalDespesas += record.valor;
        }
        acc.totalTransacoes += 1;
        return acc;
      },
      { totalReceitas: 0, totalDespesas: 0, saldo: 0, totalTransacoes: 0 }
    ) || { totalReceitas: 0, totalDespesas: 0, saldo: 0, totalTransacoes: 0 };

    metrics.saldo = metrics.totalReceitas - metrics.totalDespesas;

    return metrics;
  }, [user?.phone, periodDays]);

  const {
    data: metrics,
    loading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useCachedQuery('financial-metrics', fetchMetrics, {
    enabled: !!user?.phone,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
  });

  // Hook otimizado para dados diários (com retry)
  const fetchDailyData = useCallback(async (): Promise<DailyData[]> => {
    if (!user?.phone) return [];

    let query = supabase
      .from('financeiro_registros')
      .select('data_hora, tipo, valor')
      .eq('phone', user.phone)
      .order('data_hora', { ascending: true });

    if (periodDays) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      query = query.gte('data_hora', startDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching daily data:', error);
      throw error;
    }

    // Agrupar por data
    const dailyMap = new Map<string, DailyData>();

    data?.forEach(record => {
      const date = record.data_hora.split('T')[0];
      const existing = dailyMap.get(date) || { date, entradas: 0, saidas: 0 };
      
      if (record.tipo === 'entrada') {
        existing.entradas += record.valor;
      } else {
        existing.saidas += record.valor;
      }
      
      dailyMap.set(date, existing);
    });

    return Array.from(dailyMap.values());
  }, [user?.phone, periodDays]);

  const {
    data: dailyData,
    loading: dailyDataLoading,
    error: dailyDataError,
    retry: retryDailyData,
  } = useRetryQuery(fetchDailyData, {
    enabled: !!user?.phone,
    retryCount: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      // Retry apenas para erros de rede, não para erros de dados
      return error.message.includes('network') || error.message.includes('timeout');
    },
  });

  // Hook otimizado para dados de categoria
  const fetchCategoryData = useCallback(async (): Promise<CategoryData[]> => {
    if (!user?.phone) return [];

    let query = supabase
      .from('financeiro_registros')
      .select('categoria, valor')
      .eq('phone', user.phone);

    if (periodDays) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      query = query.gte('data_hora', startDate.toISOString());
    }

    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('tipo', typeFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching category data:', error);
      throw error;
    }

    // Agrupar por categoria
    const categoryMap = new Map<string, number>();

    data?.forEach(record => {
      const existing = categoryMap.get(record.categoria) || 0;
      categoryMap.set(record.categoria, existing + record.valor);
    });

    const total = Array.from(categoryMap.values()).reduce((sum, value) => sum + value, 0);

    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }, [user?.phone, periodDays, typeFilter]);

  const {
    data: categoryData,
    loading: categoryDataLoading,
    error: categoryDataError,
    refetch: refetchCategoryData,
  } = useCachedQuery('category-data', fetchCategoryData, {
    enabled: !!user?.phone,
    staleTime: 3 * 60 * 1000, // 3 minutos
    retry: 2,
  });

  // Estados computados
  const loading = recordsLoading || metricsLoading || dailyDataLoading || categoryDataLoading;
  const error = recordsError || metricsError || dailyDataError || categoryDataError;

  // Função para refresh completo
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshRecords(),
      refetchMetrics(),
      retryDailyData(),
      refetchCategoryData(),
    ]);
  }, [refreshRecords, refetchMetrics, retryDailyData, refetchCategoryData]);

  // Memoizar dados para evitar re-renders desnecessários
  const memoizedData = useMemo(() => ({
    records: records || [],
    metrics: metrics || { totalReceitas: 0, totalDespesas: 0, saldo: 0, totalTransacoes: 0 },
    dailyData: dailyData || [],
    categoryData: categoryData || [],
  }), [records, metrics, dailyData, categoryData]);

  return {
    ...memoizedData,
    loading,
    error,
    hasMoreRecords,
    loadMoreRecords,
    refreshAll,
    recordsStale,
    // Funções individuais para refresh
    refreshRecords,
    refetchMetrics,
    retryDailyData,
    refetchCategoryData,
  };
}

// Hook simplificado para métricas rápidas (sem paginação)
export function useQuickFinancialMetrics(periodDays?: number) {
  const { user } = useAuth();
  
  usePerformanceScan('useQuickFinancialMetrics');

  const fetchQuickMetrics = useCallback(async (): Promise<FinancialMetrics> => {
    if (!user?.phone) {
      return { totalReceitas: 0, totalDespesas: 0, saldo: 0, totalTransacoes: 0 };
    }

    let query = supabase
      .from('financeiro_registros')
      .select('tipo, valor')
      .eq('phone', user.phone);

    if (periodDays) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      query = query.gte('data_hora', startDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching quick metrics:', error);
      throw error;
    }

    const metrics = data?.reduce(
      (acc, record) => {
        if (record.tipo === 'entrada') {
          acc.totalReceitas += record.valor;
        } else {
          acc.totalDespesas += record.valor;
        }
        acc.totalTransacoes += 1;
        return acc;
      },
      { totalReceitas: 0, totalDespesas: 0, saldo: 0, totalTransacoes: 0 }
    ) || { totalReceitas: 0, totalDespesas: 0, saldo: 0, totalTransacoes: 0 };

    metrics.saldo = metrics.totalReceitas - metrics.totalDespesas;

    return metrics;
  }, [user?.phone, periodDays]);

  return useCachedQuery('quick-metrics', fetchQuickMetrics, {
    enabled: !!user?.phone,
    staleTime: 1 * 60 * 1000, // 1 minuto
    retry: 2,
  });
}
