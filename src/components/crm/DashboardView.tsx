import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Target, 
  Award, 
  Users,
  Activity,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PipelineMetrics } from '@/hooks/useCRMPipeline';
import { EvolutionContact } from '@/types/sdr';
import { useTemporalMetrics } from '@/hooks/useTemporalMetrics';
import { CRMPeriodSelector, CRMPeriodType } from './CRMPeriodSelector';
import { CRMMetricCard, CRMMetricsGrid } from './CRMMetricCard';
import { CRMTrendChart } from './CRMTrendChart';
import { CRMForecastCard } from './CRMForecastCard';

interface DashboardViewProps {
  metrics: PipelineMetrics;
  contacts: EvolutionContact[];
  className?: string;
}

export function DashboardView({ metrics, contacts, className }: DashboardViewProps) {
  const [period, setPeriod] = useState<CRMPeriodType>('this_month');
  
  // Hook de métricas temporais
  const temporalMetrics = useTemporalMetrics({ contacts, period });

  // Dados para funil de conversão (com cores mais sofisticadas para o card)
  const funnelStages = [
    {
      label: 'Novo',
      count: metrics.byStatus.novo || 0,
      barClass: 'bg-gradient-to-r from-blue-500/30 via-blue-500 to-blue-400',
      dotClass: 'bg-blue-400',
    },
    {
      label: 'Contatado',
      count: metrics.byStatus.contatado || 0,
      barClass: 'bg-gradient-to-r from-indigo-500/30 via-indigo-500 to-indigo-400',
      dotClass: 'bg-indigo-400',
    },
    {
      label: 'Qualificado',
      count: metrics.byStatus.qualificado || 0,
      barClass: 'bg-gradient-to-r from-purple-500/30 via-purple-500 to-purple-400',
      dotClass: 'bg-purple-400',
    },
    {
      label: 'Proposta',
      count: metrics.byStatus.proposta || 0,
      barClass: 'bg-gradient-to-r from-amber-500/30 via-amber-500 to-amber-400',
      dotClass: 'bg-amber-400',
    },
    {
      label: 'Negociando',
      count: metrics.byStatus.negociando || 0,
      barClass: 'bg-gradient-to-r from-orange-500/30 via-orange-500 to-orange-400',
      dotClass: 'bg-orange-400',
    },
    {
      label: 'Ganho',
      count: metrics.byStatus.ganho || 0,
      barClass: 'bg-gradient-to-r from-emerald-500/30 via-emerald-500 to-emerald-400',
      dotClass: 'bg-emerald-400',
    },
  ];

  const maxCount = Math.max(...funnelStages.map(s => s.count), 1);

  // Formatadores
  const currencyFormatter = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  
  const percentFormatter = (value: number) => `${value}`;

  return (
    <div className={cn("p-4 sm:p-6 space-y-6 overflow-y-auto", className)}>
      {/* Header com seletor de período */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Dashboard CRM</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas métricas de vendas em tempo real
          </p>
        </div>
        <CRMPeriodSelector 
          value={period} 
          onChange={setPeriod}
          compact={false}
        />
      </div>

      {/* Cards de Métricas com Comparativo Temporal */}
      <CRMMetricsGrid>
        <CRMMetricCard
          title="Novos Leads"
          icon={Users}
          metric={temporalMetrics.leads}
          iconColor="text-blue-500"
        />
        <CRMMetricCard
          title="Conversões"
          icon={Award}
          metric={temporalMetrics.conversions}
          iconColor="text-green-500"
        />
        <CRMMetricCard
          title="Receita"
          icon={DollarSign}
          metric={temporalMetrics.revenue}
          formatter={currencyFormatter}
          iconColor="text-emerald-500"
        />
        <CRMMetricCard
          title="Win Rate"
          icon={Target}
          metric={temporalMetrics.winRate}
          suffix="%"
          formatter={percentFormatter}
          iconColor="text-purple-500"
        />
      </CRMMetricsGrid>

      {/* Gráfico de Tendência + Forecast */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CRMTrendChart 
          data={temporalMetrics.trendData}
          periodLabel={temporalMetrics.periodLabel}
        />
        <CRMForecastCard 
          forecast={temporalMetrics.forecast}
        />
      </div>

      {/* Seção de Métricas Secundárias */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Ticket Médio com comparativo */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <BarChart3 className="h-4 w-4 text-amber-500" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ticket Médio
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600">
                {currencyFormatter(temporalMetrics.avgDealSize.current)}
              </span>
              {temporalMetrics.avgDealSize.changeDirection !== 'neutral' && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    temporalMetrics.avgDealSize.trend === 'positive' 
                      ? "bg-green-500/10 text-green-600" 
                      : "bg-red-500/10 text-red-600"
                  )}
                >
                  {temporalMetrics.avgDealSize.changeDirection === 'up' ? '+' : '-'}
                  {temporalMetrics.avgDealSize.change}%
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média dos deals ganhos no período
            </p>
          </CardContent>
        </Card>

        {/* Velocidade de Vendas */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10">
                <Clock className="h-4 w-4 text-indigo-500" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ciclo de Vendas
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-600">
                {metrics.salesVelocity}
              </span>
              <span className="text-sm text-muted-foreground">dias</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tempo médio para fechar um deal
            </p>
          </CardContent>
        </Card>

        {/* Pipeline Value */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10">
                <Activity className="h-4 w-4 text-cyan-500" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pipeline Aberto
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-600">
                {currencyFormatter(metrics.pipelineValue)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor total em negociação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funil de Conversão */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Funil de Conversão
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Distribuição atual dos leads por estágio
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-primary/40 text-primary/90 bg-primary/5">
              {metrics.byStatus.ganho || 0} ganhos •{' '}
              {metrics.qualificationRate}% qualificação
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {funnelStages.map((stage, index) => {
            const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const width = stage.count === 0 ? 0 : Math.max(8, percentage);
            const nextStage = funnelStages[index + 1];
            const conversionRate = stage.count > 0 && nextStage 
              ? Math.round((nextStage.count / stage.count) * 100)
              : 0;

            return (
              <div key={stage.label} className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", stage.dotClass)} />
                    <span className="font-medium">{stage.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[0.7rem] sm:text-xs bg-muted/60">
                      {stage.count} leads
                    </Badge>
                    {nextStage && conversionRate > 0 && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[0.7rem] sm:text-xs border-transparent",
                          conversionRate >= 70
                            ? "bg-emerald-500/10 text-emerald-500"
                            : conversionRate >= 40
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-red-500/10 text-red-500"
                        )}
                      >
                        {conversionRate}% →
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="h-3 sm:h-3.5 rounded-full bg-muted/60 overflow-hidden">
                  <motion.div 
                    className={cn("h-full rounded-full shadow-[0_0_0_1px_rgba(15,23,42,0.15)]", stage.barClass)}
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.05 }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Estatísticas Adicionais */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Taxa de Qualificação */}
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-emerald-500/5 via-transparent to-sky-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                  <Target className="h-4 w-4 text-emerald-500" />
                </div>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Qualificação
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[0.7rem] sm:text-xs border-transparent",
                  metrics.qualificationRate >= 50
                    ? "bg-emerald-500/10 text-emerald-500"
                    : metrics.qualificationRate >= 30
                    ? "bg-amber-500/10 text-amber-500"
                    : "bg-red-500/10 text-red-500"
                )}
              >
                alvo: 50%
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-3xl font-bold",
                  metrics.qualificationRate >= 50
                    ? "text-emerald-500"
                    : metrics.qualificationRate >= 30
                    ? "text-amber-500"
                    : "text-red-500"
                )}
              >
                {metrics.qualificationRate}%
              </span>
              <span className="text-sm text-muted-foreground">dos leads</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-sky-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.max(metrics.qualificationRate, 4), 100)}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leads que avançaram para qualificado ou além ao longo do período.
            </p>
          </CardContent>
        </Card>

        {/* Distribuição por Status */}
        <Card className="relative overflow-hidden border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10">
                <Activity className="h-4 w-4 text-sky-500" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Distribuição por Status
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                <span>Em negociação</span>
              </div>
              <Badge variant="secondary" className="text-[0.7rem] sm:text-xs bg-orange-500/10 text-orange-400">
                {metrics.byStatus.negociando || 0}
              </Badge>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Ganhos</span>
              </div>
              <Badge variant="secondary" className="text-[0.7rem] sm:text-xs bg-emerald-500/10 text-emerald-400">
                {metrics.byStatus.ganho || 0}
              </Badge>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span>Perdidos</span>
              </div>
              <Badge variant="secondary" className="text-[0.7rem] sm:text-xs bg-rose-500/10 text-rose-400">
                {metrics.byStatus.perdido || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
