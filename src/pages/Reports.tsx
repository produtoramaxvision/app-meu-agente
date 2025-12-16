import { useState, useMemo, useRef, useEffect } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useAuth } from '@/contexts/AuthContext';
import { useSearch } from '@/contexts/SearchContext';
import { ProtectedExportButton } from '@/components/ProtectedFeature';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Sector, ResponsiveContainer } from 'recharts';
import { Download, ArrowUpIcon, ArrowDownIcon, TrendingUp, FileText, CalendarIcon, X, ArrowUpDown, Trash2, Copy, Edit, CheckCircle, Clock, Search, ChevronDown, Car, Home, Utensils, ShoppingBag, PartyPopper, Briefcase, Gift, Plane, Smartphone, Zap, Wifi, Shield, Heart, MoreHorizontal, Undo2, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DeleteRecordDialog } from '@/components/DeleteRecordDialog';
import { BulkDeleteDialog } from '@/components/BulkDeleteDialog';
import { EditRecordDialog } from '@/components/EditRecordDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DespesasPorCategoriaChart } from '@/components/DespesasPorCategoriaChart';
import { StatusTimelineChart } from '@/components/StatusTimelineChart';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import { toast } from 'sonner';
import { sanitizeText } from '@/lib/sanitize';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const getCategoryIcon = (category: string) => {
  const normalized = category?.toLowerCase() || '';
  if (normalized.includes('transporte') || normalized.includes('uber') || normalized.includes('combustível') || normalized.includes('carro')) return Car;
  if (normalized.includes('alimentação') || normalized.includes('restaurante') || normalized.includes('mercado') || normalized.includes('ifood')) return Utensils;
  if (normalized.includes('moradia') || normalized.includes('casa') || normalized.includes('aluguel') || normalized.includes('condomínio') || normalized.includes('luz') || normalized.includes('água')) return Home;
  if (normalized.includes('viagem') || normalized.includes('férias')) return Plane;
  if (normalized.includes('lazer') || normalized.includes('cinema') || normalized.includes('jogos')) return PartyPopper;
  if (normalized.includes('saúde') || normalized.includes('médico') || normalized.includes('farmácia')) return Heart;
  if (normalized.includes('trabalho') || normalized.includes('salário') || normalized.includes('freela')) return Briefcase;
  if (normalized.includes('compra') || normalized.includes('vestuário') || normalized.includes('shopping')) return ShoppingBag;
  if (normalized.includes('presente')) return Gift;
  if (normalized.includes('tecnologia') || normalized.includes('internet') || normalized.includes('celular')) return Smartphone;
  if (normalized.includes('contas') || normalized.includes('serviços')) return Zap;
  return FileText;
};

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

