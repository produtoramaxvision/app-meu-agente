import { FinancialRecord } from '@/hooks/useFinancialData';
import { differenceInDays, format, isPast, isToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Tag, Repeat, Check, Edit, Trash2, Copy, AlertCircle, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ActionMenu } from '@/components/ui/ActionMenu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { EditRecordDialog } from './EditRecordDialog';
import { DeleteRecordDialog } from './DeleteRecordDialog';
import { cn } from '@/lib/utils';

interface ContaItemProps {
  conta: FinancialRecord;
  onStatusChange: () => void;
}

type ContaVisualKey = 'pago_entrada' | 'pago_saida' | 'pendente_entrada' | 'pendente_saida';

const contaVisualConfig: Record<ContaVisualKey, { color: string; glow: string }> = {
  // Contas recebidas (entrada paga) - verde suave
  pago_entrada: {
    color: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300',
    glow: 'shadow-green-500/20',
  },
  // Contas pagas (saída paga) - vermelho mais suave, indicando gasto concluído
  pago_saida: {
    color: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
    glow: 'shadow-red-500/20',
  },
  // Contas a receber pendentes - azul, alinhado com pendente de tarefas
  pendente_entrada: {
    // Ajuste de contraste: mantém o halo azul, mas usa texto neutro de alto contraste
    color: 'bg-blue-500/10 border-blue-500/30 text-text dark:text-white',
    glow: 'shadow-blue-500/20',
  },
  // Contas a pagar pendentes - âmbar, destacando atenção necessária
  // Ajuste de contraste: mantém o halo âmbar, mas usa texto neutro de alto contraste
  pendente_saida: {
    color: 'bg-amber-500/10 border-amber-500/40 text-text dark:text-white',
    glow: 'shadow-amber-500/20',
  },
};

const categoryColorMap: Record<string, string> = {
  'alimentação': 'bg-rose-500/10 border-rose-500/40 text-rose-200',
  'transporte': 'bg-sky-500/10 border-sky-500/40 text-sky-200',
  'saúde': 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200',
  'educação': 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200',
  'lazer': 'bg-purple-500/10 border-purple-500/40 text-purple-200',
  'moradia': 'bg-amber-500/10 border-amber-500/40 text-amber-200',
  'viagem': 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200',
  'freelance': 'bg-green-500/10 border-green-500/40 text-green-200',
  'trabalho': 'bg-blue-500/10 border-blue-500/40 text-blue-200',
  'salário': 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200',
  'salario': 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200',
};

function getCategoryBadgeClass(category?: string | null) {
  if (!category) {
    return 'bg-slate-500/10 border-slate-500/40 text-slate-200';
  }
  const key = category.trim().toLowerCase();
  return categoryColorMap[key] ?? 'bg-slate-500/10 border-slate-500/40 text-slate-200';
}

