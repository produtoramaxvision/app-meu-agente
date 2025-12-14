// =============================================================================
// Componente: SDRQRCodeDisplay
// Exibe QR Code ou Pairing Code para conexão WhatsApp
// =============================================================================

import { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function isBase64Image(value: string | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.startsWith('data:image')) return true;

  // Heurística mais segura: base64 "puro" e com assinaturas comuns
  // (evita tratar strings longas de QR como imagem base64)
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed)) return false;
  if (trimmed.length % 4 !== 0) return false;

  // Assinaturas típicas
  return (
    trimmed.startsWith('iVBOR') || // PNG
    trimmed.startsWith('/9j/') ||  // JPEG
    trimmed.startsWith('R0lGOD') || // GIF
    trimmed.startsWith('UklGR') // WEBP
  );
}

interface SDRQRCodeDisplayProps {
  qrCode: string | null;
  pairingCode: string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onRequestPairingCode?: () => void;
}

export function SDRQRCodeDisplay({
  qrCode,
  pairingCode,
  isLoading = false,
  onRefresh,
  onRequestPairingCode,
}: SDRQRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Determina se o qrCode é uma imagem base64 ou um valor para gerar QR
  const isQrBase64 = useMemo(() => isBase64Image(qrCode), [qrCode]);

  // Prepara o src da imagem se for base64
  const qrImageSrc = useMemo(() => {
    if (!qrCode) return null;
    if (qrCode.startsWith('data:image')) return qrCode;
    // Se for base64 sem prefixo, adiciona o prefixo
    if (isQrBase64) return `data:image/png;base64,${qrCode}`;
    return null;
  }, [qrCode, isQrBase64]);

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
            <TabsTrigger value="pairing">
              Código de Pareamento
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qrcode" className="space-y-4 flex flex-col items-center">
            <div className="flex justify-center w-full">
              <div
                className={cn(
                  'p-4 bg-white rounded-lg shadow-inner min-h-[260px] min-w-[260px] flex items-center justify-center',
                  isLoading && 'opacity-50'
                )}
              >
                {qrCode ? (
                  isQrBase64 && qrImageSrc ? (
                    // Se for base64 de imagem, mostra como <img>
                    <img 
                      src={qrImageSrc} 
                      alt="QR Code WhatsApp"
                      width={200}
                      height={200}
                      className="w-[200px] h-[200px] object-contain"
                    />
                  ) : (
                    // Se for valor de texto, gera QR com biblioteca
                    <QRCodeSVG
                      value={qrCode}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  )
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

          <TabsContent value="pairing" className="space-y-4 flex flex-col items-center">
            <div className="flex flex-col items-center gap-4 w-full">
              {pairingCode ? (
                <>
                  <div className="text-4xl font-mono font-bold tracking-[0.5em] text-center bg-muted px-6 py-4 rounded-lg min-h-[88px] flex items-center justify-center">
                    {pairingCode}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyPairingCode}
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
                </>
              ) : (
                <div className="flex flex-col items-center justify-center w-[260px] min-h-[260px] rounded-lg bg-muted/40 border border-dashed border-muted-foreground/30 text-center p-6">
                  <Smartphone className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    O código de pareamento não está disponível no momento.
                  </p>
                </div>
              )}
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
              {isLoading ? 'Atualizando...' : 'Atualizar Código'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
