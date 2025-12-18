import { useState } from 'react';
import { useTasksData, Task, TaskFormData } from '@/hooks/useTasksData';
import { useSearch } from '@/contexts/SearchContext';
import { TaskForm } from '@/components/TaskForm';
import { TaskItem } from '@/components/TaskItem';
import { TaskFilters } from '@/components/TaskFilters';
import { TaskStats } from '@/components/TaskStats';
import { DeleteTaskDialog } from '@/components/DeleteTaskDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ListTodo } from 'lucide-react';

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done' | 'overdue'>('all');
  const { searchQuery, setSearchQuery } = useSearch();
  const [formOpen, setFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    tasks,
    isLoading,
    createTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    duplicateTask,
    getTaskCounts,
  } = useTasksData(statusFilter, searchQuery);

  const counts = getTaskCounts();

  const handleFormSubmit = (data: Partial<Task>) => {
    if (taskToEdit) {
      updateTask.mutate(
        { id: taskToEdit.id, updates: data },
        {
          onSuccess: () => {
            setFormOpen(false);
            setTaskToEdit(null);
          },
        }
      );
    } else {
      createTask.mutate(data as unknown as TaskFormData, {
        onSuccess: () => {
          setFormOpen(false);
        },
      });
    }
  };

  const handleEdit = (task: Task) => {
    setTaskToEdit(task);
    setFormOpen(true);
  };

  const handleDelete = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTask.mutate(taskToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setTaskToDelete(null);
        },
      });
    }
  };

  const handleDuplicate = (task: Task) => {
    duplicateTask.mutate(task);
  };

  const handleMarkIncomplete = (task: Task) => {
    toggleTaskCompletion.mutate(task);
  };

  const handleNewTask = () => {
    setTaskToEdit(null);
    setFormOpen(true);
  };

  return (
    <div className="py-4 sm:py-6 lg:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="animate-fade-in">
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">
            Tarefas
          </h1>
          <p className="text-text-muted mt-2">Gerencie suas tarefas e acompanhe seu progresso</p>
        </div>

        {/* Desktop New Task Button */}
        <div className="hidden md:block animate-fade-in" style={{ animationDelay: '100ms' }}>
          <button
            onClick={handleNewTask}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            <span className="relative z-10 flex items-center">
              <Plus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 group-hover:rotate-90" />
              Nova Tarefa
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </div>
      </div>

      {/* Botão Nova Tarefa - Mobile/Tablet */}
      <div className="md:hidden animate-fade-in" style={{ animationDelay: '150ms' }}>
        <button
          onClick={handleNewTask}
          className="group relative overflow-hidden rounded-lg px-4 py-2.5 transition-all duration-200 bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2 w-full"
        >
          <Plus className="h-4 w-4 text-white transition-transform group-hover:scale-110 group-hover:rotate-90" />
          <span className="text-sm font-semibold text-white">Nova Tarefa</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>
      </div>

      {/* Stats */}
      <TaskStats tasks={tasks} />

      {/* Filters */}
      <TaskFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        counts={counts}
      />

      {/* Tasks List */}
      <Card className="relative rounded-2xl border-0 bg-gradient-to-br from-surface via-surface/95 to-background p-2 sm:p-4 shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1.25rem] bg-gradient-to-br from-primary/12 via-transparent to-sky-500/10 opacity-90" />
        <CardHeader className="relative z-10 pb-3 border-b border-border/40">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 border border-primary/40">
                  <ListTodo className="h-4 w-4 text-primary" />
                </span>
                {statusFilter === 'all' && 'Todas as Tarefas'}
                {statusFilter === 'pending' && 'Tarefas Pendentes'}
                {statusFilter === 'done' && 'Tarefas Concluídas'}
                {statusFilter === 'overdue' && 'Tarefas Vencidas'}
              </CardTitle>
              <p className="mt-1 text-xs sm:text-[13px] text-text-muted">
                Visualize, priorize e atualize suas tarefas em um só lugar.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 pt-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}>
                  <TaskItem
                    task={task}
                    onToggleComplete={() => toggleTaskCompletion.mutate(task)}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onMarkIncomplete={handleMarkIncomplete}
                    onChangePriority={(t, priority) =>
                      updateTask.mutate({ id: t.id, updates: { priority } })
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ListTodo className="h-12 w-12 mx-auto text-text-muted mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa encontrada'}
              </h3>
              <p className="text-sm text-text-muted mb-6">
                {searchQuery ? (
                  <>
                    Não encontramos tarefas para "<span className="font-medium text-text">{searchQuery}</span>"
                    <br />
                    Tente ajustar sua busca ou filtros
                  </>
                ) : (
                  'Comece criando sua primeira tarefa!'
                )}
              </p>
              {searchQuery ? (
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => setSearchQuery('')}
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  >
                    <span className="relative z-10 flex items-center">
                      Limpar Busca
                    </span>
                  </button>
                  <button
                    onClick={handleNewTask}
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  >
                    <span className="relative z-10 flex items-center">
                      <Plus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                      Nova Tarefa
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleNewTask}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <span className="relative z-10 flex items-center">
                    <Plus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                    Criar Primeira Tarefa
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TaskForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setTaskToEdit(null);
        }}
        onSubmit={handleFormSubmit as (data: unknown) => void}
        taskToEdit={taskToEdit}
        isSubmitting={createTask.isPending || updateTask.isPending}
      />

      <DeleteTaskDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        task={taskToDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}