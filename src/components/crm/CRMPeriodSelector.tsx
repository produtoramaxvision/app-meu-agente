import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, ChevronDown, TrendingUp, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CRMPeriodType = 
  | 'today' 
  | 'this_week' 
  | 'this_month' 
  | 'last_month' 
  | 'this_quarter' 
  | 'this_year'
  | 'last_7_days'
  | 'last_30_days'
  | 'last_90_days';

export interface CRMPeriodConfig {
  id: CRMPeriodType;
  label: string;
  shortLabel: string;
  icon: typeof Calendar;
  getDateRange: () => { start: Date; end: Date };
  getPreviousRange: () => { start: Date; end: Date };
}

const periodConfigs: CRMPeriodConfig[] = [
  {
    id: 'today',
    label: 'Hoje',
    shortLabel: 'Hoje',
    icon: Calendar,
    getDateRange: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start: today, end };
    },
    getPreviousRange: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const end = new Date(yesterday);
      end.setHours(23, 59, 59, 999);
      return { start: yesterday, end };
    },
  },
  {
    id: 'this_week',
    label: 'Esta Semana',
    shortLabel: 'Semana',
    icon: CalendarDays,
    getDateRange: () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
    getPreviousRange: () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek - 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    id: 'this_month',
    label: 'Este Mês',
    shortLabel: 'Mês',
    icon: Calendar,
    getDateRange: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
    getPreviousRange: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    id: 'last_month',
    label: 'Mês Passado',
    shortLabel: 'Mês Ant.',
    icon: Calendar,
    getDateRange: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
    getPreviousRange: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    id: 'last_7_days',
    label: 'Últimos 7 dias',
    shortLabel: '7 dias',
    icon: TrendingUp,
    getDateRange: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
    getPreviousRange: () => {
      const end = new Date();
      end.setDate(end.getDate() - 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    id: 'last_30_days',
    label: 'Últimos 30 dias',
    shortLabel: '30 dias',
    icon: TrendingUp,
    getDateRange: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(end.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
    getPreviousRange: () => {
      const end = new Date();
      end.setDate(end.getDate() - 30);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(end.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    id: 'last_90_days',
    label: 'Últimos 90 dias',
    shortLabel: '90 dias',
    icon: TrendingUp,
    getDateRange: () => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(end.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
    getPreviousRange: () => {
      const end = new Date();
      end.setDate(end.getDate() - 90);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(end.getDate() - 89);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    },
  },
  {
    id: 'this_quarter',
    label: 'Este Trimestre',
    shortLabel: 'Trim.',
    icon: Calendar,
    getDateRange: () => {
      const today = new Date();
      const quarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), quarter * 3, 1);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
    getPreviousRange: () => {
      const today = new Date();
      const quarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), (quarter - 1) * 3, 1);
      const end = new Date(today.getFullYear(), quarter * 3, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    id: 'this_year',
    label: 'Este Ano',
    shortLabel: 'Ano',
    icon: Calendar,
    getDateRange: () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
    getPreviousRange: () => {
      const today = new Date();
      const start = new Date(today.getFullYear() - 1, 0, 1);
      const end = new Date(today.getFullYear() - 1, 11, 31);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
];

interface CRMPeriodSelectorProps {
  value: CRMPeriodType;
  onChange: (period: CRMPeriodType) => void;
  className?: string;
  compact?: boolean;
}

export function CRMPeriodSelector({ 
  value, 
  onChange, 
  className,
  compact = false 
}: CRMPeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const selectedConfig = periodConfigs.find(p => p.id === value) || periodConfigs[2];
  const Icon = selectedConfig.icon;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={cn(
            "flex items-center gap-2 font-medium",
            "bg-background/80 backdrop-blur-sm border-border/60",
            "hover:bg-accent/80 hover:border-primary/30",
            "transition-all duration-200",
            className
          )}
        >
          <Icon className={cn("text-primary", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
          <span className={compact ? "hidden sm:inline" : ""}>
            {compact ? selectedConfig.shortLabel : selectedConfig.label}
          </span>
          <ChevronDown className={cn(
            "text-muted-foreground transition-transform duration-200",
            compact ? "h-3 w-3" : "h-4 w-4",
            open && "rotate-180"
          )} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Período Atual
        </div>
        {periodConfigs.slice(0, 4).map((config) => {
          const ConfigIcon = config.icon;
          return (
            <DropdownMenuItem
              key={config.id}
              onClick={() => {
                onChange(config.id);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                value === config.id && "bg-primary/10 text-primary"
              )}
            >
              <ConfigIcon className="h-4 w-4" />
              <span>{config.label}</span>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Período Relativo
        </div>
        {periodConfigs.slice(4, 7).map((config) => {
          const ConfigIcon = config.icon;
          return (
            <DropdownMenuItem
              key={config.id}
              onClick={() => {
                onChange(config.id);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                value === config.id && "bg-primary/10 text-primary"
              )}
            >
              <ConfigIcon className="h-4 w-4" />
              <span>{config.label}</span>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Período Longo
        </div>
        {periodConfigs.slice(7).map((config) => {
          const ConfigIcon = config.icon;
          return (
            <DropdownMenuItem
              key={config.id}
              onClick={() => {
                onChange(config.id);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                value === config.id && "bg-primary/10 text-primary"
              )}
            >
              <ConfigIcon className="h-4 w-4" />
              <span>{config.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Utility para obter configuração do período
export function getPeriodConfig(period: CRMPeriodType): CRMPeriodConfig {
  return periodConfigs.find(p => p.id === period) || periodConfigs[2];
}

// Export da lista de períodos
export { periodConfigs };
