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
import { MessageCircle, Phone, Calendar, CheckSquare, Plus, Mail } from 'lucide-react';
import { useTasksData, TaskFormData } from '@/hooks/useTasksData';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadDetailsSheetProps {
  contact: EvolutionContact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailsSheet({ contact, open, onOpenChange }: LeadDetailsSheetProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Use tasks filtered by this lead
  const { tasks, createTask, toggleTaskCompletion } = useTasksData(
    'all', 
    undefined, 
    contact?.remote_jid
  );

  if (!contact) return null;

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
                <div className="flex gap-2 mt-2">
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
            <Button className="flex-1 gap-2" variant="default">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button className="flex-1 gap-2" variant="outline">
              <Phone className="h-4 w-4" />
              Ligar
            </Button>
            <Button size="icon" variant="secondary">
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="tasks" className="flex-1 flex flex-col h-full">
            <div className="px-6 pt-4 border-b bg-background">
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
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
                  <Button type="submit" size="icon" disabled={!newTaskTitle.trim()}>
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
                <div className="p-3 border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground italic">
                    {contact.crm_notes || "Nenhuma nota adicionada."}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

