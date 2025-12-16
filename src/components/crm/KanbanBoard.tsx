import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { EvolutionContact, LeadStatus } from '@/types/sdr';

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

export function KanbanBoard({ onCardClick, columns, moveCard }: KanbanBoardProps) {
  const [draggingContact, setDraggingContact] = useState<EvolutionContact | null>(null);

  const handleDragStart = (contact: EvolutionContact) => {
    setDraggingContact(contact);
  };

  const handleDragEnd = () => {
    // Limpar IMEDIATAMENTE para evitar cards opacos
    setDraggingContact(null);
  };

  const handleDrop = (contactId: string, currentStatus: string, newStatus: LeadStatus) => {
    // Limpar o dragging ANTES de mover o card
    // Isso evita o problema de cards ficarem opacos após o drop
    setDraggingContact(null);
    
    if (currentStatus !== newStatus) {
      moveCard(contactId, newStatus);
    }
  };

  return (
    <div className="flex h-full items-start gap-4 pb-4 px-6 pt-6 snap-x lg:overflow-x-auto lg:snap-none">
      {columns.map((col) => (
        <div key={col.id} className="snap-center">
          <KanbanColumn
            id={col.id}
            title={col.label}
            color={col.color}
            contacts={col.contacts}
            onCardClick={onCardClick}
            onDrop={handleDrop}
            draggingContact={draggingContact}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        </div>
      ))}
    </div>
  );
}

