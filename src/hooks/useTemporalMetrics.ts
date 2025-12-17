import { useMemo } from 'react';
import { EvolutionContact, LeadStatus } from '@/types/sdr';
import { CRMPeriodType, getPeriodConfig } from '@/components/crm/CRMPeriodSelector';
import { DEFAULT_WIN_PROBABILITY } from '@/utils/leadScoring';

export interface TemporalMetric {
  current: number;
  previous: number;
  change: number; // Percentual de mudança
  changeDirection: 'up' | 'down' | 'neutral';
  trend: 'positive' | 'negative' | 'neutral'; // Se a mudança é boa ou ruim contextualmente
}

export interface DailyTrendData {
  date: string;
  dateLabel: string;
  newLeads: number;
  conversions: number;
  value: number;
  cumulativeValue: number;
}

export interface ForecastData {
  weightedPipelineValue: number; // Valor ponderado pela probabilidade
  expectedCloses: number; // Quantidade esperada de fechamentos
  bestCaseValue: number; // Melhor cenário (todos ganhos)
  worstCaseValue: number; // Pior cenário (só com alta probabilidade)
  confidenceScore: number; // Score de confiança do forecast (0-100)
}

export interface TemporalMetrics {
  // Métricas com comparativo temporal
  leads: TemporalMetric;
  conversions: TemporalMetric;
  revenue: TemporalMetric;
  winRate: TemporalMetric;
  avgDealSize: TemporalMetric;
  
  // Dados para gráfico de tendência
  trendData: DailyTrendData[];
  
  // Dados de forecast
  forecast: ForecastData;
  
  // Período atual
  periodLabel: string;
  previousPeriodLabel: string;
}

interface UseTemporalMetricsProps {
  contacts: EvolutionContact[];
  period: CRMPeriodType;
}

// Helper para verificar se data está no range
function isDateInRange(dateStr: string, start: Date, end: Date): boolean {
  const date = new Date(dateStr);
  return date >= start && date <= end;
}

// Helper para formatar data para label do gráfico
function formatDateLabel(date: Date, period: CRMPeriodType): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  if (period === 'today') {
    return `${date.getHours()}:00`;
  }
  if (period === 'this_week' || period === 'last_7_days') {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return weekdays[date.getDay()];
  }
  if (period === 'this_year' || period === 'last_90_days') {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[date.getMonth()];
  }
  return `${day}/${month}`;
}

// Helper para calcular mudança percentual
function calculateChange(current: number, previous: number): { change: number; direction: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    if (current === 0) return { change: 0, direction: 'neutral' };
    return { change: 100, direction: 'up' };
  }
  
  const change = Math.round(((current - previous) / previous) * 100);
  const direction: 'up' | 'down' | 'neutral' = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  return { change: Math.abs(change), direction };
}

// Helper para determinar se a mudança é positiva no contexto
function getTrend(direction: 'up' | 'down' | 'neutral', metric: 'leads' | 'conversions' | 'revenue' | 'winRate' | 'avgDealSize'): 'positive' | 'negative' | 'neutral' {
  if (direction === 'neutral') return 'neutral';
  
  // Para todas essas métricas, "up" é positivo
  return direction === 'up' ? 'positive' : 'negative';
}

