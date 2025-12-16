import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, format, isSameDay, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, RefreshCw, X } from 'lucide-react';
import { useOptimizedAgendaData, Event, EventFormData, Resource as OptimizedResource } from '@/hooks/useOptimizedAgendaData';
import { Resource as OriginalResource } from '@/hooks/useAgendaData';
import { AgendaFilters } from '@/components/AgendaFilters';
import { EventForm } from '@/components/EventForm';
import { UpcomingTasksCard } from '@/components/UpcomingTasksCard';
import { useSearch } from '@/contexts/SearchContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/spinner';

// Import direto dos componentes para evitar problemas de lazy loading
import AgendaGridDay from '@/components/AgendaGridDay';
import AgendaGridWeek from '@/components/AgendaGridWeek';
import AgendaGridMonth from '@/components/AgendaGridMonth';
import AgendaList from '@/components/AgendaList';
import AgendaTimeline from '@/components/AgendaTimeline';
import AgendaYearHeatmap from '@/components/AgendaYearHeatmap';

type View = 'day' | 'week' | 'month' | 'agenda' | 'timeline' | 'year';

export default function Agenda() {
  const { cliente } = useAuth();
  const { searchQuery, setSearchQuery, mode, commandId } = useSearch();
  const queryClient = useQueryClient();

  // Função para converter recursos do hook otimizado para o formato esperado pelos componentes
  const convertResources = useCallback((optimizedResources: OptimizedResource[]): OriginalResource[] => {
    return optimizedResources.map(resource => ({
      id: resource.id,
      phone: resource.phone,
      type: resource.type,
      name: resource.name,
      capacity: resource.capacity,
      metadata: resource.metadata || {},
      created_at: resource.created_at,
      updated_at: resource.updated_at,
    }));
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [view, setView] = useState<View>(() => {
    const savedView = sessionStorage.getItem('agendaView') as View;
    return savedView || 'day';
  });
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [defaultEventData, setDefaultEventData] = useState<Partial<EventFormData> | null>(null);

  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Implementar debounce para o campo de busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [localSearch]);
  
  // Estados de loading para feedback visual
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleViewChange = useCallback((newView: View) => {
    /**
     * BUG FIX - TestSprite TC009
     * Problema: Tab 'Ano' não respondia ao clique
     * Solução: Melhorar função de mudança de view e garantir renderização correta
     * Data: 2025-01-06
     * Validado: sim
     */
    setView(newView);
    sessionStorage.setItem('agendaView', newView);
  }, []);

  // ✅ CORREÇÃO CRÍTICA: Estabilizar datas usando timestamps para evitar loops infinitos
  const { startDate, endDate } = useMemo(() => {
    // If range is selected, use it for filtering
    if (dateRange?.from && dateRange?.to) {
      return { 
        startDate: startOfDay(dateRange.from), 
        endDate: endOfDay(dateRange.to) 
      };
    }
    
    switch (view) {
      case 'day':
        return { 
          startDate: startOfDay(selectedDate), 
          endDate: endOfDay(selectedDate) 
        };
      case 'week':
        // Para a visualização semanal estendida, carregamos todos os eventos do mês
        // e mostramos as semanas empilhadas na interface
        return { 
          startDate: startOfMonth(selectedDate), 
          endDate: endOfMonth(selectedDate) 
        };
      case 'month':
      case 'year':
      case 'timeline':
      case 'agenda':
      default:
        return { 
          startDate: startOfMonth(selectedDate), 
          endDate: endOfMonth(selectedDate) 
        };
    }
  }, [
    view, 
    selectedDate, 
    dateRange?.from, 
    dateRange?.to
  ]);

  // Semanas visíveis na view "Semana": todas as semanas que cobrem o mês atual
  const weekStarts = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const firstWeekStart = startOfWeek(monthStart, { locale: ptBR });
    const weeks: Date[] = [];

    let current = firstWeekStart;
    while (current <= monthEnd) {
      weeks.push(current);
      current = addWeeks(current, 1);
    }

    return weeks;
  }, [selectedDate]);

  // Removido: useEffect problemático que causava invalidação desnecessária
  // A invalidação de queries deve ser feita apenas quando necessário
  // e não a cada renderização do componente

  // ✅ CORREÇÃO: Estabilizar arrays de opções com debounce para evitar re-renderizações desnecessárias
  // Extrair joins para variáveis para evitar expressões complexas em deps
  const calendarsKey = selectedCalendars.join(',');
  const categoriesKey = selectedCategories.join(',');
  const prioritiesKey = selectedPriorities.join(',');
  const statusesKey = selectedStatuses.join(',');
  
  const stableCalendarIds = useMemo(() => 
    selectedCalendars.length ? selectedCalendars : undefined,
    [selectedCalendars]
  );

  const stableCategories = useMemo(() => 
    selectedCategories.length ? selectedCategories : undefined,
    [selectedCategories]
  );

  const stablePriorities = useMemo(() => 
    selectedPriorities.length ? selectedPriorities : undefined,
    [selectedPriorities]
  );

  const stableStatuses = useMemo(() => 
    selectedStatuses.length ? selectedStatuses : undefined,
    [selectedStatuses]
  );

  const stableSearchQuery = useMemo(() => {
    // Se o usuário digitou algo no filtro local, ele sempre tem prioridade
    if (debouncedSearch) return debouncedSearch;

    // Busca global vinda de comandos: só aplica quando o comando for da agenda/timeline
    const agendaCommandIds: string[] = [
      'agenda',
      'events',
      'timeline',
      'agenda_day',
      'agenda_week',
      'agenda_timeline',
    ];

    if (mode === 'global' && commandId && agendaCommandIds.includes(commandId)) {
      return searchQuery;
    }

    // Caso contrário, não aplica busca global residual na agenda
    return '';
  }, [debouncedSearch, searchQuery, mode, commandId]);

  const { calendars, events, resources, isLoading, refetch, createEvent, updateEvent, createCalendar } = useOptimizedAgendaData({
    view,
    startDate,
    endDate,
    calendarIds: stableCalendarIds,
    categories: stableCategories,
    priorities: stablePriorities,
      statuses: stableStatuses,
      searchQuery: stableSearchQuery,
  });

  // Quando um comando global de agenda é executado, sincroniza o texto no filtro local
  useEffect(() => {
    const agendaCommandIds: string[] = [
      'agenda',
      'events',
      'timeline',
      'agenda_day',
      'agenda_week',
      'agenda_timeline',
    ];

    if (mode === 'global' && commandId && agendaCommandIds.includes(commandId) && searchQuery && !localSearch) {
      setLocalSearch(searchQuery);
    }
  }, [mode, commandId, searchQuery, localSearch]);

  // Forçar visualização específica quando o comando global indicar uma view
  useEffect(() => {
    if (mode !== 'global' || !commandId) return;

    const viewByCommand: Record<string, View> = {
      timeline: 'timeline',
      agenda_timeline: 'timeline',
      agenda_day: 'day',
      agenda_week: 'week',
    };

    const targetView = viewByCommand[commandId];
    if (targetView && view !== targetView) {
      handleViewChange(targetView);
    }
  }, [mode, commandId, view, handleViewChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Verificar se estamos em um input ou textarea
      const activeElement = document.activeElement as HTMLElement;
      
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        activeElement.contentEditable === 'true' ||
        activeElement.getAttribute('contenteditable') === 'true' ||
        activeElement.getAttribute('role') === 'textbox'
      )) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setEventFormOpen(true);
        return;
      }
      
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      
      if (['s','d','m','a','t','y'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        const map: Record<string, View> = { s: 'week', d: 'day', m: 'month', a: 'agenda', t: 'timeline', y: 'year' };
        const newView = map[e.key.toLowerCase()];
        handleViewChange(newView);
        return;
      }
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedDate(prev => {
          switch (view) {
            case 'day': return addDays(prev, -1);
            case 'week': return addWeeks(prev, -1);
            default: return addMonths(prev, -1);
          }
        });
        return;
      }
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedDate(prev => {
          switch (view) {
            case 'day': return addDays(prev, 1);
            case 'week': return addWeeks(prev, 1);
            default: return addMonths(prev, 1);
          }
        });
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedDate(prev => addMonths(prev, 1));
        return;
      }
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedDate(prev => addMonths(prev, -1));
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setEventFormOpen(false);
        return;
      }
    };
    
    // Usar capture: true para interceptar antes do Calendar
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [view, handleViewChange]);

  const onClearFilters = useCallback(() => {
    setSelectedCalendars([]);
    setSelectedCategories([]);
    setSelectedPriorities([]);
    setSelectedStatuses([]);
    setLocalSearch('');
    setSearchQuery('');
    setDateRange(undefined);
  }, [setSearchQuery]);

  const handleCreateEvent = useCallback((data: EventFormData) => {
    const mutation = eventToEdit ? updateEvent : createEvent;
    const mutationData = eventToEdit ? { id: eventToEdit.id, updates: data } : data;
    
    // Definir estado de loading apropriado
    if (eventToEdit) {
      setIsUpdatingEvent(true);
    } else {
      setIsCreatingEvent(true);
    }
    
    mutation.mutate(mutationData, {
      onSuccess: () => {
        setEventFormOpen(false);
        setEventToEdit(null);
        setDefaultEventData(null);
        // Feedback visual de sucesso
        toast.success(
          eventToEdit ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!',
          { duration: 3000 }
        );
      },
      onError: (error: Error) => {
        // Feedback visual de erro
        toast.error(
          eventToEdit ? 'Erro ao atualizar evento' : 'Erro ao criar evento',
          { 
            description: error.message || 'Tente novamente',
            duration: 5000
          }
        );
      },
      onSettled: () => {
        // Limpar estados de loading
        setIsCreatingEvent(false);
        setIsUpdatingEvent(false);
      }
    });
  }, [createEvent, updateEvent, eventToEdit]);

  const handleQuickCreate = useCallback((data: EventFormData) => {
    setIsCreatingEvent(true);
    createEvent.mutate(data, {
      onSuccess: () => {
        toast.success('Evento criado com sucesso!', { duration: 3000 });
      },
      onError: (error: Error) => {
        toast.error('Erro ao criar evento', { 
          description: error.message || 'Tente novamente',
          duration: 5000
        });
      },
      onSettled: () => {
        setIsCreatingEvent(false);
      }
    });
  }, [createEvent]);

  const handleEventDoubleClick = useCallback((data: Partial<EventFormData>) => {
    setEventToEdit(null);
    setDefaultEventData(data);
    setEventFormOpen(true);
  }, []);

  const onEventClick = useCallback((evt: Event) => {
    toast.info(evt.title, { description: `${format(new Date(evt.start_ts), "dd/MM/yyyy HH:mm")} • ${evt.location || 'Sem local'}` });
  }, []);

  const onEventMove = useCallback((eventId: string, newStartTime: Date, newEndTime: Date) => {
    updateEvent.mutate({
      id: eventId,
      updates: {
        start_ts: newStartTime.toISOString(),
        end_ts: newEndTime.toISOString(),
      }
    });
  }, [updateEvent]);

  // Função de refresh com feedback visual
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Agenda atualizada!', { duration: 2000 });
    } catch (error) {
      toast.error('Erro ao atualizar agenda', { 
        description: 'Tente novamente',
        duration: 3000
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Classes CSS estáticas - não precisam de useMemo conforme Context7
  const triggerClasses = cn(
    'group relative overflow-hidden flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
    'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--brand-900))] data-[state=active]:to-[hsl(var(--brand-700))] data-[state=active]:text-white data-[state=active]:shadow-lg',
    'data-[state=inactive]:text-[hsl(var(--sidebar-text-muted))] data-[state=inactive]:bg-surface data-[state=inactive]:hover:bg-[hsl(var(--sidebar-hover))] data-[state=inactive]:hover:text-[hsl(var(--sidebar-text))] data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-lg'
  );

  // Componente de loading simples
  const LoadingFallback = useMemo(() => (
    <div 
      className="flex items-center justify-center h-64" 
      role="status" 
      aria-live="polite"
      aria-label="Carregando visualização da agenda"
    >
      <Spinner size="lg" />
    </div>
  ), []);

  return (
    <div className="py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="animate-fade-in flex items-start gap-4">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">
                Agenda
              </h1>
              <p className="text-text-muted mt-2">
                Seu calendário inteligente, com múltiplas vistas e atualização em tempo real.
              </p>
            </div>
          </div>
          
          <div className="pt-1 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <Tabs 
              value={view} 
              onValueChange={(v) => handleViewChange(v as View)} 
              className="w-full"
              aria-label="Selecionar visualização da agenda"
            >
              {/* Botão Novo Evento - somente Mobile (acima do seletor de visualização) */}
              <div className="md:hidden mb-3">
                <button
                  onClick={() => setEventFormOpen(true)}
                  disabled={isCreatingEvent || isUpdatingEvent}
                  className="group relative overflow-hidden rounded-lg px-3 xs:px-4 py-2 xs:py-3 transition-all duration-200 bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2 w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-manipulation"
                  aria-label="Criar novo evento na agenda"
                  aria-describedby="new-event-description-mobile"
                >
                  {isCreatingEvent ? (
                    <Spinner size="sm" />
                  ) : (
                    <Plus className="h-4 w-4 text-white transition-transform group-hover:scale-110 group-hover:rotate-90" aria-hidden="true" />
                  )}
                  <span className="text-xs xs:text-sm font-semibold text-white">
                    {isCreatingEvent ? 'Criando...' : 'Novo Evento'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
                </button>

                {/* Descrição oculta para leitores de tela (mobile) */}
                <div id="new-event-description-mobile" className="sr-only">
                  Abre o formulário para criar um novo evento na agenda. Use a tecla N como atalho.
                </div>
              </div>

              <TabsList 
                className="grid grid-cols-3 xs:grid-cols-6 gap-1 p-1 h-auto w-full"
                role="tablist"
                aria-label="Opções de visualização da agenda"
              >
                <TabsTrigger 
                  value="day" 
                  className={triggerClasses}
                  aria-label="Visualizar agenda por dia"
                  aria-describedby="day-description"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" aria-hidden="true" />
                  <span className="relative z-10">Dia</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="week" 
                  className={triggerClasses}
                  aria-label="Visualizar agenda por semana"
                  aria-describedby="week-description"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" aria-hidden="true" />
                  <span className="relative z-10">Semana</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="month" 
                  className={triggerClasses}
                  aria-label="Visualizar agenda por mês"
                  aria-describedby="month-description"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" aria-hidden="true" />
                  <span className="relative z-10">Mês</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="agenda" 
                  className={triggerClasses}
                  aria-label="Visualizar agenda em lista"
                  aria-describedby="agenda-description"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" aria-hidden="true" />
                  <span className="relative z-10">Agenda</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="timeline" 
                  className={triggerClasses}
                  aria-label="Visualizar agenda em timeline"
                  aria-describedby="timeline-description"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" aria-hidden="true" />
                  <span className="relative z-10">Timeline</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="year" 
                  className={triggerClasses}
                  aria-label="Visualizar agenda por ano"
                  aria-describedby="year-description"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" aria-hidden="true" />
                  <span className="relative z-10">Ano</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Descrições ocultas para leitores de tela */}
            <div className="sr-only">
              <div id="day-description">Visualização diária da agenda com eventos organizados por hora</div>
              <div id="week-description">Visualização semanal da agenda com eventos organizados por dias da semana</div>
              <div id="month-description">Visualização mensal da agenda com eventos organizados por dias do mês</div>
              <div id="agenda-description">Visualização em lista da agenda com eventos organizados cronologicamente</div>
              <div id="timeline-description">Visualização em timeline da agenda com eventos organizados em linha do tempo</div>
              <div id="year-description">Visualização anual da agenda com eventos organizados por meses do ano</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card
        className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl animate-fade-in"
        style={{ animationDelay: '150ms' }}
      >
        <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-primary/12 via-transparent to-sky-500/10 opacity-90" />
        <CardHeader className="flex flex-row items-center justify-between relative z-10 pb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className={cn(
                "h-8 w-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center transition-all duration-200",
                !(isRefreshing || isLoading) && "hover:bg-primary/15 hover:scale-110 hover:shadow-sm",
                (isRefreshing || isLoading) && "opacity-60 cursor-not-allowed"
              )}
              aria-label="Atualizar agenda"
              title="Atualizar agenda"
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4 text-primary transition-transform duration-200",
                  isRefreshing && "animate-spin"
                )}
              />
            </button>
            <div className="flex flex-col">
              <CardTitle className="text-sm font-semibold tracking-tight">
                Filtros
              </CardTitle>
              <p className="text-[11px] text-text-muted">
                Refine sua agenda por texto, agenda, categoria, prioridade e status
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 pt-0">
          <AgendaFilters
            calendars={calendars}
            selectedCalendars={selectedCalendars}
            onCalendarsChange={setSelectedCalendars}
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            selectedPriorities={selectedPriorities}
            onPrioritiesChange={setSelectedPriorities}
            selectedStatuses={selectedStatuses}
            onStatusesChange={setSelectedStatuses}
            searchQuery={localSearch}
            onSearchQueryChange={setLocalSearch}
            onClearFilters={onClearFilters}
            searchInputRef={searchInputRef}
          />
        </CardContent>
      </Card>

      {/* Layout Principal */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-12">
        {/* Área Principal - Calendário */}
        <div className="md:col-span-8 lg:col-span-8 xl:col-span-9">
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            {isLoading ? (
              LoadingFallback
            ) : (
              <>
                {view === 'day' && (
                  <AgendaGridDay
                    date={selectedDate}
                    events={events}
                    calendars={calendars}
                    isLoading={isLoading}
                    onEventClick={onEventClick}
                    onEventCreate={handleQuickCreate}
                    onEventDoubleClick={handleEventDoubleClick}
                    onEventMove={onEventMove}
                  />
                )}
                {view === 'week' && (
                  <div className="space-y-4">
                    {weekStarts.map((weekStartDate) => (
                      <AgendaGridWeek
                        key={weekStartDate.toISOString()}
                        weekDate={weekStartDate}
                        events={events}
                        calendars={calendars}
                        isLoading={isLoading}
                        onEventClick={onEventClick}
                        onEventMove={onEventMove}
                      />
                    ))}
                  </div>
                )}
                {view === 'month' && (
                  <AgendaGridMonth
                    monthDate={selectedDate}
                    events={events}
                    calendars={calendars}
                    isLoading={isLoading}
                    onEventClick={onEventClick}
                    onEventMove={onEventMove}
                  />
                )}
                {view === 'agenda' && (
                  <AgendaList
                    startDate={startDate}
                    endDate={endDate}
                    events={events}
                    calendars={calendars}
                    isLoading={isLoading}
                    onEventClick={onEventClick}
                    onCreateEvent={(date) => {
                      setDefaultEventData({ 
                        start_date: date, 
                        end_date: date,
                        start_time: format(date, 'HH:mm'),
                        end_time: format(addDays(date, 1), 'HH:mm')
                      });
                      setEventFormOpen(true);
                    }}
                  />
                )}
                {view === 'timeline' && (
                  <AgendaTimeline
                    startDate={startDate}
                    endDate={endDate}
                    events={events}
                    resources={convertResources(resources)}
                    isLoading={isLoading}
                    onEventClick={onEventClick}
                  />
                )}
                {view === 'year' && (
                  <div className="animate-fade-in">
                    <AgendaYearHeatmap
                      yearDate={selectedDate}
                      events={events}
                      isLoading={isLoading}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sidebar Direita */}
        <div className="md:col-span-4 lg:col-span-4 xl:col-span-3 space-y-4 md:space-y-6">
          {/* Botão Novo Evento - Desktop/Tablet */}
          <div className="hidden md:block animate-fade-in" style={{ animationDelay: '250ms' }}>
            <button
              onClick={() => setEventFormOpen(true)}
              disabled={isCreatingEvent || isUpdatingEvent}
              className="group relative overflow-hidden rounded-lg px-3 xs:px-4 py-2 xs:py-3 transition-all duration-200 bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2 w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 touch-manipulation"
              aria-label="Criar novo evento na agenda"
              aria-describedby="new-event-description"
            >
              {isCreatingEvent ? (
                <Spinner size="sm" />
              ) : (
                <Plus className="h-4 w-4 text-white transition-transform group-hover:scale-110 group-hover:rotate-90" aria-hidden="true" />
              )}
              <span className="text-xs xs:text-sm font-semibold text-white">
                {isCreatingEvent ? 'Criando...' : 'Novo Evento'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" aria-hidden="true" />
            </button>
            
            {/* Descrição oculta para leitores de tela */}
            <div id="new-event-description" className="sr-only">
              Abre o formulário para criar um novo evento na agenda. Use a tecla N como atalho.
            </div>
          </div>

          {/* Card Calendário */}
          <Card className="group relative overflow-hidden rounded-xl border-border/40 bg-card/50 shadow-sm hover:scale-105 transition-all duration-200 animate-fade-in hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-2 xs:p-4 relative z-10 w-full">
              <Calendar
                mode="single"
                selected={selectedDate}
                month={selectedDate}
                onSelect={(selection) => {
                  if (selection) {
                    setSelectedDate(selection);
                    setDateRange(undefined);
                  }
                }}
                onMonthChange={(month) => {
                  // Sincronizar o selectedDate quando o mês muda no calendário
                  setSelectedDate(month);
                }}
                disableNavigation={false}
                initialFocus
                locale={ptBR}
                className="w-full calendar-responsive"
                numberOfMonths={1}
                aria-label="Seletor de data para navegar pela agenda"
                aria-describedby="calendar-description"
              />
              
              {/* Descrição oculta para leitores de tela */}
              <div id="calendar-description" className="sr-only">
                Use este calendário para navegar pela agenda. Clique em uma data para visualizar eventos de um dia específico.
                Use as setas do teclado para navegar: ← → para dias/semanas/meses, ↑ ↓ para navegar entre meses.
              </div>
              {dateRange?.from && dateRange?.to && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium text-primary">Período selecionado:</span>
                      <div className="mt-1 text-text-muted">
                        {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange(undefined)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(new Date());
                    setDateRange(undefined);
                    // Feedback visual de sucesso
                    toast.success('Voltou para hoje!', { duration: 2000 });
                  }}
                  className="w-full group/hoje relative overflow-hidden rounded-lg p-2 transition-all duration-200 hover:scale-105 hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))] hover:shadow-md"
                  aria-label="Voltar para a data de hoje"
                  aria-describedby="hoje-description"
                >
                  <span className="relative z-10 flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 transition-transform duration-300 group-hover/hoje:scale-110" aria-hidden="true" /> Hoje
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/hoje:translate-x-full transition-transform duration-700" aria-hidden="true" />
                </Button>
                
                {/* Descrição oculta para leitores de tela */}
                <div id="hoje-description" className="sr-only">
                  Define a data atual como referência para visualizar os eventos de hoje
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Tarefas Urgentes */}
          <div className="animate-fade-in" style={{ animationDelay: '350ms' }}>
            <UpcomingTasksCard />
          </div>
        </div>
      </div>

      <EventForm
        open={eventFormOpen}
        onOpenChange={(isOpen) => {
          setEventFormOpen(isOpen);
          if (!isOpen) {
            setEventToEdit(null);
            setDefaultEventData(null);
          }
        }}
        onSubmit={handleCreateEvent}
        eventToEdit={eventToEdit}
        defaultEventData={defaultEventData}
        calendars={calendars}
        createCalendar={createCalendar.mutate}
        isSubmitting={createEvent.isPending || updateEvent.isPending}
      />
    </div>
  );
}