import { useState, useEffect, useRef, useMemo } from 'react';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, EventFormData } from '@/hooks/useOptimizedAgendaData';
import { cn } from '@/lib/utils';

// Hook para controlar o estado do popover (substitui variável global)
// Usado pela página Agenda para verificar se o popover está aberto
export const useEventPopoverOpen = () => {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, setIsOpen };
};

// Função helper para verificar se o popover está aberto (mantida para compatibilidade)
// Nota: Esta é uma verificação limitada, considere usar o hook useEventPopoverOpen
let _isPopoverOpen = false;
export const isEventPopoverOpen = () => _isPopoverOpen;

interface EventQuickCreatePopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchor: { top: number; left: number } | null;
  eventData: Partial<EventFormData> | { start_ts?: Date; end_ts?: Date };
  calendars: Calendar[];
  onSubmit: (data: Partial<EventFormData> | { start_ts?: Date; end_ts?: Date; title: string; calendar_id: string }) => void;
  onMoreOptions: () => void;
}

export function EventQuickCreatePopover({
  open,
  onOpenChange,
  anchor,
  eventData,
  calendars,
  onSubmit,
  onMoreOptions,
}: EventQuickCreatePopoverProps) {
  const [title, setTitle] = useState('');
  const [calendarId, setCalendarId] = useState<string | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarSelectContentRef = useRef<HTMLDivElement | null>(null);
  const prioritySelectContentRef = useRef<HTMLDivElement | null>(null);

  const start_ts = 'start_ts' in eventData ? eventData.start_ts : undefined;
  const end_ts = 'end_ts' in eventData ? eventData.end_ts : undefined;

  // Validação em tempo real
  useEffect(() => {
    setIsValid(title.trim().length > 0 && !!calendarId);
  }, [title, calendarId]);

  useEffect(() => {
    if (open) {
      setTitle('');
      // Selecionar agenda primária ou primeira disponível
      const primaryCalendar = calendars.find(c => c.is_primary);
      const firstCalendar = calendars[0];
      const selectedCalendarId = primaryCalendar?.id || firstCalendar?.id;
      
      setCalendarId(selectedCalendarId);
      const initialPriority =
        'priority' in eventData && eventData.priority
          ? (eventData.priority as 'low' | 'medium' | 'high')
          : 'medium';
      setPriority(initialPriority);
      _isPopoverOpen = true; // Marcar popover como aberto (para compatibilidade)
      // Usar requestAnimationFrame para garantir que o DOM está pronto, mas sem delay perceptível
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      });
    } else {
      _isPopoverOpen = false; // Marcar popover como fechado (para compatibilidade)
    }
  }, [open, calendars, eventData]);

  // Atualiza horários quando o usuário abre o popover ou muda de slot
  useEffect(() => {
    if (!open) return;
    if (start_ts instanceof Date) {
      setStartTime(format(start_ts, 'HH:mm'));
    } else {
      setStartTime('');
    }
    if (end_ts instanceof Date) {
      setEndTime(format(end_ts, 'HH:mm'));
    } else {
      setEndTime('');
    }
  }, [open, start_ts, end_ts]);

  const formattedDateLabel = useMemo(() => {
    if (!start_ts || !(start_ts instanceof Date)) return '...';
    return format(start_ts, "EEEE, d 'de' MMMM", { locale: ptBR });
  }, [start_ts]);

  const formattedTimeLabel = useMemo(() => {
    if (!(start_ts instanceof Date) || !(end_ts instanceof Date)) return '...';
    return `${format(start_ts, 'HH:mm')} – ${format(end_ts, 'HH:mm')}`;
  }, [start_ts, end_ts]);

  const updateDateWithTime = (date: Date | undefined, time: string) => {
    if (!date || !time) return date;
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      newDate.setHours(hours, minutes, 0, 0);
    }
    return newDate;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !isValid || !calendarId) return;

    const updatedEventData: Record<string, unknown> = {
      ...eventData,
    };

    const adjustedStart = updateDateWithTime(start_ts instanceof Date ? start_ts : undefined, startTime);
    const adjustedEnd = updateDateWithTime(end_ts instanceof Date ? end_ts : undefined, endTime);

    if (adjustedStart) {
      updatedEventData.start_ts = adjustedStart;
      if ('start_date' in updatedEventData && updatedEventData.start_date instanceof Date) {
        updatedEventData.start_date = adjustedStart;
      }
      if ('start_time' in updatedEventData) {
        updatedEventData.start_time = startTime;
      }
    }

    if (adjustedEnd) {
      updatedEventData.end_ts = adjustedEnd;
      if ('end_date' in updatedEventData && updatedEventData.end_date instanceof Date) {
        updatedEventData.end_date = adjustedEnd;
      }
      if ('end_time' in updatedEventData) {
        updatedEventData.end_time = endTime;
      }
    }

    updatedEventData.priority = priority;
    
    onSubmit({
      ...updatedEventData,
      title,
      calendar_id: calendarId,
      priority,
    });
    onOpenChange(false);
  };

  const handleInteractOutside = (event: Event) => {
    const target = event.target as Node;
    if (
      calendarSelectContentRef.current?.contains(target) ||
      prioritySelectContentRef.current?.contains(target)
    ) {
      event.preventDefault();
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {anchor && (
        <PopoverAnchor
          style={{ position: 'absolute', top: anchor.top, left: anchor.left, width: 0, height: 0 }}
        />
      )}
      <PopoverContent 
        className="w-80" 
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={handleInteractOutside}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            ref={inputRef}
            placeholder="Adicionar título do evento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold border-0 shadow-none focus-visible:ring-0 px-2 -mx-2"
            aria-label="Título do evento"
          />

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-text-muted">
              <CalendarIcon className="h-4 w-4" />
              <span>{formattedDateLabel}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Início</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-9"
                aria-label="Horário de início"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Término</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-9"
                aria-label="Horário de término"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Agenda</label>
              <Select value={calendarId || undefined} onValueChange={setCalendarId}>
                <SelectTrigger className="flex-1" aria-label="Selecionar agenda">
                  <SelectValue placeholder="Selecionar agenda" />
                </SelectTrigger>
                <SelectContent ref={calendarSelectContentRef}>
                  {calendars.map((cal) => (
                    <SelectItem key={cal.id} value={cal.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: cal.color }} 
                        />
                        <span>{cal.name}</span>
                        {cal.is_primary && (
                          <span className="text-xs text-text-muted">(Principal)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Prioridade</label>
              <Select value={priority} onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}>
                <SelectTrigger aria-label="Selecionar prioridade">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent ref={prioritySelectContentRef}>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onMoreOptions}
              className="min-w-[130px] justify-center"
            >
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Mais opções
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isValid}
              className={cn(
                'min-w-[130px] justify-center bg-gradient-to-r from-[hsl(var(--brand-900))] via-[hsl(var(--brand-700))] to-[hsl(var(--brand-600))] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 border border-white/10',
                'focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--brand-400))]',
                'disabled:opacity-70 disabled:saturate-75 disabled:hover:scale-100 disabled:hover:shadow-lg disabled:cursor-not-allowed'
              )}
            >
              Salvar
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}