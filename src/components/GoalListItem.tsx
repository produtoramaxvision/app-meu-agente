import { useState } from 'react';
import { Goal } from '@/hooks/useGoalsData';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GoalIcon } from './GoalIcons';
import { Badge } from './ui/badge';
import { Edit, Trash2, Copy, MoreHorizontal } from 'lucide-react';
import { GoalForm } from './GoalForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ActionMenu } from '@/components/ui/ActionMenu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface GoalListItemProps {
  goal: Goal;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

export function GoalListItem({ goal, onDelete, onUpdate }: GoalListItemProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const progress = Math.min((goal.valor_atual / goal.valor_meta) * 100, 100);
  const restante = Math.max(goal.valor_meta - goal.valor_atual, 0);

  const handleDuplicateGoal = async () => {
    try {
      const { error } = await supabase
        .from('metas')
        .insert({
          phone: goal.phone,
          titulo: `Cópia de - ${goal.titulo}`,
          icone: goal.icone,
          valor_atual: goal.valor_atual,
          valor_meta: goal.valor_meta,
          prazo_meses: goal.prazo_meses,
          meta_principal: false,
        });

      if (error) throw error;

      toast.success("Meta duplicada", {
        description: "Uma cópia da meta foi criada com sucesso.",
      });

      onUpdate();
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      toast.error("Não foi possível duplicar a meta. Tente novamente.");
    }
  };

  // Handlers para diferentes tipos de clique
  const handleSingleClick = () => {
    // Clique simples: destacar a meta ou mostrar informações adicionais
    toast.info("Meta selecionada", {
      description: `${goal.titulo} - ${progress.toFixed(0)}% concluída`,
    });
  };

  const handleDoubleClick = () => {
    // Clique duplo: abrir popover de edição
    setEditDialogOpen(true);
  };

  const actionMenuItems = [
    {
      label: 'Editar',
      icon: <Edit className="mr-2 h-4 w-4" />,
      onClick: () => setEditDialogOpen(true),
    },
    {
      label: 'Duplicar',
      icon: <Copy className="mr-2 h-4 w-4" />,
      onClick: handleDuplicateGoal,
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: () => setDeleteDialogOpen(true),
      className: 'text-red-600 focus:text-red-600',
    },
  ];

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Card 
            className={cn(
              "p-4 sm:p-5 group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl transition-all duration-300 cursor-pointer",
              "hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10",
              goal.meta_principal && "ring-1 ring-primary/40"
            )}
            onClick={handleSingleClick}
            onDoubleClick={handleDoubleClick}
          >
            <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-primary/12 via-transparent to-emerald-500/10 opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10" />
            <div className="flex flex-col sm:flex-row gap-4 relative z-20">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {goal.icone && (
                      <div className="h-10 w-10 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        <GoalIcon name={goal.icone} className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold tracking-tight">
                        {goal.titulo}
                      </h3>
                      {goal.prazo_meses && (
                        <p className="text-[11px] uppercase tracking-wide text-text-muted">
                          {goal.prazo_meses} meses restantes
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {goal.meta_principal && (
                      <Badge className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                        Principal
                      </Badge>
                    )}
                    <ActionMenu items={actionMenuItems}>
                      <button className="p-1 hover:bg-muted rounded-md transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </ActionMenu>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs sm:text-sm text-text-muted">
                    <span className="uppercase tracking-wide">Progresso</span>
                    <span className="font-semibold text-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-muted/60" />
                </div>
                <div className="flex justify-between items-baseline text-sm">
                  <div>
                    <p className="text-text-muted">Atual</p>
                    <p className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.valor_atual)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-muted">Meta</p>
                    <p className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.valor_meta)}</p>
                  </div>
                </div>
                <p className="text-xs text-center text-text-muted border-t pt-2">
                  Faltam {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(restante)}
                </p>
              </div>
            </div>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Meta
          </ContextMenuItem>
          <ContextMenuItem onClick={handleDuplicateGoal}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar Meta
          </ContextMenuItem>
          <ContextMenuItem 
            onClick={() => setDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Meta
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <GoalForm 
        goalToEdit={goal} 
        onSuccess={onUpdate}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{goal.titulo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(goal.id)} className="group relative overflow-hidden bg-gradient-to-br from-red-600 to-red-700 text-white hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-gradient-to-br hover:from-red-700 hover:to-red-800 border-none">
              <span className="relative z-10">Excluir</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}