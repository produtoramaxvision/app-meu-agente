import { Bot, Users, Database, TrendingUp, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUGGESTED_PROMPTS } from '@/types/chat';
import { cn } from '@/lib/utils';

// Map icon names to components
const iconMap = {
  Users,
  Database,
  TrendingUp,
  Scale,
};

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  isLoading?: boolean;
}

export function ChatEmptyState({ onSelectPrompt, isLoading }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {/* Agent illustration */}
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-700/20 flex items-center justify-center">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
            <Bot className="h-8 w-8 text-white" />
          </div>
        </div>
        {/* Animated pulse */}
        <div className="absolute inset-0 rounded-full bg-brand-500/10 animate-ping" />
      </div>

      {/* Welcome text */}
      <h3 className="text-xl font-semibold text-text mb-2">
        Olá! Sou o Agente de Scrape
      </h3>
      <p className="text-text-muted text-sm max-w-md mb-8">
        Posso extrair dados de sites permitidos, buscar informações em APIs públicas
        e gerar relatórios em CSV ou JSON. Como posso ajudar?
      </p>

      {/* Suggested prompts */}
      <div className="w-full max-w-2xl">
        <p className="text-xs text-text-muted uppercase tracking-wider mb-4">
          Sugestões para começar
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUGGESTED_PROMPTS.map((suggestion, index) => {
            const Icon = iconMap[suggestion.icon as keyof typeof iconMap] || Bot;
            return (
              <Button
                key={index}
                variant="outline"
                className={cn(
                  'h-auto p-4 flex flex-col items-start gap-2 text-left',
                  'bg-surface-2/50 hover:bg-surface-2 border-border/50',
                  'hover:border-brand-500/30 hover:shadow-md',
                  'transition-all duration-200',
                  isLoading && 'opacity-50 pointer-events-none'
                )}
                onClick={() => onSelectPrompt(suggestion.prompt)}
                disabled={isLoading}
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-brand-600" />
                  </div>
                  <span className="font-medium text-text">{suggestion.title}</span>
                </div>
                <p className="text-xs text-text-muted line-clamp-2">
                  {suggestion.prompt}
                </p>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Privacy note */}
      <p className="mt-8 text-[10px] text-text-muted/60 max-w-md">
        O Agente de Scrape opera apenas em fontes permitidas e APIs oficiais,
        respeitando termos de uso e legislação vigente.
      </p>
    </div>
  );
}
