import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ConnectionsBadge } from './ConnectionsBadge';
import { getTagColor, useLeadTagsReadOnly } from '@/hooks/useCrmTags';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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

// Helper para calcular estilos de probabilidade de fechamento
function getWinProbabilityStyles(probability: number) {
  const hue = (probability / 100) * 120; // 0 (red) to 120 (green)
  return {
    backgroundColor: `hsl(${hue}, 70%, 95%)`,
    borderColor: `hsl(${hue}, 70%, 60%)`,
    color: `hsl(${hue}, 70%, 30%)`,
  };
}

type LeadInteractionType = 'message' | 'call';

interface KanbanCardProps {
  contact: EvolutionContact;
  onClick: (contact: EvolutionContact) => void;
  onEdit?: (contact: EvolutionContact) => void;
  onDelete?: (contact: EvolutionContact) => void;
  isDragging?: boolean;
  onInteraction?: (contact: EvolutionContact, type: LeadInteractionType) => void;
  onTagClick?: (tagName: string) => void;
  selectedTags?: string[];
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
  onTagClick,
  selectedTags = [],
}: KanbanCardProps) {
  // Buscar definições de custom fields com show_in_card: true
  const { definitions } = useCustomFieldDefinitions();
  const { values } = useCustomFieldValues(contact.id);
  const { data: instances } = useEvolutionInstances();
  
  // Relational Tags (for card display)
  const { tags: relationalTags } = useLeadTagsReadOnly(contact.id);

  const cardFields = definitions.filter(def => def.show_in_card);

  // ⚡ OTIMIZAÇÃO: useCallback estabiliza referência do handler
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {
      onClick(contact);
    }
  }, [isDragging, onClick, contact]);

  // Previne context menu nativo do iOS Safari durante long-press para drag
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

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

  // Identificar instâncias do contato
  const instanceIds = contact.instance_ids || (contact.instance_id ? [contact.instance_id] : []);
  const contactInstances = instances?.filter(i => instanceIds.includes(i.id)) || [];
  const navigate = useNavigate();

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
            onContextMenu={handleContextMenu}
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
                    "absolute top-2 right-2 h-7 w-7 rounded-full z-dropdown",
                    "opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100",
                    "pointer-events-auto",
                    // Mobile: sempre visível em touch devices
                    "touch:opacity-100",
                    "transition-opacity"
                  )}
                  onClick={handleMenuButtonClick}
                  aria-label="Menu de ações do lead"
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
                      {/* Connection Badge - Unified display of all instances */}
                      <ConnectionsBadge 
                        instances={contactInstances}
                        onInstanceClick={(instanceId) => {
                          navigate(`/agente-sdr?instanceId=${instanceId}`);
                        }}
                      />

                      {/* Badges de Percentual e Cálculos - com card explicativo em hover */}
                      <HoverCard openDelay={120}>
                        <HoverCardTrigger asChild>
                          <div className="flex flex-nowrap items-center gap-1.5 shrink-0 cursor-help">
                            {/* Lead Score */}
                            {contact.crm_lead_score !== null && contact.crm_lead_score !== undefined && contact.crm_lead_score > 0 && (
                              <LeadScoreBadge score={contact.crm_lead_score} size="sm" showLabel={false} />
                            )}

                            {/* Badge de Probabilidade de Fechamento (Fase 3.5) */}
                            {contact.crm_win_probability !== null && status !== 'ganho' && status !== 'perdido' && (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] px-1.5 py-0 h-5 font-medium shrink-0"
                                style={getWinProbabilityStyles(contact.crm_win_probability)}
                              >
                                {contact.crm_win_probability}%
                              </Badge>
                            )}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 text-xs space-y-2">
                          <p className="text-[11px] font-semibold text-muted-foreground">
                            Como interpretar estes números
                          </p>
                          {contact.crm_lead_score !== null && contact.crm_lead_score !== undefined && contact.crm_lead_score > 0 && (
                            <div className="space-y-0.5">
                              <p className="font-medium text-foreground">
                                ⚡ Score do lead: <span className="font-semibold">{contact.crm_lead_score}</span>/100
                              </p>
                              <p className="text-muted-foreground">
                                Calculado automaticamente pela IA a partir do engajamento, dados do contato e tags. 
                                Quanto maior o número, mais quente e prioritário é o lead.
                              </p>
                            </div>
                          )}
                          {contact.crm_win_probability !== null && status !== 'ganho' && status !== 'perdido' && (
                            <div className="space-y-0.5">
                              <p className="font-medium text-foreground">
                                🎯 Probabilidade de fechamento:{" "}
                                <span className="font-semibold">{contact.crm_win_probability}%</span>
                              </p>
                              <p className="text-muted-foreground">
                                Definida na ficha do lead com base no estágio do funil e sua percepção. 
                                Use esse valor para priorizar negociações com maior chance de ganho.
                              </p>
                            </div>
                          )}
                        </HoverCardContent>
                      </HoverCard>
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
                      case 'currency': {
                        const numValue = Number(value);
                        displayValue = !isNaN(numValue) 
                          ? `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                          : String(value);
                        break;
                      }
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

              {/* Tags (Relational) */}
              {relationalTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {relationalTags.slice(0, 3).map((tag) => {
                    const isSelected = selectedTags.includes(tag.tag_name);
                    return (
                      <span 
                        key={tag.tag_id} 
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-offset-1 shadow-md' : 'hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: isSelected ? tag.tag_color : `${tag.tag_color}20`,
                          borderColor: tag.tag_color,
                          color: isSelected ? '#ffffff' : tag.tag_color,
                          border: isSelected ? '2px solid' : '1px solid',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTagClick?.(tag.tag_name);
                        }}
                        title={isSelected ? `Remover filtro: ${tag.tag_name}` : `Filtrar por: ${tag.tag_name}`}
                      >
                        {tag.tag_name}
                      </span>
                    );
                  })}
                  {relationalTags.length > 3 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      +{relationalTags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Footer Info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>
                  {contact.crm_last_interaction_at 
                    ? formatDistanceToNow(new Date(contact.crm_last_interaction_at), { addSuffix: true, locale: ptBR })
                    : 'Sem interação'}
                </span>
                
                {/* Indicador de Insights da IA com tooltip explicativo */}
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-help"
                      role="button"
                      aria-label="Saiba mais sobre insights do lead"
                    >
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs max-w-[200px] text-center">
                    Insights inteligentes do lead. Em breve mostraremos dicas da IA aqui.
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
            
            {/* Quick Actions Hover Overlay (Desktop) - Repositioned */}
            {!isDragging && onInteraction && (
              <div className="absolute right-2 top-10 flex flex-col gap-1 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-overlay opacity-0 group-hover:opacity-100">
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-6 w-6 shadow-sm border" 
                      onClick={handleMessageClick}
                      aria-label="Enviar mensagem"
                    >
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    Enviar mensagem
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="h-6 w-6 shadow-sm border" 
                      onClick={handlePhoneClick}
                      aria-label="Ligar"
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    Ligar
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </Card>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {menuContent}
      </ContextMenuContent>
    </ContextMenu>
  );
});
