import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TemporalMetric } from '@/hooks/useTemporalMetrics';
import { cn } from '@/lib/utils';

interface CRMMetricCardProps {
  title: string;
  icon: LucideIcon;
  metric: TemporalMetric;
  formatter?: (value: number) => string;
  suffix?: string;
  iconColor?: string;
  className?: string;
  compact?: boolean;
}

const defaultFormatter = (value: number) => value.toLocaleString('pt-BR');

export function CRMMetricCard({
  title,
  icon: Icon,
  metric,
  formatter = defaultFormatter,
  suffix = '',
  iconColor = 'text-primary',
  className,
  compact = false,
}: CRMMetricCardProps) {
  const { current, previous, change, changeDirection, trend } = metric;

  const trendConfig = {
    positive: {
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    negative: {
      icon: TrendingDown,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
    neutral: {
      icon: Minus,
      color: 'text-muted-foreground',
      bg: 'bg-muted/50',
      borderColor: 'border-border',
    },
  };

  const config = trendConfig[trend];
  const TrendIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn(
        "relative overflow-hidden group hover:shadow-md transition-shadow duration-300",
        className
      )}>
        {/* Gradient accent no topo */}
        <div 
          className={cn(
            "absolute top-0 left-0 right-0 h-1",
            trend === 'positive' ? "bg-gradient-to-r from-green-500 to-emerald-400" :
            trend === 'negative' ? "bg-gradient-to-r from-red-500 to-orange-400" :
            "bg-gradient-to-r from-gray-400 to-gray-300"
          )}
        />
        
        <CardContent className={cn("pt-5", compact ? "pb-4" : "pb-5")}>
          <div className="flex items-start justify-between gap-3">
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className={cn(
                    "p-1.5 rounded-lg",
                    `${iconColor.replace('text-', 'bg-')}/10`
                  )}
                >
                  <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
                <span className="text-sm font-medium text-muted-foreground truncate">
                  {title}
                </span>
              </div>
              
              {/* Valor principal */}
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex items-baseline gap-1"
              >
                <span className={cn(
                  "font-bold tracking-tight",
                  compact ? "text-xl" : "text-2xl sm:text-3xl"
                )}>
                  {formatter(current)}
                </span>
                {suffix && (
                  <span className="text-sm text-muted-foreground">{suffix}</span>
                )}
              </motion.div>
              
              {/* Comparativo */}
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-2 py-0.5 flex items-center gap-1 border",
                    config.bg,
                    config.color,
                    config.borderColor
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  {changeDirection === 'neutral' ? (
                    <span>Sem variação</span>
                  ) : (
                    <span>
                      {changeDirection === 'up' ? '+' : '-'}{change}%
                    </span>
                  )}
                </Badge>
                
                {!compact && (
                  <span className="text-xs text-muted-foreground">
                    vs. {formatter(previous)} anterior
                  </span>
                )}
              </div>
            </div>
            
            {/* Mini sparkline visual (decorativo) */}
            {!compact && (
              <div className="flex-shrink-0 hidden sm:block">
                <svg 
                  width="64" 
                  height="32" 
                  viewBox="0 0 64 32"
                  className="opacity-50"
                >
                  <defs>
                    <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="0%" 
                        stopColor={trend === 'positive' ? '#22c55e' : trend === 'negative' ? '#ef4444' : '#9ca3af'} 
                        stopOpacity={0.3}
                      />
                      <stop 
                        offset="100%" 
                        stopColor={trend === 'positive' ? '#22c55e' : trend === 'negative' ? '#ef4444' : '#9ca3af'} 
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  
                  {/* Área preenchida */}
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    d={
                      trend === 'positive' 
                        ? "M0,28 Q16,24 24,20 T48,12 T64,4 V32 H0 Z"
                        : trend === 'negative'
                        ? "M0,4 Q16,8 24,12 T48,20 T64,28 V32 H0 Z"
                        : "M0,16 Q16,14 24,16 T48,16 T64,16 V32 H0 Z"
                    }
                    fill={`url(#gradient-${title})`}
                  />
                  
                  {/* Linha */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    d={
                      trend === 'positive' 
                        ? "M0,28 Q16,24 24,20 T48,12 T64,4"
                        : trend === 'negative'
                        ? "M0,4 Q16,8 24,12 T48,20 T64,28"
                        : "M0,16 Q16,14 24,16 T48,16 T64,16"
                    }
                    fill="none"
                    stroke={trend === 'positive' ? '#22c55e' : trend === 'negative' ? '#ef4444' : '#9ca3af'}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Grid wrapper para múltiplos cards
interface CRMMetricsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function CRMMetricsGrid({ children, className }: CRMMetricsGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      className
    )}>
      {children}
    </div>
  );
}
