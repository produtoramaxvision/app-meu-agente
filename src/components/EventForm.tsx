import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, Clock, MapPin, Video, Tag, Flag, Users, Bell, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Event, EventFormData, Calendar } from '@/hooks/useOptimizedAgendaData';
import { CalendarForm } from './CalendarForm';

import { Button } from '@/components/ui/button';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SegmentedControl } from '@/components/ui/segmented-control';

const formSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().max(2000, 'Descrição muito longa').optional(),
  start_date: z.date(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  end_date: z.date(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  all_day: z.boolean().default(false),
  timezone: z.string().default('America/Sao_Paulo'),
  location: z.string().max(500, 'Local muito longo').optional(),
  conference_url: z.string().url('URL inválida').optional().or(z.literal('')),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  privacy: z.enum(['default', 'public', 'private']).default('default'),
  status: z.enum(['confirmed', 'tentative', 'cancelled']).default('confirmed'),
  calendar_id: z.string().min(1, 'Agenda é obrigatória'),
  color: z.string().optional(),
});

interface EventFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventFormData) => void;
  eventToEdit?: Event | null;
  calendars: Calendar[];
  createCalendar: (data: Omit<Calendar, 'id' | 'phone' | 'created_at' | 'updated_at'>) => void;
  isSubmitting?: boolean;
  defaultEventData?: Partial<EventFormData> | { start_ts?: Date; end_ts?: Date } | null;
}

const CATEGORIES = ['Trabalho', 'Pessoal', 'Reunião', 'Viagem', 'Foco', 'Outros'];
const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'America/New_York', label: 'Nova York (EST)' },
  { value: 'Europe/London', label: 'Londres (GMT)' },
  { value: 'Asia/Tokyo', label: 'Tóquio (JST)' },
];

