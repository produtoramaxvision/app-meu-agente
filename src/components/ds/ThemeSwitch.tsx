import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      role="switch"
      aria-checked={theme === 'dark'}
      className="h-9 w-9 group relative overflow-hidden rounded-lg p-2 transition-all duration-200 hover:scale-105 hover:bg-surface/50"
    >
      <span className="relative z-10">
        {theme === 'light' ? (
          <Moon className="h-5 w-5 text-text" />
        ) : (
          <Sun className="h-5 w-5 text-text" />
        )}
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </Button>
  );
}