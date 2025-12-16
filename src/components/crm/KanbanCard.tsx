import { useState } from 'react';
import { EvolutionContact, LeadStatus } from '@/types/sdr';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface KanbanCardProps {
  contact: EvolutionContact;
  onClick: (contact: EvolutionContact) => void;
  onDragStart?: (contact: EvolutionContact) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ contact, onClick, onDragStart, onDragEnd, isDragging = false }: KanbanCardProps) {
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDraggingLocal(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('contactId', contact.id);
    e.dataTransfer.setData('currentStatus', contact.crm_lead_status || 'novo');
    onDragStart?.(contact);
  };

  const handleDragEnd = () => {
    setIsDraggingLocal(false);
    onDragEnd?.();
  };

  // Temperature logic (mocked for now based on score or default)
  const temperatureColor = 
    contact.crm_lead_score > 80 ? 'bg-red-500' :
    contact.crm_lead_score > 50 ? 'bg-orange-500' :
    'bg-blue-500';

  const isCurrentlyDragging = isDragging || isDraggingLocal;
  const status = (contact.crm_lead_status || 'novo') as LeadStatus;
  const statusStyles = STATUS_STYLES[status];

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "group relative mb-3 transition-all cursor-move",
        isCurrentlyDragging && "opacity-50 scale-95 z-50"
      )}
    >
      <Card 
        className={cn(
          "relative cursor-grab active:cursor-grabbing hover:shadow-lg transition-all hover:border-primary/60 overflow-hidden",
          statusStyles.bg,
          statusStyles.border
        )}
        onClick={(e) => {
          if (!isCurrentlyDragging) {
            onClick(contact);
          }
        }}
      >
        {/* Faixa de cor baseada na coluna/status */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-1",
            statusStyles.stripe
          )}
        />

        <CardContent className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={contact.profile_pic_url || undefined} />
                <AvatarFallback>{contact.push_name?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{contact.push_name || contact.remote_jid.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground truncate">{contact.phone}</p>
              </div>
            </div>
            {contact.crm_lead_score > 0 && (
               <Badge variant="outline" className={cn("text-[10px] px-1 h-5", temperatureColor, "text-white border-none")}>
                 {contact.crm_lead_score}°
               </Badge>
            )}
          </div>

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
        
        {/* Quick Actions Hover Overlay (Desktop) */}
        <div className={cn(
          "absolute right-2 top-2 hidden group-hover:flex flex-col gap-1 transition-all duration-200 translate-x-2 group-hover:translate-x-0",
          isCurrentlyDragging ? "pointer-events-none opacity-0" : "opacity-0 group-hover:opacity-100"
        )}>
          <Button size="icon" variant="secondary" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); /* TODO: Open WhatsApp */ }}>
            <MessageCircle className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="secondary" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); /* TODO: Call */ }}>
            <Phone className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

