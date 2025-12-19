import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
} from '@/components/ui/sheet';
import { EvolutionContact } from '@/types/sdr';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckSquare, Plus, Mail, Loader2, MessageCircle, Phone, X, Edit2, Wallet, Target, Clock, Tag, UserRound } from 'lucide-react';
import { useTasksData, Task } from '@/hooks/useTasksData';
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
import { DEFAULT_WIN_PROBABILITY } from '@/utils/leadScoring';
import { LeadStatus } from '@/types/sdr';
import { SendWhatsAppDialog } from './SendWhatsAppDialog';
import { TagsEditorRelational } from './TagsEditorRelational';
import { useLeadTagsReadOnly } from '@/hooks/useCrmTags';
import { motion, AnimatePresence } from 'framer-motion';

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
    
    const cleanValue = estimatedValue.replace(/\./g, '').replace(',', '.');
    const numericValue = parseFloat(cleanValue) || 0;
    const oldValue = contact.crm_estimated_value || 0;
    
    setIsSavingValue(true);
    try {
      await onUpdateContact(contact.id, {
        crm_estimated_value: numericValue
      });
      
      if (oldValue !== numericValue) {
        await logValueUpdate(contact.id, oldValue, numericValue);
      }
      
      toast.success('Valor estimado atualizado!');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      // Não fechar o sheet automaticamente para permitir continuar editando
    } catch (error) {
      console.error('Erro ao atualizar valor estimado:', error);
      toast.error('Erro ao salvar valor estimado');
    } finally {
      setIsSavingValue(false);
    }
  };

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
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers) return '';
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
      <SheetContent className="w-full sm:w-[600px] flex flex-col p-0 overflow-hidden bg-background border-l shadow-2xl">
        {/* Header Elegante */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-transparent pointer-events-none" />
          
          <div className="relative px-6 pt-8 pb-6 space-y-6">
            {/* Top Bar: Status & Close */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={cn("px-2.5 py-0.5 text-xs font-medium border-transparent text-white shadow-sm", statusColor)}>
                {contact.crm_lead_status?.toUpperCase() || 'NOVO'}
              </Badge>
              {/* Fechar já é fornecido pelo Sheet, mas podemos customizar se quisermos */}
            </div>

            {/* Profile Info */}
            <div className="flex items-start gap-5">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg ring-1 ring-border/10">
                <AvatarImage src={contact.profile_pic_url || undefined} className="object-cover" />
                <AvatarFallback className="text-2xl font-semibold bg-primary/5 text-primary">
                  {contact.push_name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground truncate">
                      {contact.push_name || contact.remote_jid.split('@')[0]}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span className="text-sm font-medium">{contact.phone}</span>
                    </div>
                  </div>
                  
                  {/* Lead Score */}
                  {contact.crm_lead_score !== null && contact.crm_lead_score > 0 && (
                    <div className="flex-shrink-0">
                      <LeadScoreBadge score={contact.crm_lead_score} size="lg" showLabel={false} />
                    </div>
                  )}
                </div>

                {/* Quick Actions Row */}
                <div className="flex items-center gap-2 mt-4">
                  <Button 
                    size="sm" 
                    className="h-8 gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white border-none shadow-sm"
                    onClick={() => setWhatsappDialogOpen(true)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 gap-2"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Ligar</span>
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-8 w-8"
                    onClick={() => {
                      const email = values['email'] as string;
                      if (!email) {
                        toast.error("Este lead não possui e-mail cadastrado.");
                        return;
                      }
                      window.location.href = `mailto:${email}`;
                    }}
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Deal Info Cards (Compact) */}
            {contact.crm_lead_status !== 'ganho' && contact.crm_lead_status !== 'perdido' && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="group relative p-3 rounded-xl border bg-card hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Wallet className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Valor do Deal</span>
                    </div>
                    {isSavingValue && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-muted-foreground">R$</span>
                    <Input
                      type="text"
                      placeholder="0,00"
                      value={estimatedValue}
                      onChange={handleEstimatedValueChange}
                      onBlur={handleSaveEstimatedValue}
                      className="h-7 px-0 border-0 bg-transparent text-lg font-bold shadow-none focus-visible:ring-0 p-0 w-full placeholder:text-muted-foreground/30"
                    />
                  </div>
                </div>

                <div className="group relative p-3 rounded-xl border bg-card hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Target className="h-3.5 w-3.5" />
                      <span className="text-xs font-medium">Probabilidade</span>
                    </div>
                    <span className="text-xs font-bold text-primary">{winProbability[0]}%</span>
                  </div>
                  <div className="px-1 py-1.5">
                    <Slider
                      value={winProbability}
                      onValueChange={setWinProbability}
                      onValueCommit={handleSaveProbability}
                      max={100}
                      min={0}
                      step={5}
                      className="cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-muted/5">
          <Tabs defaultValue="tasks" className="flex-1 flex flex-col">
            <div className="px-6 border-b bg-background sticky top-0 z-10">
              <TabsList className="w-full justify-start h-12 bg-transparent p-0 gap-6">
                {['tasks', 'notes', 'history', 'tags', 'custom'].map((tab) => {
                  if (tab === 'custom' && definitions.length === 0) return null;
                  
                  const labels: Record<string, string> = {
                    tasks: 'Tarefas',
                    notes: 'Notas',
                    history: 'Timeline',
                    tags: 'Tags',
                    custom: 'Detalhes'
                  };
                  
                  const icons: Record<string, any> = {
                    tasks: CheckSquare,
                    notes: Edit2,
                    history: Clock,
                    tags: Tag,
                    custom: UserRound
                  }; // User icon as placeholder for details

                  const Icon = icons[tab];

                  return (
                    <TabsTrigger 
                      key={tab}
                      value={tab} 
                      className="relative h-12 rounded-none border-b-2 border-transparent px-0 pb-0 pt-0 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-2 py-3">
                        <Icon className="h-4 w-4" />
                        <span>{labels[tab]}</span>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <TabsContent value="tasks" className="mt-0 h-full flex flex-col space-y-4">
                <form onSubmit={handleAddTask} className="flex gap-3">
                  <Input 
                    placeholder="Adicionar nova tarefa..." 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-background h-10"
                  />
                  <Button type="submit" size="sm" className="h-10 px-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </form>

                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/30">
                      <CheckSquare className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm">Nenhuma tarefa pendente</p>
                    </div>
                  ) : (
                    tasks.map(task => (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={task.id} 
                        className="group flex items-start gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-all duration-200"
                      >
                         <button
                           className={cn(
                             "mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
                             task.status === 'done' 
                               ? "bg-primary border-primary text-primary-foreground" 
                               : "border-input hover:border-primary/50 bg-background"
                           )}
                           onClick={() => handleToggleTaskStatus(task)}
                         >
                           {task.status === 'done' && <CheckSquare className="h-3.5 w-3.5" />}
                         </button>
                         <div className="flex-1 min-w-0">
                           <p className={cn(
                             "text-sm font-medium transition-all",
                             task.status === 'done' ? "text-muted-foreground line-through decoration-border" : "text-foreground"
                           )}>
                             {task.title}
                           </p>
                           {task.due_date && (
                             <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                               <Calendar className="h-3 w-3" />
                               {format(new Date(task.due_date), "dd 'de' MMM", { locale: ptBR })}
                             </p>
                           )}
                         </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0 h-full">
                <div className="h-full flex flex-col space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Anotações
                    </label>
                    {isSavingNotes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Salvando...
                      </span>
                    )}
                  </div>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Digite suas observações aqui..."
                    className="flex-1 min-h-[300px] resize-none bg-background border-muted hover:border-muted-foreground/30 focus-visible:ring-1 p-4 leading-relaxed"
                    disabled={isSavingNotes || !onUpdateContact}
                  />
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <ActivityTimeline 
                  activities={activities} 
                  isLoading={isLoadingActivities}
                />
              </TabsContent>

              <TabsContent value="tags" className="mt-0">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border bg-card/50">
                    <TagsEditorRelational
                      leadId={contact.id}
                      instanceId={instance?.id}
                      disabled={!onUpdateContact}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="custom" className="mt-0">
                <div className="grid gap-6">
                  {definitions
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((def) => (
                      <div key={def.id} className="p-4 rounded-xl border bg-card/50 space-y-2">
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
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
