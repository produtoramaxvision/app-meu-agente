/**
 * Safe JSON Library
 * Proteção contra Prototype Pollution usando destr
 * 
 * Substitui JSON.parse por destr que é seguro contra:
 * - Prototype Pollution via __proto__
 * - Constructor Pollution via constructor.prototype
 * - Polluted Object.prototype
 */

import { destr, safeDestr } from 'destr';

// Tipos para melhor type safety
export type SafeJSONParseOptions = {
  strict?: boolean;
  fallback?: unknown;
};

// Parse seguro de JSON com proteção contra prototype pollution
export const safeJSONParse = <T = unknown>(
  json: string, 
  options: SafeJSONParseOptions = {}
): T => {
  try {
    if (options.strict) {
      return safeDestr<T>(json);
    }
    return destr<T>(json);
  } catch (error) {
    console.warn('Erro ao fazer parse seguro do JSON:', error);
    return options.fallback || null;
  }
};

// Stringify seguro (mantém JSON.stringify padrão)
export const safeJSONStringify = (
  obj: unknown, 
  replacer?: (key: string, value: unknown) => unknown, 
  space?: string | number
): string => {
  try {
    return JSON.stringify(obj, replacer, space);
  } catch (error) {
    console.warn('Erro ao fazer stringify seguro do JSON:', error);
    return '{}';
  }
};

// Verificar se objeto contém propriedades suspeitas
export const containsSuspiciousProperties = (obj: unknown): boolean => {
  if (!obj || typeof obj !== 'object') return false;
  
  const suspiciousKeys = [
    '__proto__',
    'constructor',
    'prototype',
    'constructor.prototype'
  ];
  
  return suspiciousKeys.some(key => key in obj);
};

// Sanitizar objeto removendo propriedades suspeitas
export const sanitizeObject = (obj: unknown): unknown => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Pular propriedades suspeitas
    if (key === '__proto__' || key === 'constructor') {
      continue;
    }
    
    // Recursivamente sanitizar valores
    if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Parse JSON com sanitização automática
export const safeJSONParseWithSanitization = <T = unknown>(
  json: string,
  options: SafeJSONParseOptions = {}
): T => {
  const parsed = safeJSONParse<T>(json, options);
  
  if (containsSuspiciousProperties(parsed)) {
    console.warn('Propriedades suspeitas detectadas, sanitizando objeto');
    return sanitizeObject(parsed) as T;
  }
  
  return parsed;
};

// Hook para usar parse seguro em componentes React
export const useSafeJSON = () => {
  return {
    parse: safeJSONParse,
    parseWithSanitization: safeJSONParseWithSanitization,
    stringify: safeJSONStringify,
    sanitize: sanitizeObject,
    isSuspicious: containsSuspiciousProperties
  };
};
