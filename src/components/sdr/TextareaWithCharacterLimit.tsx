// =============================================================================
// Componente: TextareaWithCharacterLimit
// Textarea com contador de caracteres restantes (MAGIC-MCP)
// =============================================================================

import { useId } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TextareaWithCharacterLimitProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  label: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function TextareaWithCharacterLimit({
  value,
  onChange,
  maxLength,
  label,
  placeholder,
  rows = 4,
  disabled = false,
  className,
  required = false,
}: TextareaWithCharacterLimitProps) {
  const id = useId();
  const remaining = maxLength - value.length;
  const isNearLimit = remaining < maxLength * 0.1;
  const isAtLimit = remaining <= 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>

      <Textarea
        id={id}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        aria-describedby={`${id}-description`}
        className={cn(
          isNearLimit && !isAtLimit && 'border-yellow-500 focus-visible:ring-yellow-500/20',
          isAtLimit && 'border-destructive focus-visible:ring-destructive/20'
        )}
      />

      <p
        id={`${id}-description`}
        className={cn(
          'text-right text-xs transition-colors',
          isAtLimit
            ? 'text-destructive font-medium'
            : isNearLimit
            ? 'text-yellow-600 dark:text-yellow-500'
            : 'text-muted-foreground'
        )}
        role="status"
        aria-live="polite"
      >
        <span className="tabular-nums">{remaining}</span> caracteres restantes
      </p>
    </div>
  );
}
