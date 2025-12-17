import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LeadStatus } from '@/types/sdr';

/**
 * Filtros disponíveis para leads no CRM
 */
export interface LeadFilters {
  // Filtro por status (múltipla seleção)
  status: LeadStatus[];
  
  // Filtro por score (range 0-100)
  scoreRange: [number, number];
  
  // Filtro por valor estimado (range em centavos)
  valueRange: [number, number];
  
  // Filtro por data de criação
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  
  // Filtro por tags (múltipla seleção)
  tags: string[];
  
  // Filtro por campos customizados (chave-valor dinâmico)
  customFields: Record<string, unknown>;
}

/**
 * Filtros padrão (sem filtros aplicados)
 */
export const DEFAULT_FILTERS: LeadFilters = {
  status: [],
  scoreRange: [0, 100],
  valueRange: [0, 1000000000], // R$ 10.000.000,00 max
  dateRange: {
    from: undefined,
    to: undefined,
  },
  tags: [],
  customFields: {},
};

/**
 * Serializa filtros para URL (query params)
 */
function serializeFiltersToURL(filters: LeadFilters): URLSearchParams {
  const params = new URLSearchParams();

  // Status
  if (filters.status.length > 0) {
    params.set('status', filters.status.join(','));
  }

  // Score range
  if (filters.scoreRange[0] !== 0 || filters.scoreRange[1] !== 100) {
    params.set('score', `${filters.scoreRange[0]}-${filters.scoreRange[1]}`);
  }

  // Value range
  if (filters.valueRange[0] !== 0 || filters.valueRange[1] !== 1000000000) {
    params.set('value', `${filters.valueRange[0]}-${filters.valueRange[1]}`);
  }

  // Date range
  if (filters.dateRange.from) {
    params.set('from', filters.dateRange.from.toISOString());
  }
  if (filters.dateRange.to) {
    params.set('to', filters.dateRange.to.toISOString());
  }

  // Tags
  if (filters.tags.length > 0) {
    params.set('tags', filters.tags.join(','));
  }

  return params;
}

/**
 * Deserializa filtros da URL (query params)
 */
function deserializeFiltersFromURL(searchParams: URLSearchParams): LeadFilters | null {
  const hasParams = Array.from(searchParams.keys()).some(key =>
    ['status', 'score', 'value', 'from', 'to', 'tags'].includes(key)
  );

  if (!hasParams) return null;

  const filters: LeadFilters = { ...DEFAULT_FILTERS };

  // Status
  const statusParam = searchParams.get('status');
  if (statusParam) {
    filters.status = statusParam.split(',') as LeadStatus[];
  }

  // Score range
  const scoreParam = searchParams.get('score');
  if (scoreParam) {
    const [min, max] = scoreParam.split('-').map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      filters.scoreRange = [min, max];
    }
  }

  // Value range
  const valueParam = searchParams.get('value');
  if (valueParam) {
    const [min, max] = valueParam.split('-').map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      filters.valueRange = [min, max];
    }
  }

  // Date range
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  if (fromParam) {
    filters.dateRange.from = new Date(fromParam);
  }
  if (toParam) {
    filters.dateRange.to = new Date(toParam);
  }

  // Tags
  const tagsParam = searchParams.get('tags');
  if (tagsParam) {
    filters.tags = tagsParam.split(',');
  }

  return filters;
}

/**
 * Presets de filtros para facilitar visualizações comuns
 */
export const FILTER_PRESETS = {
  all: {
    name: 'Todos os Leads',
    filters: DEFAULT_FILTERS,
  },
  hot: {
    name: 'Leads Quentes',
    filters: {
      ...DEFAULT_FILTERS,
      scoreRange: [75, 100] as [number, number],
      status: ['qualificado', 'proposta', 'negociando'] as LeadStatus[],
    },
  },
  highValue: {
    name: 'Alto Valor',
    filters: {
      ...DEFAULT_FILTERS,
      valueRange: [50000000, 1000000000] as [number, number], // R$ 500k+
    },
  },
  needFollowup: {
    name: 'Precisam Follow-up',
    filters: {
      ...DEFAULT_FILTERS,
      status: ['contatado', 'qualificado'] as LeadStatus[],
      scoreRange: [25, 100] as [number, number],
    },
  },
} as const;

export type FilterPresetKey = keyof typeof FILTER_PRESETS;

/**
 * Hook para gerenciar filtros de leads no CRM
 * 
 * @returns Objeto com state de filtros e funções de controle
 * 
 * @example
 * const { filters, setFilter, clearFilters, activeFiltersCount, hasActiveFilters } = useLeadFilters();
 * 
 * // Aplicar filtro de status
 * setFilter('status', ['novo', 'contatado']);
 * 
 * // Limpar todos os filtros
 * clearFilters();
 * 
 * // Aplicar preset
 * applyPreset('hot');
 */
export function useLeadFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<LeadFilters>(() => {
    // Inicializa filtros da URL se existirem
    const urlFilters = deserializeFiltersFromURL(searchParams);
    return urlFilters || DEFAULT_FILTERS;
  });

  // Sincroniza filtros com URL
  useEffect(() => {
    const params = serializeFiltersToURL(filters);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  /**
   * Atualiza um filtro específico
   */
  const setFilter = useCallback(<K extends keyof LeadFilters>(
    key: K,
    value: LeadFilters[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Limpa todos os filtros (volta ao padrão)
   */
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /**
   * Limpa um filtro específico
   */
  const clearFilter = useCallback(<K extends keyof LeadFilters>(key: K) => {
    setFilters((prev) => ({
      ...prev,
      [key]: DEFAULT_FILTERS[key],
    }));
  }, []);

  /**
   * Aplica um preset de filtros
   */
  const applyPreset = useCallback((presetKey: FilterPresetKey) => {
    const preset = FILTER_PRESETS[presetKey];
    if (preset) {
      setFilters(preset.filters as LeadFilters);
    }
  }, []);

  /**
   * Conta quantos filtros estão ativos (diferentes do padrão)
   */
  const activeFiltersCount = useMemo(() => {
    let count = 0;

    // Status
    if (filters.status.length > 0) count++;

    // Score (diferente do range padrão)
    if (filters.scoreRange[0] !== 0 || filters.scoreRange[1] !== 100) count++;

    // Valor (diferente do range padrão)
    if (filters.valueRange[0] !== 0 || filters.valueRange[1] !== 1000000000) count++;

    // Data (alguma data definida)
    if (filters.dateRange.from || filters.dateRange.to) count++;

    // Tags
    if (filters.tags.length > 0) count++;

    // Custom fields (algum campo definido)
    if (Object.keys(filters.customFields).length > 0) count++;

    return count;
  }, [filters]);

  /**
   * Verifica se há algum filtro ativo
   */
  const hasActiveFilters = useMemo(() => {
    return activeFiltersCount > 0;
  }, [activeFiltersCount]);

  return {
    filters,
    setFilter,
    clearFilters,
    clearFilter,
    applyPreset,
    activeFiltersCount,
    hasActiveFilters,
  };
}
