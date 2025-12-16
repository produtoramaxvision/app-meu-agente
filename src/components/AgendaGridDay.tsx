import { useMemo, useState, useRef, useEffect, useCallback, memo } from 'react';
import { startOfDay, isSameDay, differenceInMinutes, addMinutes } from 'date-fns';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Event, Calendar } from '@/hooks/useOptimizedAgendaData';
import EventPopover from './EventPopover';
import { EventQuickCreatePopover } from './EventQuickCreatePopover';
import { EventCard } from './EventCard';
import { cn } from '@/lib/utils';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  Active,
  Over,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  date: Date;
  events: Event[];
  calendars: Calendar[];
  isLoading?: boolean;
  onEventClick?: (evt: Event) => void;
  onEventCreate: (data: Partial<Event>) => void;
  onEventDoubleClick: (data: Partial<Event>) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
}

const HOURS = Array.from({ length: 24 }).map((_, i) => i);
const SNAP_MINUTES = 15;
const HOUR_HEIGHT_PX = 64; // h-16 in tailwind
const PX_PER_MINUTE = HOUR_HEIGHT_PX / 60;

// Função para detectar prefers-reduced-motion
const prefersReducedMotion = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

// Função de debounce para otimizar performance
function debounce<T extends (...args: never[]) => unknown>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Componente para eventos arrastáveis
interface PopoverState {
  open: boolean;
  anchor: { top: number; left: number } | null;
  eventData: Partial<Event>;
}

interface DraggableEventProps {
  event: Event;
  calendarColor: string;
  allEvents: Event[];
  onEventClick?: (evt: Event) => void;
  onEventDoubleClick?: (data: Partial<Event>) => void;
  openEventPopover: string | null;
  setOpenEventPopover: (id: string | null) => void;
  setPopoverState: (state: PopoverState | ((prev: PopoverState) => PopoverState)) => void;
  lastClickedEvent: string | null;
  setLastClickedEvent: (id: string | null) => void;
  selectedDate: Date;
}

