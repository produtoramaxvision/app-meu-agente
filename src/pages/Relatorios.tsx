import { useState, useMemo } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/DateRangePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, PieChart, TrendingUp, TrendingDown, Scale, FileText, RotateCw, Download, Lock } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff4d4d'];

export default function Relatorios() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [typeFilter, setTypeFilter] = useState<'all' | 'entrada' | 'saida'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente'>('all');

  const { records, loading } = useFinancialData(dateRange, typeFilter, statusFilter);
  const { permissions, getUpgradeMessage } = usePermissions();

  const isFiltered = useMemo(() => {
    const thirtyDaysAgo = addDays(new Date(), -30);
    const isDefaultDate = dateRange?.from?.getTime() === thirtyDaysAgo.setHours(0,0,0,0) && dateRange?.to?.setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
    return !isDefaultDate || typeFilter !== 'all' || statusFilter !== 'all';
  }, [dateRange, typeFilter, statusFilter]);

  const handleClearFilters = () => {
    setDateRange({ from: addDays(new Date(), -30), to: new Date() });
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const handleExport = (format: 'csv' | 'json' | 'pdf') => {
    if (!permissions.canExport) {
      toast.error(getUpgradeMessage('Exportação de dados'));
      return;
    }

    // Implementar lógica de exportação aqui
    toast.info(`Exportando dados em formato ${format.toUpperCase()}...`);
  };

  const summary = useMemo(() => {
    const totalEntradas = records.filter(r => r.tipo === 'entrada').reduce((acc, r) => acc + r.valor, 0);
    const totalSaidas = records.filter(r => r.tipo === 'saida').reduce((acc, r) => acc + r.valor, 0);
    const saldo = totalEntradas - totalSaidas;
    return { totalEntradas, totalSaidas, saldo };
  }, [records]);

  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    records.forEach(record => {
      const category = record.categoria || 'Sem Categoria';
      categoryMap.set(category, (categoryMap.get(category) || 0) + record.valor);
    });
    return Array.from(categoryMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [records]);

  const dailyData = useMemo(() => {
    const dateMap = new Map<string, { entrada: number, saida: number }>();
    records.forEach(record => {
      const date = new Date(record.data_transacao || record.data_vencimento || Date.now()).toLocaleDateString('pt-BR');
      const values = dateMap.get(date) || { entrada: 0, saida: 0 };
      if (record.tipo === 'entrada') {
        values.entrada += record.valor;
      } else {
        values.saida += record.valor;
      }
      dateMap.set(date, values);
    });
    return Array.from(dateMap, ([name, values]) => ({ name, ...values })).sort((a, b) => new Date(a.name.split('/').reverse().join('-')).getTime() - new Date(b.name.split('/').reverse().join('-')).getTime());
  }, [records]);

  const renderChart = (data: any[], chartType: 'pie' | 'bar') => {
    if (loading) return <Skeleton className="h-[350px] w-full" />;
    if (data.length === 0) return <div className="flex items-center justify-center h-[350px] text-text-muted">Sem dados para exibir.</div>;

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <RechartsPieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <RechartsBarChart data={data}>
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
          <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
          <Legend />
          <Bar dataKey="entrada" fill="#39a85b" name="Entradas" radius={[4, 4, 0, 0]} />
          <Bar dataKey="saida" fill="#a93838" name="Saídas" radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="py-4 sm:py-6 lg:py-8 space-y-8 min-w-0 overflow-hidden">
      <div className="animate-fade-in">
        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">
          Relatórios
        </h1>
        <p className="text-text-muted mt-2">Analise suas finanças com gráficos detalhados.</p>
        
        {/* Botão de Exportação com Controle de Acesso */}
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => handleExport('csv')}
            variant={permissions.canExport ? "default" : "outline"}
            disabled={!permissions.canExport}
            className="flex items-center gap-2"
          >
            {permissions.canExport ? (
              <Download className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Exportar CSV
          </Button>
          <Button
            onClick={() => handleExport('json')}
            variant={permissions.canExport ? "default" : "outline"}
            disabled={!permissions.canExport}
            className="flex items-center gap-2"
          >
            {permissions.canExport ? (
              <Download className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Exportar JSON
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            variant={permissions.canExport ? "default" : "outline"}
            disabled={!permissions.canExport}
            className="flex items-center gap-2"
          >
            {permissions.canExport ? (
              <Download className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Exportar PDF
          </Button>
        </div>
      </div>

      <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DateRangePicker date={dateRange} onDateChange={setDateRange} />
          <Select value={typeFilter || undefined} onValueChange={(value) => setTypeFilter(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter || undefined} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pago">Pago/Recebido</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={handleClearFilters}
            disabled={!isFiltered}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
          >
            <span className="relative z-10 flex items-center">
              <RotateCw className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 group-hover:rotate-90" />
              Limpar Filtros
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Total de Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold text-green-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalEntradas)}</div>}
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Total de Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold text-red-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalSaidas)}</div>}
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Saldo</CardTitle>
            <Scale className="h-4 w-4 text-text-muted" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-3/4" /> : <div className={`text-2xl font-bold ${summary.saldo >= 0 ? 'text-blue-500' : 'text-red-500'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.saldo)}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 min-w-0">
        <Card className="animate-fade-in min-w-0 overflow-hidden" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Distribuição por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            {renderChart(categoryData, 'pie')}
          </CardContent>
        </Card>
        <Card className="animate-fade-in min-w-0 overflow-hidden" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Entradas vs. Saídas por Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            {renderChart(dailyData, 'bar')}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}