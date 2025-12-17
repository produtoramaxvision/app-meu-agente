import { useEffect, useState } from 'react';

/**
 * Hook para detectar media queries responsivas
 * Baseado no padrão shadcn/ui
 * 
 * @param query - Media query string (ex: "(min-width: 768px)")
 * @returns boolean indicando se a media query corresponde
 * 
 * @example
 * const isDesktop = useMediaQuery("(min-width: 768px)")
 * const isMobile = useMediaQuery("(max-width: 767px)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Criar media query list
    const mediaQueryList = window.matchMedia(query);
    
    // Setar valor inicial
    setMatches(mediaQueryList.matches);

    // Handler para mudanças
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Adicionar listener (suporta browsers antigos e modernos)
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      // Fallback para browsers antigos
      mediaQueryList.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        // Fallback para browsers antigos
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}
