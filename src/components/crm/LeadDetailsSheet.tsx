import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { EvolutionContact } from '@/types/sdr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Phone, Calendar, CheckSquare, Plus, Mail, Loader2 } from 'lucide-react';
import { useTasksData, TaskFormData, Task } from '@/hooks/useTasksData';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSDRAgent } from '@/hooks/useSDRAgent';
import { toast } from 'sonner';
import { useCustomFieldDefinitions, useCustomFieldValues } from '@/hooks/useCustomFields';
import { CustomFieldRenderer } from './CustomFieldRenderer';
import { useActivityLog } from '@/hooks/useActivityLog';
import { ActivityTimeline } from './ActivityTimeline';
import { LeadScoreBadge } from './LeadScoreBadge';
import { cn } from '@/lib/utils';
import { getScoreImprovementTips, DEFAULT_WIN_PROBABILITY } from '@/utils/leadScoring';
import { LeadStatus } from '@/types/sdr';
import { supabase } from '@/integrations/supabase/client';
import { SendWhatsAppDialog } from './SendWhatsAppDialog';
import { TagsEditorRelational } from './TagsEditorRelational';
import { useLeadTagsReadOnly } from '@/hooks/useCrmTags';

interface LeadDetailsSheetProps {
  contact: EvolutionContact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateContact?: (contactId: string, updates: Partial<EvolutionContact>, options?: { recordInteraction?: boolean }) => Promise<void>;
  onTagClick?: (tagName: string) => void;
  selectedTags?: string[];
}

