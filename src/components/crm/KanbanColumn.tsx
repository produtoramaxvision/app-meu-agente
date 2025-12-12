import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EvolutionContact, LeadStatus } from '@/types/sdr';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface KanbanColumnProps {
  id: LeadStatus;
  title: string;
  color: string;
  contacts: EvolutionContact[];
  onCardClick: (contact: EvolutionContact) => void;
}

export function KanbanColumn({ id, title, color, contacts, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const totalValue = 0; // Placeholder for future use

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px] bg-muted/30 rounded-xl border border-border/50 backdrop-blur-sm self-start">
      {/* Header */}
      <div className={cn("p-3 border-b flex items-center justify-between rounded-t-xl", isOver && "bg-muted/50")}>
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full shadow-sm", color)} />
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-[20px] justify-center">
            {contacts.length}
          </Badge>
        </div>
        {/* <div className="text-xs text-muted-foreground font-medium">
          R$ {totalValue.toLocaleString('pt-BR')}
        </div> */}
      </div>

      {/* Droppable Area */}
      <div 
        ref={setNodeRef} 
        className={cn(
          "p-2 transition-colors",
          isOver ? "bg-primary/5" : ""
        )}
      >
        <div className="flex flex-col gap-2 pb-2 pr-2.5">
          {contacts.map((contact) => (
            <KanbanCard 
              key={contact.id} 
              contact={contact} 
              onClick={onCardClick}
            />
          ))}
          {contacts.length === 0 && (
            <div className="h-24 border-2 border-dashed border-muted-foreground/10 rounded-lg flex items-center justify-center text-muted-foreground/30 text-xs italic">
              Arraste leads para cá
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

