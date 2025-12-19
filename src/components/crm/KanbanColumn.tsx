import { memo, useCallback, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
  Droppable,
  DroppableProvided,
  DroppableStateSnapshot,
} from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EvolutionContact, LeadStatus } from '@/types/sdr';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: LeadStatus;
  title: string;
  color: string;
  contacts: EvolutionContact[];
  onCardClick: (contact: EvolutionContact) => void;
  onCardEdit?: (contact: EvolutionContact) => void;
  onCardDelete?: (contact: EvolutionContact) => void;
  onCardInteraction?: (contact: EvolutionContact, type: 'message' | 'call') => void;
  onTagClick?: (tagName: string) => void;
  selectedTags?: string[];
}

// ⚡ OTIMIZAÇÃO: React.memo evita re-renders desnecessários da coluna
export const KanbanColumn = memo(function KanbanColumn({
  id,
  title,
  color,
  contacts,
  onCardClick,
  onCardEdit,
  onCardDelete,
  onCardInteraction,
  onTagClick,
  selectedTags = [],
}: KanbanColumnProps) {
  // ⚡ OTIMIZAÇÃO: Lazy Loading para evitar renderizar milhares de itens de uma vez
  const [visibleCount, setVisibleCount] = useState(20);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < contacts.length) {
          setVisibleCount((prev) => Math.min(prev + 20, contacts.length));
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [contacts.length, visibleCount]);

  // Resetar visibleCount se os contatos mudarem drasticamente (ex: filtro)
  useEffect(() => {
    if (contacts.length > 0 && visibleCount > contacts.length) {
      setVisibleCount(20);
    }
  }, [contacts.length, visibleCount]);

  // ⚡ OTIMIZAÇÃO: renderização de card memorizada
  const renderDraggableCard = useCallback(
    (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
      contact: EvolutionContact,
    ) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        style={{
          ...provided.draggableProps.style,
        }}
      >
        <KanbanCard 
          contact={contact} 
          onClick={onCardClick} 
          onEdit={onCardEdit}
          onDelete={onCardDelete}
          isDragging={snapshot.isDragging}
          onInteraction={onCardInteraction}
          onTagClick={onTagClick}
          selectedTags={selectedTags}
        />
      </div>
    ),
    [onCardClick, onCardEdit, onCardDelete, onCardInteraction, onTagClick, selectedTags],
  );

  // ⚡ OTIMIZAÇÃO: renderização do clone para modo virtual
  const renderClone = useCallback(
    (
      provided: DraggableProvided,
      snapshot: DraggableStateSnapshot,
      rubric: { source: { index: number } },
    ) => {
      const contact = contacts[rubric.source.index];
      if (!contact) return null;

      // ⚡ CORREÇÃO: Usar Portal para renderizar o card arrastado direto no body.
      // Isso evita que ele fique "preso" dentro do overflow da coluna ou sofra com z-index/transform.
      return createPortal(
        renderDraggableCard(provided, snapshot, contact),
        document.body
      );
    },
    [contacts, renderDraggableCard],
  );

  return (
    <Droppable
      droppableId={id}
      type="CONTACT"
      mode="standard"
      renderClone={renderClone}
    >
      {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            'flex h-full flex-col min-w-[280px] max-w-[280px] rounded-xl border transition-all duration-200',
            snapshot.isDraggingOver
              ? 'bg-primary/10 border-primary/50 shadow-lg scale-[1.02]'
              : 'bg-muted/30 border-border/50 backdrop-blur-sm',
          )}
        >
          <div className="p-3 border-b flex items-center justify-between rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className={cn('w-3 h-3 rounded-full shadow-sm', color)} />
              <h3 className="font-semibold text-sm">{title}</h3>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-[20px] justify-center">
                {contacts.length}
              </Badge>
            </div>
          </div>

          <div className="flex flex-1 flex-col p-2 min-h-0 overflow-hidden">
            <div className="flex flex-1 flex-col gap-2 pb-2 pr-1 min-h-0 overflow-y-auto">
              <div className="flex flex-col gap-2">
                {contacts.slice(0, visibleCount).map((contact, index) => (
                  <Draggable key={contact.id} draggableId={contact.id} index={index}>
                    {(provided, snapshot) => renderDraggableCard(provided, snapshot, contact)}
                  </Draggable>
                ))}
              </div>
              
              {/* Elemento sentinela para Infinite Scroll */}
              {visibleCount < contacts.length && (
                <div ref={observerTarget} className="h-4 w-full" />
              )}

              {provided.placeholder}

              {contacts.length === 0 && (
                <div
                  className={cn(
                    'h-[100px] mb-3 border-2 border-dashed rounded-lg flex items-center justify-center text-xs italic transition-all',
                    snapshot.isDraggingOver
                      ? 'border-primary/50 text-primary/70 bg-primary/5'
                      : 'border-muted-foreground/10 text-muted-foreground/30',
                  )}
                >
                  Arraste leads para cá
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Droppable>
  );
});

