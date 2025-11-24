import { useNavigate } from 'react-router-dom';
import { useTasksData, Task } from '@/hooks/useTasksData';
import { differenceInDays, format, isToday, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { TaskItem } from '@/components/TaskItem';

export function UpcomingTasksCard() {
  const navigate = useNavigate();
  const { tasks, isLoading, updateTask, deleteTask, duplicateTask, toggleTaskCompletion } = useTasksData('all');

  const now = new Date();

  const urgentTasks = tasks
    .filter((task) => task.status !== 'done')
    .filter((task) => {
      if (task.status === 'overdue') return true;
      if (task.priority === 'high') return true;
      if (!task.due_date) return false;

      const dueDate = new Date(task.due_date);
      const daysRemaining = differenceInDays(dueDate, now);
      return daysRemaining <= 3;
    })
    .sort((a, b) => {
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      if (a.priority === b.priority) return 0;
      // Priorizar tarefas de alta prioridade sem data
      return a.priority === 'high' ? -1 : 1;
    })
    .slice(0, 10);

  const getDueDateInfo = (dueDate?: string | null) => {
    if (!dueDate) {
      return { text: 'Sem data', color: 'text-text-muted', bgColor: 'bg-muted/40' };
    }

    const date = parseISO(dueDate);
    const daysRemaining = differenceInDays(date, new Date());

    if (daysRemaining < 0) {
      return { text: `Atrasada ${-daysRemaining}d`, color: 'text-red-500', bgColor: 'bg-red-500/10' };
    }
    if (isToday(date)) {
      return { text: 'Hoje', color: 'text-yellow-600', bgColor: 'bg-yellow-500/10' };
    }
    if (daysRemaining === 1) {
      return { text: 'Amanhã', color: 'text-yellow-600', bgColor: 'bg-yellow-500/10' };
    }
    if (daysRemaining <= 3) {
      return { text: `${daysRemaining}d`, color: 'text-orange-500', bgColor: 'bg-orange-500/10' };
    }
    return { text: `${daysRemaining}d`, color: 'text-text-muted', bgColor: 'bg-muted/50' };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-muted text-text-muted border-border';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  // Handlers para ações do menu de contexto
  const handleEdit = (task: Task) => {
    // Navegar para a página de tarefas com foco na edição
    navigate('/tarefas');
    // TODO: Implementar foco na tarefa específica para edição
  };

  const handleDelete = (task: Task) => {
    deleteTask.mutate(task.id);
  };

  const handleDuplicate = (task: Task) => {
    duplicateTask.mutate(task);
  };

  const handleToggleComplete = (task: Task) => {
    toggleTaskCompletion.mutate(task);
  };

  if (isLoading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 leading-normal">
            <Clock className="h-5 w-5" />
            Tarefas Urgentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in hover:shadow-lg transition-all duration-300 border-border/40 h-[515px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between leading-normal">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-700" />
            <span className="bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent">
              Tarefas Urgentes
            </span>
          </div>
          {urgentTasks.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {urgentTasks.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {urgentTasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500/70 mb-3" />
            <p className="text-sm text-text-muted">Nenhuma tarefa urgente!</p>
            <p className="text-xs text-text-muted mt-1">Continue assim 🎉</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 flex-1 custom-scrollbar smooth-scrollbar overflow-y-auto max-h-[360px] px-1 py-2">
              {urgentTasks.map((task, index) => {
                return (
                  <div
                    key={task.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}>
                    <TaskItem
                      task={task}
                      onToggleComplete={() => toggleTaskCompletion.mutate(task)}
                      onEdit={() => navigate('/tarefas')}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onMarkIncomplete={(t) => toggleTaskCompletion.mutate(t)}
                      onChangePriority={(t, priority) =>
                        updateTask.mutate({ id: t.id, updates: { priority } })
                      }
                    />
                  </div>
                );
              })}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-2 group hover:bg-primary/5"
              onClick={() => navigate('/tarefas')}
            >
              <span className="flex items-center gap-2 text-sm">
                Ver todas as tarefas
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}