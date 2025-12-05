import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useMemo, useState, memo } from 'react';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export const DespesasPorCategoriaChart = memo(function DespesasPorCategoriaChart() {
  const { records, loading } = useFinancialData();
  const [categoryType, setCategoryType] = useState<'entrada' | 'saida'>('saida');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const { chartData, totalValue, topCategory } = useMemo(() => {
    if (!records) return { chartData: [], totalValue: 0, topCategory: null };
    
    // ✅ CORREÇÃO: Incluir todos os registros, não apenas os pagos
    const filteredRecords = records.filter(r => r.tipo === categoryType);
    const groupedByCategory = filteredRecords.reduce((acc, record) => {
      const categoria = record.categoria || 'Sem Categoria';
      const valor = Math.abs(Number(record.valor));
      if (!acc[categoria]) {
        acc[categoria] = 0;
      }
      acc[categoria] += valor;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(groupedByCategory).reduce((sum, val) => sum + val, 0);

    const sortedData: CategoryData[] = Object.entries(groupedByCategory)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Mostrar apenas top 6

    const top = sortedData.length > 0 ? sortedData[0] : null;

    return { chartData: sortedData, totalValue: total, topCategory: top };
  }, [records, categoryType]);

  if (loading) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px] sm:h-[350px] lg:h-[380px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Por Categoria</CardTitle>
            <Tabs value={categoryType} onValueChange={(v: any) => setCategoryType(v)} className="w-auto">
              <TabsList className="h-8 p-1">
                <TabsTrigger value="saida" className="text-xs px-2 sm:px-3 py-1">Despesas</TabsTrigger>
                <TabsTrigger value="entrada" className="text-xs px-2 sm:px-3 py-1">Receitas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground text-center px-4">
            {categoryType === 'saida' ? 'Não há despesas para exibir.' : 'Não há receitas para exibir.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full group relative overflow-hidden min-w-0">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10" />
      
      {/* Header */}
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg">Por Categoria</CardTitle>
          <Tabs value={categoryType} onValueChange={(v: any) => setCategoryType(v)} className="w-auto">
            <TabsList className="h-8 p-1">
              <TabsTrigger value="saida" className="text-xs px-2 sm:px-3 py-1">Despesas</TabsTrigger>
              <TabsTrigger value="entrada" className="text-xs px-2 sm:px-3 py-1">Receitas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Valor Total */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Total do período</p>
          <p className={`text-2xl sm:text-3xl font-bold ${categoryType === 'saida' ? 'text-[#a93838]' : 'text-[#39a85b]'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
          </p>
        </div>
      </CardHeader>

      {/* Lista de Barras */}
      <CardContent className="flex-1 overflow-auto px-4 sm:px-6 space-y-3">
        {chartData.map((category, index) => (
          <div
            key={category.name}
            className="space-y-2 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
            onMouseEnter={() => setHoveredCategory(category.name)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            {/* Label e Valor */}
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 transition-transform duration-200"
                  style={{ 
                    backgroundColor: category.color,
                    transform: hoveredCategory === category.name ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
                <span className="font-medium truncate">{category.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(category.value)}
                </span>
              </div>
            </div>
            
            {/* Barra de Progresso */}
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${category.percentage}%`,
                  background: `linear-gradient(to right, ${category.color}, ${category.color}dd)`,
                  opacity: hoveredCategory === category.name ? 1 : 0.9,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>

      {/* Footer com Insight */}
      {topCategory && (
        <CardFooter className="pt-3 border-t mt-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
            {categoryType === 'saida' ? (
              <TrendingDown className="h-4 w-4 text-[#a93838]" />
            ) : (
              <TrendingUp className="h-4 w-4 text-[#39a85b]" />
            )}
            <span>
              <strong className="text-foreground">{topCategory.name}</strong> representa{' '}
              <strong className="text-foreground">{topCategory.percentage.toFixed(1)}%</strong> do total
            </span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
});