export default function Reports() {
  const { cliente } = useAuth();
  const { searchQuery, setSearchQuery, setHasResults } = useSearch();
  const [periodFilter, setPeriodFilter] = useState<string>('month');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'entrada' | 'saida' | 'all'>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [sortColumn, setSortColumn] = useState<'data_hora' | 'valor' | 'categoria'>('data_hora');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryType, setCategoryType] = useState<'entrada' | 'saida'>('saida');
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<FinanceRecord | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<number>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<FinanceRecord | null>(null);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const recordsPerPage = 50;
  const transactionsTableRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to transactions table on search
  useEffect(() => {
    if (searchQuery && transactionsTableRef.current) {
      transactionsTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchQuery]);

  // Memoize period in days to prevent infinite loop
  const periodDays = useMemo(() => {
    // Se for período customizado, calcula diferença em dias
    if (periodFilter === 'custom' && customStartDate && customEndDate) {
      const diffTime = customEndDate.getTime() - customStartDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    
    switch (periodFilter) {
      case 'month':
        return 30;
      case '3months':
        return 90;
      case 'year':
        return 365;
      default:
        return 30;
    }
  }, [periodFilter, customStartDate, customEndDate]);

  const { records, loading, metrics, getCategoryData, getMonthlyData, getInsights, refetch } = useFinancialData(
    periodDays,
    categoryFilter,
    typeFilter
  );

  const categoryData = getCategoryData(categoryType);
  const monthlyData = getMonthlyData();
  const insights = getInsights(categoryType);

  // DEBUG: Verificar dados mensais
  console.log('Reports - monthlyData:', monthlyData);

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
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error("Não foi possível excluir o registro. Tente novamente.");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedRecords.map(r => r.id));
      setSelectedRecords(allIds);
    } else {
      setSelectedRecords(new Set());
    }
  };

  const handleSelectRecord = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRecords(newSelected);
  };

  const handleToggleStatus = async (record: FinanceRecord) => {
    try {
      const newStatus = record.status === 'pago' ? 'pendente' : 'pago';
      const { error } = await supabase
        .from('financeiro_registros')
        .update({ status: newStatus })
        .eq('id', record.id);

      if (error) throw error;

      toast.success(`Status alterado para ${newStatus === 'pago' ? 'Pago' : 'Pendente'}`);
      refetch();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) return;

    setIsBulkDeleting(true);
    try {
      const { error } = await supabase
        .from('financeiro_registros')
        .delete()
        .in('id', Array.from(selectedRecords));

      if (error) throw error;

      toast.success("Registros excluídos", {
        description: `${selectedRecords.size} ${selectedRecords.size === 1 ? 'registro foi excluído' : 'registros foram excluídos'} com sucesso.`,
      });

      refetch();
      setSelectedRecords(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (error) {
      console.error('Erro ao excluir em massa:', error);
      toast.error("Não foi possível excluir os registros. Tente novamente.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleDuplicateRecord = async (record: FinanceRecord) => {
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
    } catch (error) {
      console.error('Erro ao duplicar:', error);
      toast.error("Não foi possível duplicar o registro. Tente novamente.");
    }
  };
  
  const COLORS = categoryType === 'saida' ? EXPENSE_COLORS : INCOME_COLORS;

  const renderActiveShape = (props: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; startAngle: number; endAngle: number; fill: string; payload: { name: string }; percent: number; value: number }) => {
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

  // Filter and sort records
  const filteredAndSortedRecords = useMemo(() => {
    const filtered = records.filter((record) =>
      searchQuery === '' || 
      record.descricao?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.categoria.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort records
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'data_hora':
          comparison = new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime();
          break;
        case 'valor':
          comparison = Number(a.valor) - Number(b.valor);
          break;
        case 'categoria':
          comparison = a.categoria.localeCompare(b.categoria);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [records, searchQuery, sortColumn, sortDirection]);

  // Notify SearchContext when results change
  useEffect(() => {
    const hasResults = searchQuery === '' || filteredAndSortedRecords.length > 0;
    setHasResults(hasResults);
  }, [filteredAndSortedRecords.length, searchQuery, setHasResults]);

  // Get unique categories
  const uniqueCategories = Array.from(new Set(records.map((r) => r.categoria)));

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRecords.length / recordsPerPage);
  const paginatedRecords = filteredAndSortedRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Get selected records data for bulk dialog
  const selectedRecordsData = paginatedRecords.filter(r => selectedRecords.has(r.id));

  // Handle sort
  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setPeriodFilter('month');
    setCategoryFilter('all');
    setTypeFilter('all');
    setSearchQuery('');
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExportCSV = () => {
    /**
     * BUG FIX - TestSprite TC006
     * Problema: Botão de exportar CSV não dispara download nem indica sucesso
     * Solução: Melhorar implementação de CSV com feedback visual e encoding correto
     * Data: 2025-01-06
     * Validado: sim
     */
    
    setIsExportingCSV(true);
    let loadingToastId: string | number | undefined;
    
    try {
      // Mostrar feedback de loading e capturar o ID
      loadingToastId = toast.loading("Exportando dados...", {
        description: "Gerando arquivo CSV dos seus dados financeiros",
      });

      const headers = ['Data', 'Tipo', 'Status', 'Categoria', 'Descrição', 'Valor'];
      const rows = filteredAndSortedRecords.map((r) => [
        new Date(r.data_hora).toLocaleDateString('pt-BR'),
        r.tipo === 'entrada' ? 'Entrada' : 'Saída',
        r.status === 'pago' ? 'Pago' : 'Pendente',
        r.categoria || 'Sem categoria',
        (r.descricao || '').replace(/,/g, ';'), // Substituir vírgulas para evitar conflito CSV
        `R$ ${Number(r.valor).toFixed(2).replace('.', ',')}`,
      ]);

      // Adicionar BOM para compatibilidade com Excel brasileiro
      const BOM = '\uFEFF';
      const csvContent = BOM + [headers, ...rows].map((row) => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      // Nome do arquivo com timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      link.download = `relatorio_financeiro_${timestamp}.csv`;
      
      // Adicionar ao DOM temporariamente para garantir clique
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar URL do objeto
      URL.revokeObjectURL(link.href);

      // Fechar toast de loading antes de mostrar sucesso
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }

      // Feedback de sucesso
      toast.success("Relatório exportado com sucesso!", {
        description: `Arquivo CSV gerado com ${filteredAndSortedRecords.length} registros`,
      });

    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      
      // Fechar toast de loading em caso de erro
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      
      toast.error("Erro ao exportar", {
        description: "Não foi possível gerar o arquivo CSV. Tente novamente.",
      });
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    let loadingToastId: string | number | undefined;
    
    try {
      // Mostrar feedback de loading e capturar o ID
      loadingToastId = toast.loading("Exportando PDF...", {
        description: "Gerando relatório em PDF dos seus dados financeiros",
      });

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Relatório Financeiro', 14, 22);
      
      // Subtítulo com data
      doc.setFontSize(10);
      doc.text(`Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);
      
      // Métricas resumidas
      doc.setFontSize(12);
      doc.text(`Total de Receitas: R$ ${metrics.totalReceitas.toFixed(2).replace('.', ',')}`, 14, 40);
      doc.text(`Total de Despesas: R$ ${metrics.totalDespesas.toFixed(2).replace('.', ',')}`, 14, 47);
      doc.text(`Saldo: R$ ${metrics.saldo.toFixed(2).replace('.', ',')}`, 14, 54);
      doc.text(`Total de Transações: ${metrics.totalTransacoes}`, 14, 61);
      
      // Tabela de transações
      doc.setFontSize(10);
      let y = 75;
      
      // Cabeçalho da tabela
      doc.setFontSize(12);
      doc.text('RELATÓRIO DE TRANSAÇÕES', 14, y);
      y += 10;
      
      doc.setFontSize(8);
      doc.text('Data', 14, y);
      doc.text('Tipo', 40, y);
      doc.text('Status', 60, y);
      doc.text('Categoria', 85, y);
      doc.text('Descrição', 125, y);
      doc.text('Valor', 180, y);
      
      y += 7;
      doc.setFontSize(8);
      
      filteredAndSortedRecords.slice(0, 50).forEach((r) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        
        doc.text(format(new Date(r.data_hora), 'dd/MM/yyyy'), 14, y);
        doc.text(r.tipo === 'entrada' ? 'Entrada' : 'Saída', 40, y);
        doc.text(r.status === 'pago' ? 'Pago' : 'Pendente', 60, y);
        doc.text((r.categoria || 'Sem categoria').substring(0, 15), 85, y);
        doc.text((r.descricao || '').substring(0, 20), 125, y);
        doc.text(`R$ ${Number(r.valor).toFixed(2).replace('.', ',')}`, 180, y);
        y += 7;
      });
      
      // Salvar arquivo
      const timestamp = format(new Date(), 'yyyy-MM-dd');
      doc.save(`relatorio-financeiro-${timestamp}.pdf`);
      
      // Fechar toast de loading antes de mostrar sucesso
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      
      toast.success("PDF exportado com sucesso!", {
        description: "O relatório foi salvo no seu dispositivo",
      });
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      
      // Fechar toast de loading em caso de erro
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      
      toast.error("Erro ao exportar PDF", {
        description: "Não foi possível gerar o arquivo PDF. Tente novamente.",
      });
    }
  };

  // Export to JSON
  const handleExportJSON = () => {
    let loadingToastId: string | number | undefined;
    
    try {
      // Mostrar feedback de loading e capturar o ID
      loadingToastId = toast.loading("Exportando JSON...", {
        description: "Gerando arquivo JSON dos seus dados financeiros",
      });

      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalRecords: filteredAndSortedRecords.length,
          period: periodFilter,
          category: categoryFilter,
          type: typeFilter,
          searchQuery: searchQuery,
        },
        metrics: {
          totalReceitas: metrics.totalReceitas,
          totalDespesas: metrics.totalDespesas,
          saldo: metrics.saldo,
          totalTransacoes: metrics.totalTransacoes,
        },
        records: filteredAndSortedRecords.map(record => ({
          id: record.id,
          tipo: record.tipo,
          categoria: record.categoria,
          valor: record.valor,
          descricao: record.descricao,
          data_hora: record.data_hora,
          data_vencimento: record.data_vencimento,
          status: record.status,
          recorrente: record.recorrente,
          recorrencia_fim: record.recorrencia_fim,
        }))
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      // Nome do arquivo com timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd');
      link.download = `relatorio_financeiro_${timestamp}.json`;
      
      // Adicionar ao DOM temporariamente para garantir clique
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar URL do objeto
      URL.revokeObjectURL(link.href);
      
      // Fechar toast de loading antes de mostrar sucesso
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      
      toast.success("JSON exportado com sucesso!", {
        description: "O arquivo foi salvo no seu dispositivo",
      });
      
    } catch (error) {
      console.error('Erro ao exportar JSON:', error);
      
      // Fechar toast de loading em caso de erro
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      
      toast.error("Erro ao exportar JSON", {
        description: "Não foi possível gerar o arquivo JSON. Tente novamente.",
      });
    }
  };

  if (loading) {
    return (
      <div className="py-4 sm:py-6 lg:py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">Relatórios</h1>
          <p className="text-text-muted mt-2">Análise detalhada das suas finanças</p>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Estado vazio - sem dados
  if (!loading && records.length === 0) {
    return (
      <div className="py-4 sm:py-6 lg:py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">Relatórios</h1>
          <p className="text-text-muted mt-2">Análise detalhada das suas finanças</p>
        </div>
        
        <Card className="p-12">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="h-20 w-20 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
              <FileText className="h-10 w-10 text-[hsl(var(--muted-foreground))]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
                Nenhum registro financeiro encontrado
              </h3>
              <p className="text-[hsl(var(--muted-foreground))] max-w-md">
                Comece adicionando suas primeiras transações na página de Dashboard para visualizar relatórios e análises detalhadas.
              </p>
            </div>
            <Button asChild size="lg" className="mt-4">
              <a href="/dashboard">Ir para Dashboard</a>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 lg:py-8 space-y-8 min-w-0 w-full">
      <div className="flex flex-col gap-4 px-2 md:px-0 min-w-0">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">Relatórios</h1>
            <p className="text-text-muted mt-2">Análise detalhada das suas finanças</p>
          </div>
          
          {/* Botão de exportação unificado */}
          <div className="animate-fade-in flex justify-center md:justify-end md:pr-8 lg:pr-14 xl:pr-16" style={{ animationDelay: '100ms' }}>
            <div className="relative w-full sm:w-auto">
              <ProtectedExportButton
                onExportPDF={handleExportPDF}
                onExportJSON={handleExportJSON}
                onExportCSV={handleExportCSV}
                disabled={isExportingCSV}
              >
                <Download className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold text-white">Exportar</span>
                <ChevronDown className="h-4 w-4 text-white transition-transform group-hover:scale-110" />
              </ProtectedExportButton>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-primary/12 via-transparent to-sky-500/12 opacity-90" />
        <CardHeader className="flex flex-row items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Search className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-sm font-semibold tracking-tight">
                Filtros
              </CardTitle>
              <p className="text-[11px] text-text-muted">
                Ajuste o período, categoria, tipo e busque por descrição
              </p>
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:pointer-events-none"
          >
            <span className="relative z-10 flex items-center">
              <X className="mr-2 h-4 w-4 transition-transform group-hover:scale-110 group-hover:rotate-90" />
              <span className="hidden sm:inline">Limpar Filtros</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={periodFilter || undefined} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                  <SelectItem value="year">Este ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select value={categoryFilter || undefined} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select 
                value={typeFilter} 
                onValueChange={(v: 'entrada' | 'saida' | 'all') => {
                  /**
                   * BUG FIX - TestSprite TC011
                   * Problema: Filtro 'Tipo' não podia ser alterado de 'Todas' para outras opções
                   * Solução: Melhorar handler de mudança de valor e garantir que o estado seja atualizado
                   * Data: 2025-01-06
                   * Validado: sim
                   */
                  console.log('Changing type filter to:', v); // Debug log
                  setTypeFilter(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Descrição ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

          </div>

          {/* Custom Date Range */}
          {periodFilter === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(customStartDate, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDate}
                      onSelect={setCustomStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !customEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(customEndDate, "dd/MM/yyyy") : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDate}
                      onSelect={setCustomEndDate}
                      initialFocus
                      disabled={(date) => customStartDate ? date < customStartDate : false}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 min-w-0">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl" style={{ animationDelay: '0ms' }}>
          <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-emerald-500/15 via-transparent to-emerald-500/5 opacity-90" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-text-muted tracking-wide uppercase">
                Total Receitas
              </CardTitle>
              <p className="text-[11px] text-emerald-300/90 mt-0.5">
                Entradas registradas no período
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
              <p className="text-[11px] text-red-300/90 mt-0.5">
                Saídas registradas no período
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
          <div className="pointer-events-none absolute inset-px rounded-[1rem] bg-gradient-to-br from-sky-500/15 via-transparent to-emerald-500/10 opacity-90" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xs font-medium text-text-muted tracking-wide uppercase">
                {categoryType === 'saida' ? 'Categoria com Maior Gasto' : 'Categoria com Maior Receita'}
              </CardTitle>
              <p className="text-[11px] text-text-muted mt-0.5">
                Destaque de categoria no período
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-sky-500/15 border border-sky-500/40 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-sky-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-1">
            {insights.topCategory ? (
              <>
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insights.topCategory.value)}
                </div>
                <p className="mt-1 inline-flex items-center rounded-full bg-surface-elevated/80 border border-border/60 px-2.5 py-0.5 text-[11px] font-medium">
                  {insights.topCategory.name}
                </p>
              </>
            ) : (
              <p className="text-xs text-text-muted">
                {categoryType === 'saida' ? 'Adicione despesas para análise.' : 'Adicione receitas para análise.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid - 3 columns com altura consistente */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 min-w-0">
        {/* Gastos por Categoria */}
        <div className="h-[450px] sm:h-[500px] md:col-span-2 lg:col-span-1 min-w-0 overflow-hidden">
          <DespesasPorCategoriaChart />
        </div>

        {/* Evolução de Transações */}
        <div className="h-[450px] sm:h-[500px] md:col-span-2 lg:col-span-1 min-w-0 overflow-hidden">
          <StatusTimelineChart />
        </div>

        {/* Monthly Bar Chart */}
        <div className="h-[450px] sm:h-[500px] md:col-span-2 lg:col-span-1 min-w-0 overflow-hidden">
          <Card className="group relative overflow-hidden h-full flex flex-col min-w-0">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Comparação Mensal</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center p-2 sm:p-4">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    barGap={6}
                    barCategoryGap="20%"
                  >
                    <defs>
                      <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#39a85b" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#39a85b" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a93838" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#a93838" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))" 
                      opacity={0.3}
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--foreground))" 
                      fontSize={11}
                      fontWeight={400}
                      tickLine={false}
                      axisLine={false}
                      opacity={0.7}
                      tickMargin={8}
                    />
                    <YAxis 
                      stroke="hsl(var(--foreground))" 
                      fontSize={11}
                      fontWeight={400}
                      tickLine={false}
                      axisLine={false}
                      opacity={0.7}
                      width={60}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--surface))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        padding: '12px'
                      }}
                      wrapperStyle={{ outline: 'none' }}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                      formatter={(value: number) => [
                        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                        ''
                      ]}
                      labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
                    />
                    <Legend 
                      iconType="circle"
                      wrapperStyle={{ 
                        paddingTop: '15px',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    />
                    <Bar 
                      dataKey="entradas" 
                      fill="url(#colorEntradas)" 
                      name="Entradas"
                      radius={[6, 6, 0, 0]}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                    <Bar 
                      dataKey="saidas" 
                      fill="url(#colorSaidas)" 
                      name="Saídas"
                      radius={[6, 6, 0, 0]}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transactions List - Refactored */}
      <Card ref={transactionsTableRef} className="bg-transparent border-none shadow-none">
        <CardHeader className="px-0 pt-0 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Todas as Transações
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredAndSortedRecords.length} {filteredAndSortedRecords.length === 1 ? 'transação encontrada' : 'transações encontradas'}
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {selectedRecords.size > 0 && (
                <Button size="sm" variant="destructive" onClick={() => setBulkDeleteDialogOpen(true)} className="shadow-sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir ({selectedRecords.size})
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-card/50 backdrop-blur-sm">
                    <ArrowUpDown className="w-4 h-4" />
                    Ordenar
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleSort('data_hora')}>
                    <CalendarIcon className="mr-2 h-4 w-4" /> Data
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('valor')}>
                    <TrendingUp className="mr-2 h-4 w-4" /> Valor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('categoria')}>
                    <Tag className="mr-2 h-4 w-4" /> Categoria
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="flex items-center px-2">
                 <Checkbox
                    checked={paginatedRecords.length > 0 && paginatedRecords.every(r => selectedRecords.has(r.id))}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos"
                  />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          {searchQuery && filteredAndSortedRecords.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 px-4 bg-card/30 rounded-xl border border-dashed"
            >
              <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-red-500/70" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum resultado encontrado</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Não encontramos transações com o termo "<span className="font-medium text-foreground">{searchQuery}</span>"
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpar busca
                </Button>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  Limpar todos os filtros
                </Button>
              </div>
            </motion.div>
          ) : filteredAndSortedRecords.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {paginatedRecords.map((record) => {
                  const isSelected = selectedRecords.has(record.id);
                  const handleCheckedChange = (checked: boolean) => handleSelectRecord(record.id, checked);
                  const CategoryIcon = getCategoryIcon(record.categoria);
                  const isExpense = record.tipo === 'saida';

                  return (
                    <ContextMenu key={record.id}>
                      <ContextMenuTrigger asChild>
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card/80 backdrop-blur-sm hover:bg-card hover:shadow-md transition-all duration-200 hover:scale-[1.005] cursor-context-menu relative overflow-hidden",
                            isSelected && "border-primary/50 bg-primary/5"
                          )}
                        >
                           <div className={cn(
                              "absolute left-0 top-0 bottom-0 w-1 bg-transparent transition-colors duration-200",
                              isExpense ? "group-hover:bg-red-500/50" : "group-hover:bg-green-500/50",
                              isSelected && (isExpense ? "bg-red-500" : "bg-green-500")
                           )} />

                           <div className="flex items-start sm:items-center gap-4 z-10 w-full sm:w-auto">
                              <div onClick={(e) => e.stopPropagation()} className="pt-1 sm:pt-0">
                                <Checkbox checked={isSelected} onCheckedChange={handleCheckedChange} />
                              </div>
                              
                              <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border",
                                isExpense ? "bg-red-500/10 border-red-500/20 text-red-600" : "bg-green-500/10 border-green-500/20 text-green-600"
                              )}>
                                <CategoryIcon className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-sm sm:text-base truncate pr-4">
                                  {record.descricao || record.categoria}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" />
                                    {format(new Date(record.data_hora), 'dd/MM/yyyy')}
                                  </span>
                                  <span className="hidden sm:inline">•</span>
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-background/50 hidden sm:flex">
                                    {record.categoria}
                                  </Badge>
                                </div>
                              </div>
                           </div>

                           <div className="flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0 pl-10 sm:pl-0 w-full sm:w-auto">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={record.status === 'pago' ? 'default' : 'secondary'} 
                                  className={cn(
                                    "text-xs font-medium capitalize shadow-none border-0",
                                    record.status === 'pago' 
                                      ? "bg-green-500/15 text-green-600 hover:bg-green-500/25 dark:bg-green-500/20 dark:text-green-400" 
                                      : "bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 dark:bg-yellow-500/20 dark:text-yellow-400"
                                  )}
                                >
                                  {record.status === 'pago' ? 'Pago' : 'Pendente'}
                                </Badge>
                              </div>

                              <div className="text-right min-w-[100px]">
                                <span className={cn(
                                  "text-lg font-bold tracking-tight",
                                  isExpense ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                )}>
                                  {isExpense ? '-' : '+'}
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(record.valor))}
                                </span>
                              </div>
                           </div>
                        </motion.div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-48">
                          <ContextMenuItem onClick={() => { setRecordToEdit(record); setEditDialogOpen(true); }}>
                            <Edit className="mr-2 h-4 w-4" /><span>Editar</span>
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleDuplicateRecord(record)}>
                            <Copy className="mr-2 h-4 w-4" /><span>Duplicar</span>
                          </ContextMenuItem>
                          <ContextMenuItem onClick={() => handleToggleStatus(record)}>
                             {record.status === 'pago' ? (
                               <><Undo2 className="mr-2 h-4 w-4" /><span>Marcar como Pendente</span></>
                             ) : (
                               <><CheckCircle className="mr-2 h-4 w-4" /><span>Marcar como Pago</span></>
                             )}
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem onClick={() => { setRecordToDelete(record); setDeleteDialogOpen(true); }} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /><span>Excluir</span>
                          </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </AnimatePresence>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
               <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Search className="h-6 w-6 opacity-50" />
               </div>
               <p>Nenhuma transação encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteRecordDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        record={recordToDelete}
        onConfirm={handleDeleteRecord}
      />

      <BulkDeleteDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        recordCount={selectedRecords.size}
        recordsPreview={selectedRecordsData}
        onConfirm={handleBulkDelete}
        isDeleting={isBulkDeleting}
      />

      <EditRecordDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        record={recordToEdit}
        onSuccess={() => {
          refetch();
          setEditDialogOpen(false);
          setRecordToEdit(null);
        }}
      />

      {/* Floating Bulk Actions Button */}
      {selectedRecords.size > 0 && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <Button
            onClick={() => setBulkDeleteDialogOpen(true)}
            variant="destructive"
            size="sm"
            className="rounded-full px-4 py-2 text-sm font-medium gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Trash2 className="h-5 w-5" />
            Excluir {selectedRecords.size} {selectedRecords.size === 1 ? 'selecionado' : 'selecionados'}
          </Button>
        </div>
      )}
    </div>
  );
}