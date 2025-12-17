import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText,
  TrendingUp,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  MessageCircle,
  CheckCircle,
  Plus,
  Edit3,
  DollarSign,
  Sliders,
  UserPlus,
  XCircle,
  Activity as ActivityIcon,
  Clock
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

// ============================================================================
// TYPES
// ============================================================================

type CrmActivity = Tables<'crm_activities'>;

interface ActivityTimelineProps {
  activities: CrmActivity[];
  isLoading?: boolean;
  className?: string;
}

// ============================================================================
// ICONS CONFIGURATION
// ============================================================================

const activityIcons: Record<CrmActivity['activity_type'], typeof FileText> = {
  lead_created: UserPlus,
  status_change: TrendingUp,
  note_added: Plus,
  note_updated: Edit3,
  value_updated: DollarSign,
  call: Phone,
  email: Mail,
  meeting: CalendarIcon,
  whatsapp_sent: MessageCircle,
  task_created: Plus,
  task_completed: CheckCircle,
  custom_field_updated: Sliders,
  loss_reason_set: XCircle,
};

// ============================================================================
// COLORS CONFIGURATION
// ============================================================================

const activityColors: Record<CrmActivity['activity_type'], string> = {
  lead_created: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  status_change: 'text-purple-600 dark:text-purple-400 bg-purple-500/10',
  note_added: 'text-green-600 dark:text-green-400 bg-green-500/10',
  note_updated: 'text-green-600 dark:text-green-400 bg-green-500/10',
  value_updated: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
  call: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
  email: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
  meeting: 'text-orange-600 dark:text-orange-400 bg-orange-500/10',
  whatsapp_sent: 'text-green-600 dark:text-green-400 bg-green-500/10',
  task_created: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
  task_completed: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
  custom_field_updated: 'text-violet-600 dark:text-violet-400 bg-violet-500/10',
  loss_reason_set: 'text-red-600 dark:text-red-400 bg-red-500/10',
};

// ============================================================================
// LABELS CONFIGURATION
// ============================================================================

const activityLabels: Record<CrmActivity['activity_type'], string> = {
  lead_created: 'Lead Criado',
  status_change: 'Status Alterado',
  note_added: 'Nota Adicionada',
  note_updated: 'Nota Atualizada',
  value_updated: 'Valor Atualizado',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  whatsapp_sent: 'WhatsApp',
  task_created: 'Tarefa Criada',
  task_completed: 'Tarefa Completada',
  custom_field_updated: 'Campo Atualizado',
  loss_reason_set: 'Motivo de Perda',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ActivityTimeline({ activities, isLoading, className }: ActivityTimelineProps) {
  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, CrmActivity[]> = {};
    
    activities.forEach((activity) => {
      const date = format(new Date(activity.created_at || new Date()), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, items]) => ({
        date: new Date(date),
        activities: items.sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        ),
      }));
  }, [activities]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2 pl-6 border-l-2 border-muted">
              <div className="flex gap-3 items-start">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (activities.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <div className="rounded-full bg-muted p-4 mb-4">
          <ActivityIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Nenhuma atividade registrada</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          As atividades e interações com este lead aparecerão aqui automaticamente
        </p>
      </div>
    );
  }

  // Timeline render
  return (
    <div className={cn('space-y-6', className)}>
      <AnimatePresence>
        {groupedActivities.map(({ date, activities: dayActivities }) => (
          <motion.div
            key={date.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Date Header */}
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>

            {/* Activities List */}
            <div className="space-y-4 pl-6 border-l-2 border-muted relative">
              {dayActivities.map((activity, index) => {
                const Icon = activityIcons[activity.activity_type];
                const colorClass = activityColors[activity.activity_type];
                const label = activityLabels[activity.activity_type];

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute -left-[29px] top-1 rounded-full p-1.5 border-2 border-background shadow-sm',
                        colorClass
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    {/* Activity Card */}
                    <div className="bg-card border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <h4 className="text-sm font-medium">{activity.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.created_at || new Date()), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>

                      {/* Description */}
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {activity.description}
                        </p>
                      )}

                      {/* Old/New Values (for changes) */}
                      {(activity.old_value || activity.new_value) && (
                        <div className="flex items-center gap-2 text-xs bg-muted/50 rounded p-2">
                          {activity.old_value && (
                            <span className="text-muted-foreground line-through">
                              {activity.old_value}
                            </span>
                          )}
                          {activity.old_value && activity.new_value && (
                            <span className="text-muted-foreground">→</span>
                          )}
                          {activity.new_value && (
                            <span className="font-medium">
                              {activity.new_value}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metadata (if exists) */}
                      {activity.metadata && Object.keys(activity.metadata as object).length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {JSON.stringify(activity.metadata).length < 100 && (
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(activity.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
