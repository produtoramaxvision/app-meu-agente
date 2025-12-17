import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Zap, ArrowRight } from 'lucide-react';
import { 
  useAutomations, 
  TRIGGER_TYPE_LABELS, 
  ACTION_TYPE_LABELS,
  TRIGGER_TYPE_DESCRIPTIONS,
  ACTION_TYPE_DESCRIPTIONS,
} from '@/hooks/useAutomations';
import type { 
  CrmAutomation, 
  AutomationTriggerType, 
  AutomationActionType,
  Json,
} from '@/integrations/supabase/types';
import { toast } from 'sonner';

// ============================================================================
// STATUS OPTIONS
// ============================================================================

const LEAD_STATUSES = [
  { value: 'novo', label: 'Novo' },
  { value: 'contatado', label: 'Contatado' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'proposta', label: 'Proposta Enviada' },
  { value: 'negociacao', label: 'Em Negociação' },
  { value: 'ganho', label: 'Ganho' },
  { value: 'perdido', label: 'Perdido' },
];

// ============================================================================
// PROPS
// ============================================================================

interface CreateAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAutomation?: CrmAutomation | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateAutomationDialog({ 
  open, 
  onOpenChange, 
  editingAutomation,
}: CreateAutomationDialogProps) {
  const { createAutomation, updateAutomation } = useAutomations();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<AutomationTriggerType>('status_change');
  const [actionType, setActionType] = useState<AutomationActionType>('create_task');
  
  // Trigger config state
  const [fromStatus, setFromStatus] = useState('');
  const [toStatus, setToStatus] = useState('');
  const [daysInStatus, setDaysInStatus] = useState('7');
  const [statusForTime, setStatusForTime] = useState('novo');
  const [valueField, setValueField] = useState('crm_estimated_value');
  const [valueOperator, setValueOperator] = useState<'gt' | 'lt' | 'eq' | 'gte' | 'lte'>('gt');
  const [thresholdValue, setThresholdValue] = useState('1000');
  const [noInteractionDays, setNoInteractionDays] = useState('14');
  
  // Action config state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDays, setTaskDueDays] = useState('3');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [updateFieldName, setUpdateFieldName] = useState('crm_lead_status');
  const [updateFieldValue, setUpdateFieldValue] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form quando abrir/fechar ou mudar editingAutomation
  useEffect(() => {
    if (open) {
      if (editingAutomation) {
        // Modo edição - preencher com dados existentes
        setName(editingAutomation.name);
        setDescription(editingAutomation.description || '');
        setTriggerType(editingAutomation.trigger_type as AutomationTriggerType);
        setActionType(editingAutomation.action_type as AutomationActionType);
        
        // Parse trigger config
        const triggerConfig = editingAutomation.trigger_config as Record<string, unknown>;
        if (editingAutomation.trigger_type === 'status_change') {
          setFromStatus((triggerConfig.from_status as string) || '');
          setToStatus((triggerConfig.to_status as string) || '');
        } else if (editingAutomation.trigger_type === 'time_in_status') {
          setStatusForTime((triggerConfig.status as string) || 'novo');
          setDaysInStatus(String(triggerConfig.days || '7'));
        } else if (editingAutomation.trigger_type === 'value_threshold') {
          setValueField((triggerConfig.field as string) || 'crm_estimated_value');
          setValueOperator((triggerConfig.operator as 'gt' | 'lt' | 'eq' | 'gte' | 'lte') || 'gt');
          setThresholdValue(String(triggerConfig.value || '1000'));
        } else if (editingAutomation.trigger_type === 'no_interaction') {
          setNoInteractionDays(String(triggerConfig.days || '14'));
        }
        
        // Parse action config
        const actionConfig = editingAutomation.action_config as Record<string, unknown>;
        if (editingAutomation.action_type === 'create_task') {
          setTaskTitle((actionConfig.title as string) || '');
          setTaskDescription((actionConfig.description as string) || '');
          setTaskPriority((actionConfig.priority as 'low' | 'medium' | 'high') || 'medium');
          setTaskDueDays(String(actionConfig.due_days || '3'));
        } else if (editingAutomation.action_type === 'send_notification') {
          setNotificationTitle((actionConfig.title as string) || '');
          setNotificationMessage((actionConfig.message as string) || '');
        } else if (editingAutomation.action_type === 'update_field') {
          setUpdateFieldName((actionConfig.field as string) || 'crm_lead_status');
          setUpdateFieldValue(String(actionConfig.value || ''));
        } else if (editingAutomation.action_type === 'send_whatsapp') {
          setWhatsappMessage((actionConfig.message as string) || '');
        }
      } else {
        // Modo criação - limpar form
        setName('');
        setDescription('');
        setTriggerType('status_change');
        setActionType('create_task');
        setFromStatus('');
        setToStatus('');
        setDaysInStatus('7');
        setStatusForTime('novo');
        setValueField('crm_estimated_value');
        setValueOperator('gt');
        setThresholdValue('1000');
        setNoInteractionDays('14');
        setTaskTitle('');
        setTaskDescription('');
        setTaskPriority('medium');
        setTaskDueDays('3');
        setNotificationTitle('');
        setNotificationMessage('');
        setUpdateFieldName('crm_lead_status');
        setUpdateFieldValue('');
        setWhatsappMessage('');
      }
    }
  }, [open, editingAutomation]);

  // Build trigger config based on trigger type
  const buildTriggerConfig = (): Json => {
    switch (triggerType) {
      case 'status_change':
        return {
          ...(fromStatus && { from_status: fromStatus }),
          to_status: toStatus,
        };
      case 'time_in_status':
        return {
          status: statusForTime,
          days: parseInt(daysInStatus, 10),
        };
      case 'value_threshold':
        return {
          field: valueField,
          operator: valueOperator,
          value: parseFloat(thresholdValue),
        };
      case 'no_interaction':
        return {
          days: parseInt(noInteractionDays, 10),
        };
      default:
        return {};
    }
  };

  // Build action config based on action type
  const buildActionConfig = (): Json => {
    switch (actionType) {
      case 'create_task':
        return {
          title: taskTitle,
          ...(taskDescription && { description: taskDescription }),
          priority: taskPriority,
          due_days: parseInt(taskDueDays, 10),
        };
      case 'send_notification':
        return {
          title: notificationTitle,
          message: notificationMessage,
        };
      case 'update_field':
        return {
          field: updateFieldName,
          value: updateFieldValue,
        };
      case 'send_whatsapp':
        return {
          message: whatsappMessage,
        };
      default:
        return {};
    }
  };

  // Validate form
  const isFormValid = () => {
    if (!name.trim()) return false;
    
    // Validate trigger config
    switch (triggerType) {
      case 'status_change':
        if (!toStatus) return false;
        break;
      case 'time_in_status':
        if (!statusForTime || !daysInStatus) return false;
        break;
      case 'value_threshold':
        if (!valueField || !thresholdValue) return false;
        break;
      case 'no_interaction':
        if (!noInteractionDays) return false;
        break;
    }
    
    // Validate action config
    switch (actionType) {
      case 'create_task':
        if (!taskTitle.trim()) return false;
        break;
      case 'send_notification':
        if (!notificationTitle.trim() || !notificationMessage.trim()) return false;
        break;
      case 'update_field':
        if (!updateFieldName || !updateFieldValue) return false;
        break;
      case 'send_whatsapp':
        if (!whatsappMessage.trim()) return false;
        break;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || null,
        trigger_type: triggerType,
        trigger_config: buildTriggerConfig(),
        action_type: actionType,
        action_config: buildActionConfig(),
      };

      if (editingAutomation) {
        await updateAutomation.mutateAsync({
          id: editingAutomation.id,
          ...data,
        });
        toast.success('Automação atualizada com sucesso');
      } else {
        await createAutomation.mutateAsync(data);
        toast.success('Automação criada com sucesso');
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar automação:', error);
      toast.error('Erro ao salvar automação');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER TRIGGER CONFIG
  // ============================================================================

  const renderTriggerConfig = () => {
    switch (triggerType) {
      case 'status_change':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>De status (opcional)</Label>
              <Select value={fromStatus} onValueChange={setFromStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Qualquer status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Qualquer status</SelectItem>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Para status <span className="text-destructive">*</span></Label>
              <Select value={toStatus} onValueChange={setToStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
        
      case 'time_in_status':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Status <span className="text-destructive">*</span></Label>
              <Select value={statusForTime} onValueChange={setStatusForTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dias no status <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min="1"
                value={daysInStatus}
                onChange={(e) => setDaysInStatus(e.target.value)}
                placeholder="7"
              />
            </div>
          </div>
        );
        
      case 'value_threshold':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Campo</Label>
              <Select value={valueField} onValueChange={setValueField}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crm_estimated_value">Valor estimado</SelectItem>
                  <SelectItem value="crm_lead_score">Score do lead</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Operador</Label>
              <Select value={valueOperator} onValueChange={(v) => setValueOperator(v as typeof valueOperator)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gt">Maior que</SelectItem>
                  <SelectItem value="gte">Maior ou igual a</SelectItem>
                  <SelectItem value="lt">Menor que</SelectItem>
                  <SelectItem value="lte">Menor ou igual a</SelectItem>
                  <SelectItem value="eq">Igual a</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                placeholder="1000"
              />
            </div>
          </div>
        );
        
      case 'no_interaction':
        return (
          <div className="space-y-2">
            <Label>Dias sem interação <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              min="1"
              value={noInteractionDays}
              onChange={(e) => setNoInteractionDays(e.target.value)}
              placeholder="14"
            />
            <p className="text-xs text-muted-foreground">
              Disparará quando não houver atualização no lead por este número de dias
            </p>
          </div>
        );
    }
  };

  // ============================================================================
  // RENDER ACTION CONFIG
  // ============================================================================

  const renderActionConfig = () => {
    switch (actionType) {
      case 'create_task':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Título da tarefa <span className="text-destructive">*</span></Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ex: Follow-up com o lead"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Detalhes da tarefa..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v as typeof taskPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Baixa</SelectItem>
                    <SelectItem value="medium">🟡 Média</SelectItem>
                    <SelectItem value="high">🔴 Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vencer em (dias)</Label>
                <Input
                  type="number"
                  min="1"
                  value={taskDueDays}
                  onChange={(e) => setTaskDueDays(e.target.value)}
                  placeholder="3"
                />
              </div>
            </div>
          </div>
        );
        
      case 'send_notification':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Título <span className="text-destructive">*</span></Label>
              <Input
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Ex: Lead precisa de atenção"
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem <span className="text-destructive">*</span></Label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Ex: O lead está há muito tempo sem interação..."
                rows={3}
              />
            </div>
          </div>
        );
        
      case 'update_field':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Campo a atualizar</Label>
              <Select value={updateFieldName} onValueChange={setUpdateFieldName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crm_lead_status">Status do lead</SelectItem>
                  <SelectItem value="crm_tags">Tags</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Novo valor <span className="text-destructive">*</span></Label>
              {updateFieldName === 'crm_lead_status' ? (
                <Select value={updateFieldValue} onValueChange={setUpdateFieldValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={updateFieldValue}
                  onChange={(e) => setUpdateFieldValue(e.target.value)}
                  placeholder="Digite o valor"
                />
              )}
            </div>
          </div>
        );
        
      case 'send_whatsapp':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Mensagem <span className="text-destructive">*</span></Label>
              <Textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Ex: Olá! Gostaríamos de saber como está seu interesse..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                A mensagem será enviada automaticamente via WhatsApp
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            {editingAutomation ? 'Editar Automação' : 'Nova Automação'}
          </DialogTitle>
          <DialogDescription>
            {editingAutomation 
              ? 'Atualize as configurações da automação'
              : 'Configure uma regra automática para seu pipeline'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome e Descrição */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome da automação <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Follow-up após contato"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que esta automação faz..."
                rows={2}
              />
            </div>
          </div>

          {/* Trigger e Action lado a lado em desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Trigger */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">1</span>
                  Quando (Gatilho)
                </Label>
                <Select value={triggerType} onValueChange={(v) => setTriggerType(v as AutomationTriggerType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(TRIGGER_TYPE_LABELS) as [AutomationTriggerType, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {TRIGGER_TYPE_DESCRIPTIONS[triggerType]}
                </p>
              </div>

              {/* Trigger Config */}
              <div className="pt-2 border-t">
                {renderTriggerConfig()}
              </div>
            </div>

            {/* Arrow - Desktop only */}
            <div className="hidden sm:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Action */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-semibold">
                  <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-sm">2</span>
                  Então (Ação)
                </Label>
                <Select value={actionType} onValueChange={(v) => setActionType(v as AutomationActionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ACTION_TYPE_LABELS) as [AutomationActionType, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ACTION_TYPE_DESCRIPTIONS[actionType]}
                </p>
              </div>

              {/* Action Config */}
              <div className="pt-2 border-t">
                {renderActionConfig()}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !isFormValid()}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                editingAutomation ? 'Atualizar' : 'Criar Automação'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
