// =============================================================================
// Componente: SliderWithTooltip
// Slider moderno com tooltip que mostra o valor ao arrastar (MAGIC-MCP)
// =============================================================================

import { useState, useId } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SliderWithTooltipProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  description?: string;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  className?: string;
}

export function SliderWithTooltip({
  value,
  onChange,
  min,
  max,
  step,
  label,
  description,
  formatValue = (v) => v.toFixed(step < 1 ? 1 : 0),
  disabled = false,
  className,
}: SliderWithTooltipProps) {
  const id = useId();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {formatValue(value)}
        </span>
      </div>

      <TooltipProvider>
        <Tooltip open={showTooltip}>
          <TooltipTrigger asChild>
            <SliderPrimitive.Root
              id={id}
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[value]}
              onValueChange={([v]) => onChange(v)}
              max={max}
              min={min}
              step={step}
              disabled={disabled}
              onPointerDown={() => setShowTooltip(true)}
              onPointerUp={() => setShowTooltip(false)}
              onPointerLeave={() => setShowTooltip(false)}
            >
              <SliderPrimitive.Track
                className={cn(
                  'relative grow rounded-full h-2',
                  disabled ? 'bg-muted' : 'bg-secondary'
                )}
              >
                <SliderPrimitive.Range
                  className={cn(
                    'absolute rounded-full h-full',
                    disabled ? 'bg-muted-foreground/50' : 'bg-primary'
                  )}
                />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb
                className={cn(
                  'block w-5 h-5 rounded-full shadow-lg transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  disabled
                    ? 'bg-muted-foreground/50 cursor-not-allowed'
                    : 'bg-background border-2 border-primary hover:border-primary/80 cursor-grab active:cursor-grabbing'
                )}
              />
            </SliderPrimitive.Root>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm shadow-md border"
            sideOffset={8}
          >
            {formatValue(value)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
