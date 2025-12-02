import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FinanceRecordForm } from '@/components/FinanceRecordForm';
import { PeriodFilter } from '@/components/PeriodFilter';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useGoalsData } from '@/hooks/useGoalsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowDownIcon, ArrowUpIcon, TrendingUp, Receipt, Trash2, Edit, Copy } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Sector, ResponsiveContainer } from 'recharts';
import { DeleteRecordDialog } from '@/components/DeleteRecordDialog';
import { EditRecordDialog } from '@/components/EditRecordDialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DashboardGoalCard } from '@/components/DashboardGoalCard';
import { DashboardUpcomingBills } from '@/components/DashboardUpcomingBills';
import { UpcomingTasksCard } from '@/components/UpcomingTasksCard';
import { sanitizeText } from '@/lib/sanitize';

const EXPENSE_COLORS = [
  { start: '#FF6B6B', end: '#fa5252' }, // Red
  { start: '#FD7E14', end: '#ff922b' }, // Orange
  { start: '#F06595', end: '#f783ac' }, // Pink
  { start: '#FAB005', end: '#ffd43b' }, // Yellow
  { start: '#E03131', end: '#c92a2a' }, // Darker Red
  { start: '#D9480F', end: '#bf3604' }, // Darker Orange
];

const INCOME_COLORS = [
  { start: '#40C057', end: '#69db7c' }, // Green
  { start: '#12B886', end: '#40c057' }, // Teal
  { start: '#15AABF', end: '#3bc9db' }, // Cyan
  { start: '#228BE6', end: '#4dabf7' }, // Blue
  { start: '#4C6EF5', end: '#748ffc' }, // Indigo
  { start: '#2F9E44', end: '#51cf66' }, // Darker Green
];

