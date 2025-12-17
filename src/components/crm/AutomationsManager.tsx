import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2,
  PlayCircle,
  PauseCircle,
  Clock,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  Bell,
  FileEdit,
  MessageCircle,
} from 'lucide-react';
import { 
  useAutomations, 
  TRIGGER_TYPE_LABELS, 
  ACTION_TYPE_LABELS,
} from '@/hooks/useAutomations';
import { CreateAutomationDialog } from './CreateAutomationDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { 
  CrmAutomation, 
  AutomationTriggerType, 
  AutomationActionType 
} from '@/integrations/supabase/types';

// ============================================================================
// TRIGGER TYPE ICONS & COLORS
// ============================================================================

const triggerTypeConfig: Record<AutomationTriggerType, { icon: React.ElementType; color: string }> = {
  status_change: { 
    icon: RefreshCw, 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
  },
  time_in_status: { 
    icon: Clock, 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' 
  },
  value_threshold: { 
    icon: TrendingUp, 
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
  },
  no_interaction: { 
    icon: MessageSquare, 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
  },
};

// ============================================================================
// ACTION TYPE ICONS & COLORS
// ============================================================================

const actionTypeConfig: Record<AutomationActionType, { icon: React.ElementType; color: string }> = {
  create_task: { 
    icon: CheckCircle2, 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
  },
  send_notification: { 
    icon: Bell, 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
  },
  update_field: { 
    icon: FileEdit, 
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' 
  },
  send_whatsapp: { 
    icon: MessageCircle, 
    color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' 
  },
};

// ============================================================================
// COMPONENT: AutomationsManager
// ============================================================================

export function AutomationsManager() {
  const { 
    automations, 
    isLoading, 
    toggleAutomation,
    deleteAutomation,
    getStats,
  } = useAutomations();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<CrmAutomation | null>(null);
  const [automationToDelete, setAutomationToDelete] = useState<CrmAutomation | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const stats = getStats();

  const handleEdit = (automation: CrmAutomation) => {
    setEditingAutomation(automation);
    setShowCreateDialog(true);
  };

  const handleDelete = async () => {
    if (!automationToDelete) return;
    
    try {
      await deleteAutomation.mutateAsync(automationToDelete.id);
      toast.success('Automação removida com sucesso');
    } catch {
      toast.error('Erro ao remover automação');
    }
    setAutomationToDelete(null);
  };

  const handleToggle = async (automation: CrmAutomation) => {
    setTogglingId(automation.id);
    try {
      await toggleAutomation(automation.id, !automation.is_active);
      toast.success(
        automation.is_active 
          ? 'Automação desativada' 
          : 'Automação ativada'
      );
    } catch {
      toast.error('Erro ao alterar status da automação');
    } finally {
      setTogglingId(null);
    }
  };

  const formatLastTriggered = (date: string | null) => {
    if (!date) return 'Nunca';
    
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} sem. atrás`;
    return d.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Automações
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                Configure regras automáticas para seu pipeline
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                setEditingAutomation(null);
                setShowCreateDialog(true);
              }}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </div>

          {/* Stats */}
          {automations.length > 0 && (
            <div className="flex gap-4 mt-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">{stats.active} ativas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                <span className="text-muted-foreground">{stats.inactive} inativas</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                <span>{stats.totalTriggered} execuções</span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {automations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Nenhuma automação configurada</p>
              <p className="text-xs mt-1">Crie regras para automatizar seu CRM</p>
            </div>
          ) : (
            <div className="space-y-2">
              {automations.map((automation) => {
                const trigger = triggerTypeConfig[automation.trigger_type as AutomationTriggerType];
                const action = actionTypeConfig[automation.action_type as AutomationActionType];
                const TriggerIcon = trigger?.icon || Zap;
                const ActionIcon = action?.icon || Zap;
                const isToggling = togglingId === automation.id;
                
                return (
                  <div 
                    key={automation.id} 
                    className={cn(
                      "flex flex-col gap-3 p-3 sm:p-4 border rounded-lg",
                      "hover:bg-muted/30 transition-colors",
                      !automation.is_active && "opacity-60"
                    )}
                  >
                    {/* Header Row */}
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Status Indicator */}
                        <button
                          onClick={() => handleToggle(automation)}
                          disabled={isToggling}
                          className="flex-shrink-0"
                        >
                          {isToggling ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : automation.is_active ? (
                            <PlayCircle className="h-5 w-5 text-green-500 hover:text-green-600" />
                          ) : (
                            <PauseCircle className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                          )}
                        </button>

                        {/* Name & Description */}
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">
                            {automation.name}
                          </p>
                          {automation.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {automation.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions - Desktop */}
                      <div className="hidden sm:flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(automation)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setAutomationToDelete(automation)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Trigger Badge */}
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs font-medium border-0 gap-1", trigger?.color)}
                      >
                        <TriggerIcon className="h-3 w-3" />
                        {TRIGGER_TYPE_LABELS[automation.trigger_type as AutomationTriggerType]}
                      </Badge>

                      <span className="text-muted-foreground text-xs">→</span>

                      {/* Action Badge */}
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs font-medium border-0 gap-1", action?.color)}
                      >
                        <ActionIcon className="h-3 w-3" />
                        {ACTION_TYPE_LABELS[automation.action_type as AutomationActionType]}
                      </Badge>

                      {/* Stats */}
                      <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground">
                        <span title="Execuções">
                          <Zap className="h-3 w-3 inline mr-1" />
                          {automation.trigger_count}
                        </span>
                        <span title="Última execução">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatLastTriggered(automation.last_triggered_at)}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex sm:hidden items-center justify-between pt-2 border-t">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <Switch 
                          checked={automation.is_active}
                          onCheckedChange={() => handleToggle(automation)}
                          disabled={isToggling}
                          className="scale-90"
                        />
                        <span className="text-muted-foreground">
                          {automation.is_active ? 'Ativa' : 'Inativa'}
                        </span>
                      </label>

                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(automation)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setAutomationToDelete(automation)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <CreateAutomationDialog 
        open={showCreateDialog} 
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setEditingAutomation(null);
        }}
        editingAutomation={editingAutomation}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!automationToDelete} 
        onOpenChange={(open) => !open && setAutomationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover automação?</AlertDialogTitle>
            <AlertDialogDescription>
              A automação <strong>{automationToDelete?.name}</strong> será removida permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