export function useTemporalMetrics({ contacts, period }: UseTemporalMetricsProps): TemporalMetrics {
  return useMemo(() => {
    const config = getPeriodConfig(period);
    const { start: currentStart, end: currentEnd } = config.getDateRange();
    const { start: previousStart, end: previousEnd } = config.getPreviousRange();
    
    // Filtrar contatos por período
    const currentPeriodContacts = contacts.filter(c => 
      isDateInRange(c.created_at, currentStart, currentEnd)
    );
    
    const previousPeriodContacts = contacts.filter(c => 
      isDateInRange(c.created_at, previousStart, previousEnd)
    );
    
    // Contatos fechados no período
    const currentClosedContacts = contacts.filter(c => 
      c.crm_closed_at && isDateInRange(c.crm_closed_at, currentStart, currentEnd)
    );
    
    const previousClosedContacts = contacts.filter(c => 
      c.crm_closed_at && isDateInRange(c.crm_closed_at, previousStart, previousEnd)
    );
    
    // === CÁLCULO DE MÉTRICAS ===
    
    // Leads
    const currentLeads = currentPeriodContacts.length;
    const previousLeads = previousPeriodContacts.length;
    const leadsChange = calculateChange(currentLeads, previousLeads);
    
    // Conversões (ganhos)
    const currentConversions = currentClosedContacts.filter(c => c.crm_lead_status === 'ganho').length;
    const previousConversions = previousClosedContacts.filter(c => c.crm_lead_status === 'ganho').length;
    const conversionsChange = calculateChange(currentConversions, previousConversions);
    
    // Receita (valor dos ganhos)
    const currentRevenue = currentClosedContacts
      .filter(c => c.crm_lead_status === 'ganho')
      .reduce((sum, c) => sum + (c.crm_estimated_value || 0), 0);
    const previousRevenue = previousClosedContacts
      .filter(c => c.crm_lead_status === 'ganho')
      .reduce((sum, c) => sum + (c.crm_estimated_value || 0), 0);
    const revenueChange = calculateChange(currentRevenue, previousRevenue);
    
    // Win Rate
    const currentClosed = currentClosedContacts.length;
    const previousClosed = previousClosedContacts.length;
    const currentWinRate = currentClosed > 0 
      ? Math.round((currentConversions / currentClosed) * 100) 
      : 0;
    const previousWinRate = previousClosed > 0 
      ? Math.round((previousConversions / previousClosed) * 100) 
      : 0;
    const winRateChange = calculateChange(currentWinRate, previousWinRate);
    
    // Ticket Médio
    const currentAvgDeal = currentConversions > 0 
      ? Math.round(currentRevenue / currentConversions) 
      : 0;
    const previousAvgDeal = previousConversions > 0 
      ? Math.round(previousRevenue / previousConversions) 
      : 0;
    const avgDealChange = calculateChange(currentAvgDeal, previousAvgDeal);
    
    // === DADOS DE TENDÊNCIA ===
    
    const trendData: DailyTrendData[] = [];
    const daysDiff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Determinar granularidade baseado no período
    let granularity: 'hour' | 'day' | 'week' | 'month' = 'day';
    if (period === 'today') granularity = 'hour';
    if (period === 'this_year' || period === 'last_90_days') granularity = 'week';
    
    let cumulativeValue = 0;
    
    if (granularity === 'hour') {
      // Para "hoje", mostrar por hora
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(currentStart);
        hourStart.setHours(h, 0, 0, 0);
        const hourEnd = new Date(currentStart);
        hourEnd.setHours(h, 59, 59, 999);
        
        const hourContacts = currentPeriodContacts.filter(c => 
          isDateInRange(c.created_at, hourStart, hourEnd)
        );
        const hourConversions = currentClosedContacts.filter(c => 
          c.crm_lead_status === 'ganho' && 
          c.crm_closed_at && 
          isDateInRange(c.crm_closed_at, hourStart, hourEnd)
        );
        const hourValue = hourConversions.reduce((sum, c) => sum + (c.crm_estimated_value || 0), 0);
        cumulativeValue += hourValue;
        
        trendData.push({
          date: hourStart.toISOString(),
          dateLabel: `${h}:00`,
          newLeads: hourContacts.length,
          conversions: hourConversions.length,
          value: hourValue,
          cumulativeValue,
        });
      }
    } else if (granularity === 'week') {
      // Para períodos longos, agrupar por semana
      const weeks = Math.ceil(daysDiff / 7);
      for (let w = 0; w < Math.min(weeks, 12); w++) { // Máximo 12 pontos
        const weekStart = new Date(currentStart);
        weekStart.setDate(currentStart.getDate() + (w * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        if (weekStart > currentEnd) break;
        
        const weekContacts = currentPeriodContacts.filter(c => 
          isDateInRange(c.created_at, weekStart, weekEnd)
        );
        const weekConversions = currentClosedContacts.filter(c => 
          c.crm_lead_status === 'ganho' && 
          c.crm_closed_at && 
          isDateInRange(c.crm_closed_at, weekStart, weekEnd)
        );
        const weekValue = weekConversions.reduce((sum, c) => sum + (c.crm_estimated_value || 0), 0);
        cumulativeValue += weekValue;
        
        trendData.push({
          date: weekStart.toISOString(),
          dateLabel: formatDateLabel(weekStart, period),
          newLeads: weekContacts.length,
          conversions: weekConversions.length,
          value: weekValue,
          cumulativeValue,
        });
      }
    } else {
      // Agrupar por dia
      for (let d = 0; d <= Math.min(daysDiff, 31); d++) { // Máximo 31 pontos
        const dayStart = new Date(currentStart);
        dayStart.setDate(currentStart.getDate() + d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        
        if (dayStart > currentEnd) break;
        
        const dayContacts = currentPeriodContacts.filter(c => 
          isDateInRange(c.created_at, dayStart, dayEnd)
        );
        const dayConversions = currentClosedContacts.filter(c => 
          c.crm_lead_status === 'ganho' && 
          c.crm_closed_at && 
          isDateInRange(c.crm_closed_at, dayStart, dayEnd)
        );
        const dayValue = dayConversions.reduce((sum, c) => sum + (c.crm_estimated_value || 0), 0);
        cumulativeValue += dayValue;
        
        trendData.push({
          date: dayStart.toISOString(),
          dateLabel: formatDateLabel(dayStart, period),
          newLeads: dayContacts.length,
          conversions: dayConversions.length,
          value: dayValue,
          cumulativeValue,
        });
      }
    }
    
    // === FORECAST ===
    
    // Leads em aberto (não ganho/perdido)
    const openLeads = contacts.filter(c => 
      !['ganho', 'perdido'].includes(c.crm_lead_status || '')
    );
    
    // Helper para obter probabilidade (usa custom ou default)
    const getProbability = (contact: EvolutionContact): number => {
      // Se tem probabilidade customizada, usa ela
      if (contact.crm_win_probability !== null) {
        return contact.crm_win_probability;
      }
      // Senão, usa default do status
      return DEFAULT_WIN_PROBABILITY[contact.crm_lead_status as LeadStatus] || 10;
    };
    
    // Valor ponderado pela probabilidade
    const weightedPipelineValue = openLeads.reduce((sum, c) => {
      const probability = getProbability(c);
      return sum + ((c.crm_estimated_value || 0) * (probability / 100));
    }, 0);
    
    // Quantidade esperada de fechamentos (soma das probabilidades)
    const expectedCloses = openLeads.reduce((sum, c) => {
      const probability = getProbability(c);
      return sum + (probability / 100);
    }, 0);
    
    // Melhor cenário: todos os leads em aberto são ganhos
    const bestCaseValue = openLeads.reduce((sum, c) => sum + (c.crm_estimated_value || 0), 0);
    
    // Pior cenário: apenas leads com probabilidade >= 60%
    const worstCaseValue = openLeads
      .filter(c => {
        const probability = getProbability(c);
        return probability >= 60;
      })
      .reduce((sum, c) => sum + (c.crm_estimated_value || 0), 0);
    
    // Score de confiança baseado na distribuição do pipeline
    const avgProbability = openLeads.length > 0
      ? openLeads.reduce((sum, c) => {
          const probability = getProbability(c);
          return sum + probability;
        }, 0) / openLeads.length
      : 0;
    
    const confidenceScore = Math.min(100, Math.round(avgProbability * 1.2)); // Escala para 100
    
    // Labels dos períodos
    const periodLabel = config.label;
    const previousConfig = getPeriodConfig(period);
    const previousPeriodLabel = `${previousConfig.label} anterior`;
    
    return {
      leads: {
        current: currentLeads,
        previous: previousLeads,
        change: leadsChange.change,
        changeDirection: leadsChange.direction,
        trend: getTrend(leadsChange.direction, 'leads'),
      },
      conversions: {
        current: currentConversions,
        previous: previousConversions,
        change: conversionsChange.change,
        changeDirection: conversionsChange.direction,
        trend: getTrend(conversionsChange.direction, 'conversions'),
      },
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: revenueChange.change,
        changeDirection: revenueChange.direction,
        trend: getTrend(revenueChange.direction, 'revenue'),
      },
      winRate: {
        current: currentWinRate,
        previous: previousWinRate,
        change: winRateChange.change,
        changeDirection: winRateChange.direction,
        trend: getTrend(winRateChange.direction, 'winRate'),
      },
      avgDealSize: {
        current: currentAvgDeal,
        previous: previousAvgDeal,
        change: avgDealChange.change,
        changeDirection: avgDealChange.direction,
        trend: getTrend(avgDealChange.direction, 'avgDealSize'),
      },
      trendData,
      forecast: {
        weightedPipelineValue: Math.round(weightedPipelineValue),
        expectedCloses: Math.round(expectedCloses * 10) / 10, // 1 casa decimal
        bestCaseValue: Math.round(bestCaseValue),
        worstCaseValue: Math.round(worstCaseValue),
        confidenceScore,
      },
      periodLabel,
      previousPeriodLabel,
    };
  }, [contacts, period]);
}
