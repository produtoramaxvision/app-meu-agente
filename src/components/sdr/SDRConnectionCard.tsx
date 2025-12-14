// =============================================================================
// Componente: SDRConnectionCard
// Card principal de conexão WhatsApp com suporte a múltiplas instâncias
// Atualizado: 2025-12-13 - Suporte a múltiplas instâncias
// =============================================================================

import { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Phone, 
  Plus, 
  Settings2, 
  ChevronDown, 
  LogOut,
  Trash2,
  Pencil,
  Check,
  X,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SDRQRCodeDisplay } from './SDRQRCodeDisplay';
import { SDRInstanceSettings } from './SDRInstanceSettings';
import { useSDRAgent } from '@/hooks/useSDRAgent';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { EvolutionInstance } from '@/types/sdr';

// =============================================================================
// Subcomponente: Card individual de uma instância
// =============================================================================
interface InstanceCardProps {
  instance: EvolutionInstance;
  isSelected: boolean;
  onSelect: () => void;
  onRefresh: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
  onUpdateName: (name: string) => void;
  isRefreshing: boolean;
  isDisconnecting: boolean;
  isDeleting: boolean;
  isUpdatingName: boolean;
}

function InstanceCard({
  instance,
  isSelected,
  onSelect,
  onRefresh,
  onDisconnect,
  onDelete,
  onUpdateName,
  isRefreshing,
  isDisconnecting,
  isDeleting,
  isUpdatingName,
}: InstanceCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(instance.display_name || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isConnected = instance.connection_status === 'connected';
  const isConnecting = instance.connection_status === 'connecting';

  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== instance.display_name) {
      onUpdateName(editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(instance.display_name || '');
    setIsEditing(false);
  };

  return (
    <>
      <Card 
        className={cn(
          "transition-all duration-200 cursor-pointer hover:shadow-md flex flex-col h-full",
          isSelected && "ring-2 ring-primary shadow-md",
          !isConnected && "opacity-90"
        )}
        onClick={() => !isEditing && onSelect()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Ícone de status */}
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                isConnected 
                  ? "bg-green-100 dark:bg-green-900/30" 
                  : isConnecting
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : "bg-muted"
              )}>
                {isConnected ? (
                  <Wifi className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : isConnecting ? (
                  <RefreshCw className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
                ) : (
                  <WifiOff className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Nome editável */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleSaveName}
                      disabled={isUpdatingName}
                    >
                      {isUpdatingName ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base truncate">
                      {instance.display_name || 'WhatsApp'}
                    </CardTitle>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                
                <CardDescription className="text-xs truncate">
                  {isConnected
                    ? (instance.whatsapp_number || 'Conectado')
                    : isConnecting
                      ? 'Aguardando conexão...'
                      : 'Desconectado'}
                </CardDescription>
              </div>
            </div>

            {/* Badge de status */}
            <Badge 
              variant={isConnected ? "default" : isConnecting ? "secondary" : "outline"}
              className={cn(
                "flex-shrink-0",
                isConnected && "bg-green-500 hover:bg-green-600"
              )}
            >
              {isConnected ? 'Online' : isConnecting ? 'Conectando' : 'Offline'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4 flex-1 flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* QR Code / Pairing quando não conectado */}
          {!isConnected && (
            <SDRQRCodeDisplay
              qrCode={instance.qr_code}
              pairingCode={instance.pairing_code}
              isLoading={isRefreshing}
              onRefresh={onRefresh}
              onRequestPairingCode={onRefresh}
            />
          )}

          {/* Info de conexão quando conectado */}
          {isConnected && instance.connected_at && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>
                Conectado há{' '}
                {formatDistanceToNow(new Date(instance.connected_at), { locale: ptBR })}
              </span>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing || isDisconnecting}
              className="flex-1 min-w-[100px]"
            >
              {isRefreshing ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              {isRefreshing ? 'Verificando...' : 'Atualizar'}
            </Button>

            {isConnected && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDisconnect}
                disabled={isRefreshing || isDisconnecting}
                className="flex-1 min-w-[100px] text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                {isDisconnecting ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <LogOut className="h-3 w-3 mr-1" />
                )}
                Desconectar
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting || isRefreshing || isDisconnecting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              {isDeleting ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Configurações Avançadas - Dropdown */}
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-3 h-auto hover:bg-muted/50 text-sm border rounded-lg mt-auto"
              >
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  <span>Configurações</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  settingsOpen && "rotate-180"
                )} />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={8}
              avoidCollisions={false}
              className="w-[420px] max-w-[calc(100vw-2rem)] p-0"
            >
              <div className="max-h-[500px] overflow-y-auto p-3">
                <SDRInstanceSettings 
                  instanceId={instance.id}
                  instanceName={instance.instance_name}
                  isConnected={isConnected}
                  className="space-y-4"
                />
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Remover conexão?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{instance.display_name || 'WhatsApp'}"?
              <br /><br />
              <strong className="text-destructive">Atenção:</strong> Todos os contatos sincronizados 
              com esta conexão também serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =============================================================================
// Componente Principal
// =============================================================================
export function SDRConnectionCard() {
  const {
    instances,
    selectedInstance,
    selectedInstanceId,
    selectInstance,
    maxInstances,
    canCreateInstance,
    instanceCount,
    isLoadingInstances,
    isCreating,
    refreshingInstanceId,
    disconnectingInstanceId,
    deletingInstanceId,
    updatingNameInstanceId,
    createInstance,
    refreshConnection,
    disconnectInstance,
    deleteInstance,
    updateDisplayName,
  } = useSDRAgent();

  if (isLoadingInstances) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-[600px]">
      {/* Header com contador e botão de adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Conexões WhatsApp
          </h3>
          <p className="text-sm text-muted-foreground">
            {instanceCount} de {maxInstances} conexões utilizadas
          </p>
        </div>

        <button
          onClick={() => createInstance()}
          disabled={!canCreateInstance || isCreating}
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="relative z-10 flex items-center">
            {isCreating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                Adicionar WhatsApp
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>
      </div>

      {/* Barra de progresso do limite */}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={cn(
            "h-2 rounded-full transition-all",
            instanceCount >= maxInstances 
              ? "bg-destructive" 
              : instanceCount >= maxInstances * 0.8 
                ? "bg-yellow-500" 
                : "bg-primary"
          )}
          style={{ width: `${Math.min((instanceCount / maxInstances) * 100, 100)}%` }}
        />
      </div>

      {/* Lista de instâncias */}
      {instances.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="font-semibold mb-2">Nenhuma conexão</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Conecte seu primeiro WhatsApp para começar a usar o Agente SDR
            </p>
            <Button onClick={() => createInstance()} disabled={isCreating}>
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Criando conexão...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira conexão
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 auto-rows-fr">
          {instances.map((instance) => (
            <div key={instance.id} className="group h-full">
              <InstanceCard
                instance={instance}
                isSelected={instance.id === selectedInstanceId}
                onSelect={() => selectInstance(instance.id)}
                onRefresh={() => refreshConnection(instance.id)}
                onDisconnect={() => disconnectInstance(instance.id)}
                onDelete={() => deleteInstance(instance.id)}
                onUpdateName={(name) => updateDisplayName(instance.id, name)}
                isRefreshing={refreshingInstanceId === instance.id}
                isDisconnecting={disconnectingInstanceId === instance.id}
                isDeleting={deletingInstanceId === instance.id}
                isUpdatingName={updatingNameInstanceId === instance.id}
              />
            </div>
          ))}
        </div>
      )}

      {/* Aviso de limite atingido */}
      {!canCreateInstance && instances.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Limite de conexões atingido
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Seu plano permite até {maxInstances} conexões WhatsApp. 
                Remova uma existente ou faça upgrade do plano.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dicas */}
      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <p className="font-medium mb-2">💡 Dicas:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Cada conexão pode ter suas próprias configurações de agente</li>
          <li>Clique em uma conexão para selecioná-la como ativa</li>
          <li>Use nomes descritivos (ex: "Comercial", "Suporte", "Vendas")</li>
        </ul>
      </div>
    </div>
  );
}
