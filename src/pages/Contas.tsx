import { useMemo, useState } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ContaItem } from '@/components/ContaItem';
import { Wallet, ArrowDownIcon, ArrowUpIcon, CheckCircle2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { FinanceRecordForm } from '@/components/FinanceRecordForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearch } from '@/contexts/SearchContext';
import { PeriodFilter } from '@/components/PeriodFilter';

type TabFilter = 'a-pagar' | 'a-receber' | 'pagas' | 'recebidas';

export default function Contas() {
  const { cliente } = useAuth();
  const { searchQuery, mode, commandId } = useSearch();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tabFilter, setTabFilter] = useState<TabFilter>('a-pagar');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30);
  
  // Buscar registros com filtro de categoria aplicado no hook
  const { 
    records, 
    loading, 
    refetch,
    getTotalPendingBills,
    getTotalPendingIncome,
    getTotalPaidBills,
    getTotalReceivedIncome
  } = useFinancialData(selectedPeriod, categoryFilter, 'all', 'all');

  // Obter categorias únicas dos registros para o Select
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    records.forEach(record => {
      if (record.categoria) {
        uniqueCategories.add(record.categoria);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [records]);

  // Determinar tipo e status baseado na tab selecionada para filtrar apenas a exibição
  const typeFilter: 'saida' | 'entrada' = 
    tabFilter === 'a-pagar' || tabFilter === 'pagas' ? 'saida' : 'entrada';
  const statusFilter: 'pago' | 'pendente' = 
    tabFilter === 'pagas' || tabFilter === 'recebidas' ? 'pago' : 'pendente';

  // Texto de busca efetivo (global para /contas, ou vazio caso contrário)
  const effectiveSearch = useMemo(() => {
    if (!searchQuery.trim()) return '';
    // Só aplica busca global quando o comando foi direcionado para contas
    if (mode === 'global' && commandId === 'financial') {
      return searchQuery.toLowerCase();
    }
    return '';
  }, [searchQuery, mode, commandId]);

  // Filtrar registros para exibição baseado na tab selecionada + texto de busca (quando houver)
  const filteredRecords = records.filter(record => {
    const matchesType = record.tipo === typeFilter;
    const matchesStatus = record.status === statusFilter;

    const matchesSearch =
      !effectiveSearch ||
      record.descricao?.toLowerCase().includes(effectiveSearch) ||
      record.categoria?.toLowerCase().includes(effectiveSearch);

    return matchesType && matchesStatus && matchesSearch;
  });

  // Calcular métricas usando todos os registros (não filtrados)
  const totalPendingBills = getTotalPendingBills();
  const totalPendingIncome = getTotalPendingIncome();
  const totalPaidBills = getTotalPaidBills();
  const totalReceivedIncome = getTotalReceivedIncome();
  // Novo: valor líquido recebido = tudo que entrou (recebido) - tudo que saiu (pago)
  const netReceived = totalReceivedIncome - totalPaidBills;

  const sortedRecords = [...filteredRecords].sort((a, b) => 
    new Date(a.data_vencimento || 0).getTime() - new Date(b.data_vencimento || 0).getTime()
  );

  const totalValue = sortedRecords.reduce((sum, record) => sum + record.valor, 0);

  // Titles e empty states para cada tab
  const getTabTitle = () => {
    switch (tabFilter) {
      case 'a-pagar': return 'Contas a Pagar Pendentes';
      case 'a-receber': return 'Contas a Receber Pendentes';
      case 'pagas': return 'Contas Pagas';
      case 'recebidas': return 'Contas Recebidas';
    }
  };

  const getEmptyStateContent = () => {
    switch (tabFilter) {
      case 'a-pagar':
        return {
          title: 'Tudo em dia!',
          description: 'Você não tem nenhuma conta pendente para pagar.',
        };
      case 'a-receber':
        return {
          title: 'Nada a receber!',
          description: 'Você não tem nenhuma conta pendente para receber.',
        };
      case 'pagas':
        return {
          title: 'Nenhuma conta paga',
          description: 'Você ainda não pagou nenhuma conta.',
        };
      case 'recebidas':
        return {
          title: 'Nenhuma receita recebida',
          description: 'Você ainda não recebeu nenhuma receita.',
        };
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
      );
    }

    if (sortedRecords.length === 0) {
      const emptyState = getEmptyStateContent();
      return (
        <Card className="p-12 border-dashed">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              {tabFilter === 'pagas' || tabFilter === 'recebidas' ? (
                <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
              ) : (
                <Wallet className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold">
                {emptyState.title}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {emptyState.description}
              </p>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {sortedRecords.map((conta, index) => (
          <div key={conta.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
            <ContaItem conta={conta} onStatusChange={refetch} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="py-4 sm:py-6 lg:py-8 space-y-8">
      {/* Header + Filtro de Categoria */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="animate-fade-in">
            <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">
              Contas
            </h1>
            <p className="text-text-muted mt-2">
              Gerencie suas contas a pagar e a receber.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
            {/* Filtro de Categoria */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[220px] md:w-[260px]">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro de Período */}
            <PeriodFilter
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden hover:scale-[1.02] transition-all duration-300 animate-fade-in hover:shadow-2xl hover:shadow-primary/10 hover:ring-2 hover:ring-primary/20 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100" style={{ animationDelay: '0ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-text-muted">A Pagar</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-[#a93838] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-lg" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-[#a93838]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPendingBills)}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:scale-[1.02] transition-all duration-300 animate-fade-in hover:shadow-2xl hover:shadow-primary/10 hover:ring-2 hover:ring-primary/20 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-text-muted">A Receber</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-yellow-500 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-lg" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-yellow-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPendingIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:scale-[1.02] transition-all duration-300 animate-fade-in hover:shadow-2xl hover:shadow-primary/10 hover:ring-2 hover:ring-primary/20 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-text-muted">Pago</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-lg" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaidBills)}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:scale-[1.02] transition-all duration-300 animate-fade-in hover:shadow-2xl hover:shadow-primary/10 hover:ring-2 hover:ring-primary/20 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-text-muted">Total atualizado</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[#39a85b] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-lg" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-[#39a85b]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netReceived)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="space-y-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
        {/* Botão Nova Transação - somente Mobile (acima das tabs) */}
        <div className="sm:hidden mb-2">
          <button
            onClick={() => setIsFormOpen(true)}
            className="group relative overflow-hidden rounded-lg px-4 py-2.5 transition-all duration-200 bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2 w-full"
          >
            <Plus className="h-4 w-4 text-white transition-transform group-hover:scale-110 group-hover:rotate-90" />
            <span className="text-sm font-semibold text-white">Nova Transação</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </div>

        <Tabs value={tabFilter} onValueChange={(value) => setTabFilter(value as TabFilter)}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 p-1 h-auto">
            <TabsTrigger 
              value="a-pagar"
              className={cn(
                'group relative overflow-hidden flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--brand-900))] data-[state=active]:to-[hsl(var(--brand-700))] data-[state=active]:text-white data-[state=active]:shadow-lg',
                'data-[state=inactive]:text-[hsl(var(--sidebar-text-muted))] data-[state=inactive]:bg-surface data-[state=inactive]:hover:bg-[hsl(var(--sidebar-hover))] data-[state=inactive]:hover:text-[hsl(var(--sidebar-text))] data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-lg'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span className="relative z-10">A Pagar</span>
            </TabsTrigger>
            <TabsTrigger 
              value="a-receber"
              className={cn(
                'group relative overflow-hidden flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--brand-900))] data-[state=active]:to-[hsl(var(--brand-700))] data-[state=active]:text-white data-[state=active]:shadow-lg',
                'data-[state=inactive]:text-[hsl(var(--sidebar-text-muted))] data-[state=inactive]:bg-surface data-[state=inactive]:hover:bg-[hsl(var(--sidebar-hover))] data-[state=inactive]:hover:text-[hsl(var(--sidebar-text))] data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-lg'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span className="relative z-10">A Receber</span>
            </TabsTrigger>
            <TabsTrigger 
              value="pagas"
              className={cn(
                'group relative overflow-hidden flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--brand-900))] data-[state=active]:to-[hsl(var(--brand-700))] data-[state=active]:text-white data-[state=active]:shadow-lg',
                'data-[state=inactive]:text-[hsl(var(--sidebar-text-muted))] data-[state=inactive]:bg-surface data-[state=inactive]:hover:bg-[hsl(var(--sidebar-hover))] data-[state=inactive]:hover:text-[hsl(var(--sidebar-text))] data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-lg'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span className="relative z-10">Pagas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="recebidas"
              className={cn(
                'group relative overflow-hidden flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                'data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(var(--brand-900))] data-[state=active]:to-[hsl(var(--brand-700))] data-[state=active]:text-white data-[state=active]:shadow-lg',
                'data-[state=inactive]:text-[hsl(var(--sidebar-text-muted))] data-[state=inactive]:bg-surface data-[state=inactive]:hover:bg-[hsl(var(--sidebar-hover))] data-[state=inactive]:hover:text-[hsl(var(--sidebar-text))] data-[state=inactive]:hover:scale-105 data-[state=inactive]:hover:shadow-lg'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              <span className="relative z-10">Recebidas</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="a-pagar">
            <Card className="relative rounded-xl border-2 border-border/40 bg-surface p-2 sm:p-4 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <CardTitle>{getTabTitle()}</CardTitle>
                    <button
                      onClick={() => setIsFormOpen(true)}
                      className="hidden sm:inline-flex group relative items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-3 py-1.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                      <span className="relative z-10 flex items-center">
                        <Plus className="mr-1.5 h-3 w-3 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                        <span>Nova Transação</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </button>
                  </div>
                  <p className="text-sm text-text-muted">
                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {renderContent()}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="a-receber">
            <Card className="relative rounded-xl border-2 border-border/40 bg-surface p-2 sm:p-4 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <CardTitle>{getTabTitle()}</CardTitle>
                    <button
                      onClick={() => setIsFormOpen(true)}
                      className="hidden sm:inline-flex group relative items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-3 py-1.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                      <span className="relative z-10 flex items-center">
                        <Plus className="mr-1.5 h-3 w-3 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                        <span>Nova Transação</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </button>
                  </div>
                  <p className="text-sm text-text-muted">
                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {renderContent()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagas">
            <Card className="relative rounded-xl border-2 border-border/40 bg-surface p-2 sm:p-4 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <CardTitle>{getTabTitle()}</CardTitle>
                    <button
                      onClick={() => setIsFormOpen(true)}
                      className="hidden sm:inline-flex group relative items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-3 py-1.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                      <span className="relative z-10 flex items-center">
                        <Plus className="mr-1.5 h-3 w-3 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                        <span>Nova Transação</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </button>
                  </div>
                  <p className="text-sm text-text-muted">
                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {renderContent()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recebidas">
            <Card className="relative rounded-xl border-2 border-border/40 bg-surface p-2 sm:p-4 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <CardTitle>{getTabTitle()}</CardTitle>
                    <button
                      onClick={() => setIsFormOpen(true)}
                      className="hidden sm:inline-flex group relative items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-3 py-1.5 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                      <span className="relative z-10 flex items-center">
                        <Plus className="mr-1.5 h-3 w-3 transition-transform group-hover:scale-110 group-hover:rotate-90" />
                        <span>Nova Transação</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </button>
                  </div>
                  <p className="text-sm text-text-muted">
                    Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {renderContent()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {cliente && (
        <FinanceRecordForm
          userPhone={cliente.phone}
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}