export function LeadDetailsSheet({ contact, open, onOpenChange, onUpdateContact, onTagClick, selectedTags = [] }: LeadDetailsSheetProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [isSavingValue, setIsSavingValue] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [winProbability, setWinProbability] = useState<number[]>([50]);
  const [isSavingProbability, setIsSavingProbability] = useState(false);
  const { instance } = useSDRAgent();
  
  // Custom Fields
  const { definitions } = useCustomFieldDefinitions();
  const { values, saveValue } = useCustomFieldValues(contact?.id);
  
  // Activity Log
  const { activities, isLoading: isLoadingActivities, logValueUpdate, logNoteUpdate } = useActivityLog(contact?.id);
  
  // Relational Tags (for header display)
  const { tags: relationalTags } = useLeadTagsReadOnly(contact?.id);
  
  // Use tasks filtered by this lead
  const { tasks, createTask, toggleTaskCompletion } = useTasksData(
    'all', 
    undefined, 
    contact?.remote_jid
  );

  const touchLeadInteraction = useCallback(async () => {
    if (!contact || !onUpdateContact) return;
    await onUpdateContact(contact.id, {}, { recordInteraction: true });
  }, [contact, onUpdateContact]);

  // Inicializar valor estimado quando contato mudar
  useEffect(() => {
    if (contact?.crm_estimated_value) {
      // Formatar o valor do banco (ex: 1500 -> "1.500,00")
      const formatted = contact.crm_estimated_value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setEstimatedValue(formatted);
    } else {
      setEstimatedValue('');
    }
  }, [contact?.crm_estimated_value]);

  // Sincronizar notas quando contato mudar
  useEffect(() => {
    if (contact?.crm_notes) {
      setNotes(contact.crm_notes);
    } else {
      setNotes('');
    }
  }, [contact?.id, contact?.crm_notes]);

  // Sincronizar probabilidade quando contato mudar (Fase 3.5)
  useEffect(() => {
    if (contact) {
      // Se tem probabilidade customizada, usa ela
      if (contact.crm_win_probability !== null) {
        setWinProbability([contact.crm_win_probability]);
      } else {
        // Senão, usa default do status
        const defaultProb = DEFAULT_WIN_PROBABILITY[contact.crm_lead_status as LeadStatus] || 50;
        setWinProbability([defaultProb]);
      }
    }
  }, [contact]);

  // Auto-save de notas com debounce
  useEffect(() => {
    if (!contact || notes === (contact.crm_notes || '')) {
      return; // Não salvar se notas não mudaram
    }

    const timeoutId = setTimeout(async () => {
      if (onUpdateContact) {
        setIsSavingNotes(true);
        try {
          const oldNotes = contact.crm_notes || '';
          await onUpdateContact(contact.id, { crm_notes: notes });
          
          // Registrar atividade de atualização de notas
          await logNoteUpdate(contact.id, oldNotes, notes);
          
          toast.success('Notas salvas automaticamente', {
            duration: 2000,
          });
        } catch (error) {
          console.error('Error saving notes:', error);
          toast.error('Erro ao salvar notas');
        } finally {
          setIsSavingNotes(false);
        }
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [notes, contact, onUpdateContact, logNoteUpdate]);

  if (!contact) return null;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await createTask.mutateAsync({
        title: newTaskTitle,
        priority: 'medium',
        lead_remote_jid: contact.remote_jid
      });
      setNewTaskTitle('');
      await touchLeadInteraction();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    try {
      await toggleTaskCompletion.mutateAsync(task);
      await touchLeadInteraction();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const handleSaveEstimatedValue = async () => {
    if (!contact || !onUpdateContact) return;
    
    // Parse valor: remove formatação e converte para número
    // formatCurrency já divide por 100, então precisamos remover apenas a formatação de milhar/decimal
    const cleanValue = estimatedValue.replace(/\./g, '').replace(',', '.');
    const numericValue = parseFloat(cleanValue) || 0;
    const oldValue = contact.crm_estimated_value || 0;
    
    setIsSavingValue(true);
    try {
      await onUpdateContact(contact.id, {
        crm_estimated_value: numericValue
      });
      
      // Registrar atividade de mudança de valor (apenas se mudou)
      if (oldValue !== numericValue) {
        await logValueUpdate(contact.id, oldValue, numericValue);
      }
      
      toast.success('Valor estimado atualizado!');
      
      // O useEvolutionContacts agora faz refresh automático após updateContact
      // Isso garante que as métricas do pipeline sejam recalculadas
      
      // Aguardar um tick para garantir que o estado se propague antes de fechar
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fechar o sheet após salvar com sucesso
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar valor estimado:', error);
      toast.error('Erro ao salvar valor estimado');
    } finally {
      setIsSavingValue(false);
    }
  };

  // Handler para salvar probabilidade (Fase 3.5)
  const handleSaveProbability = async () => {
    if (!contact || !onUpdateContact) return;
    
    const newProb = winProbability[0];
    setIsSavingProbability(true);
    try {
      await onUpdateContact(contact.id, {
        crm_win_probability: newProb
      });
      
      toast.success('Probabilidade atualizada!', {
        description: `Nova probabilidade: ${newProb}%`,
      });
    } catch (error) {
      console.error('Erro ao atualizar probabilidade:', error);
      toast.error('Erro ao salvar probabilidade');
    } finally {
      setIsSavingProbability(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers) return '';
    
    // Converte para número (já está em centavos, ex: 150000 = R$ 1.500,00)
    const num = parseInt(numbers) / 100;
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleEstimatedValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setEstimatedValue(formatted);
  };

  // Mapear status para cores (baseado em useCRMPipeline)
  const getStatusColor = (status: LeadStatus | null) => {
    const statusMap: Record<LeadStatus, string> = {
      'novo': 'bg-blue-500',
      'contatado': 'bg-indigo-500',
      'qualificado': 'bg-purple-500',
      'proposta': 'bg-amber-500',
      'negociando': 'bg-orange-500',
      'ganho': 'bg-green-500',
      'perdido': 'bg-red-500',
    };
    return statusMap[status || 'novo'];
  };

  const currentStatus = (contact.crm_lead_status || 'novo') as LeadStatus;
  const statusColor = getStatusColor(currentStatus);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[580px] flex flex-col p-0 overflow-hidden">
        {/* Header com barra colorida de status */}
        <div className="relative">
          {/* Barra colorida no topo */}
          <div className={cn("h-1", statusColor)} />
          
          <div className="bg-muted/30 p-6 border-b flex-shrink-0">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                <AvatarImage src={contact.profile_pic_url || undefined} />
                <AvatarFallback className="text-lg">{contact.push_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <SheetTitle className="text-xl">{contact.push_name || contact.remote_jid.split('@')[0]}</SheetTitle>
                <SheetDescription className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {contact.phone}
                </SheetDescription>
                
                {/* Badges Row: Status + Score + Tags */}
                <div className="flex gap-2 flex-wrap items-center">
                  {/* Status Badge com cor */}
                  <Badge variant="outline" className={cn("text-xs", statusColor, "text-white border-transparent")}>
                    {contact.crm_lead_status || 'Novo'}
                  </Badge>
                  
                  {/* Lead Score Badge */}
                  {contact.crm_lead_score !== null && contact.crm_lead_score !== undefined && contact.crm_lead_score > 0 && (
                    <LeadScoreBadge score={contact.crm_lead_score} size="md" showLabel showTooltip />
                  )}
                  
                  {/* Tags Badges (Relational) */}
                  {relationalTags.length > 0 && (
                    <>
                      {relationalTags.slice(0, 3).map((tag) => {
                        const isSelected = selectedTags.includes(tag.tag_name);
                        return (
                          <Badge 
                            key={tag.tag_id} 
                            variant="secondary" 
                            className={`text-xs cursor-pointer transition-all ${
                              isSelected ? 'ring-2 ring-offset-1' : 'hover:opacity-80'
                            }`}
                            style={{
                              backgroundColor: isSelected ? tag.tag_color : `${tag.tag_color}20`,
                              borderColor: tag.tag_color,
                              color: isSelected ? '#ffffff' : tag.tag_color,
                              border: isSelected ? '2px solid' : '1px solid',
                            }}
                            onClick={() => onTagClick?.(tag.tag_name)}
                            title={isSelected ? `Remover filtro: ${tag.tag_name}` : `Filtrar por: ${tag.tag_name}`}
                          >
                            {tag.tag_name}
                          </Badge>
                        );
                      })}
                      {relationalTags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{relationalTags.length - 3}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1 gap-2" 
              variant="outline" 
              onClick={() => setWhatsappDialogOpen(true)}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button className="flex-1 gap-2" variant="outline">
              <Phone className="h-4 w-4" />
              Ligar
            </Button>
            <Button size="icon" variant="outline">
              <Mail className="h-4 w-4" />
            </Button>
          </div>

          {/* Campo de Valor Estimado */}
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Valor Estimado do Deal
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
                <Input
                  type="text"
                  placeholder="0,00"
                  value={estimatedValue}
                  onChange={handleEstimatedValueChange}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={handleSaveEstimatedValue} 
                disabled={isSavingValue || !estimatedValue}
                size="default"
                variant="outline"
              >
                {isSavingValue ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>

          {/* Dialog para envio de mensagem WhatsApp */}
          <SendWhatsAppDialog
            open={whatsappDialogOpen}
            onOpenChange={setWhatsappDialogOpen}
            contactName={contact.push_name || 'Contato'}
            contactPhone={contact.phone || contact.remote_jid.split('@')[0]}
            contactRemoteJid={contact.remote_jid}
            defaultMessage={`Olá ${contact.push_name || ''}!`}
          />

          {/* Campo de Probabilidade de Fechamento (Fase 3.5) - Não exibir para ganho/perdido */}
          {contact.crm_lead_status !== 'ganho' && contact.crm_lead_status !== 'perdido' && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  Probabilidade de Fechamento
                </label>
                <Badge 
                  variant="secondary"
                  className="text-xs font-semibold"
                  style={{
                    backgroundColor: `hsl(${(winProbability[0] / 100) * 120}, 70%, 95%)`,
                    borderColor: `hsl(${(winProbability[0] / 100) * 120}, 70%, 60%)`,
                    color: `hsl(${(winProbability[0] / 100) * 120}, 70%, 30%)`,
                  }}
                >
                  {winProbability[0]}%
                </Badge>
              </div>
              <div className="space-y-3">
                <Slider
                  value={winProbability}
                  onValueChange={setWinProbability}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                  aria-label="Probabilidade de Fechamento"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="text-[10px] opacity-70">
                    {contact.crm_win_probability === null 
                      ? `Padrão: ${DEFAULT_WIN_PROBABILITY[contact.crm_lead_status as LeadStatus] || 50}%`
                      : 'Customizado'}
                  </span>
                  <span>100%</span>
                </div>
                {contact.crm_win_probability !== winProbability[0] && (
                  <Button
                    onClick={handleSaveProbability}
                    disabled={isSavingProbability}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    {isSavingProbability ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Salvar Probabilidade
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Motivo de Perda (only when status is "perdido") */}
          {contact.crm_lead_status === 'perdido' && contact.crm_loss_reason && (
            <div className="mt-6 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Motivo da Perda
                </h4>
              </div>
              <p className="text-sm text-red-600 dark:text-red-300">
                {contact.crm_loss_reason === 'price' && '💰 Preço muito alto'}
                {contact.crm_loss_reason === 'competitor' && '🏆 Escolheu concorrente'}
                {contact.crm_loss_reason === 'timing' && '⏰ Não é o momento'}
                {contact.crm_loss_reason === 'no_budget' && '💸 Sem orçamento'}
                {contact.crm_loss_reason === 'no_response' && '📵 Sem resposta'}
                {contact.crm_loss_reason === 'not_qualified' && '❌ Lead não qualificado'}
                {contact.crm_loss_reason === 'changed_needs' && '🔄 Necessidades mudaram'}
                {contact.crm_loss_reason === 'other' && '📝 Outro motivo'}
              </p>
              {contact.crm_loss_reason_details && (
                <p className="text-xs text-red-600/80 dark:text-red-400/80 italic border-t border-red-200 dark:border-red-900 pt-2">
                  "{contact.crm_loss_reason_details}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="tasks" className="flex-1 flex flex-col">
            <div className="px-6 pt-4 border-b bg-background flex-shrink-0">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto">
                <TabsTrigger 
                  value="tasks" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                >
                  Tarefas
                </TabsTrigger>
                <TabsTrigger 
                  value="agenda" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                >
                  Agenda
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                >
                  Notas
                </TabsTrigger>
                <TabsTrigger 
                  value="tags" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                >
                  Tags
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                >
                  Histórico
                </TabsTrigger>
                {definitions.length > 0 && (
                  <TabsTrigger 
                    value="custom" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                  >
                    Campos Extras
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="flex-1 p-0 m-0 border-0 data-[state=active]:flex data-[state=active]:flex-col overflow-auto">
              <div className="p-6 border-b bg-muted/10 flex-shrink-0">
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <Input 
                    placeholder="Adicionar nova tarefa..." 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" variant="outline" disabled={!newTaskTitle.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </div>
              <div className="flex-1 overflow-auto">
                <div className="p-6 space-y-2">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma tarefa para este lead
                    </div>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                         <div 
                           className={`mt-0.5 cursor-pointer rounded border h-4 w-4 flex items-center justify-center ${task.status === 'done' ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                           onClick={() => handleToggleTaskStatus(task)}
                         >
                           {task.status === 'done' && <CheckSquare className="h-3 w-3 text-primary-foreground" />}
                         </div>
                         <div className="flex-1 space-y-1">
                           <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                             {task.title}
                           </p>
                           {task.due_date && (
                             <p className="text-xs text-muted-foreground flex items-center gap-1">
                               <Calendar className="h-3 w-3" />
                               {format(new Date(task.due_date), "dd 'de' MMM", { locale: ptBR })}
                             </p>
                           )}
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Agenda Tab */}
            <TabsContent value="agenda" className="flex-1 p-6 m-0 border-0 data-[state=active]:block overflow-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Próximos Eventos</h3>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Agendar
                  </Button>
                </div>
                <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg border-dashed">
                  Em breve: Integração com Agenda
                </div>
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="flex-1 p-6 m-0 border-0 data-[state=active]:block overflow-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Notas e Observações
                    </label>
                    {isSavingNotes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Salvando...
                      </span>
                    )}
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione notas sobre este lead... (auto-salvamento ativado)"
                    className="min-h-[200px] resize-none"
                    disabled={isSavingNotes || !onUpdateContact}
                  />
                  <p className="text-xs text-muted-foreground">
                    {notes.length}/500 caracteres • Salva automaticamente após parar de digitar
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Tags Tab */}
            <TabsContent value="tags" className="flex-1 p-6 m-0 border-0 data-[state=active]:block overflow-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Tags do Lead
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Use tags para categorizar e organizar seus leads. Tags facilitam a filtragem e segmentação.
                  </p>
                </div>
                <TagsEditorRelational
                  leadId={contact.id}
                  instanceId={instance?.id}
                  disabled={!onUpdateContact}
                />
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="flex-1 p-6 m-0 border-0 data-[state=active]:block overflow-auto">
              <ActivityTimeline 
                activities={activities} 
                isLoading={isLoadingActivities}
              />
            </TabsContent>

            {/* Custom Fields Tab */}
            {definitions.length > 0 && (
              <TabsContent value="custom" className="flex-1 p-6 m-0 border-0 data-[state=active]:block overflow-auto">
                <div className="space-y-6">
                    {definitions
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((def) => (
                        <div key={def.id}>
                          <CustomFieldRenderer
                            definition={def}
                            value={values?.[def.field_key]}
                            onChange={async (value) => {
                              await saveValue.mutateAsync({
                                field_key: def.field_key,
                                value,
                              });
                                  await touchLeadInteraction();
                            }}
                          />
                        </div>
                      ))}
                    
                    {definitions.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg border-dashed">
                        Nenhum campo personalizado configurado
                      </div>
                    )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

