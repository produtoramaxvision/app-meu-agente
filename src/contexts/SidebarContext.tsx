import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

const STORAGE_KEY = 'meuagente:sidebar:collapsed';
const HOVER_DELAY_MS = 100;

interface SidebarContextValue {
  /** User's preference for collapsed state (persisted) */
  collapsedPreference: boolean;
  /** Whether the sidebar is currently being hovered */
  isHovering: boolean;
  /** Computed value: collapsed && !hovering */
  effectiveCollapsed: boolean;
  /** Whether user is on mobile device */
  isMobile: boolean;
  /** Mobile sidebar open state */
  mobileOpen: boolean;
  /** Toggle collapsed preference (persisted) */
  toggleCollapsed: () => void;
  /** Set collapsed preference directly */
  setCollapsedPreference: (collapsed: boolean) => void;
  /** Set hover state with debounce */
  setHovering: (hovering: boolean) => void;
  /** Toggle mobile sidebar */
  toggleMobileOpen: () => void;
  /** Set mobile open state directly */
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

interface SidebarProviderProps {
  children: ReactNode;
  /** Default collapsed state (used only on first visit) */
  defaultCollapsed?: boolean;
}

export function SidebarProvider({ children, defaultCollapsed = true }: SidebarProviderProps) {
  // Persisted preference: starts collapsed by default
  const [collapsedPreference, setCollapsedPreferenceState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
    } catch {
      // localStorage not available
    }
    return defaultCollapsed;
  });

  // Temporary hover state
  const [isHovering, setIsHoveringState] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  // Mobile sidebar state
  const [mobileOpen, setMobileOpenState] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Debounce timer ref
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsedPreference));
    } catch {
      // localStorage not available
    }
  }, [collapsedPreference]);

  // Listen for viewport changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      // Close mobile sidebar when switching to desktop
      if (!e.matches) {
        setMobileOpenState(false);
        setIsClosing(false);
      }
    };

    // Initial check
    handleChange(mediaQuery);
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Legacy browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsedPreferenceState(prev => !prev);
  }, []);

  const setCollapsedPreference = useCallback((collapsed: boolean) => {
    setCollapsedPreferenceState(collapsed);
  }, []);

  // Debounced hover setter
  const setHovering = useCallback((hovering: boolean) => {
    // Clear any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // Apply debounce
    hoverTimerRef.current = setTimeout(() => {
      setIsHoveringState(hovering);
    }, HOVER_DELAY_MS);
  }, []);

  const toggleMobileOpen = useCallback(() => {
    if (mobileOpen) {
      // Closing animation
      setIsClosing(true);
      setTimeout(() => {
        setMobileOpenState(false);
        setIsClosing(false);
      }, 300); // Match animation duration
    } else {
      setMobileOpenState(true);
      setIsClosing(false);
    }
  }, [mobileOpen]);

  const setMobileOpen = useCallback((open: boolean) => {
    if (!open && mobileOpen) {
      // Closing animation
      setIsClosing(true);
      setTimeout(() => {
        setMobileOpenState(false);
        setIsClosing(false);
      }, 300);
    } else {
      setMobileOpenState(open);
      setIsClosing(false);
    }
  }, [mobileOpen]);

  // Computed effective collapsed state
  // Desktop: collapsed when user prefers AND not hovering
  // Mobile: never use hover logic
  const effectiveCollapsed = isMobile ? false : (collapsedPreference && !isHovering);

  const value: SidebarContextValue = {
    collapsedPreference,
    isHovering,
    effectiveCollapsed,
    isMobile,
    mobileOpen: mobileOpen || isClosing, // Keep true during close animation
    toggleCollapsed,
    setCollapsedPreference,
    setHovering,
    toggleMobileOpen,
    setMobileOpen,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

/**
 * Safe version of useSidebar that returns default values if provider is not available
 * Used in components that may be rendered outside of SidebarProvider (e.g., auth pages)
 */
export function useSidebarSafe() {
  const context = useContext(SidebarContext);
  
  // Return default values if provider is not available
  if (!context) {
    return {
      collapsedPreference: false,
      isHovering: false,
      effectiveCollapsed: false,
      isMobile: false,
      mobileOpen: false,
      toggleCollapsed: () => {},
      setCollapsedPreference: () => {},
      setHovering: () => {},
      toggleMobileOpen: () => {},
      setMobileOpen: () => {},
    };
  }
  
  return context;
}
