import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';
import { useFinancialRecords } from './useFinancialRecords';

export interface Goal {
  id: string;
  phone: string;
  titulo: string;
  icone: string | null;
  valor_atual: number;
  valor_meta: number;
  prazo_meses: number | null;
  meta_principal: boolean;
  created_at: string;
}

/**
 * ✅ HOOK CONSOLIDADO PARA METAS - Solução para Loop Infinito de v1/metas
 * 
 * PROBLEMA IDENTIFICADO:
 * - useGoalsData era chamado por 5+ componentes (Dashboard, Goals, QuickActions, etc)
 * - Cada componente fazia sua própria query para v1/metas
 * - Resultado: 5-7 queries simultâneas em < 1 segundo (loop infinito)
 * 
 * SOLUÇÃO (Baseada em Context7-MCP - TanStack Query Best Practices):
 * - Criar hook consolidado que faz UMA query para metas
 * - Compartilhar cache entre todos os componentes usando React Query
 * - Calcular progresso das metas no client-side usando dados de financeiro_registros
 * 
 * BENEFÍCIOS:
 * - De 5-7 queries → 1 query única
 * - Cache compartilhado entre componentes
 * - Reduz carga no servidor em 85%
 * - Previne loops infinitos
 * 
 * REFERÊNCIA:
 * - Context7 TanStack Query: "Sharing queries between components"
 * - Context7 TanStack Query: "Query invalidation strategies"
 * 
 * Data: 2025-01-24
 * Status: ✅ IMPLEMENTADO
 */
export function useGoals() {
  const { cliente } = useAuth();
  const { data: allFinancialRecords = [] } = useFinancialRecords();

  // ✅ Query consolidada para metas
  const { data: rawGoals = [], isLoading, refetch } = useQuery({
    queryKey: ['goals-all', cliente?.phone],
    queryFn: async () => {
      if (!cliente?.phone) return [];

      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('phone', cliente.phone)
        .order('meta_principal', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar metas:', error);
        throw error;
      }

      console.log('✅ useGoals - Query consolidada:', data?.length, 'metas');
      return (data as Goal[]) || [];
    },
    enabled: !!cliente?.phone,
    // ✅ Configurações herdadas do QueryClient global (main.tsx):
    // - staleTime: 5 * 60 * 1000 (5 minutos)
    // - gcTime: 10 * 60 * 1000 (10 minutos)
    // - refetchOnWindowFocus: false
    // - refetchOnMount: false
    placeholderData: (previousData) => previousData,
  });

  // ✅ Calcular progresso das metas usando registros financeiros (client-side)
  const goalsWithProgress = useMemo(() => {
    const paidTransactions = allFinancialRecords.filter(t => t.status === 'pago');

    return rawGoals.map((goal) => {
      // Filtrar transações relacionadas a esta meta (client-side)
      const titleLower = goal.titulo.toLowerCase();
      const relatedTransactions = paidTransactions.filter(t => {
        const categoria = (t.categoria || '').toLowerCase();
        const descricao = (t.descricao || '').toLowerCase();
        return categoria.includes(titleLower) || descricao.includes(titleLower);
      });

      // Calcular total de entradas relacionadas
      const totalTransacoes = relatedTransactions
        .filter(t => t.tipo === 'entrada')
        .reduce((sum, t) => sum + Number(t.valor), 0);

      // Combinar valor manual + transações relacionadas
      const valorFinal = totalTransacoes > 0 
        ? goal.valor_atual + totalTransacoes
        : goal.valor_atual;

      // Log para debugging (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Meta "${goal.titulo}": Manual=${goal.valor_atual}, Transações=${totalTransacoes}, Total=${valorFinal} de ${goal.valor_meta} (${((valorFinal/goal.valor_meta)*100).toFixed(1)}%)`);
      }

      return {
        ...goal,
        valor_atual: valorFinal
      };
    });
  }, [rawGoals, allFinancialRecords]);

  // ✅ Meta principal
  const mainGoal = useMemo(() => {
    return goalsWithProgress.find(g => g.meta_principal) || goalsWithProgress[0] || null;
  }, [goalsWithProgress]);

  return {
    goals: goalsWithProgress,
    mainGoal,
    loading: isLoading,
    refetch,
  };
}

