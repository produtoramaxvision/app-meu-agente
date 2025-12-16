/**
 * Basic Performance Monitoring
 * Monitoramento básico de performance sem dependências externas
 */

import { useEffect, useState, useCallback } from 'react';

// Inicialização básica de monitoramento
export const initPerformanceMonitoring = () => {
  console.log('Performance monitoring initialized');
  measureCoreWebVitals();
};

// Hook básico para monitoramento
export const usePerformanceScan = (componentName: string) => {
  useEffect(() => {
    console.log(`Performance monitoring enabled for ${componentName}`);
  }, [componentName]);
};

// Medição de Core Web Vitals
export const measureCoreWebVitals = () => {
  if (typeof window === 'undefined') return;

  // First Contentful Paint (FCP)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            console.log('🎯 FCP:', entry.startTime, 'ms');
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('Erro ao medir FCP:', error);
    }
  }
};

// Hook para medir tempo de execução
export const usePerformanceTimer = () => {
  const [timings, setTimings] = useState<Array<{ name: string; time: number }>>([]);

  const measureTime = useCallback(async <T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    setTimings(prev => [...prev, { name, time: duration }]);
    
    if (duration > 1000) {
      console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }, []);

  return { measureTime, timings };
};

// Hook para monitorar uso de memória
export const useMemoryMonitor = () => {
  const [memoryUsage, setMemoryUsage] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        const usage = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        };
        
        setMemoryUsage(usage);
        
        const usagePercentage = (usage.used / usage.limit) * 100;
        if (usagePercentage > 80) {
          console.warn(`⚠️ High memory usage: ${usagePercentage.toFixed(1)}%`);
        }
      }
    };

    const interval = setInterval(checkMemory, 5000);
    checkMemory();

    return () => clearInterval(interval);
  }, []);

  return memoryUsage;
};

// Hook para monitorar performance de queries
export const useQueryPerformance = () => {
  const [queryMetrics, setQueryMetrics] = useState<Array<{
    query: string;
    time: number;
    timestamp: number;
  }>>([]);

  const measureQuery = useCallback(async <T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    const result = await queryFn();
    const end = performance.now();
    const duration = end - start;

    setQueryMetrics(prev => [...prev, {
      query: queryName,
      time: duration,
      timestamp: Date.now()
    }]);

    if (duration > 2000) {
      console.warn(`⚠️ Slow query: ${queryName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }, []);

  return { measureQuery, queryMetrics };
};