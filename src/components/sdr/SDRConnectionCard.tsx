// =============================================================================
// Componente: SDRConnectionCard
// Card principal de conexão WhatsApp
// =============================================================================

import { Wifi, WifiOff, RefreshCw, Phone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SDRStatusBadge } from './SDRStatusBadge';
import { SDRQRCodeDisplay } from './SDRQRCodeDisplay';
import { useSDRAgent } from '@/hooks/useSDRAgent';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SDRConnectionCard() {
  const {
    instance,
    isLoadingInstance,
    isCreating,
    isRefreshing,
    connectionStatus,
    isConnected,
    hasInstance,
    qrCode,
    pairingCode,
    createInstance,
    refreshConnection,
  } = useSDRAgent();

  if (isLoadingInstance) {
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-muted-foreground" />
              )}
              Conexão WhatsApp
            </CardTitle>
            <CardDescription>
              {isConnected
                ? 'Seu WhatsApp está conectado e pronto para receber mensagens'
                : 'Conecte seu WhatsApp para ativar o Agente SDR'}
            </CardDescription>
          </div>
          <SDRStatusBadge status={connectionStatus} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informações da conexão quando conectado */}
        {isConnected && instance?.whatsapp_number && (
          <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-900 dark:text-green-100">
                Número conectado
              </p>
              <p className="text-lg font-mono text-green-700 dark:text-green-300">
                {instance.whatsapp_number}
              </p>
              {instance.connected_at && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Conectado há{' '}
                  {formatDistanceToNow(new Date(instance.connected_at), {
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* QR Code quando não conectado */}
        {!isConnected && hasInstance && (
          <SDRQRCodeDisplay
            qrCode={qrCode}
            pairingCode={pairingCode}
            isLoading={isRefreshing}
            onRefresh={refreshConnection}
            onRequestPairingCode={refreshConnection}
          />
        )}

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-3">
          {!hasInstance ? (
            <Button
              onClick={() => createInstance()}
              disabled={isCreating || isRefreshing}
              className="w-full sm:w-auto"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Criando conexão...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Conexão
                </>
              )}
            </Button>
          ) : !isConnected ? (
            <Button
              variant="outline"
              onClick={refreshConnection}
              disabled={isRefreshing || isCreating}
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Reconectando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Conexão
                </>
              )}
            </Button>
          ) : (
            <Button variant="outline" onClick={refreshConnection} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Status
                </>
              )}
            </Button>
          )}
        </div>

        {/* Dicas */}
        {!isConnected && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <p className="font-medium mb-2">💡 Dicas:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use o código de pareamento se preferir não escanear</li>
              <li>O QR Code expira após alguns minutos</li>
              <li>Mantenha o celular conectado à internet</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
