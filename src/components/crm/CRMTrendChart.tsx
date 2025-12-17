import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { DailyTrendData } from '@/hooks/useTemporalMetrics';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type MetricType = 'leads' | 'conversions' | 'value';

interface CRMTrendChartProps {
  data: DailyTrendData[];
  className?: string;
  periodLabel: string;
}

const metricConfig: Record<MetricType, {
  key: keyof DailyTrendData;
  label: string;
  color: string;
  gradientId: string;
  icon: typeof TrendingUp;
  formatter: (value: number) => string;
}> = {
  leads: {
    key: 'newLeads',
    label: 'Novos Leads',
    color: '#6366f1',
    gradientId: 'leadsGradient',
    icon: Users,
    formatter: (v) => v.toString(),
  },
  conversions: {
    key: 'conversions',
    label: 'Conversões',
    color: '#22c55e',
    gradientId: 'conversionsGradient',
    icon: Activity,
    formatter: (v) => v.toString(),
  },
  value: {
    key: 'cumulativeValue',
    label: 'Receita Acumulada',
    color: '#f59e0b',
    gradientId: 'valueGradient',
    icon: DollarSign,
    formatter: (v) => `R$ ${v.toLocaleString('pt-BR')}`,
  },
};

// Custom Tooltip Component
function CustomTooltip({ 
  active, 
  payload, 
  label,
  metricType 
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
  metricType: MetricType;
}) {
  if (!active || !payload || !payload.length) return null;

  const config = metricConfig[metricType];
  const value = payload[0]?.value ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3"
    >
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <span className="font-semibold text-sm">
          {config.formatter(value)}
        </span>
      </div>
    </motion.div>
  );
}

export function CRMTrendChart({ data, className, periodLabel }: CRMTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType>('leads');
  const config = metricConfig[activeMetric];
  const Icon = config.icon;

  // Calcular média para linha de referência
  const average = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, d) => acc + (d[config.key] as number), 0);
    return Math.round(sum / data.length);
  }, [data, config.key]);

  // Calcular total
  const total = useMemo(() => {
    if (activeMetric === 'value') {
      // Para valor, pegar o último cumulativo
      return data[data.length - 1]?.cumulativeValue ?? 0;
    }
    return data.reduce((acc, d) => acc + (d[config.key] as number), 0);
  }, [data, activeMetric, config.key]);

  const hasData = data.length > 0 && data.some(d => (d[config.key] as number) > 0);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <TrendingUp 
                className="h-5 w-5" 
                style={{ color: config.color }}
              />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Tendência</CardTitle>
              <p className="text-xs text-muted-foreground">{periodLabel}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="font-semibold"
              style={{ 
                backgroundColor: `${config.color}15`,
                color: config.color,
              }}
            >
              <Icon className="h-3 w-3 mr-1" />
              {config.formatter(total)}
            </Badge>
          </div>
        </div>
        
        {/* Tabs de seleção de métrica */}
        <Tabs value={activeMetric} onValueChange={(v) => setActiveMetric(v as MetricType)}>
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="leads" className="text-xs px-2">
              <Users className="h-3 w-3 mr-1 hidden sm:inline" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="conversions" className="text-xs px-2">
              <Activity className="h-3 w-3 mr-1 hidden sm:inline" />
              Conversões
            </TabsTrigger>
            <TabsTrigger value="value" className="text-xs px-2">
              <DollarSign className="h-3 w-3 mr-1 hidden sm:inline" />
              Receita
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="pt-0 pb-4">
        <motion.div
          key={activeMetric}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-[200px] sm:h-[240px] w-full"
        >
          {!hasData ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Icon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sem dados para este período</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false}
                  className="stroke-border/50"
                />
                
                <XAxis
                  dataKey="dateLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickMargin={8}
                  interval="preserveStartEnd"
                />
                
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickMargin={8}
                  width={activeMetric === 'value' ? 60 : 30}
                  tickFormatter={(v) => 
                    activeMetric === 'value' 
                      ? `R$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`
                      : v
                  }
                />
                
                <Tooltip 
                  content={<CustomTooltip metricType={activeMetric} />}
                  cursor={{ 
                    stroke: config.color, 
                    strokeWidth: 1, 
                    strokeDasharray: '4 4' 
                  }}
                />
                
                {/* Linha de média */}
                {average > 0 && activeMetric !== 'value' && (
                  <ReferenceLine
                    y={average}
                    stroke={config.color}
                    strokeDasharray="5 5"
                    strokeOpacity={0.5}
                    label={{
                      value: `Média: ${average}`,
                      position: 'right',
                      fill: config.color,
                      fontSize: 10,
                    }}
                  />
                )}
                
                <Area
                  type="monotone"
                  dataKey={config.key}
                  stroke={config.color}
                  strokeWidth={2}
                  fill={`url(#${config.gradientId})`}
                  animationDuration={1000}
                  animationEasing="ease-out"
                  dot={data.length <= 14 ? {
                    r: 3,
                    fill: config.color,
                    strokeWidth: 0,
                  } : false}
                  activeDot={{
                    r: 5,
                    fill: config.color,
                    stroke: 'hsl(var(--background))',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
