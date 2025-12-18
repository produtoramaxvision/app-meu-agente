import React, { useMemo, useState, useCallback } from 'react';
import { startOfWeek, addDays, isSameDay, format, differenceInDays, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Event, Calendar } from '@/hooks/useOptimizedAgendaData';
import EventPopover from './EventPopover';
import { EventCard } from './EventCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { restrictToVerticalAxis, createSnapModifier } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  weekDate: Date;
  events: Event[];
  calendars: Calendar[];
  isLoading?: boolean;
  onEventClick?: (evt: Event) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
}

export default function AgendaGridWeek({ weekDate, events, calendars, isLoading, onEventClick, onEventMove }: Props) {
  const weekStart = startOfWeek(weekDate, { locale: ptBR });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Estados para drag & drop
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  // Configuração dos sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Evita interferência com cliques
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Handlers para drag & drop
  const handleDragStart = useCallback((dragEvent: DragStartEvent) => {
    const eventId = dragEvent.active.id as string;
    const eventData = events.find(e => e.id === eventId);
    
    if (eventData && eventId.startsWith('event-')) {
      setActiveEvent(eventData);
    }
  }, [events]);

  const handleDragEnd = useCallback((dragEvent: DragEndEvent) => {
    const { active, over } = dragEvent;
    
    if (!over || !activeEvent || !onEventMove) {
      setActiveEvent(null);
      return;
    }

    // Extrair o dia de destino do ID da drop zone
    const targetDayId = over.id as string;
    if (targetDayId.startsWith('day-')) {
      const dayIndex = parseInt(targetDayId.replace('day-', ''));
      const targetDay = days[dayIndex];
      
      if (targetDay) {
        const startTime = new Date(activeEvent.start_ts);
        const endTime = new Date(activeEvent.end_ts);
        const duration = differenceInDays(endTime, startTime);
        
        // Calcular novos horários mantendo a duração
        const newStartTime = new Date(targetDay);
        newStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
        
        const newEndTime = new Date(newStartTime);
        newEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
        
        // Chamar callback para mover o evento
        onEventMove(activeEvent.id, newStartTime, newEndTime);
      }
    }
    
    setActiveEvent(null);
  }, [activeEvent, onEventMove, days]);

  const eventsByDay = useMemo(() => {
    return days.map((d) => ({
      date: d,
      items: events
        .filter(e => isSameDay(new Date(e.start_ts), d) || isSameDay(new Date(e.end_ts), d))
        .sort((a, b) => new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime()),
    }));
  }, [days, events]);

  // Componente para eventos arrastáveis
  interface DraggableEventProps {
    event: Event;
    calendarColor: string;
    onEventClick?: (evt: Event) => void;
  }

  const DraggableEvent = React.forwardRef<HTMLDivElement, DraggableEventProps>(
    ({ event, calendarColor, onEventClick }, ref) => {
      const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
      } = useDraggable({
        id: `event-${event.id}`,
      });

      // Combinar refs: setNodeRef do dnd-kit + ref externo
      const combinedRef = useCallback((node: HTMLDivElement | null) => {
        setNodeRef(node);
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }, [setNodeRef, ref]);

      const style = {
        transform: CSS.Transform.toString(transform),
      };

      return (
        <motion.div
          ref={combinedRef}
          style={style}
          className="cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => { 
            e.stopPropagation(); 
            onEventClick?.(event);
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: isDragging ? 0.3 : 1, 
            scale: isDragging ? 1.05 : 1,
          }}
          whileHover={{ 
            scale: 1.02,
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.98,
            transition: { duration: 0.1 }
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
        >
          <EventCard
            event={event}
            variant="compact"
            calendarColor={calendarColor}
            className="text-xs"
          />
        </motion.div>
      );
    }
  );

  DraggableEvent.displayName = 'DraggableEvent';

  // Componente para dias droppable
  interface DroppableDayProps {
    dayIndex: number;
    date: Date;
    items: Event[];
    calendars: Calendar[];
    onEventClick?: (evt: Event) => void;
  }

  function DroppableDay({ dayIndex, date, items, calendars, onEventClick }: DroppableDayProps) {
    const { isOver, setNodeRef } = useDroppable({
      id: `day-${dayIndex}`,
    });

    return (
      <motion.div
        ref={setNodeRef}
        className={`border rounded-md p-2 transition-colors ${
          isOver ? 'bg-primary/10 border-primary/60' : ''
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: dayIndex * 0.05 }}
      >
        <div className="text-xs text-text-muted mb-2">
          {format(date, "EEE, dd 'de' MMM", { locale: ptBR })}
        </div>
        <div className="space-y-2">
          {items.length === 0 && <div className="text-xs text-text-muted">Sem eventos</div>}
          {items.map(evt => {
            const calendar = calendars.find(cal => cal.id === evt.calendar_id);
            const calendarColor = calendar?.color || '#3b82f6';
            
            return (
              <EventPopover key={evt.id} event={evt}>
                <DraggableEvent
                  event={evt}
                  calendarColor={calendarColor}
                  onEventClick={onEventClick}
                />
              </EventPopover>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <Card className="p-2 xs:p-4 overflow-x-auto custom-scrollbar smooth-scrollbar">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, createSnapModifier(20)]}
      >
        {/* Layout Mobile - Lista Vertical */}
        <div className="xs:hidden space-y-3">
          {eventsByDay.map(({ date, items }, index) => (
            <div key={date.toISOString()} className="border rounded-lg p-3">
              <div className="text-sm font-semibold text-text mb-2">
                {format(date, 'EEEE, dd/MM', { locale: ptBR })}
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="text-xs text-text-muted text-center py-4">
                    Nenhum evento
                  </div>
                ) : (
                  items.map((event) => {
                    const calendar = calendars.find(c => c.id === event.calendar_id);
                    const calendarColor = calendar?.color || '#3b82f6';
                    
                    return (
                      <EventPopover key={event.id} event={event}>
                        <DraggableEvent
                          event={event}
                          calendarColor={calendarColor}
                          onEventClick={onEventClick}
                        />
                      </EventPopover>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Layout Desktop - Grid Horizontal */}
        <div className="hidden xs:block">
          <div role="grid" aria-label="Grade semanal" className="min-w-[600px] grid grid-cols-7 gap-2 md:gap-3">
            {eventsByDay.map(({ date, items }, index) => (
              <DroppableDay
                key={date.toISOString()}
                dayIndex={index}
                date={date}
                items={items}
                calendars={calendars}
                onEventClick={onEventClick}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          <AnimatePresence>
            {activeEvent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                animate={{ 
                  opacity: 0.9, 
                  scale: 1.1, 
                  rotate: 3,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
                exit={{ opacity: 0, scale: 0.8, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  mass: 0.8
                }}
                className="cursor-grabbing"
              >
                <EventCard
                  event={activeEvent}
                  variant="compact"
                  calendarColor={calendars.find(cal => cal.id === activeEvent.calendar_id)?.color || '#3b82f6'}
                  className="shadow-2xl border-2 border-white/20"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </DragOverlay>
      </DndContext>
    </Card>
  );
}