import DOMPurify from 'dompurify';

/**
 * Utilitário de sanitização para prevenir ataques XSS
 * Baseado nas melhores práticas do Context7 e PortSwigger Web Security Academy
 */

// Configuração segura do DOMPurify para texto simples
const TEXT_ONLY_CONFIG = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  FORCE_BODY: false,
  ADD_ATTR: [],
  ADD_TAGS: [],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta'],
  FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  USE_PROFILES: { html: false, svg: false, svgFilters: false, mathMl: false }
};

// Configuração para HTML limitado (apenas tags seguras)
const LIMITED_HTML_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span'],
  ALLOWED_ATTR: ['class'],
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM_IMPORT: false,
  SANITIZE_DOM: true,
  FORCE_BODY: false,
  ADD_ATTR: [],
  ADD_TAGS: [],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'style'],
  FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style'],
  USE_PROFILES: { html: true, svg: false, svgFilters: false, mathMl: false }
};

/**
 * Sanitiza texto para renderização segura (apenas texto)
 * Remove todos os elementos HTML e scripts maliciosos
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  
  // Primeiro, usar DOMPurify para remover scripts e elementos perigosos
  const sanitized = DOMPurify.sanitize(input, TEXT_ONLY_CONFIG);
  
  // Depois, fazer escape manual dos caracteres HTML restantes
  return escapeHtml(sanitized);
}

/**
 * Sanitiza HTML para renderização limitada (tags seguras apenas)
 * Permite apenas tags básicas de formatação
 */
export function sanitizeLimitedHtml(input: string | null | undefined): string {
  if (!input) return '';
  
  return DOMPurify.sanitize(input, LIMITED_HTML_CONFIG);
}

/**
 * Escapa caracteres HTML perigosos manualmente
 * Baseado nas práticas do PortSwigger Web Security Academy
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return text.replace(/[&<>"'`=/]/g, (char) => map[char] || char);
}

/**
 * Valida se o input contém conteúdo suspeito
 * Útil para logging e alertas de segurança
 */
export function containsSuspiciousContent(input: string | null | undefined): boolean {
  if (!input) return false;
  
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /<style/i,
    /expression\s*\(/i,
    /url\s*\(/i,
    /@import/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Hook para sanitização em componentes React
 * Fornece sanitização automática e logging de segurança
 */
export function useSanitization() {
  const sanitizeAndLog = (input: string | null | undefined, context: string = 'unknown'): string => {
    if (!input) return '';
    
    // Verificar conteúdo suspeito para logging
    if (containsSuspiciousContent(input)) {
      console.warn(`🚨 XSS Attempt Detected in ${context}:`, {
        input: input.substring(0, 100),
        context,
        timestamp: new Date().toISOString()
      });
    }
    
    return sanitizeText(input);
  };
  
  return { sanitizeAndLog };
}
