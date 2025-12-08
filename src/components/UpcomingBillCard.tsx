import { UpcomingBill } from '@/hooks/useAlertsData';
import { differenceInDays, format, isToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Tag, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface UpcomingBillCardProps {
  bill: UpcomingBill;
  onStatusChange: () => void;
}

export function UpcomingBillCard({ bill, onStatusChange }: UpcomingBillCardProps) {
  const [isPaying, setIsPaying] = useState(false);
  const dueDate = new Date(bill.data_vencimento || new Date());
  const daysRemaining = differenceInDays(dueDate, new Date());

  const getDueDateInfo = () => {
    if (daysRemaining < 0) return { text: `Venceu há ${-daysRemaining} dia(s)`, color: 'text-red-500' };
    if (isToday(dueDate)) return { text: 'Vence hoje', color: 'text-yellow-500 font-bold' };
    if (daysRemaining === 1) return { text: 'Vence amanhã', color: 'text-yellow-600' };
    return { text: `Vence em ${daysRemaining} dias`, color: 'text-text-muted' };
  };

  const { text, color } = getDueDateInfo();

  const handleMarkAsPaid = async () => {
    setIsPaying(true);
    try {
      const { error } = await supabase
        .from('financeiro_registros')
        .update({ status: 'pago', data_hora: new Date().toISOString() })
        .eq('id', bill.id);

      if (error) throw error;
      toast.success('Conta marcada como paga.');
      onStatusChange();
    } catch (error) {
      toast.error('Não foi possível atualizar a conta.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Card className="p-4 transition-all hover:shadow-md hover:border-primary/20 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <AlertCircle className={`h-5 w-5 ${color}`} />
            <h3 className="font-bold text-lg">{bill.descricao || bill.categoria}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted pl-8">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{format(dueDate, 'dd/MM/yyyy')} ({text})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4" />
              <span>{bill.categoria}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 self-end sm:self-center">
          <div className={`text-xl font-bold ${bill.tipo === 'saida' ? 'text-red-500' : 'text-green-500'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.valor)}
          </div>
          <Button onClick={handleMarkAsPaid} disabled={isPaying} size="sm" className="group relative overflow-hidden bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] text-white hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-gradient-to-br hover:from-[hsl(var(--brand-900))] hover:to-[hsl(var(--brand-700))]">
            <span className="relative z-10 flex items-center">
              <Check className="mr-2 h-4 w-4" />
              {isPaying ? '...' : 'Pagar'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </div>
      </div>
    </Card>
  );
}