import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (buttonRef?: React.RefObject<HTMLButtonElement>) => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    
    // If nothing is stored, default to 'dark'
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Also toggle the 'dark' class for compatibility
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // ✅ OTIMIZAÇÃO: useCallback com View Transition API para animação suave
  const toggleTheme = useCallback(async (buttonRef?: React.RefObject<HTMLButtonElement>) => {
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Check if View Transitions API is supported
    if (!document.startViewTransition || !buttonRef?.current) {
      // Fallback: toggle without animation
      setTheme(newTheme);
      return;
    }

    // Start the view transition with the new animated effect
    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    }).ready;

    // Calculate the animation origin from the button position
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const maxDistance = Math.hypot(
      Math.max(centerX, window.innerWidth - centerX),
      Math.max(centerY, window.innerHeight - centerY)
    );

    // Animate the clip-path for a circular reveal effect
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${centerX}px ${centerY}px)`,
          `circle(${maxDistance}px at ${centerX}px ${centerY}px)`,
        ],
      },
      {
        duration: 700,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  }, [theme]);

  // ✅ OTIMIZAÇÃO: Memoizar value do context (padrão React.dev)
  const contextValue = useMemo(() => ({
    theme,
    toggleTheme,
    setTheme
  }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}