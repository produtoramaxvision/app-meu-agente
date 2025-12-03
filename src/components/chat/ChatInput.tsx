import { useState, useRef, useCallback, KeyboardEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = 'Digite sua mensagem para o Agente de Scrape...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustHeight();
  };

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isLoading) return;
    
    onSend(trimmed);
    setValue('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, isLoading, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || isLoading;
  const canSend = value.trim().length > 0 && !isDisabled;

  return (
    <div className="flex items-end gap-2 p-4 bg-surface border-t border-border/50">
      <div className="flex-1 relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={1}
          className={cn(
            'min-h-[44px] max-h-[200px] resize-none pr-12',
            'bg-surface-2 border-border/50 focus:border-brand-500/50',
            'placeholder:text-text-muted/60',
            'transition-all duration-200',
            isDisabled && 'opacity-60 cursor-not-allowed'
          )}
        />
        
        {/* Character count hint */}
        {value.length > 500 && (
          <span className="absolute bottom-2 right-14 text-[10px] text-text-muted">
            {value.length}/2000
          </span>
        )}
      </div>

      <Button
        onClick={handleSend}
        disabled={!canSend}
        size="icon"
        className={cn(
          'h-11 w-11 rounded-full flex-shrink-0',
          'bg-gradient-to-br from-brand-500 to-brand-600',
          'hover:from-brand-600 hover:to-brand-700',
          'shadow-lg hover:shadow-xl',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          canSend && 'hover:scale-105'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
        <span className="sr-only">Enviar mensagem</span>
      </Button>
    </div>
  );
}
