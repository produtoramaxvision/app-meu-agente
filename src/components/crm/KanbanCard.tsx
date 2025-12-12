import { useDraggable } from '@dnd-kit/core';
import { EvolutionContact } from '@/types/sdr';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle, Calendar, CheckSquare, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanCardProps {
  contact: EvolutionContact;
  onClick: (contact: EvolutionContact) => void;
}

export function KanbanCard({ contact, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
    data: { contact }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Temperature logic (mocked for now based on score or default)
  const temperatureColor = 
    contact.crm_lead_score > 80 ? 'bg-red-500' :
    contact.crm_lead_score > 50 ? 'bg-orange-500' :
    'bg-blue-500';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "group relative mb-3 touch-none",
        isDragging && "opacity-50 z-50 rotate-2 scale-105"
      )}
    >
      <Card 
        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4"
        style={{ borderLeftColor: contact.crm_lead_score > 0 ? undefined : 'transparent' }}
        onClick={() => onClick(contact)}
      >
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
        <div className="absolute right-2 top-2 hidden group-hover:flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
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

