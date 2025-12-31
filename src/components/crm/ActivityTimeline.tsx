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
    <div className={cn('space-y-8', className)}>
      <AnimatePresence>
        {groupedActivities.map(({ date, activities: dayActivities }) => (
          <motion.div
            key={date.toISOString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Date Header */}
            <div className="flex items-center gap-2.5 px-1">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted/50">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </span>
            </div>

            {/* Activities List */}
            <div className="space-y-3 pl-1">
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
                    className="grid grid-cols-[28px_1fr] items-start gap-x-3"
                  >
                    {/* Timeline column (line + dot) */}
                    <div className="relative flex justify-center">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-border/50" />
                      <div
                        className={cn(
                          'relative z-10 mt-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background shadow-md',
                          colorClass
                        )}
                      >
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                    </div>

                    {/* Activity Card */}
                    <div className="min-w-0 bg-card/50 backdrop-blur-sm border rounded-xl p-3.5 hover:shadow-md hover:bg-card transition-all duration-200 group">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {activity.title}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">
                              {label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.created_at || new Date()), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {activity.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed mb-2.5">
                          {activity.description}
                        </p>
                      )}

                      {/* Old/New Values (for changes) */}
                      {(activity.old_value || activity.new_value) && (
                        <div className="flex items-center gap-2.5 text-sm bg-muted/30 rounded-lg px-3 py-2 border border-border/50">
                          {activity.old_value && (
                            <span className="text-muted-foreground/80 line-through font-medium">
                              {activity.old_value}
                            </span>
                          )}
                          {activity.old_value && activity.new_value && (
                            <span className="text-muted-foreground">→</span>
                          )}
                          {activity.new_value && (
                            <span className="font-semibold text-foreground">
                              {activity.new_value}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metadata (if exists) - Collapsible */}
                      {activity.metadata && Object.keys(activity.metadata as object).length > 0 && (
                        <details className="mt-2.5 group/details">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-1.5 select-none">
                            <span className="group-open/details:rotate-90 transition-transform">▶</span>
                            <span>Ver detalhes técnicos</span>
                          </summary>
                          <pre className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 overflow-x-auto border border-border/50 font-mono">
{JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        </details>
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