const formatTimeToHHMM = (time: string | undefined | null): string => {
  if (!time) return '';
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }

  const cleanedTime = time.toLowerCase().replace(/[^0-9:apm\s]/g, '');
  const match = cleanedTime.match(/(\d{1,2})[:\s]?(\d{2})?\s*(am|pm)?/);

  if (!match) {
    const singleNum = parseInt(time, 10);
    if (!isNaN(singleNum) && singleNum >= 0 && singleNum <= 23) {
      return `${String(singleNum).padStart(2, '0')}:00`;
    }
    return time;
  }

  const [, hours, minutes, period] = match;
  let h = parseInt(hours, 10);
  const m = minutes ? parseInt(minutes, 10) : 0;

  if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return time;

  if (period === 'pm' && h < 12) {
    h += 12;
  }
  if (period === 'am' && h === 12) {
    h = 0;
  }

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export function EventForm({
  open,
  onOpenChange,
  onSubmit,
  eventToEdit,
  calendars,
  createCalendar,
  isSubmitting = false,
  defaultEventData,
}: EventFormProps) {
  const [isStartDatePickerOpen, setIsStartDatePickerOpen] = useState(false);
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false);
  const [calendarFormOpen, setCalendarFormOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      start_date: new Date(),
      start_time: '09:00',
      end_date: new Date(),
      end_time: '10:00',
      all_day: false,
      timezone: 'America/Sao_Paulo',
      location: '',
      conference_url: '',
      category: '',
      priority: 'medium',
      privacy: 'default',
      status: 'confirmed',
      calendar_id: '',
      color: '',
    },
  });

  useEffect(() => {
    if (eventToEdit) {
      const startDate = new Date(eventToEdit.start_ts);
      const endDate = new Date(eventToEdit.end_ts);

      form.reset({
        title: eventToEdit.title || '',
        description: eventToEdit.description || '',
        start_date: startDate,
        start_time: format(startDate, 'HH:mm'),
        end_date: endDate,
        end_time: format(endDate, 'HH:mm'),
        all_day: !!eventToEdit.all_day,
        timezone: eventToEdit.timezone || 'America/Sao_Paulo',
        location: eventToEdit.location || '',
        conference_url: eventToEdit.conference_url || '',
        category: eventToEdit.category || '',
        priority: (eventToEdit.priority as 'low' | 'medium' | 'high') || 'medium',
        privacy: (eventToEdit.privacy as 'default' | 'public' | 'private') || 'default',
        status: (eventToEdit.status as 'confirmed' | 'tentative' | 'cancelled') || 'confirmed',
        calendar_id: eventToEdit.calendar_id || calendars.find(c => c.is_primary)?.id || calendars[0]?.id || '',
        color: eventToEdit.color || '',
      });
    } else if (defaultEventData) {
      // Aceitar tanto o formato com start_ts/end_ts quanto start_date/end_date
      const startDate = ('start_ts' in defaultEventData && defaultEventData.start_ts) 
        ? defaultEventData.start_ts 
        : ('start_date' in defaultEventData && defaultEventData.start_date) 
        ? defaultEventData.start_date 
        : new Date();
      const endDate = ('end_ts' in defaultEventData && defaultEventData.end_ts) 
        ? defaultEventData.end_ts 
        : ('end_date' in defaultEventData && defaultEventData.end_date) 
        ? defaultEventData.end_date 
        : new Date();
      form.reset({
        title: '',
        description: '',
        start_date: startDate,
        start_time: format(startDate, 'HH:mm'),
        end_date: endDate,
        end_time: format(endDate, 'HH:mm'),
        all_day: false,
        timezone: 'America/Sao_Paulo',
        location: '',
        conference_url: '',
        category: '',
        priority: 'medium',
        privacy: 'default',
        status: 'confirmed',
        calendar_id: calendars.find(c => c.is_primary)?.id || calendars[0]?.id || '',
        color: '',
      });
    } else if (open) { // Reset only when opening for a new event
      const startDate = new Date();
      form.reset({
        title: '',
        description: '',
        start_date: startDate,
        end_date: startDate,
        start_time: '09:00',
        end_time: '10:00',
        all_day: false,
        timezone: 'America/Sao_Paulo',
        location: '',
        conference_url: '',
        category: '',
        priority: 'medium',
        privacy: 'default',
        status: 'confirmed',
        calendar_id: calendars.find(c => c.is_primary)?.id || calendars[0]?.id || '',
        color: '',
      });
    }
  }, [eventToEdit, defaultEventData, open, form, calendars]);

  // Garantir que sempre há um calendar_id válido
  useEffect(() => {
    const currentCalendarId = form.getValues('calendar_id');
    if (!currentCalendarId && calendars.length > 0) {
      const defaultCalendarId = calendars.find(c => c.is_primary)?.id || calendars[0]?.id;
      if (defaultCalendarId) {
        form.setValue('calendar_id', defaultCalendarId);
      }
    }
  }, [calendars, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      title: values.title,
      description: values.description,
      start_date: values.start_date,
      start_time: values.start_time,
      end_date: values.end_date,
      end_time: values.end_time,
      all_day: values.all_day,
      timezone: values.timezone,
      location: values.location,
      conference_url: values.conference_url,
      category: values.category,
      priority: values.priority,
      privacy: values.privacy,
      status: values.status,
      calendar_id: values.calendar_id,
      color: values.color,
    });
  };

  const handleCreateCalendar = (data: Omit<Calendar, 'id' | 'phone' | 'created_at' | 'updated_at'>) => {
    createCalendar(data);
    setCalendarFormOpen(false);
  };

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
  };

  const statusLabels = {
    confirmed: 'Confirmado',
    tentative: 'Provisório',
    cancelled: 'Cancelado',
  };

  const privacyLabels = {
    default: 'Padrão',
    public: 'Público',
    private: 'Privado',
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{eventToEdit ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
            <DialogDescription>
              {eventToEdit ? 'Modifique os dados do evento.' : 'Adicione um novo evento à sua agenda.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="advanced">Avançado</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Reunião com cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Detalhes do evento..." rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4 items-start">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início</FormLabel>
                          <Popover open={isStartDatePickerOpen} onOpenChange={setIsStartDatePickerOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full h-10 pl-3 pr-9 text-left font-normal justify-start relative',
                                    !field.value && 'text-text-muted'
                                  )}
                                >
                                  <span className="truncate">
                                    {field.value ? (
                                      format(field.value, 'PPP', { locale: ptBR })
                                    ) : (
                                      'Selecione'
                                    )}
                                  </span>
                                  <CalendarIcon className="absolute right-3 h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarPicker
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  setIsStartDatePickerOpen(false);
                                }}
                                initialFocus
                                className="calendar-responsive"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Início</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                              <Input
                                type="text"
                                className="pl-9 h-10"
                                {...field}
                                onBlur={(e) => {
                                  field.onChange(formatTimeToHHMM(e.target.value));
                                  field.onBlur();
                                }}
                                disabled={form.watch('all_day')}
                                placeholder="HH:MM"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-start">
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Término</FormLabel>
                          <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full h-10 pl-3 pr-9 text-left font-normal justify-start relative',
                                    !field.value && 'text-text-muted'
                                  )}
                                >
                                  <span className="truncate">
                                    {field.value ? (
                                      format(field.value, 'PPP', { locale: ptBR })
                                    ) : (
                                      'Selecione'
                                    )}
                                  </span>
                                  <CalendarIcon className="absolute right-3 h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarPicker
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date);
                                  setIsEndDatePickerOpen(false);
                                }}
                                initialFocus
                                className="calendar-responsive"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de Término</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                              <Input
                                type="text"
                                className="pl-9 h-10"
                                {...field}
                                onBlur={(e) => {
                                  field.onChange(formatTimeToHHMM(e.target.value));
                                  field.onBlur();
                                }}
                                disabled={form.watch('all_day')}
                                placeholder="HH:MM"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="all_day"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Dia inteiro</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                            <Input placeholder="Ex: Sala de reuniões" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conference_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link de Videoconferência</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Video className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                            <Input
                              type="url"
                              placeholder="https://meet.google.com/..."
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="calendar_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agenda</FormLabel>
                        <div className="flex items-center gap-2">
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma agenda" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {calendars.map((cal) => (
                                <SelectItem key={cal.id} value={cal.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-3 w-3 rounded-full"
                                      style={{ backgroundColor: cal.color }}
                                    />
                                    {cal.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button type="button" variant="outline" size="icon" onClick={() => setCalendarFormOpen(true)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <FormControl>
                            <SegmentedControl
                              value={field.value}
                              onValueChange={field.onChange}
                              options={[
                                { value: "low", label: priorityLabels.low },
                                { value: "medium", label: priorityLabels.medium },
                                { value: "high", label: priorityLabels.high },
                              ]}
                              size="sm"
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <FormControl>
                            <SegmentedControl
                              value={field.value}
                              onValueChange={field.onChange}
                              options={[
                                { value: "confirmed", label: statusLabels.confirmed },
                                { value: "tentative", label: statusLabels.tentative },
                                { value: "cancelled", label: statusLabels.cancelled },
                              ]}
                              size="sm"
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="privacy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Privacidade</FormLabel>
                          <FormControl>
                            <SegmentedControl
                              value={field.value}
                              onValueChange={field.onChange}
                              options={[
                                { value: "default", label: privacyLabels.default },
                                { value: "public", label: privacyLabels.public },
                                { value: "private", label: privacyLabels.private },
                              ]}
                              size="sm"
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuso Horário</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" className="min-w-[140px] justify-center" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'min-w-[140px] justify-center bg-gradient-to-r from-[hsl(var(--brand-900))] via-[hsl(var(--brand-700))] to-[hsl(var(--brand-600))] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 border border-white/10',
                    'focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--brand-400))]',
                    'disabled:opacity-70 disabled:saturate-75 disabled:hover:scale-100 disabled:hover:shadow-lg disabled:cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <CalendarForm
        open={calendarFormOpen}
        onOpenChange={setCalendarFormOpen}
        onSubmit={handleCreateCalendar}
      />
    </>
  );
}