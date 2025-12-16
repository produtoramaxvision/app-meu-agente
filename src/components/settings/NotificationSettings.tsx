import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Volume2, VolumeX, Monitor } from 'lucide-react';
import { useNotificationSettings, requestNotificationPermission } from '@/hooks/useRealtimeNotifications';
import { useState } from 'react';
import { toast } from 'sonner';

const NOTIFICATION_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  status_change: {
    label: 'Mudança de Status',
    description: 'Quando um lead muda de etapa no pipeline',
  },
  whatsapp_received: {
    label: 'WhatsApp Recebido',
    description: 'Quando um lead envia mensagem',
  },
  email_opened: {
    label: 'Email Aberto',
    description: 'Quando um lead abre seu email',
  },
  task_due: {
    label: 'Tarefa Vencendo',
    description: 'Lembrete de tarefas próximas do vencimento',
  },
  lead_hot: {
    label: 'Lead Aqueceu',
    description: 'Quando o score do lead aumenta significativamente',
  },
};

export function NotificationSettings() {
  const { settings, updateSettings } = useNotificationSettings();
  const [requestingPermission, setRequestingPermission] = useState(false);

  const handleRequestPermission = async () => {
    setRequestingPermission(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        toast.success('Permissão de notificação concedida!');
        updateSettings({ desktop: true });
      } else {
        toast.error('Permissão de notificação negada');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao solicitar permissão');
    } finally {
      setRequestingPermission(false);
    }
  };

  const notificationStatus = 
    !settings.enabled ? 'Desativadas' :
    settings.desktop ? 'Ativas (Desktop)' :
    'Ativas (App)';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.enabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-lg sm:text-xl">Notificações em Tempo Real</CardTitle>
              <CardDescription className="text-sm mt-1">
                Configure alertas instantâneos sobre seus leads
              </CardDescription>
            </div>
          </div>
          <Badge variant={settings.enabled ? 'default' : 'secondary'} className="hidden sm:inline-flex">
            {notificationStatus}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Badge Mobile */}
        <div className="sm:hidden">
          <Badge variant={settings.enabled ? 'default' : 'secondary'} className="w-full justify-center">
            {notificationStatus}
          </Badge>
        </div>

        {/* Master Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border bg-muted/30">
          <div className="space-y-1">
            <Label className="text-base font-semibold">Ativar Notificações</Label>
            <p className="text-sm text-muted-foreground">
              Receba alertas em tempo real sobre mudanças nos leads
            </p>
          </div>
          <Switch 
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
            className="self-start sm:self-auto"
          />
        </div>

        <Separator />

        {/* Notification Options */}
        <div className={`space-y-4 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <Label className="text-sm font-semibold text-muted-foreground uppercase">
            Opções de Notificação
          </Label>

          {/* Sound Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              {settings.sound ? (
                <Volume2 className="h-5 w-5 text-primary mt-0.5 sm:mt-0 flex-shrink-0" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground mt-0.5 sm:mt-0 flex-shrink-0" />
              )}
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm sm:text-base">Som de Notificação</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Tocar som ao receber notificação
                </p>
              </div>
            </div>
            <Switch 
              checked={settings.sound}
              disabled={!settings.enabled}
              onCheckedChange={(sound) => updateSettings({ sound })}
              className="self-start sm:self-auto"
            />
          </div>

          {/* Desktop Notifications */}
          <div className="flex flex-col gap-3 p-4 rounded-lg border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <Monitor className="h-5 w-5 text-primary mt-0.5 sm:mt-0 flex-shrink-0" />
                <div className="space-y-0.5 flex-1">
                  <Label className="text-sm sm:text-base">Notificações do Sistema</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Receber mesmo com aba fechada
                  </p>
                </div>
              </div>
              {Notification.permission === 'granted' ? (
                <Switch 
                  checked={settings.desktop}
                  disabled={!settings.enabled}
                  onCheckedChange={(desktop) => updateSettings({ desktop })}
                  className="self-start sm:self-auto"
                />
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRequestPermission}
                  disabled={!settings.enabled || requestingPermission}
                  className="self-start sm:self-auto"
                >
                  {requestingPermission ? 'Aguarde...' : 'Permitir'}
                </Button>
              )}
            </div>
            {Notification.permission === 'denied' && (
              <p className="text-xs text-destructive">
                Permissão negada. Ative nas configurações do navegador.
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className={`space-y-4 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <Label className="text-sm font-semibold text-muted-foreground uppercase">
            Tipos de Notificação
          </Label>

          <div className="space-y-3">
            {Object.entries(settings.types).map(([key, value]) => {
              const config = NOTIFICATION_TYPE_LABELS[key];
              
              return (
                <div 
                  key={key} 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-sm sm:text-base cursor-pointer">
                      {config.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                  <Switch 
                    checked={value}
                    disabled={!settings.enabled}
                    onCheckedChange={(checked) => updateSettings({
                      types: { ...settings.types, [key]: checked }
                    })}
                    className="self-start sm:self-auto"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Footer */}
        {settings.enabled && (
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            💡 <strong>Dica:</strong> Mantenha a aba do CRM aberta para receber notificações em tempo real.
            Com notificações do sistema ativadas, você receberá alertas mesmo com a aba fechada.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
