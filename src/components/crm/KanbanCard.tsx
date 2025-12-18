import { memo, useCallback } from 'react';
import { EvolutionContact, LeadStatus } from '@/types/sdr';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Sparkles, MoreVertical, Edit, Trash2, Eye, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCustomFieldDefinitions, useCustomFieldValues } from '@/hooks/useCustomFields';
import { useEvolutionInstances } from '@/hooks/useEvolutionInstances';
import { LeadScoreBadge } from './LeadScoreBadge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const STATUS_STYLES: Record<LeadStatus, { bg: string; border: string; stripe: string }> = {
  novo: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/40',
    stripe: 'bg-blue-500',
  },
  contatado: {
    bg: 'bg-indigo-500/5',
    border: 'border-indigo-500/40',
    stripe: 'bg-indigo-500',
  },
  qualificado: {
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/40',
    stripe: 'bg-purple-500',
  },
  proposta: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/40',
    stripe: 'bg-amber-500',
  },
  negociando: {
    bg: 'bg-orange-500/5',
    border: 'border-orange-500/40',
    stripe: 'bg-orange-500',
  },
  ganho: {
    bg: 'bg-green-500/5',
    border: 'border-green-500/40',
    stripe: 'bg-green-500',
  },
  perdido: {
    bg: 'bg-red-500/5',
    border: 'border-red-500/40',
    stripe: 'bg-red-500',
  },
};

type LeadInteractionType = 'message' | 'call';

interface KanbanCardProps {
  contact: EvolutionContact;
  onClick: (contact: EvolutionContact) => void;
  onEdit?: (contact: EvolutionContact) => void;
  onDelete?: (contact: EvolutionContact) => void;
  isDragging?: boolean;
  onInteraction?: (contact: EvolutionContact, type: LeadInteractionType) => void;
}

