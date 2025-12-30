import { memo, useCallback } from 'react';
import { DragDropContext, DropResult, BeforeCapture } from '@hello-pangea/dnd';
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
  onCardEdit?: (contact: EvolutionContact) => void;
  onCardDelete?: (contact: EvolutionContact) => void;
  columns: ColumnType[];
  moveCard: (contactId: string, newStatus: LeadStatus) => Promise<void>;
  onCardInteraction?: (contact: EvolutionContact, type: 'message' | 'call') => void;
  onTagClick?: (tagName: string) => void;
  selectedTags?: string[];
}

// ⚡ OTIMIZAÇÃO: React.memo evita re-renders desnecessários do board
export const KanbanBoard = memo(function KanbanBoard({ 
  onCardClick, 
  onCardEdit,
  onCardDelete,
  columns, 
  moveCard,
  onCardInteraction,
  onTagClick,
  selectedTags = [],
}: KanbanBoardProps) {
  // 📱 MOBILE FIX: Helper para ativar modo drag (desabilita scroll)
  const enableDragMode = useCallback(() => {
    document.body.classList.add('rfd-dragging-active');
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }, []);

  // 📱 MOBILE FIX: Helper para desativar modo drag (restaura scroll)
  const disableDragMode = useCallback(() => {
    document.body.classList.remove('rfd-dragging-active');
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }, []);

  // 📱 MOBILE FIX: Chamado antes de capturar dimensões (primeiro callback no lifecycle)
  const handleBeforeCapture = useCallback((_before: BeforeCapture) => {
    enableDragMode();
  }, [enableDragMode]);

  // 📱 MOBILE FIX: Backup - também chamado quando drag inicia (após long-press em touch)
  const handleDragStart = useCallback(() => {
    enableDragMode();
  }, [enableDragMode]);

  // 📱 MOBILE FIX: Remove classe do body após drag terminar
  const handleDragEnd = useCallback((result: DropResult) => {
    // Restaura scroll
    disableDragMode();
    
    const { destination, source, draggableId } = result;

    // Não fazer nada se dropped fora de um droppable
    if (!destination) {
      return;
    }

    // Não fazer nada se dropped na mesma posição
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Mover o card para a nova coluna (status)
    const newStatus = destination.droppableId as LeadStatus;
    const currentStatus = source.droppableId as LeadStatus;

    if (currentStatus !== newStatus) {
      // Apenas atualizar status se mudou de coluna
      moveCard(draggableId, newStatus);
    }
  }, [disableDragMode, moveCard]);

  return (
    <DragDropContext 
      onBeforeCapture={handleBeforeCapture} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full items-stretch gap-4 pb-4 px-6 pt-6 snap-x lg:overflow-x-auto lg:snap-none">
        {columns.map((col) => (
          <div key={col.id} className="snap-center h-full">
            <KanbanColumn
              id={col.id}
              title={col.label}
              color={col.color}
              contacts={col.contacts}
              onCardClick={onCardClick}
              onCardEdit={onCardEdit}
              onCardDelete={onCardDelete}
              onCardInteraction={onCardInteraction}
              onTagClick={onTagClick}
              selectedTags={selectedTags}
            />
          </div>
        ))}
      </div>
    </DragDropContext>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   🗄️  CÓDIGO ANTIGO (HTML5 DRAG DROP) - MANTIDO COMO BACKUP
   ═══════════════════════════════════════════════════════════════════

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
    setDraggingContact(null);
  };

  const handleDrop = (contactId: string, currentStatus: string, newStatus: LeadStatus) => {
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

   ═══════════════════════════════════════════════════════════════════ */