export default function Dashboard() {
  const { cliente } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [categoryType, setCategoryType] = useState<'entrada' | 'saida'>('saida');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<any>(null);
  const { metrics, loading, getDailyData, getCategoryData, getLatestTransactions, refetch } = useFinancialData(selectedPeriod);
  const { mainGoal, loading: goalsLoading, refetch: refetchGoals } = useGoalsData();
  
  const handleRefetch = () => {
    refetch();
    refetchGoals();
  };

  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;

    try {
      const { error } = await supabase
        .from('financeiro_registros')
        .delete()
        .eq('id', recordToDelete.id);

      if (error) throw error;

      toast.success("Registro excluído", {
        description: "O registro foi removido com sucesso.",
      });

      refetch();
      refetchGoals();
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error("Não foi possível excluir o registro. Tente novamente.");
    }
  };

  const handleDuplicateRecord = async (record: any) => {
    try {
      const { error } = await supabase
        .from('financeiro_registros')
        .insert({
          phone: record.phone,
          tipo: record.tipo,
          categoria: record.categoria,
          valor: record.valor,
          descricao: record.descricao,
          data_hora: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Uma cópia do registro foi criada com sucesso.");

      refetch();
      refetchGoals();
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      toast.error("Não foi possível duplicar o registro. Tente novamente.");
    }
  };

  const dailyData = getDailyData();
  const categoryData = getCategoryData(categoryType);
  const latestTransactions = getLatestTransactions(5);
  
  const COLORS = categoryType === 'saida' ? EXPENSE_COLORS : INCOME_COLORS;

  const renderDailyLegend = (props: any) => {
    const { payload } = props;
    if (!payload || payload.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pt-4 text-[11px] sm:text-xs">
        {payload.map((entry: any) => (
          <div
            key={entry.value}
            className="flex items-center gap-2 rounded-full bg-surface-elevated/70 px-3 py-1 border border-border/60 backdrop-blur-sm shadow-sm"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium text-text-muted">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 10}
          outerRadius={outerRadius + 12}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-sm font-semibold">
          {payload.name}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" className="text-xs">
          {`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  if (loading || goalsLoading) {
    return (
      <div className="py-4 sm:py-6 lg:py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">Dashboard</h1>
          <p className="text-text-muted mt-2">Visão geral das suas finanças</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 lg:py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="animate-fade-in">
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">Dashboard</h1>
          <p className="text-text-muted mt-2">Visão geral das suas finanças</p>
        </div>
        
        <div className="pt-1 animate-fade-in flex justify-center md:justify-end" style={{ animationDelay: '100ms' }}>
          <PeriodFilter selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl" style={{ animationDelay: '0ms' }}>
          <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-emerald-500/15 via-transparent to-emerald-500/5 opacity-90" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-text-muted tracking-wide uppercase">
                Total Receitas
              </CardTitle>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                Entradas acumuladas no período
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
              <ArrowUpIcon className="h-4 w-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-1">
            <div className="text-2xl sm:text-3xl font-semibold text-emerald-400 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalReceitas)}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl" style={{ animationDelay: '100ms' }}>
          <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-red-500/15 via-transparent to-red-500/5 opacity-90" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-text-muted tracking-wide uppercase">
                Total Despesas
              </CardTitle>
              <p className="text-[11px] text-red-400/80 mt-0.5">
                Saídas acumuladas no período
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center">
              <ArrowDownIcon className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-1">
            <div className="text-2xl sm:text-3xl font-semibold text-red-400 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalDespesas)}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl" style={{ animationDelay: '200ms' }}>
          <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-primary/15 via-transparent to-emerald-500/10 opacity-90" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-text-muted tracking-wide uppercase">
                Saldo
              </CardTitle>
              <p className="text-[11px] text-text-muted mt-0.5">
                Diferença entre receitas e despesas
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-1">
            <div className={`text-2xl sm:text-3xl font-semibold tracking-tight ${metrics.saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.saldo)}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl" style={{ animationDelay: '300ms' }}>
          <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-sky-500/15 via-transparent to-sky-500/5 opacity-90" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-text-muted tracking-wide uppercase">
                Transações
              </CardTitle>
              <p className="text-[11px] text-text-muted mt-0.5">
                Lançamentos registrados no período
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-sky-500/15 border border-sky-500/40 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-sky-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-1">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {metrics.totalTransacoes}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Side - Charts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Daily Evolution Chart */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
            <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-primary/15 via-transparent to-emerald-500/10 opacity-70" />
            <div className="pointer-events-none absolute -top-28 -right-40 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
            <CardHeader className="relative z-10 flex flex-col gap-2 border-b border-border/40 pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base sm:text-lg font-semibold">
                  Evolução Diária (Últimos {selectedPeriod} dias)
                </CardTitle>
                <span className="hidden sm:inline-flex items-center rounded-full bg-surface-elevated/80 px-3 py-1 text-[11px] uppercase tracking-wide text-text-muted border border-border/60">
                  Visão de fluxo
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-muted">
                Acompanhe o comportamento diário de entradas e saídas para identificar picos, quedas e tendências.
              </p>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              {dailyData.length > 0 ? (
                <div className="h-[260px] sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={dailyData}
                      margin={{ top: 10, right: 24, left: 8, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#39a85b" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#39a85b" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a93838" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#a93838" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="hsl(var(--border))" 
                        opacity={0.4}
                        vertical={false}
                      />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--foreground))" 
                        fontSize={11}
                        fontWeight={400}
                        tickLine={false}
                        axisLine={false}
                        opacity={0.7}
                      />
                      <YAxis 
                        stroke="hsl(var(--foreground))" 
                        fontSize={11}
                        fontWeight={400}
                        tickLine={false}
                        axisLine={false}
                        opacity={0.7}
                        width={60}
                        tickFormatter={(value) => 
                          new Intl.NumberFormat('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL',
                            notation: 'compact',
                            compactDisplay: 'short'
                          }).format(value)
                        }
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--surface))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 16px 40px rgba(0,0,0,0.35)'
                        }}
                        formatter={(value: number) => [
                          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                          ''
                        ]}
                        labelStyle={{ fontWeight: 600, marginBottom: '8px' }}
                        cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 2 }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        content={renderDailyLegend}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="entradas" 
                        stroke="#39a85b" 
                        strokeWidth={3}
                        fill="url(#colorEntradas)"
                        name="Entradas"
                        dot={{ r: 3.5, fill: "#39a85b", strokeWidth: 1.5, stroke: "#020817" }}
                        activeDot={{ r: 5, fill: "#39a85b", strokeWidth: 2, stroke: "#fff" }}
                        animationDuration={900}
                        animationEasing="ease-out"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="saidas" 
                        stroke="#a93838" 
                        strokeWidth={3}
                        fill="url(#colorSaidas)"
                        name="Saídas"
                        dot={{ r: 3.5, fill: "#a93838", strokeWidth: 1.5, stroke: "#020817" }}
                        activeDot={{ r: 5, fill: "#a93838", strokeWidth: 2, stroke: "#fff" }}
                        animationDuration={900}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[260px] sm:h-[320px] flex items-center justify-center text-text-muted">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution Chart */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
            <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-rose-500/12 via-transparent to-sky-500/12 opacity-80" />
            <div className="pointer-events-none absolute -bottom-24 -left-32 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <CardHeader className="relative z-10 space-y-3 border-b border-border/40 pb-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold">
                    {categoryType === 'saida' ? 'Distribuição de Despesas' : 'Distribuição de Receitas'}
                  </CardTitle>
                  <p className="mt-1 text-xs sm:text-[13px] text-text-muted">
                    Veja em quais categorias você está concentrando mais {categoryType === 'saida' ? 'gastos' : 'receitas'}.
                  </p>
                </div>
                <Tabs value={categoryType} onValueChange={(v: any) => setCategoryType(v)} className="w-auto">
                  <TabsList className="grid w-full grid-cols-2 p-1 h-auto gap-1 bg-surface-elevated/80 border border-border/60 backdrop-blur-sm rounded-full">
                    <TabsTrigger value="saida" className="text-[11px] px-3 py-1 rounded-full data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive">
                      Despesas
                    </TabsTrigger>
                    <TabsTrigger value="entrada" className="text-[11px] px-3 py-1 rounded-full data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500">
                      Receitas
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-4">
              {categoryData.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-full md:w-1/2 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          {COLORS.map((color, index) => (
                            <linearGradient id={`colorGradient${index}`} x1="0" y1="0" x2="1" y2="1" key={index}>
                              <stop offset="0%" stopColor={color.start} stopOpacity={0.95} />
                              <stop offset="100%" stopColor={color.end} stopOpacity={0.9} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={50}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          activeIndex={activeIndex}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, index) => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(undefined)}
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#colorGradient${index % COLORS.length})`}
                              stroke={'hsl(var(--surface))'}
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const total = categoryData.reduce((sum, item) => sum + item.value, 0);
                              const current = payload[0].value as number;
                              const percent = total > 0 ? (current / total) * 100 : 0;

                              return (
                                <div className="bg-surface border border-border rounded-xl px-3 py-2 shadow-2xl backdrop-blur-sm min-w-[180px]">
                                  <p className="font-semibold text-sm mb-1">{payload[0].name}</p>
                                  <p className="text-primary font-bold text-base">
                                    {new Intl.NumberFormat('pt-BR', { 
                                      style: 'currency', 
                                      currency: 'BRL' 
                                    }).format(current)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {percent.toFixed(1)}% do total
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full md:w-1/2 space-y-3">
                    {categoryData.map((item, index) => {
                      const colorIndex = index % COLORS.length;
                      const gradientColor = COLORS[colorIndex];
                      const total = categoryData.reduce((sum, c) => sum + c.value, 0);
                      const percent = total > 0 ? (item.value / total) * 100 : 0;

                      return (
                        <div
                          key={item.name}
                          className="flex items-center justify-between gap-3 rounded-xl bg-surface-elevated/80 border border-border/60 px-3 py-2 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ 
                                background: `linear-gradient(135deg, ${gradientColor.start}, ${gradientColor.end})`
                              }}
                            />
                            <span className="text-sm font-medium text-text truncate">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-muted">
                              {percent.toFixed(1)}%
                            </span>
                            <span className="text-sm font-semibold text-text">
                              {new Intl.NumberFormat('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              }).format(item.value)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-center text-text-muted px-4">
                  {categoryType === 'saida' 
                    ? 'Nenhuma despesa registrada.' 
                    : 'Nenhuma receita registrada.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Goals & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DashboardGoalCard goal={mainGoal} />
            <DashboardUpcomingBills />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '350ms' }}>
            <UpcomingTasksCard />
          </div>
        </div>
      </div>

      {/* Latest Transactions & Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Latest Transactions */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
          <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/10 opacity-80" />
          <div className="pointer-events-none absolute -top-20 -right-32 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <CardHeader className="relative z-10 flex items-center justify-between pb-3 border-b border-border/40">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold">Últimas Transações</CardTitle>
              <p className="mt-1 text-xs sm:text-[13px] text-text-muted">
                Visão rápida dos últimos lançamentos financeiros.
              </p>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            {latestTransactions.length > 0 ? (
              <div className="space-y-3">
                {latestTransactions.map((transaction, index) => {
                  const isEntrada = transaction.tipo === 'entrada';
                  const amountColor = isEntrada ? 'text-emerald-400' : 'text-red-400';
                  const pillBg = isEntrada ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400';

                  return (
                    <ContextMenu key={transaction.id}>
                      <ContextMenuTrigger asChild>
                        <div 
                          className="cursor-context-menu group relative overflow-hidden rounded-xl bg-surface-elevated/80 border border-border/60 px-3 py-2.5 sm:px-4 sm:py-3 hover:bg-surface-hover/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                          style={{ animationDelay: `${index * 40}ms` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                          <div className="relative z-10 flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border ${isEntrada ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
                              {isEntrada ? (
                                <ArrowUpIcon className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <ArrowDownIcon className="h-4 w-4 text-red-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-text truncate">
                                    {transaction.descricao ? sanitizeText(transaction.descricao) : transaction.categoria}
                                  </p>
                                  <p className="text-[11px] text-text-muted mt-0.5">
                                    {transaction.categoria} • {new Date(transaction.data_hora).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                                <div className="hidden sm:flex items-center">
                                  <span className={`text-sm font-semibold tabular-nums ${amountColor}`}>
                                    {isEntrada ? '+' : '-'}
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(transaction.valor))}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${pillBg}`}>
                                  {isEntrada ? 'Entrada' : 'Saída'}
                                </span>
                                <span className="sm:hidden text-sm font-semibold tabular-nums">
                                  <span className={amountColor}>
                                    {isEntrada ? '+' : '-'}
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(transaction.valor))}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                        <ContextMenuItem
                          onClick={() => {
                            setRecordToEdit(transaction);
                            setEditDialogOpen(true);
                          }}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => handleDuplicateRecord(transaction)}
                          className="cursor-pointer"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Duplicar</span>
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => {
                            setRecordToDelete(transaction);
                            setDeleteDialogOpen(true);
                          }}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Excluir</span>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-text-muted">
                <Receipt className="h-10 w-10 mx-auto mb-3 opacity-60" />
                <p className="text-sm">Nenhuma transação registrada</p>
                <p className="text-xs mt-1">Adicione sua primeira transação ao lado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Transaction Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <FinanceRecordForm
              userPhone={cliente?.phone || ''}
              onSuccess={handleRefetch}
            />
          </CardContent>
        </Card>
      </div>

      <DeleteRecordDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        record={recordToDelete}
        onConfirm={handleDeleteRecord}
      />

      <EditRecordDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        record={recordToEdit}
        onSuccess={() => {
          refetch();
      refetchGoals();
          setEditDialogOpen(false);
          setRecordToEdit(null);
        }}
      />
    </div>
  );
}