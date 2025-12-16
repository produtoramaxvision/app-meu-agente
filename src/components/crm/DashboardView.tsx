import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, TrendingUp, DollarSign, Clock, Target, Award, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PipelineMetrics } from '@/hooks/useCRMPipeline';

interface DashboardViewProps {
  metrics: PipelineMetrics;
  className?: string;
}

export function DashboardView({ metrics, className }: DashboardViewProps) {
  // Determinar cores baseadas em benchmarks da indústria
  const getWinRateColor = (rate: number) => {
    if (rate >= 40) return { bg: 'bg-green-600', text: 'text-green-600' };
    if (rate >= 20) return { bg: 'bg-amber-600', text: 'text-amber-600' };
    return { bg: 'bg-red-600', text: 'text-red-600' };
  };

  const getQualificationColor = (rate: number) => {
    if (rate >= 50) return { bg: 'bg-green-600', text: 'text-green-600' };
    if (rate >= 30) return { bg: 'bg-amber-600', text: 'text-amber-600' };
    return { bg: 'bg-red-600', text: 'text-red-600' };
  };

  const winRateColors = getWinRateColor(metrics.winRate);
  const qualificationColors = getQualificationColor(metrics.qualificationRate);

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

  return (
    <div className={cn("p-6 space-y-6 overflow-y-auto", className)}>
      {/* Cards de Métricas Principais */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Win Rate */}
        <motion.div
          whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de ganho
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold mb-2", winRateColors.text)}>
                {metrics.winRate}%
              </div>
              <p className="flex items-center text-xs font-medium text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                Taxa de conversão
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pipeline Value */}
        <motion.div
          whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor do pipeline
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                R$ {(metrics.pipelineValue / 1000).toFixed(1)}k
              </div>
              <p className="flex items-center text-xs font-medium text-muted-foreground">
                <Zap className="h-3 w-3 mr-1" />
                Negócios em aberto
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sales Velocity */}
        <motion.div
          whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Velocidade de vendas
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {metrics.salesVelocity} dias
              </div>
              <p className="flex items-center text-xs font-medium text-muted-foreground">
                <Target className="h-3 w-3 mr-1" />
                Tempo médio de fechamento
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Qualification Rate */}
        <motion.div
          whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de qualificação
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold mb-2", qualificationColors.text)}>
                {metrics.qualificationRate}%
              </div>
              <p className="flex items-center text-xs font-medium text-muted-foreground">
                <ArrowUp className="h-3 w-3 mr-1" />
                Leads qualificados
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Funil de Conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
            <CardTitle>Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              R$ {metrics.avgDealSize.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Valor médio dos deals ganhos
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
