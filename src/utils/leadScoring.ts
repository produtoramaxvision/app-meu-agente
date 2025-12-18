/**
 * Lead Scoring System
 * Calcula score automático de 0-100 baseado em:
 * - Completude de dados básicos (20 pontos)
 * - Status no pipeline (30 pontos)
 * - Interações recentes (30 pontos)
 * - Custom fields preenchidos (20 pontos)
 */

import { EvolutionContact, LeadStatus } from '@/types/sdr';
import { differenceInDays } from 'date-fns';

// Pontos por status no pipeline
const STATUS_POINTS: Record<string, number> = {
  'novo': 0,
  'contatado': 10,
  'qualificado': 20,
  'proposta': 25,
  'negociando': 30,
  'ganho': 35, // Máximo para já ganho (para histórico)
  'perdido': 0
};

// Probabilidades padrão por status (para forecast) - Fase 3.5
export const DEFAULT_WIN_PROBABILITY: Record<LeadStatus, number> = {
  novo: 10,
  contatado: 20,
  qualificado: 40,
  proposta: 60,
  negociando: 80,
  ganho: 100,
  perdido: 0,
};

/**
 * Calcula o score automático de um lead (0-100)
 */
export function calculateLeadScore(
  contact: EvolutionContact,
  customFieldsCount: number = 0
): number {
  let score = 0;
  
  // 1. Dados básicos (máx 20 pontos)
  if (contact.push_name?.trim()) score += 5;
  if (contact.phone?.trim()) score += 5;
  if ((contact.crm_estimated_value || 0) > 0) score += 10;
  
  // 2. Status no pipeline (máx 30 pontos)
  score += STATUS_POINTS[contact.crm_lead_status || 'novo'] || 0;
  
  // 3. Interação recente (máx 30 pontos)
  if (contact.crm_last_interaction_at) {
    try {
      const daysSince = differenceInDays(
        new Date(), 
        new Date(contact.crm_last_interaction_at)
      );
      
      if (daysSince <= 1) score += 30;        // Interagiu hoje ou ontem
      else if (daysSince <= 3) score += 25;   // Últimos 3 dias
      else if (daysSince <= 7) score += 15;   // Última semana
      else if (daysSince <= 14) score += 5;   // Últimas 2 semanas
      // > 14 dias: sem pontos
    } catch {
      // Data inválida: sem pontos
    }
  }
  
  // 4. Campos customizados preenchidos (máx 20 pontos)
  // Cada campo preenchido vale 5 pontos, até o máximo de 20
  score += Math.min(customFieldsCount * 5, 20);
  
  // Garantir que o score fique entre 0 e 100
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Retorna informações de apresentação do score
 */
export function getScoreLevel(score: number): {
  label: string;
  color: string;
  bgColor: string;
  icon: '🔥' | '⚡' | '💫' | '❄️';
  description: string;
} {
  if (score >= 75) {
    return {
      label: 'Quente',
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      icon: '🔥',
      description: 'Lead de alta prioridade - Ação imediata recomendada'
    };
  }
  
  if (score >= 50) {
    return {
      label: 'Morno',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 border-orange-200',
      icon: '⚡',
      description: 'Lead com bom potencial - Acompanhamento frequente'
    };
  }
  
  if (score >= 25) {
    return {
      label: 'Frio',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      icon: '💫',
      description: 'Lead iniciante - Nutrir relacionamento'
    };
  }
  
  return {
    label: 'Congelado',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: '❄️',
    description: 'Lead inativo - Requer reativação'
  };
}

/**
 * Retorna dicas de como melhorar o score do lead
 */
export function getScoreImprovementTips(contact: EvolutionContact): string[] {
  const tips: string[] = [];
  
  if (!contact.push_name?.trim()) {
    tips.push('Adicione o nome do lead');
  }
  
  if ((contact.crm_estimated_value || 0) <= 0) {
    tips.push('Defina o valor estimado do negócio');
  }
  
  if (!contact.crm_last_interaction_at) {
    tips.push('Registre uma interação com o lead');
  } else {
    const daysSince = differenceInDays(new Date(), new Date(contact.crm_last_interaction_at));
    if (daysSince > 7) {
      tips.push('Entre em contato novamente (última interação há mais de 7 dias)');
    }
  }
  
  if (['novo', 'contatado'].includes(contact.crm_lead_status || 'novo')) {
    tips.push('Avance o lead no pipeline (qualifique ou envie proposta)');
  }
  
  return tips;
}
