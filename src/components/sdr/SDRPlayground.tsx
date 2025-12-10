// =============================================================================
// Componente: SDRPlayground
// Ambiente de teste para simular conversas com o Agente SDR
// =============================================================================

import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSDRAgent } from '@/hooks/useSDRAgent';
import { cn } from '@/lib/utils';
import type { PlaygroundMessage } from '@/types/sdr';
import { useAuth } from '@/contexts/AuthContext';

// Gerar ID único
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const WEBHOOK_URL = 'https://webhook.meuagente.api.br/webhook/agente-sdr-playground';

export function SDRPlayground() {
  const { configJson, isAgentActive } = useSDRAgent();
  const { cliente } = useAuth();
  const [messages, setMessages] = useState<PlaygroundMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensagem inicial do agente
  useEffect(() => {
    if (configJson && messages.length === 0) {
      const greeting = configJson.mensagens.saudacao || 
        `Olá! Sou ${configJson.identidade.nome_agente} da ${configJson.identidade.nome_empresa}. Como posso ajudar você hoje?`;
      
      setMessages([
        {
          id: generateId(),
          role: 'assistant',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    }
  }, [configJson]);

  // Enviar para webhook do playground e exibir resposta do agente real
  const sendToWebhook = async (userMessage: string) => {
    setIsLoading(true);

    const payload = {
      message: userMessage,
      phone: cliente?.phone,
      agent: configJson?.identidade?.nome_agente,
      empresa: configJson?.identidade?.nome_empresa,
      origem: 'playground-web',
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let replyText = '';

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await response.json().catch(() => ({} as any));
          replyText = json.reply || json.message || JSON.stringify(json);
        } else {
          replyText = await response.text();
        }

        if (!replyText) {
          replyText = 'O webhook não retornou mensagem.';
        }
      } else {
        replyText = `Erro do webhook (${response.status})`;
      }

      const agentMessage: PlaygroundMessage = {
        id: generateId(),
        role: 'assistant',
        content: replyText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      const agentMessage: PlaygroundMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Falha ao contatar webhook: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar mensagem
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Adicionar mensagem do usuário
    const userMessage: PlaygroundMessage = {
      id: generateId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Disparar webhook para obter resposta real do agente
    await sendToWebhook(userMessage.content);
    
    // Focar no input
    inputRef.current?.focus();
  };

  // Reiniciar conversa
  const handleReset = () => {
    setMessages([]);
    setInputValue('');
    // Trigger re-render para mostrar mensagem inicial
    setTimeout(() => {
      if (configJson) {
        const greeting = configJson.mensagens.saudacao || 
          `Olá! Sou ${configJson.identidade.nome_agente} da ${configJson.identidade.nome_empresa}. Como posso ajudar você hoje?`;
        
        setMessages([
          {
            id: generateId(),
            role: 'assistant',
            content: greeting,
            timestamp: new Date(),
          },
        ]);
      }
    }, 100);
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              🎮 Playground
            </CardTitle>
            <CardDescription>
              Teste como seu agente responde às mensagens
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        </div>

        {!isAgentActive && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 text-sm p-2 rounded-md">
            ⚠️ O agente está pausado. Ative-o na aba de configurações.
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Área de mensagens */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' && 'flex-row-reverse'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                    message.role === 'assistant'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>

                {/* Mensagem */}
                <div
                  className={cn(
                    'rounded-lg px-4 py-2 max-w-[80%]',
                    message.role === 'assistant'
                      ? 'bg-muted'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={cn(
                      'text-xs mt-1',
                      message.role === 'assistant'
                        ? 'text-muted-foreground'
                        : 'text-primary-foreground/70'
                    )}
                  >
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Indicador de digitação */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input de mensagem */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite uma mensagem..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!inputValue.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Aviso */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          ℹ️ Este é um ambiente de teste. As mensagens não são enviadas para o WhatsApp.
        </p>
      </CardContent>
    </Card>
  );
}
