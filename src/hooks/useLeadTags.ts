/**
 * @file useLeadTags.ts
 * @deprecated Este hook foi refatorado para usar o sistema relacional de tags.
 *             Use useCrmTags() de '@/hooks/useCrmTags' para operações de tags.
 *             
 *             Mantido apenas para compatibilidade retroativa (export de constantes e utils).
 */

// Re-export everything from useCrmTags for backward compatibility
export { 
  useCrmTags, 
  useLeadTagsRelational,
  useLeadTagsReadOnly,
  getTagColor,
  crmTagsKeys 
} from './useCrmTags';

// ============================================================================
// CONSTANTS (mantidos para compatibilidade)
// ============================================================================

/** Máximo de tags permitidas por lead */
export const MAX_TAGS_PER_LEAD = 10;

/** 
 * @deprecated Use tag_color da tabela crm_tags (cores hexadecimais). 
 * Mantido apenas para compatibilidade retroativa.
 */
export const TAG_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-blue-800',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
] as const;

// ============================================================================
// LEGACY TYPES (mantidos para compatibilidade)
// ============================================================================

interface UseLeadTagsOptions {
  /** @deprecated Não usado mais - tags são por phone (owner) */
  instanceId?: string;
}

interface UseLeadTagsReturn {
  /** Lista de tags únicas usadas nos leads (agora vindas da tabela crm_tags) */
  availableTags: string[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

// ============================================================================
// LEGACY UTILS (mantidos para compatibilidade)
// ============================================================================

/**
 * @deprecated Use getTagColor de useCrmTags.ts que suporta cores hexadecimais.
 * Gera um índice de cor baseado no hash da string da tag.
 */
export function getTagColorIndex(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    const char = tag.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % TAG_COLORS.length;
}

// ============================================================================
// LEGACY HOOK (usa sistema relacional internamente)
// ============================================================================

import { useCrmTags } from './useCrmTags';

/**
 * @deprecated Use useCrmTags() diretamente para operações completas de tags.
 * 
 * Hook de compatibilidade que retorna tags disponíveis no formato antigo.
 * Internamente usa o sistema relacional (tabela crm_tags).
 */
export function useLeadTags(_options: UseLeadTagsOptions = {}): UseLeadTagsReturn {
  const { tags, isLoading, error } = useCrmTags();

  // Converte tags relacionais para array de strings (formato antigo)
  const availableTags = tags.map(tag => tag.tag_name).sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  return {
    availableTags,
    isLoading,
    error: error as Error | null,
  };
}
