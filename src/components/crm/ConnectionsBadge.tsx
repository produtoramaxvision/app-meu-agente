import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Circle } from 'lucide-react';

/**
 * ConnectionsBadge - Badge unificado para exibir conexões WhatsApp
 * 
 * Mostra quantas instâncias estão conectadas de forma clara e concisa.
 * Ao passar o mouse, exibe tooltip detalhado com todas as instâncias,
 * seus status e números WhatsApp.
 * 
 * Feedbacks visuais:
 * - Verde: Há conexões ativas
 * - Laranja: Há instâncias mas nenhuma conectada  
 * - Cinza: Nenhuma instância cadastrada
 * 
 * @param instances - Lista de instâncias Evolution API
 * @param onInstanceClick - Callback ao clicar em uma instância na tooltip
 * @param className - Classes CSS adicionais
 */

interface EvolutionInstance {
  id: string;
  instance_name: string;
  display_name?: string;
  connection_status?: string;
  whatsapp_number?: string;
}

interface ConnectionsBadgeProps {
  instances: EvolutionInstance[];
  onInstanceClick?: (instanceId: string) => void;
  className?: string;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'connected':
      return 'bg-green-500';
    case 'connecting':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-400';
  }
};

const getStatusText = (status?: string) => {
  switch (status) {
    case 'connected':
      return 'Conectado';
    case 'connecting':
      return 'Conectando';
    default:
      return 'Desconectado';
  }
};

export function ConnectionsBadge({ instances, onInstanceClick, className }: ConnectionsBadgeProps) {
  const connectedCount = instances.filter(i => i.connection_status === 'connected').length;
  const totalCount = instances.length;

  // Caso especial: nenhuma instância cadastrada
  if (totalCount === 0) {
    return (
      <Badge 
        variant="secondary" 
        className={cn(
          "text-[10px] px-1.5 py-0 h-5 font-medium border-0 bg-secondary/30 opacity-60 flex items-center gap-1",
          className
        )}
      >
        <Circle className="w-1.5 h-1.5 fill-muted-foreground stroke-none" />
        Sem conexão
      </Badge>
    );
  }

  // Visual diferente para quando há instâncias mas nenhuma conectada
  const hasConnections = connectedCount > 0;
  const badgeVariant = hasConnections ? "outline" : "secondary";
  const badgeStyles = hasConnections 
    ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20" 
    : "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20";

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div
          onClick={(e) => e.stopPropagation()}
          className="inline-flex"
        >
          <Badge 
            variant={badgeVariant}
            className={cn(
              "text-[10px] px-1.5 py-0.5 h-5 font-medium flex items-center gap-1 cursor-help transition-all hover:scale-105 active:scale-95",
              badgeStyles,
              className
            )}
          >
            {hasConnections ? (
              <Wifi className="w-2.5 h-2.5" />
            ) : (
              <WifiOff className="w-2.5 h-2.5" />
            )}
            <span className="font-semibold">
              {connectedCount}/{totalCount} {totalCount === 1 ? 'Conexão' : 'Conexões'}
            </span>
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        align="start"
        className="max-w-[280px] p-3 space-y-2 bg-popover/95 backdrop-blur-sm border-border/50 shadow-lg"
      >
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-foreground/90 flex items-center gap-1.5">
            <Wifi className="w-3 h-3" />
            Instâncias WhatsApp
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Este lead está salvo em {totalCount} {totalCount === 1 ? 'instância' : 'instâncias'}, com{' '}
            <span className="font-semibold text-green-600 dark:text-green-400">
              {connectedCount} conectada{connectedCount !== 1 && 's'}
            </span>
          </p>
        </div>

        <div className="space-y-1.5 pt-1 border-t border-border/30">
          {instances.map((instance) => {
            const isConnected = instance.connection_status === 'connected';
            return (
              <div
                key={instance.id}
                onClick={() => onInstanceClick?.(instance.id)}
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded-md transition-colors text-left w-full",
                  onInstanceClick && "cursor-pointer hover:bg-accent/50"
                )}
              >
                <span 
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    getStatusColor(instance.connection_status)
                  )}
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-[11px] font-medium text-foreground truncate">
                    {instance.display_name || instance.instance_name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className={cn(
                      "font-medium",
                      isConnected && "text-green-600 dark:text-green-400"
                    )}>
                      {getStatusText(instance.connection_status)}
                    </span>
                    {instance.whatsapp_number && (
                      <>
                        <span>•</span>
                        <span className="truncate">{instance.whatsapp_number}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {onInstanceClick && (
          <p className="text-[9px] text-muted-foreground/70 pt-1 border-t border-border/20">
            💡 Clique em uma instância para gerenciá-la
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
