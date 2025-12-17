import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Zap
} from 'lucide-react';
import { ForecastData } from '@/hooks/useTemporalMetrics';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CRMForecastCardProps {
  forecast: ForecastData;
  className?: string;
}

// Gauge visual simples com CSS
function ConfidenceGauge({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return { ring: 'stroke-green-500', bg: 'bg-green-500/10', text: 'text-green-600' };
    if (score >= 40) return { ring: 'stroke-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-600' };
    return { ring: 'stroke-red-500', bg: 'bg-red-500/10', text: 'text-red-600' };
  };

  const colors = getScoreColor(score);
  const circumference = 2 * Math.PI * 40; // raio 40
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx="48"
          cy="48"
          r="40"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={colors.ring}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className={cn("text-2xl font-bold", colors.text)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {score}%
        </motion.span>
        <span className="text-[10px] text-muted-foreground">confiança</span>
      </div>
    </div>
  );
}

// Mini card de cenário
function ScenarioCard({ 
  label, 
  value, 
  icon: Icon, 
  variant 
}: { 
  label: string; 
  value: number; 
  icon: typeof TrendingUp; 
  variant: 'best' | 'expected' | 'worst';
}) {
  const variantStyles = {
    best: {
      bg: 'bg-green-500/10 dark:bg-green-500/20',
      border: 'border-green-500/30',
      text: 'text-green-600 dark:text-green-400',
      icon: 'text-green-500',
    },
    expected: {
      bg: 'bg-primary/10',
      border: 'border-primary/30',
      text: 'text-primary',
      icon: 'text-primary',
    },
    worst: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      icon: 'text-amber-500',
    },
  };

  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: variant === 'best' ? 0.2 : variant === 'expected' ? 0.3 : 0.4 }}
      className={cn(
        "rounded-lg p-3 border",
        styles.bg,
        styles.border
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-3.5 w-3.5", styles.icon)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-lg font-bold", styles.text)}>
        R$ {value.toLocaleString('pt-BR')}
      </span>
    </motion.div>
  );
}

export function CRMForecastCard({ forecast, className }: CRMForecastCardProps) {
  const {
    weightedPipelineValue,
    expectedCloses,
    bestCaseValue,
    worstCaseValue,
    confidenceScore,
  } = forecast;

  // Determinar health do pipeline
  const pipelineHealth = confidenceScore >= 70 ? 'healthy' : confidenceScore >= 40 ? 'moderate' : 'low';

  const healthConfig = {
    healthy: {
      icon: Sparkles,
      label: 'Pipeline Saudável',
      color: 'text-green-600',
      bg: 'bg-green-500/10',
    },
    moderate: {
      icon: AlertTriangle,
      label: 'Atenção Necessária',
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    low: {
      icon: AlertTriangle,
      label: 'Pipeline Fraco',
      color: 'text-red-600',
      bg: 'bg-red-500/10',
    },
  };

  const health = healthConfig[pipelineHealth];
  const HealthIcon = health.icon;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Forecast</CardTitle>
              <p className="text-xs text-muted-foreground">Previsão de receita</p>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge 
                  variant="secondary"
                  className={cn("flex items-center gap-1", health.bg, health.color)}
                >
                  <HealthIcon className="h-3 w-3" />
                  <span className="hidden sm:inline text-xs">{health.label}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Baseado na distribuição de leads por estágio
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Valor principal + Gauge */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">
              Receita Ponderada
            </p>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-baseline gap-2"
            >
              <span className="text-2xl sm:text-3xl font-bold text-primary truncate">
                R$ {weightedPipelineValue.toLocaleString('pt-BR')}
              </span>
            </motion.div>
            
            {/* Fechamentos esperados */}
            <div className="flex items-center gap-2 mt-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">
                ~{expectedCloses} fechamentos esperados
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <ConfidenceGauge score={confidenceScore} />
          </div>
        </div>
        
        {/* Barra de progresso do range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pior cenário</span>
            <span>Melhor cenário</span>
          </div>
          <div className="relative">
            <Progress 
              value={bestCaseValue > 0 ? (weightedPipelineValue / bestCaseValue) * 100 : 0} 
              className="h-2"
            />
            {/* Indicador do valor ponderado */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -top-1 transform -translate-x-1/2"
              style={{ 
                left: `${bestCaseValue > 0 ? (weightedPipelineValue / bestCaseValue) * 100 : 0}%` 
              }}
            >
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-background shadow-md" />
            </motion.div>
          </div>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-amber-600">
              R$ {worstCaseValue.toLocaleString('pt-BR')}
            </span>
            <span className="text-green-600">
              R$ {bestCaseValue.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>
        
        {/* Cenários */}
        <div className="grid grid-cols-3 gap-2">
          <ScenarioCard
            label="Pessimista"
            value={worstCaseValue}
            icon={TrendingDown}
            variant="worst"
          />
          <ScenarioCard
            label="Ponderado"
            value={weightedPipelineValue}
            icon={Target}
            variant="expected"
          />
          <ScenarioCard
            label="Otimista"
            value={bestCaseValue}
            icon={TrendingUp}
            variant="best"
          />
        </div>
        
        {/* Dica */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            O forecast é calculado com base na probabilidade de cada estágio do pipeline. 
            Avance leads para estágios mais maduros para aumentar a confiança.
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}