function DraggableEvent({
  event,
  calendarColor,
  allEvents,
  onEventClick,
  onEventDoubleClick,
  openEventPopover,
  setOpenEventPopover,
  setPopoverState,
  lastClickedEvent,
  setLastClickedEvent,
  selectedDate,
}: DraggableEventProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `event-${event.id}` });

  const style = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
  }), [transform, transition]);

  const position = useMemo(() => {
    const start = new Date(event.start_ts);
    const end = new Date(event.end_ts);
    const dayStart = startOfDay(selectedDate);
    const top = Math.max(0, differenceInMinutes(start, dayStart) * PX_PER_MINUTE);

    // Altura proporcional à duração real do evento.
    // Cada hora tem 64px (HOUR_HEIGHT_PX), então 30 minutos ≈ 32px.
    // Definimos uma altura mínima visual de meia hora para eventos muito curtos,
    // mas SEM forçar todos os eventos a parecerem de 1h.
    const rawHeight = differenceInMinutes(end, start) * PX_PER_MINUTE;
    const minHeight = HOUR_HEIGHT_PX / 2; // 30 minutos
    const height = Math.max(minHeight, rawHeight);
    
    // Calcular empilhamento para eventos sobrepostos
    const overlappingEvents = allEvents.filter(e => {
      if (e.id === event.id) return false;
      const eStart = new Date(e.start_ts);
      const eEnd = new Date(e.end_ts);
      return (start < eEnd && end > eStart);
    });
    
    // Calcular posição lateral baseada no índice de sobreposição
    const overlapIndex = overlappingEvents.length;
    const leftOffset = overlapIndex * 20; // 20px por evento sobreposto
    const width = `calc(100% - ${leftOffset}px)`;
    
    return { 
      top: `${top}px`, 
      height: `${height}px`,
      left: `${leftOffset}px`,
      width: width
    };
  }, [event.start_ts, event.end_ts, event.id, allEvents, selectedDate]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick?.(event);
    setLastClickedEvent(event.id);
    if (lastClickedEvent === event.id && openEventPopover !== event.id) {
      setOpenEventPopover(event.id);
    }
  }, [event, onEventClick, lastClickedEvent, openEventPopover, setLastClickedEvent, setOpenEventPopover]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEventDoubleClick?.(event);
  }, [event, onEventDoubleClick]);

  const handlePopoverChange = useCallback((open: boolean) => {
    if (open) {
      setOpenEventPopover(event.id);
      setPopoverState(s => ({ ...s, open: false }));
    } else {
      setOpenEventPopover(null);
      if (lastClickedEvent === event.id) {
        setLastClickedEvent(null);
      }
    }
  }, [event.id, lastClickedEvent, setLastClickedEvent, setOpenEventPopover, setPopoverState]);

  return (
    <EventPopover 
      event={event}
      open={openEventPopover === event.id}
      onOpenChange={handlePopoverChange}
    >
      <motion.div
        ref={setNodeRef}
        style={{ ...style, ...position }}
        className="absolute left-2 right-4 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
        data-event-id={event.id}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        initial={prefersReducedMotion() ? {} : { opacity: 0, scale: 0.8, y: -20 }}
        animate={prefersReducedMotion() ? {} : { 
          opacity: isDragging ? 0.3 : 1, 
          scale: isDragging ? 1.05 : 1,
          y: 0,
          rotate: isDragging ? 2 : 0,
          boxShadow: isDragging 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
            : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}
        whileHover={prefersReducedMotion() ? {} : { 
          scale: 1.02,
          y: -2,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          transition: { duration: 0.2 }
        }}
        whileTap={prefersReducedMotion() ? {} : { 
          scale: 0.98,
          transition: { duration: 0.1 }
        }}
        transition={prefersReducedMotion() ? { duration: 0 } : {
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
        layout
      >
        <motion.div
          className="h-full w-full"
          animate={prefersReducedMotion() ? {} : {
            backgroundColor: isDragging ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0)',
            borderColor: isDragging ? calendarColor : 'rgba(0, 0, 0, 0)',
            borderWidth: isDragging ? '2px' : '0px',
            borderRadius: isDragging ? '8px' : '0px',
          }}
          transition={prefersReducedMotion() ? { duration: 0 } : { duration: 0.2 }}
        >
          <EventCard
            event={event}
            variant="compact"
            calendarColor={calendarColor}
            className="h-full"
          />
        </motion.div>
      </motion.div>
    </EventPopover>
  );
}

// Memoizar o componente para evitar re-renders desnecessários
const MemoizedDraggableEvent = memo(DraggableEvent);

export default function AgendaGridDay({ date, events, calendars, isLoading, onEventClick, onEventCreate, onEventDoubleClick, onEventMove }: Props) {
  const dayEvents = useMemo(
    () => events.filter(e => {
      const startDate = new Date(e.start_ts);
      const endDate = new Date(e.end_ts);
      return isSameDay(startDate, date) || isSameDay(endDate, date);
    }),
    [events, date]
  );

  // Memoizar cores dos calendários para evitar recálculos
  const calendarColorMap = useMemo(() => {
    const map = new Map<string, string>();
    calendars.forEach(cal => {
      map.set(cal.id, cal.color || '#3b82f6');
    });
    return map;
  }, [calendars]);

  const gridRef = useRef<HTMLDivElement>(null);
  const [nowIndicatorTop, setNowIndicatorTop] = useState<number | null>(null);
  const [hoverIndicator, setHoverIndicator] = useState<{ top: number; time: string } | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number | null; startTime: Date } | null>(null);
  
  const [popoverState, setPopoverState] = useState<PopoverState>({ open: false, anchor: null, eventData: {} });
  const singleClickTimeoutRef = useRef<number | null>(null);

  const [openEventPopover, setOpenEventPopover] = useState<string | null>(null);
  const [lastClickedEvent, setLastClickedEvent] = useState<string | null>(null);

  // Estados para drag and drop
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragStartPointerY, setDragStartPointerY] = useState<number | null>(null);

  // Configuração dos sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Aumentar distância para evitar interferência com cliques
      },
    }),
    useSensor(KeyboardSensor)
  );

  const mapYToTime = useCallback((y: number): Date => {
    const minutesFromStart = Math.max(0, y) / PX_PER_MINUTE;
    const snappedMinutes = Math.round(minutesFromStart / SNAP_MINUTES) * SNAP_MINUTES;
    return addMinutes(startOfDay(date), snappedMinutes);
  }, [date]);

  const mapTimeToY = useCallback((time: Date): number => {
    const dayStart = startOfDay(date);
    return differenceInMinutes(time, dayStart) * PX_PER_MINUTE;
  }, [date]);

  // Handlers para drag and drop
  const handleDragStart = useCallback((dragEvent: DragStartEvent) => {
    const activeId = dragEvent.active.id as string;
    // IDs do Sortable são no formato "event-<id_real>", então precisamos remover o prefixo
    const eventId = activeId.startsWith('event-') ? activeId.replace('event-', '') : activeId;
    const eventData = dayEvents.find(e => e.id === eventId);
    
    // Capturar posição inicial do ponteiro em Y
    const activatorEvent = dragEvent.activatorEvent as { clientY?: number } | null | undefined;
    if (activatorEvent && typeof activatorEvent.clientY === 'number') {
      setDragStartPointerY(activatorEvent.clientY);
    } else {
      setDragStartPointerY(null);
    }
    
    // Só iniciar drag se for um evento válido
    if (eventData) {
      setActiveEvent(eventData);
      setDraggedEventId(activeId);
    }
  }, [dayEvents]);

  // Durante o drag, deixamos o dnd-kit controlar apenas o movimento visual.
  const handleDragOver = useCallback((_dragEvent: DragOverEvent) => {
    return;
  }, []);

  const handleDragEnd = useCallback((dragEvent: DragEndEvent) => {
    if (!gridRef.current || !activeEvent || !onEventMove) {
      setActiveEvent(null);
      setDraggedEventId(null);
      setDragStartPointerY(null);
      return;
    }

    const gridRect = gridRef.current.getBoundingClientRect();

    // Calcula a posição final do ponteiro em relação ao grid
    const startPointerY = dragStartPointerY ?? (gridRect.top + mapTimeToY(new Date(activeEvent.start_ts)));
    const endPointerY = startPointerY + dragEvent.delta.y;
    const relativeY = endPointerY - gridRect.top;

    // Converte a posição final do ponteiro em horário absoluto (snap para a grade)
    // Aqui a linha representa o INÍCIO do evento: se o mouse está em 07:00,
    // o evento será salvo iniciando exatamente às 07:00.
    const newStartTime = mapYToTime(relativeY);

    // Mantém a duração original do evento
    const originalStart = new Date(activeEvent.start_ts);
    const originalEnd = new Date(activeEvent.end_ts);
    const duration = differenceInMinutes(originalEnd, originalStart);
    const newEndTime = addMinutes(newStartTime, duration);

    // Chamar callback para mover o evento
    onEventMove(activeEvent.id, newStartTime, newEndTime);
    
    setActiveEvent(null);
    setDraggedEventId(null);
    setDragStartPointerY(null);
  }, [activeEvent, onEventMove, dragStartPointerY, mapTimeToY, mapYToTime]);

  useEffect(() => {
    const updateNowIndicator = () => {
      const now = new Date();
      if (isSameDay(now, date)) {
        const minutes = differenceInMinutes(now, startOfDay(date));
        setNowIndicatorTop(minutes * PX_PER_MINUTE);
      } else {
        setNowIndicatorTop(null);
      }
    };
    updateNowIndicator();
    const interval = setInterval(updateNowIndicator, 60000);
    return () => clearInterval(interval);
  }, [date]);

  // ✅ CORREÇÃO: Listener global para fechar popovers ao clicar em qualquer lugar fora deles
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Verificar se há um popover aberto (EventQuickCreatePopover ou EventPopover)
      const hasOpenPopover = popoverState.open || openEventPopover !== null;
      if (!hasOpenPopover) return;
      
      // Verificar se o clique foi dentro de qualquer popover
      const isInsidePopover = target.closest('[data-slot="popover-content"], [data-radix-popover-content]');
      if (isInsidePopover) return;

      // Permitir interações com componentes Radix que usam portais (Select, Dropdown, etc.)
      const isInsideRadixOverlay = target.closest(
        '[data-radix-select-content], [data-radix-select-viewport], [data-radix-select-item], [role="listbox"]'
      );
      if (isInsideRadixOverlay) return;
      
      // Verificar se o clique foi dentro de um Dialog (não fechar popover se Dialog está aberto)
      const isInsideDialog = target.closest('[role="dialog"]');
      if (isInsideDialog) return;
      
      // Se o clique foi fora de qualquer popover e Dialog, fechar todos os popovers
      // Fechamos o EventQuickCreatePopover manualmente
      if (popoverState.open) {
        setPopoverState({ open: false, anchor: null, eventData: {} });
      }
      
      // Fechar EventPopover se estiver aberto
      // O Radix UI Popover já fecha automaticamente, mas garantimos que funcione
      if (openEventPopover) {
        setOpenEventPopover(null);
      }
    };
    
    // Adicionar listener no documento para capturar cliques em qualquer lugar
    // Usamos 'mousedown' para capturar antes que outros handlers processem
    document.addEventListener('mousedown', handleDocumentClick, true);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick, true);
    };
  }, [popoverState.open, openEventPopover]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - gridRect.top;
    
    const time = mapYToTime(y);
    setHoverIndicator({ top: y, time: format(time, 'HH:mm') });

    if (selection && selection.end !== null) {
      setSelection(s => s ? { ...s, end: y } : null);
    }
  }, [mapYToTime, selection]);

  // Debounced version para melhor performance
  const debouncedHandlePointerMove = useMemo(
    () => debounce(handlePointerMove, 16), // ~60fps
    [handlePointerMove]
  );

  // Função helper para verificar se há um Dialog aberto
  const isDialogOpen = useCallback(() => {
    // Verificar se há um Dialog do Radix UI aberto no DOM
    // O Radix UI adiciona role="dialog" e data-state="open" quando o Dialog está aberto
    // Verificamos pelo elemento DialogContent que tem role="dialog"
    const openDialog = document.querySelector('[role="dialog"][data-state="open"]');
    return !!openDialog;
  }, []);

  // Função helper para verificar se há um Popover aberto
  const isPopoverOpen = useCallback(() => {
    // Verificar se há um Popover do Radix UI aberto no DOM
    // O Radix UI adiciona data-state="open" no PopoverContent quando está aberto
    // Verificamos por data-slot="popover-content" ou por role="dialog" (alguns popovers podem usar isso)
    const openPopover = document.querySelector('[data-slot="popover-content"][data-state="open"], [data-radix-popover-content][data-state="open"]');
    return !!openPopover;
  }, []);

  // Função helper para verificar se o clique está dentro de um Popover
  const isClickInsidePopover = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Verificar se o clique foi dentro do conteúdo do popover ou em um elemento filho
    // Verificamos por data-slot="popover-content" ou data-radix-popover-content
    const popoverContent = target.closest('[data-slot="popover-content"], [data-radix-popover-content]');
    return !!popoverContent;
  }, []);

  // Função helper para verificar se o clique está dentro da grade da agenda
  const isClickInsideGrid = useCallback((e: React.PointerEvent | React.MouseEvent) => {
    if (!gridRef.current) return false;
    const gridRect = gridRef.current.getBoundingClientRect();
    return (
      e.clientX >= gridRect.left &&
      e.clientX <= gridRect.right &&
      e.clientY >= gridRect.top &&
      e.clientY <= gridRect.bottom
    );
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!gridRef.current || e.button !== 0) return;
    
    // ✅ CORREÇÃO: Se há um Dialog aberto, não processar cliques na grade
    // Isso permite que cliques no overlay do Dialog funcionem normalmente (para fechar o Dialog)
    // O overlay do Dialog está acima da grade (z-50), então cliques no overlay não chegam aqui
    // Mas garantimos que se algum clique chegar aqui quando o Dialog está aberto, não processamos
    if (isDialogOpen()) {
      // Não processar - deixar o Dialog fechar automaticamente ao clicar no overlay
      return;
    }
    
    // ✅ CORREÇÃO: Se há um Popover aberto e o clique não está dentro dele, permitir que feche
    // Não processar o clique na grade, mas NÃO bloquear a propagação para que o Radix UI possa fechar o popover
    if (isPopoverOpen() && !isClickInsidePopover(e)) {
      // Não fazer nada - deixar o evento propagar para que o Radix UI Popover possa fechar
      return;
    }
    
    const gridRect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - gridRect.top;
    const startTime = mapYToTime(y);
    setSelection({ start: y, end: y, startTime });
  }, [mapYToTime, isDialogOpen, isPopoverOpen, isClickInsidePopover]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    
    // ✅ CORREÇÃO: Se há um Dialog aberto, não processar cliques na grade
    // Isso permite que cliques no overlay do Dialog funcionem normalmente (para fechar o Dialog)
    // O overlay do Dialog está acima da grade (z-50), então cliques no overlay não chegam aqui
    // Mas garantimos que se algum clique chegar aqui quando o Dialog está aberto, não processamos
    if (isDialogOpen()) {
      setSelection(null);
      // Não processar - deixar o Dialog fechar automaticamente ao clicar no overlay
      return;
    }
    
    // ✅ CORREÇÃO: Se há um Popover aberto e o clique não está dentro dele, permitir que feche
    // Não processar o clique na grade, mas NÃO bloquear a propagação para que o Radix UI possa fechar o popover
    if (isPopoverOpen() && !isClickInsidePopover(e)) {
      setSelection(null);
      // Não fazer nada - deixar o evento propagar para que o Radix UI Popover possa fechar
      return;
    }
    
    // Evitar que cliques duplos disparem a criação rápida
    if (e.detail > 1) {
      setSelection(null);
      return;
    }
    
    const gridRect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - gridRect.top;

    // Se houver seleção, só tratar como seleção se houve movimento suficiente
    const MIN_SELECTION_DRAG = 6;
    if (selection) {
      const dragDelta = Math.abs(y - selection.start);
      if (dragDelta >= MIN_SELECTION_DRAG) {
        const startY = Math.min(selection.start, y);
        const endY = Math.max(selection.start, y);

        const startTime = mapYToTime(startY);
        let endTime = mapYToTime(endY);

        if (endTime <= startTime) {
          endTime = addMinutes(startTime, SNAP_MINUTES);
        }

        setPopoverState({
          open: true,
          anchor: { top: startY, left: e.clientX - gridRect.left },
          eventData: { start_ts: startTime, end_ts: endTime },
        });
        setSelection(null);
        return;
      } else {
        setSelection(null);
      }
    }

    // Cancelar timeout pendente
    if (singleClickTimeoutRef.current) {
      clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = null;
    }

    // Se for clique múltiplo (duplo), não abrir popover rápido
    if (e.detail > 1) {
      return;
    }

    singleClickTimeoutRef.current = window.setTimeout(() => {
      // Clique simples - criar evento com duração padrão de 30 minutos
      const startTime = mapYToTime(y);
      const endTime = addMinutes(startTime, 30);

      setPopoverState({
        open: true,
        anchor: { top: y, left: e.clientX - gridRect.left },
        eventData: { start_ts: startTime, end_ts: endTime },
      });

      setOpenEventPopover(null);
      singleClickTimeoutRef.current = null;
    }, 220);

    // Fechar qualquer EventPopover aberto quando abrir EventQuickCreatePopover
    // Mas preservar o último evento clicado para permitir reabertura
    setOpenEventPopover(null);
  }, [mapYToTime, selection, setOpenEventPopover, isDialogOpen, isPopoverOpen, isClickInsidePopover]);

  // handleGridClick agora é um fallback caso o handlePointerUp não capture o clique
  // Normalmente não será necessário, mas mantemos para garantir compatibilidade
  const handleGridClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Prevenir se já foi tratado por handlePointerUp
    // Verificar se o popover já está sendo aberto
    if (popoverState.open) return;
    
    // Evitar que cliques duplos disparem a criação rápida
    if (e.detail > 1) return;
    
    // ✅ CORREÇÃO: Se há um Dialog aberto, não processar cliques na grade
    // Isso permite que cliques no overlay do Dialog funcionem normalmente (para fechar o Dialog)
    if (isDialogOpen()) {
      // Não processar - deixar o Dialog fechar automaticamente ao clicar no overlay
      return;
    }
    
    // ✅ CORREÇÃO: Se há um Popover aberto e o clique não está dentro dele, permitir que feche
    // Não processar o clique na grade, mas NÃO bloquear a propagação para que o Radix UI possa fechar o popover
    if (isPopoverOpen() && !isClickInsidePopover(e)) {
      // Não fazer nada - deixar o evento propagar para que o Radix UI Popover possa fechar
      return;
    }
    
    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return;
    
    // Cancelar timeout existente antes de agendar novo
    if (singleClickTimeoutRef.current) {
      clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = null;
    }
    
    singleClickTimeoutRef.current = window.setTimeout(() => {
      const y = e.clientY - gridRect.top;
      const startTime = mapYToTime(y);
      const endTime = addMinutes(startTime, 30);

      setPopoverState({
        open: true,
        anchor: { top: y, left: e.clientX - gridRect.left },
        eventData: { start_ts: startTime, end_ts: endTime },
      });
      setOpenEventPopover(null);
      singleClickTimeoutRef.current = null;
    }, 220);
  }, [mapYToTime, setOpenEventPopover, popoverState.open, isDialogOpen, isPopoverOpen, isClickInsidePopover]);

  // Limpar timeout quando componente desmontar
  useEffect(() => {
    return () => {
      if (singleClickTimeoutRef.current) {
        clearTimeout(singleClickTimeoutRef.current);
      }
    };
  }, []);

  const handleDoubleClick = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    
    // ✅ CORREÇÃO: Se há um Dialog aberto, não processar cliques na grade
    // Isso permite que cliques no overlay do Dialog funcionem normalmente (para fechar o Dialog)
    if (isDialogOpen()) {
      // Não processar - deixar o Dialog fechar automaticamente ao clicar no overlay
      return;
    }
    
    // ✅ CORREÇÃO: Se há um Popover aberto e o clique não está dentro dele, permitir que feche
    // Não processar o clique na grade, mas NÃO bloquear a propagação para que o Radix UI possa fechar o popover
    if (isPopoverOpen() && !isClickInsidePopover(e)) {
      // Não fazer nada - deixar o evento propagar para que o Radix UI Popover possa fechar
      return;
    }
    
    // Cancelar qualquer criação rápida pendente antes de abrir o popover completo
    if (singleClickTimeoutRef.current) {
      clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = null;
    }
    if (popoverState.open) {
      setPopoverState({ open: false, anchor: null, eventData: {} });
    }
    
    const gridRect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - gridRect.top;
    const startTime = mapYToTime(y);
    const endTime = addMinutes(startTime, 60);
    onEventDoubleClick({ start_ts: startTime, end_ts: endTime });
  }, [mapYToTime, onEventDoubleClick, isDialogOpen, isPopoverOpen, isClickInsidePopover, popoverState.open, setPopoverState]);

  const handlePointerLeave = useCallback(() => {
    setHoverIndicator(null);
    if (selection) {
      setSelection(null);
    }
  }, [selection]);

  const selectionStyle = useMemo(() => {
    if (!selection) return { display: 'none' };
    const start = Math.min(selection.start, selection.end ?? selection.start);
    const end = Math.max(selection.start, selection.end ?? selection.start);
    return {
      top: `${start}px`,
      height: `${end - start}px`,
    };
  }, [selection]);

  return (
    <>
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl p-4 custom-scrollbar smooth-scrollbar">
        <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-sky-500/10 via-transparent to-primary/10 opacity-90" />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
        <div
          role="application"
          aria-label="Grade de horários do dia"
          className="relative grid grid-cols-[60px_1fr] gap-2 min-h-[700px]"
        >
          <div className="flex flex-col">
            {HOURS.map(h => (
              <div key={h} className="h-16 text-xs text-text-muted pt-[-8px]">{String(h).padStart(2, '0')}:00</div>
            ))}
          </div>

          <div
            ref={gridRef}
            className="relative border-l cursor-crosshair"
            onPointerMove={debouncedHandlePointerMove}
            onPointerDown={(e) => {
              // ✅ CORREÇÃO: Se há um Dialog aberto, não processar cliques
              // Isso permite que o Dialog feche automaticamente ao clicar no overlay
              if (isDialogOpen()) {
                return;
              }
              
              // Evita que a seleção seja iniciada ao clicar em um evento existente
              if ((e.target as HTMLElement).closest('[data-event-id]')) {
                return;
              }
              handlePointerDown(e);
            }}
            onPointerUp={(e) => {
              // ✅ CORREÇÃO: Se há um Dialog aberto, não processar cliques
              // Isso permite que o Dialog feche automaticamente ao clicar no overlay
              if (isDialogOpen()) {
                setSelection(null);
                return;
              }
              
              // Não finalizar seleção se o pointer up aconteceu em um evento
              if ((e.target as HTMLElement).closest('[data-event-id]')) {
                setSelection(null);
                return;
              }
              handlePointerUp(e);
            }}
            onPointerLeave={handlePointerLeave}
            onDoubleClick={(e) => {
              // ✅ CORREÇÃO: Se há um Dialog aberto, não processar cliques
              // Isso permite que o Dialog feche automaticamente ao clicar no overlay
              if (isDialogOpen()) {
                return;
              }
              handleDoubleClick(e);
            }}
            onClick={(e) => {
              // ✅ CORREÇÃO: Se há um Dialog aberto, não processar cliques
              // Isso permite que o Dialog feche automaticamente ao clicar no overlay
              if (isDialogOpen()) {
                return;
              }
              handleGridClick(e);
            }}
          >
            {HOURS.map(h => (
              <div key={h} className="h-16 border-b border-border/60" />
            ))}

            <AnimatePresence>
              {nowIndicatorTop !== null && (
                <motion.div 
                  className="absolute left-0 right-0 pointer-events-none z-20" 
                  style={{ top: `${nowIndicatorTop}px` }}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="relative h-px bg-gradient-to-r from-red-400 to-red-600 shadow-lg">
                    <motion.div 
                      className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-red-500 shadow-lg"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(239, 68, 68, 0.7)',
                          '0 0 0 8px rgba(239, 68, 68, 0)',
                          '0 0 0 0 rgba(239, 68, 68, 0)'
                        ]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {hoverIndicator && !selection && (
                <motion.div 
                  className="absolute left-0 right-0 pointer-events-none" 
                  style={{ top: `${hoverIndicator.top}px` }}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 0.7, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="relative h-px bg-gradient-to-r from-primary/50 to-primary border-t border-dashed border-primary/60">
                    <motion.span 
                      className="absolute -left-14 -top-2 text-xs bg-surface px-2 py-1 rounded shadow-md border"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {hoverIndicator.time}
                    </motion.span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {selection && (
                <motion.div
                  className="absolute left-2 right-4 bg-gradient-to-r from-primary/10 to-primary/20 border border-primary/60 rounded-md pointer-events-none z-10 shadow-lg"
                  style={selectionStyle}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>

            <SortableContext items={dayEvents.map(e => `event-${e.id}`)} strategy={verticalListSortingStrategy}>
              <motion.div 
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, staggerChildren: 0.05 }}
              >
                <AnimatePresence mode="popLayout">
                  {dayEvents.map((evt, index) => {
                    // Usar mapa memoizado para melhor performance
                    const calendarColor = calendarColorMap.get(evt.calendar_id) || '#3b82f6';

                    return (
                      <motion.div
                        key={evt.id}
                        layout
                        initial={{ opacity: 0, y: -20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.8 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: index * 0.05,
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }}
                      >
                        <MemoizedDraggableEvent
                          event={evt}
                          calendarColor={calendarColor}
                          allEvents={dayEvents}
                          onEventClick={onEventClick}
                          onEventDoubleClick={onEventDoubleClick}
                          openEventPopover={openEventPopover}
                          setOpenEventPopover={setOpenEventPopover}
                          setPopoverState={setPopoverState}
                          lastClickedEvent={lastClickedEvent}
                          setLastClickedEvent={setLastClickedEvent}
                          selectedDate={date}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </SortableContext>
          </div>
        </div>

        {/* Removemos o DragOverlay para que o próprio card siga o mouse,
            evitando qualquer deslocamento visual entre o cursor e o evento. */}
        </DndContext>
      </Card>
      
      {/* Removido AnimatePresence e motion.div para eliminar delay - Radix UI já cuida das animações */}
      {popoverState.open && (
        <EventQuickCreatePopover
          open={popoverState.open}
          onOpenChange={(open) => setPopoverState(s => ({ ...s, open }))}
          anchor={popoverState.anchor}
          eventData={popoverState.eventData}
          calendars={calendars}
          onSubmit={onEventCreate}
          onMoreOptions={() => {
            setPopoverState(s => ({ ...s, open: false }));
            onEventDoubleClick(popoverState.eventData);
          }}
        />
      )}
    </>
  );
}