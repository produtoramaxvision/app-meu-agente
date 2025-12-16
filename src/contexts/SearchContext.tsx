import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface SearchContextValue {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  hasResults: boolean;
  setHasResults: (hasResults: boolean) => void;
  searchResults: SearchResults;
  setSearchResults: (results: SearchResults) => void;
  clearSearch: () => void;

  // NOVO: modo de busca e metadados de comando global
  mode: 'global' | 'local';
  setMode: (mode: 'global' | 'local') => void;
  rawCommand?: string;
  setRawCommand: (value: string | undefined) => void;
  commandId?: string;
  setCommandId: (id: string | undefined) => void;
  targetRoute?: string;
  setTargetRoute: (route: string | undefined) => void;
}

interface SearchResults {
  financial: unknown[];
  tasks: unknown[];
  agenda: unknown[];
  reports: unknown[];
  total: number;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasResults, setHasResults] = useState(true);
  const [mode, setMode] = useState<'global' | 'local'>('local');
  const [rawCommand, setRawCommand] = useState<string | undefined>(undefined);
  const [commandId, setCommandId] = useState<string | undefined>(undefined);
  const [targetRoute, setTargetRoute] = useState<string | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    financial: [],
    tasks: [],
    agenda: [],
    reports: [],
    total: 0
  });

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setHasResults(true);
    setMode('local');
    setRawCommand(undefined);
    setCommandId(undefined);
    setTargetRoute(undefined);
    setSearchResults({
      financial: [],
      tasks: [],
      agenda: [],
      reports: [],
      total: 0
    });
  }, []);

  // ✅ OTIMIZAÇÃO: Memoizar value do context (padrão React.dev)
  const contextValue = useMemo(() => ({
    searchQuery, 
    setSearchQuery,
    hasResults, 
    setHasResults, 
    searchResults, 
    setSearchResults,
    clearSearch,
    mode,
    setMode,
    rawCommand,
    setRawCommand,
    commandId,
    setCommandId,
    targetRoute,
    setTargetRoute,
  }), [
    searchQuery,
    hasResults,
    searchResults,
    clearSearch,
    mode,
    rawCommand,
    commandId,
    targetRoute,
  ]);

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}