import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFiltersProps {
  statusFilter: 'all' | 'pending' | 'done' | 'overdue';
  onStatusFilterChange: (status: 'all' | 'pending' | 'done' | 'overdue') => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  counts: {
    all: number;
    pending: number;
    done: number;
    overdue: number;
  };
}

export function TaskFilters({
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  counts,
}: TaskFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          type="search"
          placeholder="Buscar tarefas..."
          className="pl-9 bg-surface"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as 'all' | 'pending' | 'done' | 'overdue')}>
        <TabsList className="grid w-full grid-cols-4 p-1 h-auto gap-1">
          <TabsTrigger
            value="all"
            className={cn(
              'group relative overflow-hidden flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--brand-900))] data-[state=active]:to-[hsl(var(--brand-700))] data-[state=active]:text-white data-[state=active]:shadow-lg',
              'data-[state=inactive]:text-[hsl(var(--sidebar-text-muted))] data-[state=inactive]:bg-surface data-[state=inactive]:hover:bg-[hsl(var(--sidebar-hover))] data-[state=inactive]:hover:text-[hsl(var(--sidebar-text))] data-[state=inactive]:hover:scale-105'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative z-10">Todas ({counts.all})</span>
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className={cn(
              'group relative overflow-hidden flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--brand-900))] data-[state=active]:to-[hsl(var(--brand-700))] data-[state=active]:text-white data-[state=active]:shadow-lg',
              'data-[state=inactive]:text-[hsl(var(--sidebar-text-muted))] data-[state=inactive]:bg-surface data-[state=inactive]:hover:bg-[hsl(var(--sidebar-hover))] data-[state=inactive]:hover:text-[hsl(var(--sidebar-text))] data-[state=inactive]:hover:scale-105'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative z-10">Pendentes ({counts.pending})</span>
          </TabsTrigger>
          <TabsTrigger
            value="done"
            className={cn(
              'group relative overflow-hidden flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--brand-900))] data-[state=active]:to-[hsl(var(--brand-700))] data-[state=active]:text-white data-[state=active]:shadow-lg',
              'data-[state=inactive]:text-[hsl(var(--sidebar-text-muted))] data-[state=inactive]:bg-surface data-[state=inactive]:hover:bg-[hsl(var(--sidebar-hover))] data-[state=inactive]:hover:text-[hsl(var(--sidebar-text))] data-[state=inactive]:hover:scale-105'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative z-10">Concluídas ({counts.done})</span>
          </TabsTrigger>
          <TabsTrigger
            value="overdue"
            className={cn(
              'group relative overflow-hidden flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--brand-900))] data-[state=active]:to-[hsl(var(--brand-700))] data-[state=active]:text-white data-[state=active]:shadow-lg',
              'data-[state=inactive]:text-[hsl(var(--sidebar-text-muted))] data-[state=inactive]:bg-surface data-[state=inactive]:hover:bg-[hsl(var(--sidebar-hover))] data-[state=inactive]:hover:text-[hsl(var(--sidebar-text))] data-[state=inactive]:hover:scale-105'
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
            <span className="relative z-10">Vencidas ({counts.overdue})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}