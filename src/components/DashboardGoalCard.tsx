import { Goal } from '@/hooks/useGoalsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GoalIcon } from './GoalIcons';
import { Target } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardGoalCardProps {
  goal: Goal | null;
}

export function DashboardGoalCard({ goal }: DashboardGoalCardProps) {
  if (!goal) {
    return (
      <Card className="group relative overflow-hidden h-full border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-primary/12 via-transparent to-emerald-500/10 opacity-80" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-text-muted">Meta Principal</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 text-center text-text-muted space-y-2 pb-6">
          <p className="text-sm">
            Nenhuma meta principal definida no momento.
          </p>
          <p className="text-xs text-text-muted">
            Crie uma meta para acompanhar seu progresso aqui no dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  const progress = Math.min((goal.valor_atual / goal.valor_meta) * 100, 100);
  const restante = Math.max(goal.valor_meta - goal.valor_atual, 0);

  return (
    <Link to="/metas" className="block h-full">
      <Card className="group relative overflow-hidden h-full border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-primary/12 via-transparent to-emerald-500/12 opacity-90" />
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xs font-medium text-text-muted tracking-wide uppercase">
                Meta Principal
              </CardTitle>
              <p className="mt-1 text-[11px] text-text-muted">
                Acompanhe o progresso da sua meta mais importante.
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-3">
            {goal.icone && <GoalIcon name={goal.icone} className="h-6 w-6 text-text" />}
            <p className="text-lg font-semibold truncate">{goal.titulo}</p>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 space-y-4 pb-5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Progresso</span>
              <span className="text-sm font-semibold text-primary">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2 overflow-hidden bg-surface-elevated/60">
              {/* o componente Progress atual não aceita children, mantemos apenas a classe externa */}
            </Progress>
          </div>
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-[11px] text-text-muted uppercase">Atual</p>
              <p className="font-semibold text-base sm:text-lg">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.valor_atual)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-text-muted uppercase">Meta</p>
              <p className="font-semibold text-base sm:text-lg">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.valor_meta)}
              </p>
            </div>
          </div>
          <div className="text-[11px] text-text-muted text-center border-t border-border/50 pt-2">
            Faltam{' '}
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(restante)}
            {goal.prazo_meses && ` • ${goal.prazo_meses} meses restantes`}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}