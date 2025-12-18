"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Bug,
  Lightbulb,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSupportTickets, getSupportSLA } from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';

const supportTicketSchema = z.object({
  type: z.enum(['support', 'bug', 'suggestion'], {
    required_error: 'Selecione o tipo de solicitação',
  }),
  subject: z.string().min(5, 'Assunto deve ter pelo menos 5 caracteres').max(100, 'Assunto deve ter no máximo 100 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

type SupportTicketData = z.infer<typeof supportTicketSchema>;

interface SupportTicketFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: 'support' | 'bug' | 'suggestion';
  onSuccess?: (ticketNumber: string) => void;
}

const typeConfig = {
  support: {
    label: 'Suporte Geral',
    description: 'Dúvidas e problemas comuns',
    icon: MessageSquare,
    color: 'bg-blue-500',
  },
  bug: {
    label: 'Reportar Bug',
    description: 'Problemas técnicos encontrados',
    icon: Bug,
    color: 'bg-red-500',
  },
  suggestion: {
    label: 'Sugestão',
    description: 'Ideias para melhorar o sistema',
    icon: Lightbulb,
    color: 'bg-green-500',
  },
};

export function SupportTicketForm({ 
  open, 
  onOpenChange, 
  initialType = 'support',
  onSuccess 
}: SupportTicketFormProps) {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ticketNumber, setTicketNumber] = useState<string>('');
  
  const { cliente } = useAuth();
  const { 
    createTicket, 
    isCreatingTicket, 
    createTicketError,
    ticketLimit,
    isLoadingLimit 
  } = useSupportTickets();

  // Obter SLA do plano atual
  const currentSLA = cliente?.plan_id ? getSupportSLA(cliente.plan_id) : getSupportSLA('free');

  const form = useForm<SupportTicketData>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      type: initialType,
      subject: '',
      description: '',
      priority: 'medium',
    },
  });

  const onSubmit = async (data: SupportTicketData) => {
    setSubmitStatus('idle');

    try {
      const result = await createTicket({
        type: data.type,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
      });

      if (result?.ticket_number) {
        setTicketNumber(result.ticket_number);
        setSubmitStatus('success');
        
        // Callback de sucesso
        if (onSuccess) {
          onSuccess(result.ticket_number);
        }
      }
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      setSubmitStatus('error');
    }
  };

  const handleClose = () => {
    if (submitStatus === 'success') {
      form.reset();
      setSubmitStatus('idle');
      setTicketNumber('');
    }
    onOpenChange(false);
  };

  const selectedType = form.watch('type');
  const typeInfo = typeConfig[selectedType];

  if (submitStatus === 'success') {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Ticket Criado com Sucesso!
            </DialogTitle>
            <DialogDescription>
              Seu ticket de suporte foi criado e nossa equipe entrará em contato em breve.
            </DialogDescription>
          </DialogHeader>
          
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Detalhes do Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Número do Ticket:</span>
                <Badge variant="outline" className="font-mono">
                  {ticketNumber}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Tipo:</span>
                <div className="flex items-center gap-2">
                  <typeInfo.icon className="h-4 w-4" />
                  <span className="text-sm">{typeInfo.label}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Prioridade:</span>
                <Badge 
                  variant={form.getValues('priority') === 'high' ? 'destructive' : 
                          form.getValues('priority') === 'medium' ? 'default' : 'secondary'}
                >
                  {form.getValues('priority') === 'high' ? 'Alta' : 
                   form.getValues('priority') === 'medium' ? 'Média' : 'Baixa'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleClose} variant="outline">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Formulário de Suporte
          </DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para criar um ticket de suporte. Nossa equipe responderá o mais rápido possível.
          </DialogDescription>
        </DialogHeader>

        {/* Ticket Limit Info */}
        {!isLoadingLimit && ticketLimit && (
          <div className="bg-surface border rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Tickets disponíveis este mês:</span>
              <div className="flex items-center gap-2">
                {ticketLimit.isUnlimited ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Ilimitado
                  </Badge>
                ) : (
                  <Badge 
                    variant={ticketLimit.remaining > 0 ? "default" : "destructive"}
                    className={ticketLimit.remaining > 0 ? "bg-blue-100 text-blue-700" : ""}
                  >
                    {ticketLimit.remaining} de {ticketLimit.limit}
                  </Badge>
                )}
              </div>
            </div>
            {!ticketLimit.isUnlimited && ticketLimit.remaining === 0 && (
              <p className="text-xs text-red-600 mt-1">
                Você atingiu o limite de tickets. Faça upgrade do seu plano para criar mais tickets.
              </p>
            )}
          </div>
        )}

        {/* SLA Info */}
        <div className="bg-surface border rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-text-muted">Tempo de resposta esperado:</span>
              <p className="text-xs text-text-muted mt-1">{currentSLA.description}</p>
            </div>
            <Badge 
              variant={currentSLA.priority === 'critical' ? 'destructive' : 
                      currentSLA.priority === 'high' ? 'default' : 
                      currentSLA.priority === 'medium' ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {currentSLA.responseTime}
            </Badge>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Solicitação */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Solicitação</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de solicitação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(typeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{config.label}</div>
                              <div className="text-xs text-text-muted">{config.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assunto */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Descreva brevemente o assunto da sua solicitação"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Detalhada</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Forneça detalhes sobre sua solicitação, incluindo passos para reproduzir o problema (se aplicável)"
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>Mínimo 10 caracteres</span>
                    <span>{field.value?.length || 0}/1000</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prioridade */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span>Baixa - Questões gerais</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          <span>Média - Problemas moderados</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Alta - Problemas críticos</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status de Erro */}
            {(submitStatus === 'error' || createTicketError) && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  {createTicketError?.message || 'Erro ao criar ticket. Tente novamente ou entre em contato por email.'}
                </span>
              </div>
            )}

            {/* Botões */}
            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isCreatingTicket}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              
              <Button 
                type="submit" 
                disabled={isCreatingTicket}
                className="min-w-[120px]"
              >
                {isCreatingTicket ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
