import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Loader2, 
  Smartphone, 
  WifiOff, 
  RefreshCw, 
  Settings,
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EvolutionInstance } from '@/types/sdr';
import { useNavigate } from 'react-router-dom';

interface SendWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactName: string;
  contactPhone: string;
  contactRemoteJid: string;
  defaultMessage?: string;
}

export function SendWhatsAppDialog({
  open,
  onOpenChange,
  contactName,
  contactPhone,
  contactRemoteJid,
  defaultMessage = '',
}: SendWhatsAppDialogProps) {
  const navigate = useNavigate();
  const [message, setMessage] = useState(defaultMessage);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [availableInstances, setAvailableInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [disconnectedInstance, setDisconnectedInstance] = useState<EvolutionInstance | null>(null);

  // Função para buscar instâncias (reutilizável)
  const fetchAvailableInstances = useCallback(async () => {
    if (!contactRemoteJid) return;
    
    setLoading(true);
    setDisconnectedInstance(null);
    
    try {
      // Buscar instâncias conectadas onde o lead já está salvo
      const { data: contactInstances, error: contactError } = await supabase
        .from('evolution_contacts')
        .select(`
          instance_id,
          evolution_instances!inner (
            id,
            phone,
            instance_name,
            display_name,
            whatsapp_number,
            connection_status
          )
        `)
        .eq('remote_jid', contactRemoteJid)
        .eq('evolution_instances.connection_status', 'connected');

      if (contactError) throw contactError;

      // Transformar resultado em lista de instâncias únicas
      const instances = contactInstances
        ?.map((c: { evolution_instances: EvolutionInstance }) => c.evolution_instances)
        .filter((inst: EvolutionInstance, index: number, self: EvolutionInstance[]) => 
          self.findIndex(i => i.id === inst.id) === index
        ) || [];

      setAvailableInstances(instances);

      // Selecionar automaticamente se houver apenas uma
      if (instances.length === 1) {
        setSelectedInstanceId(instances[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
      toast.error('Erro ao carregar instâncias disponíveis', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setLoading(false);
    }
  }, [contactRemoteJid]);

  // Buscar instâncias onde o lead está salvo como contato
  useEffect(() => {
    if (!open || !contactPhone) return;
    fetchAvailableInstances();
  }, [open, contactPhone, fetchAvailableInstances]);

  // Realtime subscription para detectar desconexões
  useEffect(() => {
    if (!open || availableInstances.length === 0) return;

    const instanceIds = availableInstances.map(inst => inst.id);
    
    console.log('[SendWhatsAppDialog] 🔌 Iniciando Realtime subscription para instâncias:', instanceIds);

    const channel = supabase
      .channel('evolution_instances_status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evolution_instances',
        },
        (payload) => {
          const updatedInstance = payload.new as EvolutionInstance;
          
          // Verificar se é uma das instâncias relevantes
          if (!instanceIds.includes(updatedInstance.id)) return;
          
          console.log('[SendWhatsAppDialog] 📡 Atualização Realtime:', {
            instanceId: updatedInstance.id,
            newStatus: updatedInstance.connection_status,
          });

          // Se a instância desconectou
          if (updatedInstance.connection_status !== 'connected') {
            // Encontrar a instância anterior para mostrar nome no alert
            const previousInstance = availableInstances.find(i => i.id === updatedInstance.id);
            
            setDisconnectedInstance({
              ...updatedInstance,
              display_name: previousInstance?.display_name || updatedInstance.display_name,
            });
            
            // Remover da lista de disponíveis
            setAvailableInstances(prev => prev.filter(inst => inst.id !== updatedInstance.id));
            
            // Se era a instância selecionada, desmarcar
            if (selectedInstanceId === updatedInstance.id) {
              setSelectedInstanceId('');
            }
            
            toast.warning('Instância desconectada', {
              description: `A instância "${previousInstance?.display_name || 'WhatsApp'}" foi desconectada`,
            });
          }
          // Se reconectou
          else {
            // Rebuscar para garantir dados atualizados
            fetchAvailableInstances();
            setDisconnectedInstance(null);
            toast.success('Instância reconectada!');
          }
        }
      )
      .subscribe((status) => {
        console.log('[SendWhatsAppDialog] 📡 Realtime subscription status:', status);
      });

    return () => {
      console.log('[SendWhatsAppDialog] 🔌 Removendo Realtime subscription');
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [open, availableInstances, selectedInstanceId, fetchAvailableInstances]);

  // Resetar estado quando fechar
  useEffect(() => {
    if (!open) {
      setMessage(defaultMessage);
      setSelectedInstanceId('');
      setDisconnectedInstance(null);
    }
  }, [open, defaultMessage]);

  // Função para reconectar instância desconectada
  const handleReconnect = async () => {
    if (!disconnectedInstance) return;
    
    setReconnecting(true);
    try {
      console.log('[SendWhatsAppDialog] 🔄 Tentando reconectar instância:', disconnectedInstance.id);
      
      const { data, error } = await supabase.functions.invoke('connect-evolution-instance', {
        body: { instance_id: disconnectedInstance.id },
      });

      if (error) throw error;

      if (data?.qrcode) {
        toast.info('QR Code gerado', {
          description: 'Escaneie o QR Code na página de configuração do Agente SDR',
          duration: 6000,
        });
        // Opcionalmente navegar para página do SDR
      } else if (data?.connected) {
        toast.success('Instância reconectada!');
        fetchAvailableInstances();
        setDisconnectedInstance(null);
      }
    } catch (error) {
      console.error('Erro ao reconectar:', error);
      toast.error('Erro ao reconectar', {
        description: error instanceof Error ? error.message : 'Não foi possível reconectar a instância',
      });
    } finally {
      setReconnecting(false);
    }
  };

  // Navegar para configurações do SDR
  const handleGoToSettings = () => {
    onOpenChange(false);
    navigate('/sdr-agent');
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    if (!selectedInstanceId) {
      toast.error('Selecione uma instância');
      return;
    }

    // Extrair número do remote_jid (formato: 5511999999999@s.whatsapp.net)
    const numberFromJid = contactRemoteJid.split('@')[0];
    
    console.log('[SendWhatsAppDialog] 📤 Enviando mensagem:', {
      contactName,
      contactRemoteJid,
      numberExtracted: numberFromJid,
      instanceId: selectedInstanceId,
      messageLength: message.length,
    });

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-evolution-text', {
        body: {
          number: numberFromJid,
          text: message,
          instance_id: selectedInstanceId,
        },
      });

      console.log('[SendWhatsAppDialog] 📥 Resposta da Edge Function:', { data, error });

      if (error || !data?.success) {
        // Mensagens de erro mais claras baseadas no código de status
        const errorMessage = data?.error || error?.message || 'Falha ao enviar mensagem';
        const technicalDetails = data?.technical_details;
        
        // Se for erro de conexão, mostrar mensagem mais específica
        if (errorMessage.includes('desconectada') || errorMessage.includes('Connection Closed')) {
          toast.error('WhatsApp desconectado', {
            description: errorMessage,
            duration: 6000,
          });
        } else {
          toast.error('Erro ao enviar mensagem', {
            description: errorMessage,
            duration: 5000,
          });
        }
        
        // Log técnico para debug
        if (technicalDetails) {
          console.error('Detalhes técnicos do erro:', technicalDetails);
        }
        
        return; // Não fechar o dialog em caso de erro
      }

      toast.success('Mensagem enviada via WhatsApp!', {
        description: `Enviada para ${contactName}`,
        duration: 3000,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro inesperado', {
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar enviar a mensagem',
        duration: 5000,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Enviar mensagem via WhatsApp
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem para <strong>{contactName}</strong>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : availableInstances.length === 0 ? (
          /* Empty State Moderno */
          <div className="py-6">
            {/* Alert de desconexão quando instância foi perdida */}
            {disconnectedInstance && (
              <Alert variant="destructive" className="mb-4">
                <WifiOff className="h-4 w-4" />
                <AlertTitle>Instância desconectada</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    A instância "{disconnectedInstance.display_name || 'WhatsApp'}" foi desconectada.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReconnect}
                    disabled={reconnecting}
                    className="mt-2"
                  >
                    {reconnecting ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Reconectando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Tentar reconectar
                      </>
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Empty State com design moderno */}
            <div className="flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-lg p-8 bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
              <div className="mb-4 p-3 rounded-full bg-muted text-muted-foreground border border-border">
                <Smartphone className="h-8 w-8" />
              </div>
              <h4 className="text-base font-medium text-foreground mb-2">
                Nenhuma instância disponível
              </h4>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                Este contato não está salvo em nenhuma instância WhatsApp conectada.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToSettings}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Configurar instâncias
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Alert de instância desconectada em tempo real */}
            {disconnectedInstance && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    A instância "{disconnectedInstance.display_name || 'WhatsApp'}" foi desconectada.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReconnect}
                    disabled={reconnecting}
                    className="ml-2"
                  >
                    {reconnecting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Seletor de Instância */}
            <div className="space-y-2">
              <Label htmlFor="instance">Instância WhatsApp</Label>
              <Select
                value={selectedInstanceId}
                onValueChange={setSelectedInstanceId}
              >
                <SelectTrigger id="instance">
                  <SelectValue placeholder="Selecione uma instância" />
                </SelectTrigger>
                <SelectContent>
                  {availableInstances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-green-600" />
                        <span>
                          {instance.display_name || instance.whatsapp_number || 'WhatsApp'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableInstances.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  Este contato está salvo em {availableInstances.length} instâncias
                </p>
              )}
            </div>

            {/* Campo de Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder={`Olá ${contactName}! Como posso ajudar?`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {message.length} caracteres
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              loading ||
              sending ||
              availableInstances.length === 0 ||
              !selectedInstanceId ||
              !message.trim()
            }
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
