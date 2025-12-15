/**
 * Optimized Loading Components
 * Componentes de loading otimizados usando ShadcnUI
 * 
 * Componentes:
 * - SkeletonLoader: Loading states para diferentes tipos de conteúdo
 * - PerformanceSpinner: Spinner com métricas de performance
 * - LoadingProgress: Barra de progresso para operações longas
 * - OptimizedTable: Tabela com virtualização
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Skeleton para diferentes tipos de conteúdo
export const SkeletonLoader = {
  // Skeleton para cards do dashboard
  DashboardCard: ({ className }: { className?: string }) => (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3 mt-2" />
      </CardContent>
    </Card>
  ),

  // Skeleton para tabelas
  TableRow: ({ columns = 4 }: { columns?: number }) => (
    <tr>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  ),

  // Skeleton para listas
  ListItem: ({ className }: { className?: string }) => (
    <div className={cn('flex items-center space-x-4 p-4', className)}>
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  ),

  // Skeleton para formulários
  FormField: ({ className }: { className?: string }) => (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
  ),

  // Skeleton para gráficos
  Chart: ({ className }: { className?: string }) => (
    <div className={cn('space-y-4', className)}>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-64 w-full" />
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  ),
};

// Spinner com métricas de performance
export const PerformanceSpinner = ({ 
  message = 'Carregando...', 
  showMetrics = false,
  className 
}: { 
  message?: string; 
  showMetrics?: boolean;
  className?: string;
}) => {
  const [metrics, setMetrics] = React.useState<{
    startTime: number;
    currentTime: number;
  }>({ startTime: Date.now(), currentTime: Date.now() });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        currentTime: Date.now()
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const elapsedTime = metrics.currentTime - metrics.startTime;

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4 p-8', className)}>
      <Spinner className="h-8 w-8" />
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">{message}</p>
        {showMetrics && (
          <p className="text-xs text-muted-foreground">
            Tempo decorrido: {(elapsedTime / 1000).toFixed(1)}s
          </p>
        )}
      </div>
    </div>
  );
};

// Barra de progresso para operações longas
export const LoadingProgress = ({ 
  progress, 
  message, 
  showPercentage = true,
  className 
}: { 
  progress: number; 
  message?: string;
  showPercentage?: boolean;
  className?: string;
}) => {
  const [displayProgress, setDisplayProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setDisplayProgress(prev => {
        const diff = progress - prev;
        if (Math.abs(diff) < 0.1) return progress;
        return prev + diff * 0.1;
      });
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [progress]);

  return (
    <div className={cn('space-y-3', className)}>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      <Progress value={displayProgress} className="w-full" />
      {showPercentage && (
        <p className="text-xs text-muted-foreground text-right">
          {Math.round(displayProgress)}%
        </p>
      )}
    </div>
  );
};

// Componente de loading para operações assíncronas
export const AsyncLoader = ({ 
  isLoading, 
  error, 
  children, 
  loadingComponent,
  errorComponent,
  className 
}: {
  isLoading: boolean;
  error: Error | null;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  className?: string;
}) => {
  if (isLoading) {
    return (
      <div className={className}>
        {loadingComponent || <PerformanceSpinner />}
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center p-8', className)}>
        {errorComponent || (
          <div className="space-y-2">
            <p className="text-sm text-destructive">Erro ao carregar dados</p>
            <p className="text-xs text-muted-foreground">{error.message}</p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

// Hook para gerenciar estados de loading
export const useLoadingState = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [progress, setProgress] = React.useState(0);

  const executeWithLoading = React.useCallback(async <T,>(
    operation: () => Promise<T>,
    options: {
      showProgress?: boolean;
      progressSteps?: number;
    } = {}
  ): Promise<T> => {
    const { showProgress = false, progressSteps = 1 } = options;
    
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      if (showProgress) {
        // Simular progresso para operações longas
        const progressInterval = setInterval(() => {
          setProgress(prev => Math.min(prev + 100 / progressSteps, 90));
        }, 100);

        const result = await operation();
        
        clearInterval(progressInterval);
        setProgress(100);
        
        // Aguardar um pouco para mostrar 100%
        setTimeout(() => setProgress(0), 500);
        
        return result;
      } else {
        return await operation();
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    progress,
    executeWithLoading,
    setLoading,
    setError,
    setProgress,
  };
};

// Componente de loading para listas infinitas
export const InfiniteLoadingIndicator = ({ 
  hasMore, 
  loading, 
  onLoadMore,
  className 
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  className?: string;
}) => {
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!hasMore || loading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore) {
    return (
      <div className={cn('text-center p-4 text-sm text-muted-foreground', className)}>
        Todos os dados foram carregados
      </div>
    );
  }

  return (
    <div ref={loadMoreRef} className={cn('text-center p-4', className)}>
      {loading ? (
        <PerformanceSpinner message="Carregando mais dados..." />
      ) : (
        <button
          onClick={onLoadMore}
          className="text-sm text-primary hover:underline"
        >
          Carregar mais
        </button>
      )}
    </div>
  );
};
