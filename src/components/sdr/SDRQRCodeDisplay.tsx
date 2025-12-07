// =============================================================================
// Componente: SDRQRCodeDisplay
// Exibe QR Code ou Pairing Code para conexão WhatsApp
// =============================================================================

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SDRQRCodeDisplayProps {
  qrCode: string | null;
  pairingCode: string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function SDRQRCodeDisplay({
  qrCode,
  pairingCode,
  isLoading = false,
  onRefresh,
}: SDRQRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPairingCode = async () => {
    if (!pairingCode) return;

    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar código');
    }
  };

  if (!qrCode && !pairingCode) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Smartphone className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-center">
            Clique em "Gerar QR Code" para conectar seu WhatsApp
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="qrcode" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="qrcode" disabled={!qrCode}>
              QR Code
            </TabsTrigger>
            <TabsTrigger value="pairing" disabled={!pairingCode}>
              Código de Pareamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qrcode" className="space-y-4">
            <div className="flex justify-center">
              <div
                className={cn(
                  'p-4 bg-white rounded-lg shadow-inner',
                  isLoading && 'opacity-50'
                )}
              >
                {qrCode ? (
                  <QRCodeSVG
                    value={qrCode}
                    size={200}
                    level="M"
                    includeMargin={false}
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100">
                    <p className="text-gray-400 text-sm">QR não disponível</p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Abra o WhatsApp no seu celular, vá em{' '}
              <span className="font-medium">Configurações → Aparelhos conectados</span>{' '}
              e escaneie o código
            </p>
          </TabsContent>

          <TabsContent value="pairing" className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div className="text-4xl font-mono font-bold tracking-[0.5em] text-center bg-muted px-6 py-4 rounded-lg">
                {pairingCode || '--------'}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPairingCode}
                disabled={!pairingCode}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar Código
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Abra o WhatsApp, vá em{' '}
              <span className="font-medium">Configurações → Aparelhos conectados → Conectar com número de telefone</span>{' '}
              e digite o código acima
            </p>
          </TabsContent>
        </Tabs>

        {onRefresh && (
          <div className="flex justify-center mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              {isLoading ? 'Atualizando...' : 'Atualizar QR Code'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
