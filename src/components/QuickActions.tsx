import { useState, useMemo } from 'react';
import { Plus, Receipt, Target, CheckSquare, CalendarPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FinanceRecordForm } from '@/components/FinanceRecordForm';
import { GoalForm } from '@/components/GoalForm';
import { TaskForm } from '@/components/TaskForm';
import { EventForm } from '@/components/EventForm';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useOptimizedAgendaData, EventFormData } from '@/hooks/useOptimizedAgendaData';
import { useTasksData, TaskFormData } from '@/hooks/useTasksData';
import { useGoalsData } from '@/hooks/useGoalsData';
import { useFinancialData } from '@/hooks/useFinancialData';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { startOfMonth, endOfMonth } from 'date-fns';

export function QuickActions() {
  const { cliente } = useAuth();
  const { effectiveCollapsed } = useSidebar();
  const collapsed = effectiveCollapsed;

  // States for all dialogs
  const [isActionHubOpen, setIsActionHubOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);

  // ✅ CORREÇÃO: Criar datas estáveis para evitar loops infinitos
  // Usar useMemo para garantir que as datas não mudem a cada render
  const agendaDates = useMemo(() => {
    const now = new Date();
    return {
      startDate: startOfMonth(now),
      endDate: endOfMonth(now),
    };
  }, []); // Array vazio = calcula apenas uma vez no mount

  // Hooks for data and mutations
  const { refetch: refetchFinancialData } = useFinancialData();
  const { refetch: refetchGoals } = useGoalsData();
  const { createTask } = useTasksData();
  const { calendars, createEvent, createCalendar } = useOptimizedAgendaData({
    view: 'month',
    startDate: agendaDates.startDate,
    endDate: agendaDates.endDate,
  });

  // Callback handlers
  const handleTransactionSuccess = () => {
    refetchFinancialData();
    setIsTransactionFormOpen(false);
  };

  const handleGoalSuccess = () => {
    refetchGoals();
    setIsGoalFormOpen(false);
  };

  const handleTaskSubmit = (data: TaskFormData) => {
    createTask.mutate(data, {
      onSuccess: () => setIsTaskFormOpen(false),
    });
  };

  const handleEventSubmit = (data: EventFormData) => {
    createEvent.mutate(data, {
      onSuccess: () => setIsEventFormOpen(false),
    });
  };

  const openActionDialog = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setIsActionHubOpen(false);
    setter(true);
  };

  const mainAction = {
    id: 'new-action',
    label: 'Nova Ação',
    icon: Plus,
    onClick: () => setIsActionHubOpen(true),
  };

  const hubActions = [
    {
      label: 'Nova Transação',
      icon: Receipt,
      onClick: () => openActionDialog(setIsTransactionFormOpen),
    },
    {
      label: 'Nova Meta',
      icon: Target,
      onClick: () => openActionDialog(setIsGoalFormOpen),
    },
    {
      label: 'Novo Evento',
      icon: CalendarPlus,
      onClick: () => openActionDialog(setIsEventFormOpen),
    },
    {
      label: 'Nova Tarefa',
      icon: CheckSquare,
      onClick: () => openActionDialog(setIsTaskFormOpen),
    },
  ];

  return (
    <>
      <div className={cn("space-y-2", collapsed ? "px-2" : "px-4")}>
        <div className="grid grid-cols-1 gap-2">
          <button
            key={mainAction.id}
            onClick={(e) => {
              e.stopPropagation();
              mainAction.onClick();
            }}
            className={cn(
              'group relative overflow-hidden flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              'text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))] hover:shadow-md'
            )}
            title={collapsed ? mainAction.label : undefined}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <div className="relative z-10 transition-transform duration-200 group-hover:scale-110">
              <mainAction.icon className="h-5 w-5 flex-shrink-0" />
            </div>
            <motion.span
              initial={false}
              animate={{
                opacity: collapsed ? 0 : 1,
                width: collapsed ? 0 : 'auto',
              }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5 whitespace-pre !p-0 !m-0 inline-block overflow-hidden"
              style={{ whiteSpace: 'nowrap' }}
            >
              {mainAction.label}
            </motion.span>
          </button>
        </div>
      </div>

      {/* Main Action Hub Dialog */}
      <Dialog open={isActionHubOpen} onOpenChange={setIsActionHubOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nova Ação</DialogTitle>
            <DialogDescription>Selecione o tipo de registro que você deseja criar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {hubActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="group relative flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-[hsl(var(--sidebar-text-muted))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-[hsl(var(--sidebar-text))] hover:shadow-md"
              >
                <div className="relative z-10 transition-transform duration-200 group-hover:scale-110">
                  <action.icon className="h-5 w-5 flex-shrink-0" />
                </div>
                <span className="relative z-10 transition-transform duration-200 group-hover:translate-x-0.5">{action.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Form Dialog */}
      {cliente && (
        <FinanceRecordForm 
          userPhone={cliente.phone}
          open={isTransactionFormOpen}
          onOpenChange={setIsTransactionFormOpen}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {/* Goal Form Dialog */}
      <GoalForm
        open={isGoalFormOpen}
        onOpenChange={setIsGoalFormOpen}
        onSuccess={handleGoalSuccess}
      />

      {/* Task Form Dialog */}
      <TaskForm
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        onSubmit={handleTaskSubmit}
        isSubmitting={createTask.isPending}
      />

      {/* Event Form Dialog */}
      <EventForm
        open={isEventFormOpen}
        onOpenChange={setIsEventFormOpen}
        onSubmit={handleEventSubmit}
        calendars={calendars}
        createCalendar={createCalendar.mutate}
        isSubmitting={createEvent.isPending}
      />
    </>
  );
}