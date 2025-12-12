import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { EvolutionContact, LeadStatus } from '@/types/sdr';
import { createPortal } from 'react-dom';

type ColumnType = {
  id: LeadStatus;
  label: string;
  color: string;
  contacts: EvolutionContact[];
};

interface KanbanBoardProps {
  onCardClick: (contact: EvolutionContact) => void;
  columns: ColumnType[];
  moveCard: (contactId: string, newStatus: LeadStatus) => Promise<void>;
}

const dropAnimation: DropAnimation = {
  duration: 180,
  easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.6',
        transform: 'scale(1.02)',
      },
    },
  }),
};

export function KanbanBoard({ onCardClick, columns, moveCard }: KanbanBoardProps) {
  const [activeContact, setActiveContact] = useState<EvolutionContact | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2, // start drag sooner for sensação mais fluida
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // responde mais rápido em touch
        tolerance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const contact = active.data.current?.contact as EvolutionContact;
    if (contact) {
      setActiveContact(contact);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveContact(null);

    if (!over) return;

    const contactId = active.id as string;
    const newStatus = over.id as LeadStatus;
    const currentStatus = active.data.current?.contact?.crm_lead_status;

    if (currentStatus !== newStatus) {
      moveCard(contactId, newStatus);
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full items-start gap-4 overflow-x-auto pb-4 px-6 pt-6 snap-x">
        {columns.map((col) => (
          <div key={col.id} className="snap-center">
            <KanbanColumn
              id={col.id}
              title={col.label}
              color={col.color}
              contacts={col.contacts}
              onCardClick={onCardClick}
            />
          </div>
        ))}
      </div>

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeContact ? (
            <div className="rotate-2 scale-105 cursor-grabbing opacity-90">
               <KanbanCard contact={activeContact} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}

