// =============================================================================
// Componente: AnimatedSlider
// Slider animado com Framer Motion e tooltip flutuante
// Substituição moderna do SliderWithTooltip com animações suaves
// =============================================================================

import { useState, useId, ElementRef, useRef } from 'react';
import * as RadixSlider from '@radix-ui/react-slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  AnimatePresence,
} from 'framer-motion';

const MAX_OVERFLOW = 50;

interface AnimatedSliderProps {
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

// Função de decay sigmoid para efeito de overflow suave
function decay(value: number, max: number) {
  if (max === 0) {
    return 0;
  }

  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);

  return sigmoid * max;
}

export function AnimatedSlider({
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
}: AnimatedSliderProps) {
  const id = useId();
  const [showTooltip, setShowTooltip] = useState(false);
  const [region, setRegion] = useState('middle');
  const clientX = useMotionValue(0);
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);
  const ref = useRef<ElementRef<typeof RadixSlider.Root>>(null);
  
  // Animated value for number counter animation
  const animatedValue = useMotionValue(value);

  // Monitorar movimento do mouse para calcular overflow
  useMotionValueEvent(clientX, 'change', (latest) => {
    if (ref.current && !disabled) {
      const { left, right } = ref.current.getBoundingClientRect();
      let newValue;

      if (latest < left) {
        setRegion('left');
        newValue = left - latest;
      } else if (latest > right) {
        setRegion('right');
        newValue = latest - right;
      } else {
        setRegion('middle');
        newValue = 0;
      }

      overflow.jump(decay(newValue, MAX_OVERFLOW));
    }
  });

  // Animar valor quando muda
  const handleValueChange = ([v]: number[]) => {
    const newValue = Math.round(v / step) * step; // Garantir que segue o step
    onChange(newValue);
    animate(animatedValue, newValue, {
      duration: 0.3,
      ease: 'easeOut',
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex justify-between items-center">
        <Label 
          htmlFor={id} 
          className={cn(
            'text-sm font-medium transition-colors',
            disabled && 'text-muted-foreground'
          )}
        >
          {label}
        </Label>
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'text-sm font-mono px-2 py-0.5 rounded transition-colors',
              disabled 
                ? 'text-muted-foreground bg-muted/50' 
                : 'text-muted-foreground bg-muted'
            )}
          >
            {formatValue(value)}
          </motion.span>
        </AnimatePresence>
      </div>

      <TooltipProvider>
        <Tooltip open={showTooltip && !disabled}>
          <TooltipTrigger asChild>
            <motion.div
              onHoverStart={() => !disabled && animate(scale, 1.2)}
              onHoverEnd={() => !disabled && animate(scale, 1)}
              onTouchStart={() => !disabled && animate(scale, 1.2)}
              onTouchEnd={() => !disabled && animate(scale, 1)}
              style={{
                scale,
                opacity: useTransform(scale, [1, 1.2], [disabled ? 0.5 : 0.7, disabled ? 0.5 : 1]),
              }}
              className="flex w-full touch-none select-none items-center justify-center"
            >
              <RadixSlider.Root
                ref={ref}
                id={id}
                value={[value]}
                onValueChange={handleValueChange}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                className={cn(
                  'relative flex w-full grow cursor-grab touch-none select-none items-center py-4',
                  disabled && 'cursor-not-allowed opacity-50',
                  !disabled && 'active:cursor-grabbing'
                )}
                onPointerMove={(e) => {
                  if (e.buttons > 0 && !disabled) {
                    clientX.jump(e.clientX);
                  }
                }}
                onPointerDown={() => !disabled && setShowTooltip(true)}
                onPointerUp={() => setShowTooltip(false)}
                onPointerLeave={() => {
                  setShowTooltip(false);
                  if (!disabled) {
                    animate(overflow, 0, { type: 'spring', bounce: 0.5 });
                  }
                }}
                onLostPointerCapture={() => {
                  if (!disabled) {
                    animate(overflow, 0, { type: 'spring', bounce: 0.5 });
                  }
                }}
              >
                <motion.div
                  style={{
                    scaleX: useTransform(() => {
                      if (ref.current && !disabled) {
                        const { width } = ref.current.getBoundingClientRect();
                        return 1 + overflow.get() / width;
                      }
                      return 1;
                    }),
                    scaleY: useTransform(overflow, [0, MAX_OVERFLOW], [1, 0.8]),
                    transformOrigin: useTransform(() => {
                      if (ref.current) {
                        const { left, width } = ref.current.getBoundingClientRect();
                        return clientX.get() < left + width / 2 ? 'right' : 'left';
                      }
                      return 'center';
                    }),
                    height: useTransform(scale, [1, 1.2], [6, 12]),
                    marginTop: useTransform(scale, [1, 1.2], [0, -3]),
                    marginBottom: useTransform(scale, [1, 1.2], [0, -3]),
                  }}
                  className="flex grow"
                >
                  <RadixSlider.Track className="relative isolate h-full grow overflow-hidden rounded-full bg-muted">
                    <RadixSlider.Range 
                      className={cn(
                        'absolute h-full transition-colors',
                        disabled ? 'bg-muted-foreground/50' : 'bg-foreground'
                      )}
                    />
                  </RadixSlider.Track>
                </motion.div>
                <RadixSlider.Thumb
                  className={cn(
                    'block w-5 h-5 rounded-full shadow-lg transition-all',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    disabled
                      ? 'bg-muted-foreground/50 cursor-not-allowed'
                      : 'bg-background border-2 border-primary hover:border-primary/80 hover:scale-110'
                  )}
                />
              </RadixSlider.Root>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm shadow-md border"
            sideOffset={8}
          >
            <motion.span
              key={value}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              {formatValue(value)}
            </motion.span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'text-xs transition-colors',
            disabled ? 'text-muted-foreground/50' : 'text-muted-foreground'
          )}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
