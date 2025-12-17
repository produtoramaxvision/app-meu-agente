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

  // Dados para funil de conversão
  const funnelStages = [
    { label: 'Novo', count: metrics.byStatus.novo || 0, color: 'bg-blue-500' },
    { label: 'Contatado', count: metrics.byStatus.contatado || 0, color: 'bg-indigo-500' },
    { label: 'Qualificado', count: metrics.byStatus.qualificado || 0, color: 'bg-purple-500' },
    { label: 'Proposta', count: metrics.byStatus.proposta || 0, color: 'bg-amber-500' },
    { label: 'Negociando', count: metrics.byStatus.negociando || 0, color: 'bg-orange-500' },
    { label: 'Ganho', count: metrics.byStatus.ganho || 0, color: 'bg-green-500' },
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
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Funil de Conversão</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Distribuição atual dos leads por estágio
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {funnelStages.map((stage, index) => {
            const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const nextStage = funnelStages[index + 1];
            const conversionRate = stage.count > 0 && nextStage 
              ? Math.round((nextStage.count / stage.count) * 100)
              : 0;

            return (
              <div key={stage.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.label}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {stage.count} leads
                    </Badge>
                    {nextStage && conversionRate > 0 && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          conversionRate >= 70 ? "text-green-600 border-green-600" :
                          conversionRate >= 40 ? "text-amber-600 border-amber-600" :
                          "text-red-600 border-red-600"
                        )}
                      >
                        {conversionRate}% →
                      </Badge>
                    )}
                  </div>
                </div>
                <motion.div 
                  className={cn("h-8 rounded-md", stage.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Estatísticas Adicionais */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Qualificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-3xl font-bold",
                metrics.qualificationRate >= 50 ? "text-green-600" :
                metrics.qualificationRate >= 30 ? "text-amber-600" :
                "text-red-600"
              )}>
                {metrics.qualificationRate}%
              </span>
              <span className="text-sm text-muted-foreground">
                dos leads
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Leads que avançaram para qualificado ou além
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Em negociação</span>
              <span className="font-medium">{metrics.byStatus.negociando || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ganhos</span>
              <span className="font-medium text-green-600">{metrics.byStatus.ganho || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Perdidos</span>
              <span className="font-medium text-red-600">{metrics.byStatus.perdido || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
