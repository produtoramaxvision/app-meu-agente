import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useMemo, useState, memo } from 'react';
import { Loader2 } from 'lucide-react';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const StatusTimelineChart = memo(function StatusTimelineChart() {
  const { records, loading } = useFinancialData();
  const [statusFilter, setStatusFilter] = useState<'pago' | 'pendente'>('pago');

  const { chartData, config } = useMemo(() => {
    if (!records) return { chartData: [], config: {} };

    // Filtrar registros pelo status selecionado
    const filteredRecords = records.filter(r => r.status === statusFilter);

    // Obter o intervalo do mês atual
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Agrupar transações por dia
    const dailyData = daysInMonth.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayRecords = filteredRecords.filter(r => {
        const recordDate = format(parseISO(r.data_hora), 'yyyy-MM-dd');
        return recordDate === dayStr;
      });

      const entradas = dayRecords
        .filter(r => r.tipo === 'entrada')
        .reduce((sum, r) => sum + Math.abs(Number(r.valor)), 0);

      const saidas = dayRecords
        .filter(r => r.tipo === 'saida')
        .reduce((sum, r) => sum + Math.abs(Number(r.valor)), 0);

      return {
        date: format(day, 'dd/MM'),
        fullDate: format(day, 'dd/MM/yyyy'),
        dateObj: day, // Adicionar objeto Date completo para comparação
        entradas,
        saidas,
      };
    });

    const chartConfig = {
      entradas: {
        label: 'Entradas',
        color: 'hsl(var(--chart-1))',
      },
      saidas: {
        label: 'Saídas',
        color: 'hsl(var(--chart-2))',
      },
    };

    return { chartData: dailyData, config: chartConfig };
  }, [records, statusFilter]);

  if (loading) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>Evolução de Transações</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0 || chartData.every(d => d.entradas === 0 && d.saidas === 0)) {
    return (
      <Card className="flex flex-col h-full group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10" />
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Evolução de Transações</CardTitle>
            <Tabs value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)} className="w-auto">
              <TabsList className="h-8 p-1">
                <TabsTrigger value="pago" className="text-xs px-2 sm:px-3 py-1">Pago</TabsTrigger>
                <TabsTrigger value="pendente" className="text-xs px-2 sm:px-3 py-1">Pendente</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center px-4">
            Não há dados de transações {statusFilter === 'pago' ? 'pagas' : 'pendentes'} para exibir.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full group relative overflow-hidden min-w-0">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10" />
      
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg">Evolução de Transações</CardTitle>
          <Tabs value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)} className="w-auto">
            <TabsList className="h-8 p-1">
              <TabsTrigger value="pago" className="text-xs px-2 sm:px-3 py-1">Pago</TabsTrigger>
              <TabsTrigger value="pendente" className="text-xs px-2 sm:px-3 py-1">Pendente</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-2 sm:p-4">
        <ChartContainer config={config} className="h-full w-full">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
          >
              <defs>
                <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                tickMargin={8}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                width={60}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border/50 shadow-lg rounded-lg p-3 text-sm">
                        <p className="font-bold text-foreground mb-2">{payload[0].payload.fullDate}</p>
                        {payload.map((entry, index) => (
                          <div key={`tooltip-entry-${entry.dataKey}-${index}`} className="flex items-center justify-between gap-4 mb-1">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-muted-foreground">{entry.name}:</span>
                            </div>
                            <span className="font-semibold text-foreground">
                              {new Intl.NumberFormat('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              }).format(entry.value as number)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="entradas"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  // Mostrar dot apenas se houver valor de entrada neste dia
                  if (!payload.entradas || payload.entradas === 0) {
                    return null; // Não renderizar dot se não houver entradas
                  }
                  return (
                    <circle
                      key={`entrada-dot-${payload.date}`}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="hsl(var(--chart-1))"
                      className="transition-all"
                    />
                  );
                }}
                activeDot={{ r: 5 }}
                name="Entradas"
              />
              <Line
                type="monotone"
                dataKey="saidas"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  // Mostrar dot apenas se houver valor de saída neste dia
                  if (!payload.saidas || payload.saidas === 0) {
                    return null; // Não renderizar dot se não houver saídas
                  }
                  return (
                    <circle
                      key={`saida-dot-${payload.date}`}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="hsl(var(--chart-2))"
                      className="transition-all"
                    />
                  );
                }}
                activeDot={{ r: 5 }}
                name="Saídas"
              />
            </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
});
