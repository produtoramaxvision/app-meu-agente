import { useMemo } from 'react';
import { startOfYear, endOfYear, eachDayOfInterval, getMonth, format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Event } from '@/hooks/useOptimizedAgendaData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  yearDate: Date;
  events: Event[];
  isLoading?: boolean;
}

export default function AgendaYearHeatmap({ yearDate, events }: Props) {
  const yearStart = startOfYear(yearDate);
  const yearEnd = endOfYear(yearDate);

  const days = useMemo(() => eachDayOfInterval({ start: yearStart, end: yearEnd }), [yearStart, yearEnd]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of days) {
      map.set(d.toISOString().slice(0,10), 0);
    }
    for (const e of events) {
      const key = new Date(e.start_ts).toISOString().slice(0,10);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [days, events]);

  const colorFor = (n: number) => {
    if (n === 0) return 'bg-muted';
    if (n <= 2) return 'bg-green-200 dark:bg-green-900';
    if (n <= 5) return 'bg-green-400 dark:bg-green-700';
    return 'bg-green-600 dark:bg-green-600/60';
  };

  return (
    <Card className="p-5 md:p-6 lg:p-7 space-y-6">
      <div className="space-y-1 text-center">
        <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
          {format(yearDate, 'yyyy')} - Visão Anual
        </h3>
        <p className="text-sm md:text-base text-text-muted">
          Heatmap de eventos por dia do ano
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {Array.from({ length: 12 }).map((_, m) => {
          const monthDays = days.filter(d => getMonth(d) === m);
          return (
            <div
              key={m}
              className="border border-border/40 rounded-lg bg-card/40 hover:bg-card/60 transition-all duration-200 p-3 flex flex-col gap-2 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-text-muted">
                {format(new Date(yearDate.getFullYear(), m, 1), 'MMMM')}
              </div>
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                <TooltipProvider>
                  {monthDays.map(d => {
                    const key = d.toISOString().slice(0,10);
                    const n = counts.get(key) || 0;
                    return (
                      <Tooltip key={key}>
                        <TooltipTrigger asChild>
                          <div className={`h-5 w-5 rounded-sm ${colorFor(n)}`} aria-label={`${n} evento(s) em ${format(d, 'dd/MM/yyyy')}`} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">{format(d, 'dd/MM/yyyy')} — {n} evento(s)</div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}