import { useState } from 'react';
import { Task } from '@/hooks/useTasksData';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuTrigger 
} from '@/components/ui/context-menu';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Edit, Trash2, Copy, Calendar, Flag, Tag, Undo2, Flame, Star, Circle, CheckCircle, AlertCircle } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TaskForm } from '@/components/TaskForm';

 interface TaskItemProps {
   task: Task;
   onToggleComplete: (task: Task) => void;
   onEdit: (task: Task) => void;
   onDelete: (task: Task) => void;
   onDuplicate: (task: Task) => void;
   onMarkIncomplete?: (task: Task) => void;
   onChangePriority?: (task: Task, priority: Task['priority']) => void;
 }

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  medium: { label: 'Média', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' },
  high: { label: 'Alta', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
};

const statusConfig = {
  pending: {
    label: 'Pendente',
    // Maior contraste para melhor legibilidade em ambos temas
    color: 'bg-blue-500/15 text-blue-500 dark:text-blue-300 border-blue-500/40',
  },
  done: { label: 'Concluída', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
  overdue: { label: 'Vencida', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
};

// Config visual inspirado na view Timeline da Agenda
const timelinePriorityConfig = {
  high: {
    color: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
    glow: 'shadow-red-500/20',
    Icon: Flame,
    iconColor: 'text-red-500 dark:text-red-300',
  },
  medium: {
    color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300',
    glow: 'shadow-yellow-500/20',
    Icon: Star,
    iconColor: 'text-yellow-500 dark:text-yellow-300',
  },
  low: {
    color: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
    glow: 'shadow-blue-500/20',
    // Troca o ícone de círculo para bandeira para não confundir com o checkbox
    Icon: Flag,
    iconColor: 'text-blue-500 dark:text-blue-300',
  },
} as const;

 export function TaskItem({ task, onToggleComplete, onEdit, onDelete, onDuplicate, onMarkIncomplete, onChangePriority }: TaskItemProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getDueDateInfo = () => {
    if (!task.due_date) return null;

    const dueDate = new Date(task.due_date);
    const isOverdue = isPast(dueDate) && !isToday(dueDate) && task.status !== 'done';

    if (isToday(dueDate)) {
      return { text: 'Vence hoje', color: 'text-yellow-600 dark:text-yellow-500 font-semibold' };
    }
    if (isTomorrow(dueDate)) {
      return { text: 'Vence amanhã', color: 'text-yellow-600 dark:text-yellow-500' };
    }
    if (isOverdue) {
      return { text: 'Vencida', color: 'text-red-600 dark:text-red-500 font-semibold' };
    }

    return {
      text: format(dueDate, 'dd/MM/yyyy', { locale: ptBR }),
      color: 'text-text-muted',
    };
  };

  const dueDateInfo = getDueDateInfo();
  const isDone = task.status === 'done';
  const priorityVisual = timelinePriorityConfig[task.priority];

  // Handlers para diferentes tipos de clique
  const handleSingleClick = (e: React.MouseEvent) => {
    // Clique simples não faz nada - apenas previne propagação se necessário
    e.preventDefault();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setPopoverOpen(true);
  };


  const handleFormSubmit = (data: Partial<Task>) => {
    onEdit({ ...task, ...data });
    setPopoverOpen(false);
    setIsEditing(false);
  };

  const handlePopoverClose = () => {
    setPopoverOpen(false);
    setIsEditing(false);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            className={cn(
              'group relative rounded-lg border p-3 sm:p-4 cursor-pointer transition-all duration-300',
              'hover:shadow-md backdrop-blur-sm',
              priorityVisual.color,
              priorityVisual.glow,
              'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isDone && 'opacity-60'
            )}
            onClick={handleSingleClick}
            onDoubleClick={handleDoubleClick}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-2 sm:gap-3 relative z-10">
              <Checkbox
                checked={isDone}
                onCheckedChange={() => onToggleComplete(task)}
                className="mt-1 transition-all duration-200 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              />

               <div className="flex-1 space-y-2 min-w-0">
                 <div className="flex items-start justify-between gap-2">
                   <motion.h3
                     className={cn(
                       'font-semibold text-sm sm:text-base leading-snug truncate group-hover:text-primary transition-colors',
                       isDone && 'line-through text-text-muted group-hover:text-text-muted'
                     )}
                     initial={{ opacity: 0, x: -8 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.2 }}
                   >
                     {task.title}
                   </motion.h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <priorityVisual.Icon
                      className={cn(
                        'h-3 w-3 sm:h-3.5 sm:w-3.5',
                        priorityVisual.iconColor
                      )}
                    />
                    <Badge
                      variant="outline"
                      className={cn('flex-shrink-0 text-xs', priorityConfig[task.priority].color)}
                    >
                    <Flag className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{priorityConfig[task.priority].label}</span>
                    <span className="sm:hidden">{priorityConfig[task.priority].label.charAt(0)}</span>
                  </Badge>
                  </div>
                </div>

                {task.description && (
                  <p className={cn('text-sm text-text-muted line-clamp-2', isDone && 'line-through')}>
                    {task.description}
                  </p>
                )}

                 <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs">
                   {dueDateInfo && (
                     <motion.div
                       className={cn('flex items-center gap-1', dueDateInfo.color)}
                       initial={{ opacity: 0, x: -6 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ duration: 0.2, delay: 0.05 }}
                     >
                       <motion.div
                         animate={{ rotate: [0, 4, 0] }}
                         transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                       >
                         <Calendar className="h-3 w-3 flex-shrink-0" />
                       </motion.div>
                       <span className="truncate">{dueDateInfo.text}</span>
                     </motion.div>
                   )}

                   {task.category && (
                     <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.15 }}>
                       <Badge variant="outline" className="text-xs flex-shrink-0">
                         <Tag className="h-3 w-3 mr-1" />
                         <span className="hidden sm:inline">{task.category}</span>
                         <span className="sm:hidden truncate max-w-[60px]">{task.category}</span>
                       </Badge>
                     </motion.div>
                   )}

                   <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.15 }}>
                     <Badge variant="outline" className={cn('text-xs flex-shrink-0', statusConfig[task.status].color)}>
                       <span className="hidden sm:inline">{statusConfig[task.status].label}</span>
                       <span className="sm:hidden">{statusConfig[task.status].label.charAt(0)}</span>
                     </Badge>
                   </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => onEdit(task)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDuplicate(task)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar
          </ContextMenuItem>
          {!isDone && (
            <ContextMenuItem onClick={() => onToggleComplete(task)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Marcar como concluída
            </ContextMenuItem>
          )}
          {isDone && onMarkIncomplete && (
            <ContextMenuItem onClick={() => onMarkIncomplete(task)}>
              <Undo2 className="mr-2 h-4 w-4" />
              Desmarcar Concluída
            </ContextMenuItem>
          )}
          <ContextMenuItem 
            onClick={() => onDelete(task)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

       <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
         <PopoverContent className="w-96 p-4 space-y-4" align="start">
           {/* Atalho rápido para alterar prioridade diretamente no popover */}
           <div className="flex items-center justify-between gap-2">
             <span className="text-xs text-text-muted">Prioridade rápida</span>
             <div className="flex gap-1">
               {(['low', 'medium', 'high'] as const).map((p) => (
                 <button
                   key={p}
                   type="button"
                   className={cn(
                     'px-2 py-1 rounded-full text-[11px] border transition-colors',
                     task.priority === p
                       ? 'bg-primary text-primary-foreground border-primary'
                       : 'bg-background text-text-muted hover:bg-surface'
                   )}
                   onClick={() => onChangePriority?.(task, p)}
                 >
                   {priorityConfig[p].label}
                 </button>
               ))}
             </div>
           </div>

           {/* Formulário completo de edição (inclui prioridade também) */}
           <div className="border-t border-border/40 pt-3 -mx-4 px-0">
             <TaskForm
               open={isEditing}
               onOpenChange={handlePopoverClose}
               onSubmit={handleFormSubmit}
               taskToEdit={task}
               isSubmitting={false}
             />
           </div>
         </PopoverContent>
       </Popover>
    </>
  );
}