// ⚡ OTIMIZAÇÃO: React.memo evita re-renders desnecessários do card
// Só re-renderiza se contact ou isDragging mudarem
export const KanbanCard = memo(function KanbanCard({ 
  contact, 
  onClick,
  onEdit,
  onDelete,
  isDragging = false,
  onInteraction,
}: KanbanCardProps) {
  // Buscar definições de custom fields com show_in_card: true
  const { definitions } = useCustomFieldDefinitions();
  const { values } = useCustomFieldValues(contact.id);
  const { data: instances } = useEvolutionInstances();

  const cardFields = definitions.filter(def => def.show_in_card);

  // ⚡ OTIMIZAÇÃO: useCallback estabiliza referência do handler
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {
      onClick(contact);
    }
  }, [isDragging, onClick, contact]);

  // ⚡ OTIMIZAÇÃO: useCallback para handlers de ações rápidas
  const handleMessageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction?.(contact, 'message');
  }, [onInteraction, contact]);

  const handlePhoneClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction?.(contact, 'call');
  }, [onInteraction, contact]);

  // Handlers para menu de contexto
  const handleViewClick = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onClick(contact);
  }, [onClick, contact]);

  const handleEditClick = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onEdit?.(contact);
  }, [onEdit, contact]);

  const handleDeleteClick = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDelete?.(contact);
  }, [onDelete, contact]);

  const handleMenuButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const status = (contact.crm_lead_status || 'novo') as LeadStatus;
  const statusStyles = STATUS_STYLES[status];

  // Cores de status das instâncias
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeStyles = (status?: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200/50';
      case 'connecting': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200/50';
      case 'error': return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200/50';
      default: return 'bg-secondary/50 text-secondary-foreground border-transparent';
    }
  };

  // Identificar instâncias do contato
  const instanceIds = contact.instance_ids || (contact.instance_id ? [contact.instance_id] : []);
  const contactInstances = instances?.filter(i => instanceIds.includes(i.id)) || [];

  // Renderizar conteúdo do menu (reutilizado em Context e Dropdown)
  const menuContent = (
    <>
      <ContextMenuItem onClick={handleViewClick} className="cursor-pointer">
        <Eye className="mr-2 h-4 w-4" />
        <span>Abrir Detalhes</span>
      </ContextMenuItem>
      {onEdit && (
        <ContextMenuItem onClick={handleEditClick} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          <span>Editar Lead</span>
        </ContextMenuItem>
      )}
      {(onEdit || onDelete) && <ContextMenuSeparator />}
      {onDelete && (
        <ContextMenuItem 
          onClick={handleDeleteClick} 
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Excluir Lead</span>
        </ContextMenuItem>
      )}
    </>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "group relative mb-3 transition-all",
            isDragging && "opacity-60 rotate-2"
          )}
        >
          <Card 
            className={cn(
              "relative cursor-grab active:cursor-grabbing hover:shadow-lg transition-all hover:border-primary/60 overflow-hidden",
              statusStyles.bg,
              statusStyles.border,
              isDragging && "shadow-2xl scale-105"
            )}
            onClick={handleClick}
          >
            {/* Faixa de cor baseada na coluna/status */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-1",
                statusStyles.stripe
              )}
            />
            
            {/* Indicador lateral de status (sutil) */}
            <div
              className={cn(
                "absolute inset-y-0 left-0 w-0.5",
                statusStyles.stripe,
                "opacity-20"
              )}
            />

            {/* Botão de Menu Mobile (visível apenas em touch devices) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute top-2 right-2 h-7 w-7 rounded-full z-20", // z-20 to ensure above other elements
                    "opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100",
                    "touch-none pointer-events-auto",
                    // Mobile: sempre visível quando há ações disponíveis
                    "@media (hover: none) { opacity-100 }",
                    "transition-opacity"
                  )}
                  onClick={handleMenuButtonClick}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleViewClick} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Abrir Detalhes</span>
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={handleEditClick} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Editar Lead</span>
                  </DropdownMenuItem>
                )}
                {(onEdit || onDelete) && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={handleDeleteClick} 
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Excluir Lead</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <CardContent className="p-3 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 overflow-hidden w-full pr-6">
                  <Avatar className="h-9 w-9 shrink-0 border border-border/50">
                    <AvatarImage src={contact.profile_pic_url || undefined} />
                    <AvatarFallback>{contact.push_name?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                    <p className="font-semibold text-sm truncate leading-none">
                      {contact.push_name || contact.remote_jid.split('@')[0]}
                    </p>
                    
                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Instance Badges */}
                      {contactInstances.length > 0 ? (
                        contactInstances.map(inst => (
                          <Badge 
                            key={inst.id} 
                            variant="outline" 
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-5 font-medium flex items-center gap-1 truncate max-w-[120px] transition-colors",
                              getStatusBadgeStyles(inst.connection_status)
                            )}
                            title={`${inst.display_name || inst.instance_name} (${inst.connection_status || 'offline'})`}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", getStatusColor(inst.connection_status))} />
                            <span className="truncate">{inst.display_name || inst.instance_name}</span>
                          </Badge>
                        ))
                      ) : (
                         <Badge 
                            variant="secondary" 
                            className="text-[10px] px-1.5 py-0 h-5 font-medium border-0 bg-secondary/30 opacity-60 flex items-center gap-1"
                          >
                            <Circle className="w-1.5 h-1.5 fill-muted-foreground stroke-none" />
                            Sem instância
                          </Badge>
                      )}

                      {/* Badges de Percentual e Cálculos - Agrupados para não quebrar linha no mobile */}
                      <div className="flex flex-nowrap items-center gap-1.5 shrink-0">
                        {/* Lead Score */}
                        {contact.crm_lead_score !== null && contact.crm_lead_score !== undefined && contact.crm_lead_score > 0 && (
                          <LeadScoreBadge score={contact.crm_lead_score} size="sm" showLabel={false} />
                        )}

                        {/* Badge de Probabilidade de Fechamento (Fase 3.5) */}
                        {contact.crm_win_probability !== null && status !== 'ganho' && status !== 'perdido' && (
                          <Badge 
                            variant="outline" 
                            className="text-[10px] px-1.5 py-0 h-5 font-medium shrink-0"
                            style={{
                              backgroundColor: `hsl(${(contact.crm_win_probability / 100) * 120}, 70%, 95%)`,
                              borderColor: `hsl(${(contact.crm_win_probability / 100) * 120}, 70%, 60%)`,
                              color: `hsl(${(contact.crm_win_probability / 100) * 120}, 70%, 30%)`,
                            }}
                          >
                            {contact.crm_win_probability}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loss Reason (only for "perdido" status) */}
              {status === 'perdido' && contact.crm_loss_reason && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded p-2 space-y-1">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">
                    {contact.crm_loss_reason === 'price' && '💰 Preço muito alto'}
                    {contact.crm_loss_reason === 'competitor' && '🏆 Escolheu concorrente'}
                    {contact.crm_loss_reason === 'timing' && '⏰ Não é o momento'}
                    {contact.crm_loss_reason === 'no_budget' && '💸 Sem orçamento'}
                    {contact.crm_loss_reason === 'no_response' && '📵 Sem resposta'}
                    {contact.crm_loss_reason === 'not_qualified' && '❌ Não qualificado'}
                    {contact.crm_loss_reason === 'changed_needs' && '🔄 Mudou necessidades'}
                    {contact.crm_loss_reason === 'other' && '📝 Outro motivo'}
                  </p>
                  {contact.crm_loss_reason_details && (
                    <p className="text-[10px] text-red-600/80 dark:text-red-400/80 line-clamp-2">
                      {contact.crm_loss_reason_details}
                    </p>
                  )}
                </div>
              )}

              {/* Custom Fields (show_in_card: true) */}
              {cardFields.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t">
                  {cardFields.slice(0, 2).map((field) => {
                    const value = values[field.field_key];
                    if (!value) return null;

                    let displayValue: string;
                    
                    // Formatar valor baseado no tipo
                    switch (field.field_type) {
                      case 'boolean':
                        displayValue = value ? '✓' : '✗';
                        break;
                      case 'date':
                        displayValue = new Date(value as string).toLocaleDateString('pt-BR');
                        break;
                      case 'currency':
                        displayValue = `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                        break;
                      case 'multiselect':
                        displayValue = Array.isArray(value) ? value.slice(0, 2).join(', ') : String(value);
                        break;
                      default:
                        displayValue = String(value);
                    }

                    return (
                      <div key={field.id} className="flex items-center justify-between text-[11px] gap-2">
                        <span className="text-muted-foreground truncate">{field.field_label}:</span>
                        <span className="font-medium truncate">{displayValue}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tags */}
              {contact.crm_tags && contact.crm_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {contact.crm_tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer Info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>
                  {contact.crm_last_interaction_at 
                    ? formatDistanceToNow(new Date(contact.crm_last_interaction_at), { addSuffix: true, locale: ptBR })
                    : 'Sem interação'}
                </span>
                
                {/* AI Insight Indicator (Visual only) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Sparkles className="h-3 w-3 text-yellow-500" />
                </div>
              </div>
            </CardContent>
            
            {/* Quick Actions Hover Overlay (Desktop) - Repositioned */}
            <div className={cn(
              "absolute right-2 top-10 flex flex-col gap-1 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-10",
              isDragging ? "pointer-events-none opacity-0" : "opacity-0 group-hover:opacity-100"
            )}>
              <Button size="icon" variant="secondary" className="h-6 w-6 shadow-sm border" onClick={handleMessageClick}>
                <MessageCircle className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="secondary" className="h-6 w-6 shadow-sm border" onClick={handlePhoneClick}>
                <Phone className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {menuContent}
      </ContextMenuContent>
    </ContextMenu>
  );
});
