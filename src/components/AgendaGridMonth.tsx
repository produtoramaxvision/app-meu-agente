import { useMemo, useState, useCallback } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Event, Calendar } from '@/hooks/useOptimizedAgendaData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { restrictToVerticalAxis, createSnapModifier } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  monthDate: Date;
  events: Event[];
  calendars: Calendar[];
  isLoading?: boolean;
  onEventClick?: (evt: Event) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
}

export default function AgendaGridMonth({ monthDate, events, calendars, isLoading, onEventClick, onEventMove }: Props) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { locale: ptBR });
  const gridEnd = endOfWeek(monthEnd, { locale: ptBR });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

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

  function DraggableEvent({ event, calendarColor, onEventClick }: DraggableEventProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging,
    } = useDraggable({
      id: `event-${event.id}`,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
    };

    return (
      <motion.div
        ref={setNodeRef}
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
          className="text-[9px] xs:text-[10px] md:text-xs"
        />
      </motion.div>
    );
  }

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

    const show = items.slice(0, 3);
    const restCount = items.length - show.length;

    return (
      <motion.div
        ref={setNodeRef}
        className={`min-h-[80px] xs:min-h-[110px] md:min-h-[140px] border rounded-lg p-1 xs:p-2 bg-surface transition-colors ${
          !isSameMonth(date, monthDate) ? 'opacity-60' : ''
        } ${isOver ? 'bg-primary/10 border-primary/60' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: dayIndex * 0.02 }}
      >
        <div className="text-[9px] xs:text-[10px] md:text-xs text-text-muted mb-1">
          {format(date, 'd MMM', { locale: ptBR })}
        </div>
        <div className="space-y-1">
          {show.map(evt => {
            // Encontrar a cor do calendário
            const calendar = calendars.find(cal => cal.id === evt.calendar_id);
            const calendarColor = calendar?.color || '#3b82f6';
            
            return (
              <DraggableEvent
                key={evt.id}
                event={evt}
                calendarColor={calendarColor}
                onEventClick={onEventClick}
              />
            );
          })}
          {restCount > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-[10px] sm:text-xs text-primary hover:underline">+{restCount} mais</button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  {items.map(evt => {
                    // Encontrar a cor do calendário
                    const calendar = calendars.find(cal => cal.id === evt.calendar_id);
                    const calendarColor = calendar?.color || '#3b82f6';
                    
                    return (
                      <DraggableEvent
                        key={evt.id}
                        event={evt}
                        calendarColor={calendarColor}
                        onEventClick={onEventClick}
                      />
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {items.length === 0 && <div className="text-[10px] sm:text-xs text-text-muted">Sem eventos</div>}
        </div>
      </motion.div>
    );
  }

  return (
    <Card className="p-2 xs:p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, createSnapModifier(20)]}
      >
        <div role="grid" aria-label="Grade mensal" className="grid grid-cols-7 gap-1 xs:gap-2 md:gap-3">
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