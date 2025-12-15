import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, value, ...props }, ref) => {
  // BUG FIX - TestSprite TC002 - CORREÇÃO CRÍTICA DE SEGURANÇA
  // Problema: Warning "A component is changing an uncontrolled input to be controlled"
  // Causa: Valor mudando de undefined para um valor definido
  // Solução: Garantir que o valor seja sempre uma string definida
  const controlledValue = value === undefined ? '' : value;
  
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      value={controlledValue}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
