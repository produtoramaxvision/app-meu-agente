import { memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Bot, User, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: (messageId: string) => void;
  userName?: string;
  userAvatar?: string;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  onRetry,
  userName,
  userAvatar,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isSending = message.status === 'sending';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success('Copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <div
      className={cn(
        'group flex gap-3 py-4 px-2 transition-colors',
        isUser ? 'flex-row-reverse' : 'flex-row',
        isError && 'bg-danger-bg/30'
      )}
    >
      {/* Avatar */}
      <Avatar className={cn('h-8 w-8 flex-shrink-0', isSending && 'opacity-60')}>
        {isUser ? (
          <>
            <AvatarImage src={userAvatar} alt={userName || 'Você'} />
            <AvatarFallback className="bg-brand-500 text-white text-xs">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-brand-600 to-brand-800 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Message content */}
      <div
        className={cn(
          'flex flex-col max-w-[80%] md:max-w-[70%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Role label */}
        <span className="text-xs text-text-muted mb-1 px-1">
          {isUser ? (userName || 'Você') : 'Agente de Scrape'}
        </span>

        {/* Message bubble */}
        <div
          className={cn(
            'relative rounded-2xl px-4 py-3 shadow-sm',
            isUser
              ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-tr-sm'
              : 'bg-surface-2 text-text border border-border/50 rounded-tl-sm',
            isSending && 'opacity-70',
            isError && 'border-danger/50'
          )}
        >
          {/* Message text with proper whitespace handling */}
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>

          {/* Sending indicator */}
          {isSending && (
            <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
              <div className="flex gap-1">
                <span className="animate-bounce delay-0">.</span>
                <span className="animate-bounce delay-75">.</span>
                <span className="animate-bounce delay-150">.</span>
              </div>
              <span>Enviando</span>
            </div>
          )}
        </div>

        {/* Footer: timestamp, error, actions */}
        <div className="flex items-center gap-2 mt-1 px-1">
          {/* Timestamp */}
          <span className="text-[10px] text-text-muted">
            {format(message.timestamp, "HH:mm", { locale: ptBR })}
          </span>

          {/* Error indicator and retry */}
          {isError && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-danger" />
              <span className="text-[10px] text-danger">Falha ao enviar</span>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px] text-danger hover:text-danger hover:bg-danger-bg"
                  onClick={() => onRetry(message.id)}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Tentar novamente
                </Button>
              )}
            </div>
          )}

          {/* Copy button (visible on hover for assistant messages) */}
          {!isUser && !isSending && !isError && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3 text-success" />
              ) : (
                <Copy className="h-3 w-3 text-text-muted" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
