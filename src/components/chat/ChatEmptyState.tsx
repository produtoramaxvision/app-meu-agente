import { Bot, Users, Database, TrendingUp, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SplineScene } from '@/components/ui/spline-scene';
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
      {/* 3D Spline Robot Agent */}
      <div className="relative w-full max-w-md h-64 md:h-80 mb-4">
        {/* Gradient glow background for emphasis */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 via-transparent to-sky-500/20 rounded-3xl blur-2xl" />
        <div className="absolute inset-0 bg-gradient-radial from-brand-500/10 to-transparent opacity-60" />
        
        {/* Spline 3D Scene */}
        <SplineScene 
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
        />
        
        {/* Decorative animated rings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-brand-500/20 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-brand-500/10 animate-[pulse_3s_ease-in-out_infinite]" />
        </div>
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
                  'h-auto p-4 flex flex-col items-start gap-2 text-left whitespace-normal break-words',
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
        respeitando{' '}
        <a
          href="https://site.meuagente.api.br/termos-de-uso"
          target="_blank"
          rel="noreferrer"
          className="underline text-brand-500 hover:text-brand-600"
        >
          termos de uso
        </a>{' '}
        e legislação vigente.
      </p>
    </div>
  );
}
