import { Task } from '@/hooks/useTasksData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

interface TaskStatsProps {
  tasks: Task[];
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const overdue = tasks.filter((t) => t.status === 'overdue').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, overdue, completionRate };
  }, [tasks]);

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-primary/12 via-transparent to-sky-500/10 opacity-90" />
        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 px-3 py-3">
          <div>
            <CardTitle className="text-[11px] sm:text-xs font-medium text-text-muted tracking-wide uppercase">
              Total de Tarefas
            </CardTitle>
            <p className="text-[10px] text-text-muted mt-0.5">Todas as tarefas cadastradas</p>
          </div>
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10 px-3 pb-3">
          <div className="text-lg sm:text-2xl font-semibold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-emerald-500/15 via-transparent to-emerald-500/5 opacity-90" />
        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 px-3 py-3">
          <div>
            <CardTitle className="text-[11px] sm:text-xs font-medium text-text-muted tracking-wide uppercase">
              Concluídas
            </CardTitle>
            <p className="text-[10px] text-emerald-300/90 mt-0.5">
              {stats.completionRate}% de conclusão
            </p>
          </div>
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10 px-3 pb-3">
          <div className="text-lg sm:text-2xl font-semibold text-emerald-400">
            {stats.completed}
          </div>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-amber-400/15 via-transparent to-amber-400/5 opacity-90" />
        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 px-3 py-3">
          <div>
            <CardTitle className="text-[11px] sm:text-xs font-medium text-text-muted tracking-wide uppercase">
              Pendentes
            </CardTitle>
            <p className="text-[10px] text-text-muted mt-0.5">
              Aguardando conclusão
            </p>
          </div>
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-amber-400/15 border border-amber-400/40 flex items-center justify-center">
            <Clock className="h-3.5 w-3.5 text-amber-300" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10 px-3 pb-3">
          <div className="text-lg sm:text-2xl font-semibold text-amber-300">
            {stats.pending}
          </div>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-red-500/15 via-transparent to-red-500/5 opacity-90" />
        <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 px-3 py-3">
          <div>
            <CardTitle className="text-[11px] sm:text-xs font-medium text-text-muted tracking-wide uppercase">
              Vencidas
            </CardTitle>
            <p className="text-[10px] text-red-300/90 mt-0.5">
              Tarefas atrasadas
            </p>
          </div>
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center">
            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
          </div>
        </CardHeader>
        <CardContent className="relative z-10 px-3 pb-3">
          <div className="text-lg sm:text-2xl font-semibold text-red-400">
            {stats.overdue}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}