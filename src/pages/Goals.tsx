import { useGoalsData } from '@/hooks/useGoalsData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';
import { GoalForm } from '@/components/GoalForm';
import { GoalListItem } from '@/components/GoalListItem';
import { Card } from '@/components/ui/card';

export default function Goals() {
  const { goals, loading, refetch } = useGoalsData();

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('metas').delete().eq('id', id);
      if (error) throw error;
      toast.success('Meta excluída com sucesso.');
      refetch();
    } catch (error) {
      toast.error('Não foi possível excluir a meta.');
    }
  };

  return (
    <div className="py-4 sm:py-6 lg:py-8 space-y-8">
      <div className="flex items-center">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">
            Minhas Metas
          </h1>
          <p className="text-text-muted mt-2">
            Acompanhe e gerencie seus objetivos financeiros.
          </p>
        </div>
        <div className="ml-auto">
          <GoalForm onSuccess={refetch}>
            <button className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <span className="relative z-10 flex items-center">
                <Plus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                Nova Meta
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          </GoalForm>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <>
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </>
        ) : goals.length > 0 ? (
          goals.map((goal, index) => (
            <div key={goal.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <GoalListItem goal={goal} onDelete={handleDelete} onUpdate={refetch} />
            </div>
          ))
        ) : (
          <Card className="p-12">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <Target className="h-10 w-10 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">
                  Nenhuma meta encontrada
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Crie sua primeira meta para começar a economizar e acompanhar seu progresso!
                </p>
              </div>
              <GoalForm onSuccess={refetch}>
                <button className="mt-4 group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-8 py-3 text-base font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg">
                  <span className="relative z-10 flex items-center">
                    <Plus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                    Criar Primeira Meta
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
              </GoalForm>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}