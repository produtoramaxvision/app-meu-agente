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
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

export function KanbanBoard({ onCardClick, columns, moveCard }: KanbanBoardProps) {
  const [activeContact, setActiveContact] = useState<EvolutionContact | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require movement of 8px before drag starts (prevents accidental drags on clicks)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Delay for touch to allow scrolling
        tolerance: 5,
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
      <div className="flex h-full gap-4 overflow-x-auto pb-4 px-6 pt-6 snap-x">
        {columns.map((col) => (
          <div key={col.id} className="snap-center h-full">
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

