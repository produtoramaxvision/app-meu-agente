/**
 * Error Handling Utilities
 * Sistema robusto de tratamento de erros para Supabase
 * 
 * Funcionalidades:
 * - Classificação automática de erros
 * - Retry com backoff exponencial
 * - Logging estruturado
 * - Fallbacks graceful
 * - Métricas de performance
 * - Notificações inteligentes ao usuário
 */

import { toast } from 'sonner';
import { PostgrestError } from '@supabase/supabase-js';

// Tipos de erro
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  UNKNOWN = 'unknown',
}

// Severidade do erro
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Interface para erro estruturado
export interface StructuredError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError: unknown;
  context?: Record<string, unknown>;
  timestamp: Date;
  retryable: boolean;
  userMessage: string;
}

// Configuração de retry
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

// Configuração padrão de retry
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 30000, // 30 segundos
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorType.NETWORK,
    ErrorType.RATE_LIMIT,
    ErrorType.SERVER_ERROR,
  ],
};

// ✅ CLASSIFICAÇÃO AUTOMÁTICA DE ERROS
export function classifyError(error: unknown): StructuredError {
  const timestamp = new Date();
  
  // Type guard para erro com propriedades básicas
  const isErrorLike = (err: unknown): err is { name?: string; message?: string; code?: string; details?: string } => {
    return typeof err === 'object' && err !== null;
  };
  
  // Erro de rede
  if (isErrorLike(error) && (error.name === 'NetworkError' || error.message?.includes('fetch'))) {
    return {
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      message: 'Erro de conexão com o servidor',
      originalError: error,
      timestamp,
      retryable: true,
      userMessage: 'Problema de conexão. Tentando novamente...',
    };
  }
  
  // Erro do Supabase/PostgreSQL
  if (isErrorLike(error) && (error.code || error.details)) {
    const postgrestError = error as PostgrestError;
    
    switch (postgrestError.code) {
      case 'PGRST301':
        return {
          type: ErrorType.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
          message: 'Token de autenticação inválido ou expirado',
          originalError: error,
          timestamp,
          retryable: false,
          userMessage: 'Sessão expirada. Faça login novamente.',
        };
        
      case 'PGRST116':
        return {
          type: ErrorType.NOT_FOUND,
          severity: ErrorSeverity.LOW,
          message: 'Recurso não encontrado',
          originalError: error,
          timestamp,
          retryable: false,
          userMessage: 'Item não encontrado.',
        };
        
      case '23505': // Unique violation
        return {
          type: ErrorType.CONFLICT,
          severity: ErrorSeverity.MEDIUM,
          message: 'Conflito de dados - registro duplicado',
          originalError: error,
          timestamp,
          retryable: false,
          userMessage: 'Este item já existe.',
        };
        
      case '23503': // Foreign key violation
        return {
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          message: 'Violação de integridade referencial',
          originalError: error,
          timestamp,
          retryable: false,
          userMessage: 'Dados relacionados não encontrados.',
        };
        
      case '42501': // Insufficient privilege
        return {
          type: ErrorType.AUTHORIZATION,
          severity: ErrorSeverity.HIGH,
          message: 'Permissões insuficientes',
          originalError: error,
          timestamp,
          retryable: false,
          userMessage: 'Você não tem permissão para esta ação.',
        };
        
      default:
        if (postgrestError.code?.startsWith('23')) {
          return {
            type: ErrorType.VALIDATION,
            severity: ErrorSeverity.MEDIUM,
            message: 'Erro de validação de dados',
            originalError: error,
            timestamp,
            retryable: false,
            userMessage: 'Dados inválidos. Verifique os campos.',
          };
        }
    }
  }
  
  // Erro HTTP
  if (error && typeof error === 'object' && 'status' in error) {
    switch ((error as Record<string, unknown>).status) {
      case 401:
        return {
          type: ErrorType.AUTHENTICATION,
          severity: ErrorSeverity.HIGH,
          message: 'Não autenticado',
          originalError: error,
          timestamp,
          retryable: false,
          userMessage: 'Faça login para continuar.',
        };
        
      case 403:
        return {
          type: ErrorType.AUTHORIZATION,
          severity: ErrorSeverity.HIGH,
          message: 'Acesso negado',
          originalError: error,
          timestamp,
          retryable: false,
          userMessage: 'Acesso negado.',
        };
        
      case 404:
        return {
          type: ErrorType.NOT_FOUND,
          severity: ErrorSeverity.LOW,
          message: 'Recurso não encontrado',
          originalError: error,
          timestamp,
          retryable: false,
          userMessage: 'Item não encontrado.',
        };
        
      case 409:
        return {
          type: ErrorType.CONFLICT,
          severity: ErrorSeverity.MEDIUM,
          message: 'Conflito de dados',
          originalError: error,
          timestamp,
          retryable: false,
          userMessage: 'Conflito de dados. Tente novamente.',
        };
        
      case 429:
        return {
          type: ErrorType.RATE_LIMIT,
          severity: ErrorSeverity.MEDIUM,
          message: 'Muitas requisições',
          originalError: error,
          timestamp,
          retryable: true,
          userMessage: 'Muitas tentativas. Aguarde um momento.',
        };
        
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: ErrorType.SERVER_ERROR,
          severity: ErrorSeverity.HIGH,
          message: 'Erro interno do servidor',
          originalError: error,
          timestamp,
          retryable: true,
          userMessage: 'Erro no servidor. Tentando novamente...',
        };
    }
  }
  
  // Erro desconhecido
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    message: (error instanceof Error ? error.message : null) || (error && typeof error === 'object' && 'message' in error ? String((error as Record<string, unknown>).message) : null) || 'Erro desconhecido',
    originalError: error,
    timestamp,
    retryable: false,
    userMessage: 'Ocorreu um erro inesperado.',
  };
}

