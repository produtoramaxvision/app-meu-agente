// =============================================================================
// Componente: SDRStatusBadge
// Badge de status da conexão WhatsApp
// =============================================================================

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { ConnectionStatus } from '@/types/sdr';
import { CONNECTION_STATUS_CONFIG } from '@/types/sdr';

interface SDRStatusBadgeProps {
  status: ConnectionStatus;
  className?: string;
  showIcon?: boolean;
}

export function SDRStatusBadge({
  status,
  className,
  showIcon = true,
}: SDRStatusBadgeProps) {
  const config = CONNECTION_STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium transition-all',
        config.color,
        status === 'connecting' && 'animate-pulse',
        className
      )}
    >
      {showIcon && <span className="mr-1.5">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}
