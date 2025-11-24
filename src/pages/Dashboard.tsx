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
        <Card className="group relative overflow-hidden hover:scale-[1.02] transition-all duration-300 animate-fade-in hover:shadow-2xl hover:shadow-primary/10 hover:ring-2 hover:ring-primary/20 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100" style={{ animationDelay: '0ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-text-muted">Total Receitas</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-yellow-500 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-lg" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-yellow-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalReceitas)}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:scale-[1.02] transition-all duration-300 animate-fade-in hover:shadow-2xl hover:shadow-primary/10 hover:ring-2 hover:ring-primary/20 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-text-muted">Total Despesas</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-[#a93838] transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-lg" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-[#a93838]">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalDespesas)}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:scale-[1.02] transition-all duration-300 animate-fade-in hover:shadow-2xl hover:shadow-primary/10 hover:ring-2 hover:ring-primary/20 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-text-muted">Saldo</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-lg" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className={`text-2xl font-bold ${metrics.saldo >= 0 ? 'text-[#39a85b]' : 'text-[#a93838]'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.saldo)}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:scale-[1.02] transition-all duration-300 animate-fade-in hover:shadow-2xl hover:shadow-primary/10 hover:ring-2 hover:ring-primary/20 hover:-translate-y-1 before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100" style={{ animationDelay: '300ms' }}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-text-muted">Transações</CardTitle>
            <Receipt className="h-4 w-4 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:drop-shadow-lg" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">{metrics.totalTransacoes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Side - Charts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Daily Evolution Chart */}
          <Card className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10" />
            <CardHeader>
              <CardTitle>Evolução Diária (Últimos {selectedPeriod} dias)</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart 
                    data={dailyData}
                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#39a85b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#39a85b" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a93838" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#a93838" stopOpacity={0.1}/>
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
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: number) => [
                        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                        ''
                      ]}
                      labelStyle={{ fontWeight: 600, marginBottom: '8px' }}
                      cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 2 }}
                    />
                    <Legend 
                      iconType="circle"
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="entradas" 
                      stroke="#39a85b" 
                      strokeWidth={3}
                      fill="url(#colorEntradas)"
                      name="Entradas"
                      dot={{ r: 4, fill: "#39a85b", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#39a85b", strokeWidth: 2, stroke: "#fff" }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="saidas" 
                      stroke="#a93838" 
                      strokeWidth={3}
                      fill="url(#colorSaidas)"
                      name="Saídas"
                      dot={{ r: 4, fill: "#a93838", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#a93838", strokeWidth: 2, stroke: "#fff" }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-text-muted">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Distribution Chart */}
          <Card className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10" />
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {categoryType === 'saida' ? 'Distribuição de Despesas' : 'Distribuição de Receitas'}
                </CardTitle>
                <Tabs value={categoryType} onValueChange={(v: any) => setCategoryType(v)} className="w-auto">
                  <TabsList className="grid w-full grid-cols-2 p-1 h-auto gap-1">
                    <TabsTrigger value="saida" className="text-xs px-3 py-1.5">Despesas</TabsTrigger>
                    <TabsTrigger value="entrada" className="text-xs px-3 py-1.5">Receitas</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <defs>
                      {COLORS.map((color, index) => (
                        <linearGradient id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1" key={index}>
                          <stop offset="0%" stopColor={color.start} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={color.end} stopOpacity={1} />
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
                        <Cell key={`cell-${index}`} fill={`url(#colorGradient${index % COLORS.length})`} stroke={'hsl(var(--surface))'} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-surface border border-border rounded-lg p-3 shadow-xl backdrop-blur-sm">
                              <p className="font-semibold text-sm mb-1">{payload[0].name}</p>
                              <p className="text-primary font-bold text-base">
                                {new Intl.NumberFormat('pt-BR', { 
                                  style: 'currency', 
                                  currency: 'BRL' 
                                }).format(payload[0].value as number)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {((payload[0].value as number / categoryData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}% do total
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      content={({ payload }) => {
                        if (!payload || payload.length === 0) return null;
                        
                        return (
                          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                            {payload.map((entry, index) => {
                              // Usar as cores dos gradientes definidos
                              const colorIndex = index % COLORS.length;
                              const gradientColor = COLORS[colorIndex];
                              
                              return (
                                <div key={entry.value} className="flex items-center gap-2">
                                  <div
                                    className="h-3 w-3 shrink-0 rounded-full"
                                    style={{ 
                                      background: `linear-gradient(135deg, ${gradientColor.start}, ${gradientColor.end})`
                                    }}
                                  />
                                  <span className="text-sm text-text-muted">
                                    {entry.value}
                                  </span>
                                  <span className="text-xs text-text-muted font-medium">
                                    ({((entry.payload?.value / categoryData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-center text-text-muted px-4">
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
        <Card>
          <CardHeader>
            <CardTitle>Últimas Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {latestTransactions.length > 0 ? (
              <div className="space-y-4">
                {latestTransactions.map((transaction, index) => (
                  <ContextMenu key={transaction.id}>
                    <ContextMenuTrigger asChild>
                      <div 
                        className="cursor-context-menu group relative overflow-hidden flex items-center justify-between p-3 rounded-lg bg-surface-elevated hover:bg-surface-hover hover:scale-[1.02] hover:shadow-lg transition-all duration-200 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                        <div className="relative z-10 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{transaction.categoria}</span>
                            {transaction.tipo === 'entrada' ? (
                              <ArrowUpIcon className="h-4 w-4 text-[#39a85b]" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4 text-[#a93838]" />
                            )}
                          </div>
                          {transaction.descricao && (
                            <p className="text-sm text-text-muted">{sanitizeText(transaction.descricao)}</p>
                          )}
                          <p className="text-xs text-text-muted mt-1">
                            {new Date(transaction.data_hora).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className={`relative z-10 text-lg font-semibold ${transaction.tipo === 'entrada' ? 'text-[#39a85b]' : 'text-[#a93838]'}`}>
                          {transaction.tipo === 'entrada' ? '+' : '-'}
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(transaction.valor))}
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
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-text-muted">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma transação registrada</p>
                <p className="text-sm mt-2">Adicione sua primeira transação ao lado</p>
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