// ✅ SISTEMA DE RETRY COM BACKOFF EXPONENCIAL
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: StructuredError;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = classifyError(error);
      
      // Se não é retryable ou é a última tentativa, lança o erro
      if (!finalConfig.retryableErrors.includes(lastError.type) || attempt === finalConfig.maxAttempts) {
        throw lastError;
      }
      
      // Calcular delay com backoff exponencial
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelay
      );
      
      console.warn(`Tentativa ${attempt} falhou. Tentando novamente em ${delay}ms`, {
        error: lastError,
        attempt,
        nextDelay: delay,
      });
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// ✅ LOGGING ESTRUTURADO
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorHistory: StructuredError[] = [];
  private maxHistorySize = 100;
  
  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }
  
  log(error: StructuredError, context?: Record<string, unknown>): void {
    const enrichedError = {
      ...error,
      context: { ...error.context, ...context },
    };
    
    // Adicionar ao histórico
    this.errorHistory.unshift(enrichedError);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.pop();
    }
    
    // Log no console baseado na severidade
    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.info('🔵 Low severity error:', enrichedError);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('🟡 Medium severity error:', enrichedError);
        break;
      case ErrorSeverity.HIGH:
        console.error('🟠 High severity error:', enrichedError);
        break;
      case ErrorSeverity.CRITICAL:
        console.error('🔴 CRITICAL ERROR:', enrichedError);
        break;
    }
    
    // Enviar para serviço de monitoramento (se configurado)
    this.sendToMonitoring(enrichedError);
  }
  
  private sendToMonitoring(error: StructuredError): void {
    // Implementar integração com serviços como Sentry, LogRocket, etc.
    // Por enquanto, apenas log local
    if (error.severity === ErrorSeverity.CRITICAL) {
      console.error('🚨 CRITICAL ERROR - Should be sent to monitoring service:', error);
    }
  }
  
  getErrorHistory(): StructuredError[] {
    return [...this.errorHistory];
  }
  
  getErrorStats(): Record<ErrorType, number> {
    const stats: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    
    Object.values(ErrorType).forEach(type => {
      stats[type] = 0;
    });
    
    this.errorHistory.forEach(error => {
      stats[error.type]++;
    });
    
    return stats;
  }
  
  clearHistory(): void {
    this.errorHistory = [];
  }
}

// ✅ NOTIFICAÇÕES INTELIGENTES AO USUÁRIO
export function handleUserNotification(error: StructuredError): void {
  // Não mostrar notificações para erros de baixa severidade
  if (error.severity === ErrorSeverity.LOW) {
    return;
  }
  
  // Configurar tipo de toast baseado na severidade
  switch (error.severity) {
    case ErrorSeverity.MEDIUM:
      toast.warning(error.userMessage, {
        description: 'Tente novamente em alguns instantes.',
        duration: 4000,
      });
      break;
      
    case ErrorSeverity.HIGH:
      toast.error(error.userMessage, {
        description: 'Se o problema persistir, entre em contato com o suporte.',
        duration: 6000,
      });
      break;
      
    case ErrorSeverity.CRITICAL:
      toast.error(error.userMessage, {
        description: 'Erro crítico detectado. Suporte foi notificado.',
        duration: 8000,
        action: {
          label: 'Recarregar',
          onClick: () => window.location.reload(),
        },
      });
      break;
  }
}

// ✅ WRAPPER PRINCIPAL PARA OPERAÇÕES SUPABASE
export async function executeSupabaseOperation<T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  const logger = ErrorLogger.getInstance();
  
  try {
    return await withRetry(operation, retryConfig);
  } catch (error) {
    const structuredError = classifyError(error);
    
    // Log do erro
    logger.log(structuredError, context);
    
    // Notificar usuário
    handleUserNotification(structuredError);
    
    // Re-lançar o erro estruturado
    throw structuredError;
  }
}

// ✅ HOOK PARA MÉTRICAS DE PERFORMANCE
export function useErrorMetrics() {
  const logger = ErrorLogger.getInstance();
  
  return {
    getErrorHistory: () => logger.getErrorHistory(),
    getErrorStats: () => logger.getErrorStats(),
    clearHistory: () => logger.clearHistory(),
    
    // Métricas úteis
    getErrorRate: () => {
      const history = logger.getErrorHistory();
      const last24h = history.filter(
        error => Date.now() - error.timestamp.getTime() < 24 * 60 * 60 * 1000
      );
      return last24h.length;
    },
    
    getCriticalErrors: () => {
      return logger.getErrorHistory().filter(
        error => error.severity === ErrorSeverity.CRITICAL
      );
    },
    
    getMostCommonErrors: () => {
      const stats = logger.getErrorStats();
      return Object.entries(stats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    },
  };
}

// ✅ UTILITÁRIOS PARA FALLBACKS GRACEFUL
export function createFallbackData<T>(defaultValue: T): T {
  return defaultValue;
}

export function withFallback<T>(
  operation: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  return operation().catch((error) => {
    console.warn('Operation failed, using fallback:', error);
    return fallbackValue;
  });
}