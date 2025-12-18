"use client";

import { useState } from 'react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  MessageSquare,
  Calendar,
  Clock,
  XCircle,
  Loader2,
  Eye,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeText } from '@/lib/sanitize';
import { useSupportTickets, getSupportSLA, SupportTicket } from '@/hooks/useSupportTickets';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';

const supportTicketSchema = z.object({
  type: z.enum(['support', 'bug', 'suggestion'], {
    required_error: 'Selecione o tipo de solicitação',
  }),
  subject: z.string().min(5, 'Assunto deve ter pelo menos 5 caracteres').max(100, 'Assunto deve ter no máximo 100 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

type SupportTicketData = z.infer<typeof supportTicketSchema>;

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

const statusConfig = {
  open: {
    label: 'Aberto',
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  in_progress: {
    label: 'Em Andamento',
    icon: Loader2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  resolved: {
    label: 'Resolvido',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  closed: {
    label: 'Fechado',
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

const priorityConfig = {
  low: {
    label: 'Baixa',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  medium: {
    label: 'Média',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  high: {
    label: 'Alta',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

function TicketCard({ ticket }: { ticket: SupportTicket }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const typeInfo = typeConfig[ticket.type];
  const statusInfo = statusConfig[ticket.status];
  const priorityInfo = priorityConfig[ticket.priority];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn('p-2 rounded-lg flex-shrink-0', 'color' in typeInfo && typeof typeInfo.color === 'string' ? typeInfo.color : '')}>
              <typeInfo.icon className={cn('h-4 w-4', typeInfo.color)} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{ticket.subject}</CardTitle>
              <CardDescription className="text-sm">
                #{ticket.ticket_number}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge 
              variant="outline" 
              className={cn('text-xs', statusInfo.color, statusInfo.bgColor)}
            >
              <statusInfo.icon className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">{statusInfo.label}</span>
              <span className="sm:hidden">{statusInfo.label.split(' ')[0]}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Meta informações */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(ticket.created_at)}
            </div>
            <div className="flex items-center gap-1">
              <Badge 
                variant="outline" 
                className={cn('text-xs', priorityInfo.color, priorityInfo.bgColor)}
              >
                {priorityInfo.label}
              </Badge>
            </div>
          </div>

          {/* Descrição (truncada) */}
          <p className="text-sm text-text-muted line-clamp-2">
            {sanitizeText(ticket.description)}
          </p>

          {/* Botão para ver detalhes */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              {showDetails ? 'Ocultar' : 'Ver Detalhes'}
            </Button>
          </div>

          {/* Detalhes expandidos */}
          {showDetails && (
            <div className="border-t pt-3 space-y-3">
              <div>
                <h4 className="text-sm font-medium text-text mb-1">Descrição Completa:</h4>
                <p className="text-sm text-text-muted whitespace-pre-wrap">
                  {sanitizeText(ticket.description)}
                </p>
              </div>
              
              {ticket.admin_notes && (
                <div>
                  <h4 className="text-sm font-medium text-text mb-1">Resposta da Equipe:</h4>
                  <div className="bg-surface border rounded-lg p-3">
                    <p className="text-sm text-text-muted whitespace-pre-wrap">
                      {sanitizeText(ticket.admin_notes)}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-xs text-text-muted">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Última atualização: {formatDate(ticket.updated_at)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SupportFormTab({ onSuccess }: { onSuccess: (ticketNumber: string) => void }) {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ticketNumber, setTicketNumber] = useState<string>('');
  const navigate = useNavigate();
  
  const { cliente } = useAuth();
  const { permissions, getUpgradeMessage } = usePermissions();
  const { 
    createTicket, 
    isCreatingTicket, 
    createTicketError,
    ticketLimit,
    isLoadingLimit 
  } = useSupportTickets();

  // Obter SLA do plano atual
  const currentSLA = cliente?.plan_id ? getSupportSLA(cliente.plan_id) : getSupportSLA('free');

  // Initialize form before any early returns (Rules of Hooks)
  const form = useForm<SupportTicketData>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      type: 'support',
      subject: '',
      description: '',
      priority: 'medium',
    },
  });

  // Verificar se o usuário tem acesso ao suporte
  if (!permissions.canAccessSupport) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <FileText className="h-8 w-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-amber-800">
              Suporte Indisponível
            </h3>
            <p className="text-amber-700 max-w-md">
              {getUpgradeMessage('Sistema de Suporte')}
            </p>
          </div>
          <Button 
            onClick={() => navigate('/perfil?tab=plans')}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            Ver Planos Disponíveis
          </Button>
        </div>
      </Card>
    );
  }

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

  const selectedType = form.watch('type');
  const typeInfo = typeConfig[selectedType];

  if (submitStatus === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="font-medium text-text mb-2">Ticket Criado com Sucesso!</h3>
        <p className="text-sm text-text-muted mb-4">
          Seu ticket {ticketNumber} foi criado e nossa equipe entrará em contato em breve.
        </p>
        <Button onClick={() => {
          form.reset();
          setSubmitStatus('idle');
          setTicketNumber('');
        }} variant="outline">
          Criar Novo Ticket
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Ticket Limit Info */}
      {!isLoadingLimit && ticketLimit && (
        <div className="bg-surface border rounded-lg p-3">
          <div className="flex flex-row items-center justify-between gap-2 text-sm">
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
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
                      <SelectValue placeholder="Selecione o tipo de solicitação">
                        {field.value && typeConfig[field.value as keyof typeof typeConfig] ? (
                          <div className="flex items-center gap-2">
                            {React.createElement(typeConfig[field.value as keyof typeof typeConfig].icon, { 
                              className: "h-4 w-4 flex-shrink-0" 
                            })}
                            <span className="font-medium text-sm">
                              {typeConfig[field.value as keyof typeof typeConfig].label}
                            </span>
                          </div>
                        ) : (
                          "Selecione o tipo de solicitação"
                        )}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-3 w-full">
                          <config.icon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{config.label}</div>
                            <div className="text-xs text-text-muted truncate">{config.description}</div>
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
                    data-testid="ticket-subject-input"
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
                    className="min-h-[100px] sm:min-h-[120px] resize-none"
                    data-testid="ticket-description-textarea"
                    {...field}
                  />
                </FormControl>
                <div className="flex justify-between text-xs text-text-muted mt-1">
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
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700" data-testid="error-message">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                {createTicketError?.message || 'Erro ao criar ticket. Tente novamente ou entre em contato por email.'}
              </span>
            </div>
          )}

          {/* Botão de Envio */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-6 pb-2">
            <Button 
              type="submit" 
              disabled={isCreatingTicket}
              className="w-full sm:w-auto sm:min-w-[120px]"
              data-testid="submit-ticket-button"
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
    </div>
  );
}

export function SupportTicketsTab() {
  const navigate = useNavigate();
  const { permissions, getUpgradeMessage } = usePermissions();
  const { 
    tickets, 
    isLoadingTickets, 
    ticketsError,
    ticketLimit 
  } = useSupportTickets();

  // Verificar se o usuário tem acesso ao suporte
  if (!permissions.canAccessSupport) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <List className="h-8 w-8 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-amber-800">
              Tickets Indisponíveis
            </h3>
            <p className="text-amber-700 max-w-md">
              {getUpgradeMessage('Visualização de Tickets')}
            </p>
          </div>
          <Button 
            onClick={() => navigate('/perfil?tab=plans')}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            Ver Planos Disponíveis
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoadingTickets) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (ticketsError) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-text-muted">
            {ticketsError.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Resumo */}
      {ticketLimit && (
        <div className="bg-surface border rounded-lg p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-medium text-text text-sm">Resumo do Suporte</h3>
              <p className="text-xs text-text-muted">
                {tickets.length} ticket(s) criado(s)
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs text-text-muted">Tickets disponíveis:</p>
              <Badge 
                variant={ticketLimit.isUnlimited ? "secondary" : "default"}
                className={`text-xs ${ticketLimit.isUnlimited ? "bg-green-100 text-green-700" : ""}`}
              >
                {ticketLimit.isUnlimited ? 'Ilimitado' : `${ticketLimit.remaining} de ${ticketLimit.limit}`}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Tickets */}
      <div>
        {tickets.length === 0 ? (
          <div className="flex items-center justify-center px-4 py-6 sm:py-12">
            <div className="text-center w-full max-w-md mx-auto">
              <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-text-muted mx-auto mb-4 sm:mb-6" />
              <h3 className="font-medium text-text mb-2 sm:mb-3 text-base sm:text-lg">Nenhum ticket encontrado</h3>
              <p className="text-sm text-text-muted mb-4 sm:mb-6 px-2">
                Você ainda não criou nenhum ticket de suporte. Use a aba "Novo Ticket" para criar seu primeiro ticket.
              </p>
              <div className="bg-surface border rounded-lg p-3 sm:p-4 mx-2 sm:mx-auto">
                <h4 className="font-medium text-text mb-2 text-sm sm:text-base">💡 Dica</h4>
                <p className="text-xs text-text-muted">
                  Tickets de suporte são a melhor forma de obter ajuda personalizada da nossa equipe.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
