/**
 * Lead Score Badge
 * Exibe o score do lead com ícone e cor baseada no nível
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { getScoreLevel } from '@/utils/leadScoring';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LeadScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export const LeadScoreBadge = memo(function LeadScoreBadge({ 
  score, 
  size = 'md',
  showLabel = true,
  showTooltip = false,
  className
}: LeadScoreBadgeProps) {
  const level = getScoreLevel(score);
  
  // Configurações de tamanho
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0 gap-0.5',
    md: 'text-xs px-2 py-0.5 gap-1',
    lg: 'text-sm px-3 py-1 gap-1.5'
  };
  
  const badge = (
    <Badge 
      variant="outline"
      className={cn(
        "font-semibold select-none inline-flex items-center cursor-help transition-all hover:scale-105 active:scale-95",
        level.color,
        level.bgColor,
        sizeClasses[size],
        className
      )}
    >
      <span className={size === 'sm' ? 'text-[12px]' : undefined}>{level.icon}</span>
      <span>{score}</span>
      {showLabel && <span className="opacity-70">· {level.label}</span>}
    </Badge>
  );
  
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">{level.icon} {level.label} ({score}/100)</p>
              <p className="text-xs text-muted-foreground">{level.description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return badge;
});