export function ContaItem({ conta, onStatusChange }: ContaItemProps) {
  const [isPaying, setIsPaying] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const dueDate = new Date(conta.data_vencimento || conta.data_hora);
  const daysRemaining = differenceInDays(dueDate, new Date());
  const isOverdue = isPast(dueDate) && !isToday(dueDate);
  const isDueToday = isToday(dueDate);

  const getStatusProps = () => {
    if (conta.status === 'pago') {
      return {
        text: conta.tipo === 'entrada' ? 'Recebido' : 'Pago',
        icon: Check,
        className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      };
    }
    if (isOverdue) {
      return {
        text: `Venceu há ${-daysRemaining}d`,
        icon: AlertCircle,
        className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
      };
    }
    if (isDueToday) {
      return {
        text: 'Vence hoje',
        icon: Clock,
        className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
      };
    }
    return {
      text: `Vence em ${daysRemaining}d`,
      icon: Clock,
      // Pendente padrão com maior contraste, alinhado com badge de "Pendente" em tarefas
      className: 'bg-blue-500/15 text-blue-500 dark:text-blue-300 border-blue-500/40',
    };
  };

  const statusProps = getStatusProps();
  const visualKey: ContaVisualKey = `${conta.status}_${conta.tipo}` as ContaVisualKey;
  const visual = contaVisualConfig[visualKey];

  const handleMarkAsPaid = async () => {
    setIsPaying(true);
    try {
      const { error } = await supabase
        .from('financeiro_registros')
        .update({
          status: 'pago',
          data_hora: new Date().toISOString(),
        })
        .eq('id', conta.id);

      if (error) throw error;

      toast.success(conta.tipo === 'entrada' 
        ? 'Conta marcada como recebida.' 
        : 'Conta marcada como paga.');
      onStatusChange();
    } catch (error) {
      toast.error('Não foi possível atualizar a conta.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleDeleteRecord = async () => {
    try {
      const { error } = await supabase
        .from('financeiro_registros')
        .delete()
        .eq('id', conta.id);

      if (error) throw error;

      toast.success("Registro excluído", {
        description: "A conta foi removida com sucesso.",
      });

      onStatusChange();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error("Não foi possível excluir a conta. Tente novamente.");
    }
  };

  const handleDuplicateRecord = async () => {
    try {
      const { error } = await supabase
        .from('financeiro_registros')
        .insert({
          phone: conta.phone,
          tipo: conta.tipo,
          categoria: conta.categoria,
          valor: conta.valor,
          descricao: `Cópia de - ${conta.descricao || conta.categoria}`,
          data_vencimento: conta.data_vencimento,
          recorrente: conta.recorrente,
          recorrencia_fim: conta.recorrencia_fim,
          status: 'pendente',
        });

      if (error) throw error;

      toast.success("Uma cópia da conta pendente foi criada.");

      onStatusChange();
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      toast.error("Não foi possível duplicar a conta. Tente novamente.");
    }
  };

  const getButtonText = () => {
    if (isPaying) return 'Processando...';
    return conta.tipo === 'entrada' ? 'Marcar como Recebido' : 'Marcar como Pago';
  };

  const getButtonShortText = () => {
    if (isPaying) return 'Processando...';
    return conta.tipo === 'entrada' ? 'Recebido' : 'Pago';
  };

  const actionMenuItems = [
    {
      label: 'Editar',
      icon: <Edit className="mr-2 h-4 w-4" />,
      onClick: () => setEditDialogOpen(true),
      disabled: false,
    },
    {
      label: 'Duplicar',
      icon: <Copy className="mr-2 h-4 w-4" />,
      onClick: handleDuplicateRecord,
      disabled: false,
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: () => setDeleteDialogOpen(true),
      className: 'text-red-600 focus:text-red-600',
      disabled: false,
    },
  ];

  if (conta.status !== 'pago' && !isPaying) {
    actionMenuItems.unshift({
      label: conta.tipo === 'entrada' ? 'Marcar como recebido' : 'Marcar como pago',
      icon: <Check className="mr-2 h-4 w-4" />,
      onClick: handleMarkAsPaid,
      disabled: false,
    });
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
            className={cn(
              'group relative overflow-hidden rounded-lg border p-3 sm:p-4 transition-all duration-300 hover:shadow-md backdrop-blur-sm',
              visual.color,
              visual.glow,
              'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-300',
              conta.status === 'pago' && 'opacity-70'
            )}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

              <div className="absolute top-3 right-3 z-20">
                <ActionMenu items={actionMenuItems}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-surface-hover flex items-center justify-center"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </ActionMenu>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:gap-4 gap-3">
                {/* Main Content */}
                <div className="flex-1 space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 md:mb-0 pr-8 sm:pr-10 md:pr-16">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={cn(
                        'font-bold text-base sm:text-lg leading-tight flex-1',
                        conta.status === 'pago' && 'line-through text-text-muted'
                      )}
                    >
                      {conta.descricao || conta.categoria}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                    <Badge variant="outline" className={statusProps.className}>
                      <statusProps.icon className="h-3 w-3 mr-1.5" />
                      {statusProps.text}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      {format(dueDate, 'dd/MM/yyyy')}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[11px] px-2.5 py-0.5 rounded-full border',
                        getCategoryBadgeClass(conta.categoria)
                      )}
                    >
                      <Tag className="h-3 w-3 mr-1.5" />
                      {conta.categoria}
                    </Badge>
                    {conta.recorrente && (
                      <Badge variant="outline" className="text-xs">
                        <Repeat className="h-3 w-3 mr-1.5" />
                        Recorrente
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Valor alinhado à direita (ações de pagamento via menus) */}
                <div className="flex items-baseline justify-between md:justify-end gap-3 sm:gap-4 md:gap-6 pr-2 sm:pr-4 md:pr-10">
                  <div
                    className={cn(
                      'text-lg sm:text-xl font-bold tabular-nums',
                      conta.tipo === 'saida' ? 'text-destructive' : 'text-green-600 dark:text-green-500'
                    )}
                  >
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conta.valor)}
                  </div>
                </div>
              </div>
            </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {actionMenuItems.map((item, index) => {
            const isLast = index === actionMenuItems.length - 1;
            const isDestructive = item.className?.includes('text-red') || item.className?.includes('text-destructive');

            return (
              <div key={index}>
                <ContextMenuItem
                  onClick={item.onClick}
                  className={`cursor-pointer ${item.className || ''}`}
                  disabled={item.disabled}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </ContextMenuItem>
                {!isLast && isDestructive && <ContextMenuSeparator />}
              </div>
            );
          })}
        </ContextMenuContent>
      </ContextMenu>

      <EditRecordDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} record={conta} onSuccess={() => { onStatusChange(); setEditDialogOpen(false); }} />
      <DeleteRecordDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} record={conta} onConfirm={handleDeleteRecord} />
    </>
  );
}