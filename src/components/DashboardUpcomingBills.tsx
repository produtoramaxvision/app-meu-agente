import { useAlertsData } from '@/hooks/useAlertsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInDays, isToday } from 'date-fns';
import { Button } from './ui/button';
import { sanitizeText } from '@/lib/sanitize';

export function DashboardUpcomingBills() {
  const { upcomingBills, loading } = useAlertsData();

  const billsToShow = upcomingBills.slice(0, 3);

  const getDueDateInfo = (dueDate: Date) => {
    const daysRemaining = differenceInDays(dueDate, new Date());
    if (daysRemaining < 0) return { text: `Venceu há ${-daysRemaining} d`, color: 'text-red-500' };
    if (isToday(dueDate)) return { text: 'Vence hoje', color: 'text-yellow-500 font-bold' };
    if (daysRemaining === 1) return { text: 'Vence amanhã', color: 'text-yellow-600' };
    return { text: `Vence em ${daysRemaining} d`, color: 'text-text-muted' };
  };

  return (
    <Card className="group relative overflow-hidden h-full flex flex-col border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
      <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-yellow-500/12 via-transparent to-red-500/12 opacity-90" />
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xs font-medium text-text-muted tracking-wide uppercase">
              Contas a Vencer
            </CardTitle>
            <p className="mt-1 text-[11px] text-text-muted">
              Acompanhe contas próximas do vencimento.
            </p>
          </div>
          <div className="h-9 w-9 rounded-full bg-yellow-500/15 border border-yellow-500/40 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 space-y-3 flex-grow flex flex-col pb-4">
        <div className="flex-grow space-y-2">
          {loading ? (
            <>
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </>
          ) : billsToShow.length > 0 ? (
            billsToShow.map(bill => {
              const dueDate = new Date(bill.data_vencimento || new Date());
              const { text, color } = getDueDateInfo(dueDate);
              return (
                <div
                  key={bill.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-surface-elevated/80 border border-border/60 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate max-w-[150px]">
                      {sanitizeText(bill.descricao) || sanitizeText(bill.categoria)}
                    </p>
                    <p className={`text-[11px] ${color}`}>{text}</p>
                  </div>
                  <p className="font-semibold text-red-400 text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.valor)}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-text-muted text-center py-4">
                Nenhuma conta próxima do vencimento.
              </p>
            </div>
          )}
        </div>
        <Button asChild variant="ghost" size="sm" className="w-full mt-auto justify-between px-3 text-xs font-medium">
          <Link to="/alertas">
            <span>Ver todos os alertas</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}