import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface UseLeadTagsOptions {
  /** UUID da instância para filtrar tags (recomendado) */
  instanceId?: string;
}

interface UseLeadTagsReturn {
  /** Lista de tags únicas usadas nos leads */
  availableTags: string[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Máximo de tags permitidas por lead */
export const MAX_TAGS_PER_LEAD = 10;

/** Cores predefinidas para tags (hash-based cycling) */
export const TAG_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
] as const;

// ============================================================================
// UTILS
// ============================================================================

/**
 * Gera um índice de cor baseado no hash da string da tag.
 * Garante que a mesma tag sempre terá a mesma cor.
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

/**
 * Retorna a classe de cor para uma tag específica.
 */
export function getTagColor(tag: string): string {
  return TAG_COLORS[getTagColorIndex(tag)];
}

// ============================================================================
// HOOK: useLeadTags
// ============================================================================

/**
 * Hook para buscar todas as tags únicas usadas nos leads.
 * Útil para sugestões de autocomplete no TagsEditor.
 * 
 * @param options - Opções de configuração
 * @returns Lista de tags disponíveis e estado de loading
 * 
 * @example
 * ```tsx
 * const { availableTags, isLoading } = useLeadTags({ instanceId: instance.id });
 * 
 * // availableTags = ['VIP', 'Urgente', 'B2B', 'Indicação', ...]
 * ```
 */
export function useLeadTags(options: UseLeadTagsOptions = {}): UseLeadTagsReturn {
  const { instanceId } = options;
  const { cliente } = useAuth();

  const {
    data: availableTags = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['lead-tags', instanceId || 'all'],
    queryFn: async () => {
      if (!cliente?.phone) return [];

      // Busca todas as tags dos contatos da instância
      let query = supabase
        .from('evolution_contacts')
        .select('crm_tags');

      // Filtrar por instância se fornecido
      if (instanceId) {
        query = query.eq('instance_id', instanceId);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('❌ useLeadTags: Erro ao buscar tags:', queryError);
        throw queryError;
      }

      // Extrair todas as tags únicas
      const allTags = new Set<string>();
      
      (data || []).forEach((contact) => {
        if (contact.crm_tags && Array.isArray(contact.crm_tags)) {
          contact.crm_tags.forEach((tag: string) => {
            if (tag && typeof tag === 'string' && tag.trim()) {
              allTags.add(tag.trim());
            }
          });
        }
      });

      // Ordenar alfabeticamente
      return Array.from(allTags).sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
    },
    enabled: !!cliente?.phone,
    staleTime: 5 * 60 * 1000, // 5 minutos
    placeholderData: (previousData) => previousData,
  });

  return {
    availableTags,
    isLoading,
    error: error as Error | null,
  };
}
