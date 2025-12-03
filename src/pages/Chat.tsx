import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatAgent } from '@/hooks/useChatAgent';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatEmptyState } from '@/components/chat/ChatEmptyState';
import { AlertTriangle, MessageCircle } from 'lucide-react';

export default function Chat() {
  const { cliente } = useAuth();
  const {
    messages,
    sendMessage,
    retryMessage,
    clearMessages,
    isLoading,
    messagesEndRef,
    isWebhookConfigured,
  } = useChatAgent();

  const handleSelectPrompt = useCallback(
    (prompt: string) => {
      sendMessage(prompt);
    },
    [sendMessage]
  );

  return (
    <div className="py-4 sm:py-6 lg:py-8 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header with gradient title */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6 animate-fade-in px-1">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm flex items-center gap-3">
            <MessageCircle className="h-9 w-9 text-brand-500" />
            Chat IA
          </h1>
          <p className="text-text-muted mt-2">
            Converse com o Agente de Scrape para extrair dados e informações
          </p>
        </div>
      </div>

      {/* Webhook not configured warning */}
      {!isWebhookConfigured && (
        <Alert variant="destructive" className="mb-4 border-warning bg-warning-bg">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning">
            O webhook do n8n não está configurado. Configure a variável de ambiente{' '}
            <code className="bg-warning/20 px-1 rounded">VITE_N8N_WEBHOOK_URL</code>{' '}
            para habilitar o chat.
          </AlertDescription>
        </Alert>
      )}

      {/* Chat container */}
      <Card className="relative flex-1 flex flex-col overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-px rounded-[1.25rem] bg-gradient-to-br from-primary/12 via-transparent to-sky-500/10 opacity-90" />

        {/* Chat content */}
        <div className="relative flex flex-col h-full z-10">
          {/* Header */}
          <ChatHeader
            onClearHistory={clearMessages}
            messageCount={messages.length}
            isWebhookConfigured={isWebhookConfigured}
          />

          {/* Messages area */}
          <ScrollArea className="flex-1">
            {messages.length === 0 ? (
              <ChatEmptyState
                onSelectPrompt={handleSelectPrompt}
                isLoading={isLoading}
              />
            ) : (
              <div className="divide-y divide-border/30">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onRetry={retryMessage}
                    userName={cliente?.name}
                    userAvatar={cliente?.avatar_url}
                  />
                ))}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            disabled={!isWebhookConfigured}
            placeholder={
              isWebhookConfigured
                ? 'Digite sua mensagem para o Agente de Scrape...'
                : 'Configure o webhook para começar a conversar'
            }
          />
        </div>
      </Card>
    </div>
  );
}
