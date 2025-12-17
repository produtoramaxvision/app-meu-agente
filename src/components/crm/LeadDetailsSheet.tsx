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
import { useTasksData, TaskFormData } from '@/hooks/useTasksData';
import { Input } from '@/components/ui/input';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSDRAgent } from '@/hooks/useSDRAgent';
import { toast } from 'sonner';
import { useCustomFieldDefinitions, useCustomFieldValues } from '@/hooks/useCustomFields';
import { CustomFieldRenderer } from './CustomFieldRenderer';
import { useActivityLog } from '@/hooks/useActivityLog';
import { ActivityTimeline } from './ActivityTimeline';

interface LeadDetailsSheetProps {
  contact: EvolutionContact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateContact?: (contactId: string, updates: Partial<EvolutionContact>) => Promise<void>;
}

export function LeadDetailsSheet({ contact, open, onOpenChange, onUpdateContact }: LeadDetailsSheetProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [estimatedValue, setEstimatedValue] = useState<string>('');
  const [isSavingValue, setIsSavingValue] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const { instance } = useSDRAgent();
  
  // Custom Fields
  const { definitions } = useCustomFieldDefinitions();
  const { values, saveValue } = useCustomFieldValues(contact?.id);
  
  // Activity Log
  const { activities, isLoading: isLoadingActivities, logValueUpdate, logNoteUpdate } = useActivityLog(contact?.id);
  const evolutionApiUrl = useMemo(
    () => import.meta.env.VITE_EVOLUTION_API_URL || 'https://evolution-api.com',
    []
  );
  const evolutionApiKey = useMemo(
    () => import.meta.env.VITE_EVOLUTION_API_KEY || '',
    []
  );
  
  // Use tasks filtered by this lead
  const { tasks, createTask, toggleTaskCompletion } = useTasksData(
    'all', 
    undefined, 
    contact?.remote_jid
  );

  // Inicializar valor estimado quando contato mudar
  useMemo(() => {
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
  }, [contact]);

  // Sincronizar notas quando contato mudar
  useEffect(() => {
    if (contact?.crm_notes) {
      setNotes(contact.crm_notes);
    } else {
      setNotes('');
    }
  }, [contact?.id, contact?.crm_notes]);

  // Auto-save de notas com debounce
  useEffect(() => {
    if (!contact || notes === (contact.crm_notes || '')) {
      return; // Não salvar se notas não mudaram
    }

    const timeoutId = setTimeout(async () => {
      if (onUpdateContact) {
        setIsSavingNotes(true);
        try {
          await onUpdateContact(contact.id, { crm_notes: notes });
          
          // Registrar atividade de atualização de notas
          await logNoteUpdate(contact.id);
          
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

  const handleSendWhatsapp = async () => {
    const instanceName = instance?.instance_name;
    const phone = contact.remote_jid.split('@')[0] || contact.phone;
    if (!instanceName) {
      toast.error('Instância Evolution não configurada.');
      return;
    }
    if (!phone) {
      toast.error('Contato sem número de telefone válido.');
      return;
    }
    if (!evolutionApiKey) {
      toast.error('Chave da Evolution API não configurada.');
      return;
    }

    setSendingWhatsapp(true);
    try {
      const payload = {
        number: phone,
        text: `Olá ${contact.push_name || ''}!`,
      };

      const response = await fetch(
        `${evolutionApiUrl}/message/sendText/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: evolutionApiKey,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Falha ao enviar mensagem.');
      }

      toast.success('Mensagem enviada via WhatsApp.');
    } catch (error: unknown) {
      console.error('Erro ao enviar WhatsApp:', error);
      const message = error instanceof Error ? error.message : 'Verifique a configuração da Evolution API.';
      toast.error('Erro ao enviar mensagem.', {
        description: message,
      });
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await createTask.mutateAsync({
      title: newTaskTitle,
      priority: 'medium',
      lead_remote_jid: contact.remote_jid
    });
    setNewTaskTitle('');
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full p-0">
        {/* Header with Cover-like style */}
        <div className="bg-muted/30 p-6 border-b">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
              <AvatarImage src={contact.profile_pic_url || undefined} />
              <AvatarFallback className="text-lg">{contact.push_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <SheetTitle className="text-xl">{contact.push_name || contact.remote_jid.split('@')[0]}</SheetTitle>
              <SheetDescription className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {contact.phone}
                </span>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-xs bg-background/50">
                    {contact.crm_lead_status || 'Novo'}
                  </Badge>
                  {contact.crm_lead_score > 0 && (
                    <Badge variant="outline" className="text-xs bg-background/50">
                      Score: {contact.crm_lead_score}
                    </Badge>
                  )}
                </div>
              </SheetDescription>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button 
              className="flex-1 gap-2" 
              variant="outline" 
              onClick={handleSendWhatsapp}
              disabled={sendingWhatsapp}
            >
              {sendingWhatsapp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              {sendingWhatsapp ? 'Enviando...' : 'WhatsApp'}
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
          <div className="mt-4 space-y-2">
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

          {/* Motivo de Perda (only when status is "perdido") */}
          {contact.crm_lead_status === 'perdido' && contact.crm_loss_reason && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg space-y-2">
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
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="tasks" className="flex-1 flex flex-col h-full">
            <div className="px-6 pt-4 border-b bg-background">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto overflow-x-auto">
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
            <TabsContent value="tasks" className="flex-1 overflow-hidden flex flex-col p-0 m-0 border-0">
              <div className="p-4 border-b bg-muted/10">
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
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nenhuma tarefa para este lead
                    </div>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                         <div 
                           className={`mt-0.5 cursor-pointer rounded border h-4 w-4 flex items-center justify-center ${task.status === 'done' ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                           onClick={() => toggleTaskCompletion.mutate(task)}
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
              </ScrollArea>
            </TabsContent>

            {/* Agenda Tab */}
            <TabsContent value="agenda" className="flex-1 overflow-hidden p-6 m-0 border-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Próximos Eventos</h3>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Agendar
                </Button>
              </div>
              <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg border-dashed">
                Em breve: Integração com Agenda
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="flex-1 overflow-hidden p-6 m-0 border-0">
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

            {/* History Tab */}
            <TabsContent value="history" className="flex-1 overflow-hidden m-0 border-0">
              <ScrollArea className="h-full">
                <div className="p-4 sm:p-6">
                  <ActivityTimeline 
                    activities={activities} 
                    isLoading={isLoadingActivities}
                  />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Custom Fields Tab */}
            {definitions.length > 0 && (
              <TabsContent value="custom" className="flex-1 overflow-hidden m-0 border-0">
                <ScrollArea className="h-full">
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
                </ScrollArea>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

