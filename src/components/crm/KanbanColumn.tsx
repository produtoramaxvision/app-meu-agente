import { useState } from 'react';
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
  onDrop: (contactId: string, currentStatus: string, newStatus: LeadStatus) => void;
  draggingContact: EvolutionContact | null;
  onDragStart: (contact: EvolutionContact) => void;
  onDragEnd: () => void;
}

export function KanbanColumn({ id, title, color, contacts, onCardClick, onDrop, draggingContact, onDragStart, onDragEnd }: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((prev) => prev + 1);
    setIsOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragCounter((prev) => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsOver(false);
      }
      return newCounter;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    setDragCounter(0);
    
    const contactId = e.dataTransfer.getData('contactId');
    const currentStatus = e.dataTransfer.getData('currentStatus');
    
    if (contactId && currentStatus !== id) {
      onDrop(contactId, currentStatus, id);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex h-full flex-col min-w-[280px] max-w-[280px] rounded-xl border transition-all",
        isOver 
          ? "bg-primary/10 border-primary/50 shadow-lg" 
          : "bg-muted/30 border-border/50 backdrop-blur-sm"
      )}
    >
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between rounded-t-xl pointer-events-none">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full shadow-sm", color)} />
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-[20px] justify-center">
            {contacts.length}
          </Badge>
        </div>
      </div>

      {/* Droppable Area - COLUNA INTEIRA */}
      <div className="flex flex-1 flex-col p-2 min-h-0 overflow-y-auto">
        <div className="flex flex-1 flex-col gap-2 pb-2 pr-2.5 min-h-0 pointer-events-auto">
          {contacts.map((contact) => (
            <KanbanCard 
              key={contact.id} 
              contact={contact} 
              onClick={onCardClick}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggingContact?.id === contact.id}
            />
          ))}
          {contacts.length === 0 && (
            <div className={cn(
              "h-[100px] mb-3 border-2 border-dashed rounded-lg flex items-center justify-center text-xs italic transition-all",
              isOver 
                ? "border-primary/50 text-primary/70 bg-primary/5" 
                : "border-muted-foreground/10 text-muted-foreground/30"
            )}>
              Arraste leads para cá
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

