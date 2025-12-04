import { useCallback, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChatAgent } from '@/hooks/useChatAgent';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatIntroAnimation } from '@/components/chat/ChatIntroAnimation';
import { PromptInputBox } from '@/components/chat/PromptInputBox';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chat() {
  const { cliente } = useAuth();
  const {
    messages,
    allSessions,
    sendMessage,
    retryMessage,
    clearMessages,
    selectSession,
    isLoading,
    messagesEndRef,
    isWebhookConfigured,
  } = useChatAgent();

  // State to control when to show the chat view
  const [showChatView, setShowChatView] = useState(false);

  // Transform sessions to the format expected by PromptInputBox
  const chatSessions = useMemo(() => 
    allSessions.map(session => ({
      id: session.id,
      title: session.title || 'Nova conversa',
      updatedAt: session.updatedAt,
      messageCount: (session as any).messageCount || 0,
    })),
    [allSessions]
  );

  const handleSendMessage = useCallback(
    (message: string) => {
      // When user sends a message, show the chat view
      if (!showChatView) {
        setShowChatView(true);
      }
      sendMessage(message);
    },
    [sendMessage, showChatView]
  );

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      // When user selects a session from history, load it and show chat view
      selectSession(sessionId);
      setShowChatView(true);
    },
    [selectSession]
  );

  // Always show intro first, until user starts a chat or selects from history
  const showIntro = !showChatView;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Webhook not configured warning */}
      <AnimatePresence>
        {!isWebhookConfigured && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-4"
          >
            <Alert variant="destructive" className="border-warning bg-warning-bg">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                O webhook do n8n não está configurado. Configure a variável de ambiente{' '}
                <code className="bg-warning/20 px-1 rounded">VITE_N8N_WEBHOOK_URL</code>{' '}
                para habilitar o chat.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {showIntro ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="flex-1"
            >
              <ChatIntroAnimation
                onSend={handleSendMessage}
                onSelectSession={handleSelectSession}
                isLoading={isLoading}
                disabled={!isWebhookConfigured}
                chatSessions={chatSessions}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Chat Interface */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Chat content */}
                <div className="relative flex flex-col h-full z-10">
                  {/* Header */}
                  <ChatHeader
                    onClearHistory={() => {
                      clearMessages();
                      setShowChatView(false);
                    }}
                    messageCount={messages.length}
                    isWebhookConfigured={isWebhookConfigured}
                  />

                  {/* Messages area */}
                  <ScrollArea className="flex-1">
                    <div className="py-2">
                      <div className="space-y-4">
                        {messages.map((message, index) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                          >
                            <ChatMessage
                              message={message}
                              onRetry={retryMessage}
                              userName={cliente?.name}
                              userAvatar={cliente?.avatar_url}
                            />
                          </motion.div>
                        ))}
                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                  </ScrollArea>

                  {/* Input area */}
                  <div className="relative p-2 border-t border-border/30 bg-bg">
                    {/* Subtle glow effect */}
                    <div className="absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
                    
                    <div className="w-full">
                      <PromptInputBox
                        onSend={handleSendMessage}
                        isLoading={isLoading}
                        disabled={!isWebhookConfigured}
                        placeholder={
                          isWebhookConfigured
                            ? 'Digite sua mensagem para o Agente de Scrape...'
                            : 'Configure o webhook para começar a conversar'
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
