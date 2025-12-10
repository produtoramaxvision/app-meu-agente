import { useAuth } from '@/contexts/AuthContext';

export interface PlanInfo {
  name: string;
  displayName: string;
  color: string;
  features: string[];
  limits: {
    maxRecords: number;
    maxExports: number;
    maxAgendaEvents: number;
    hasWhatsApp: boolean;
    hasSupport: boolean;
    hasAdvancedFeatures: boolean;
  };
}

export function usePlanInfo() {
  const { cliente } = useAuth();

  const getPlanInfo = (): PlanInfo => {
    // ✅ Determinar o plano baseado no subscription_active e plan_id
    const planId = cliente?.plan_id || 'free';
    const subscriptionActive = cliente?.subscription_active;

    // Se subscription_active é false, retornar free
    if (!subscriptionActive) {
      return getFreePlanInfo();
    }

    // Mapear plan_id para informações do plano
    switch (planId) {
      case 'lite':
        return getLitePlanInfo();
      case 'basic':
        return getBasicPlanInfo();
      case 'business':
        return getBusinessPlanInfo();
      case 'premium':
        return getPremiumPlanInfo();
      default:
        return getFreePlanInfo();
    }
  };

  const getLitePlanInfo = (): PlanInfo => ({
    name: 'lite',
    displayName: 'Plano Lite',
    color: 'cyan',
    features: [
      'Tudo do plano Free',
      'Recursos iniciais de agendamento',
      'Notificações básicas'
    ],
    limits: {
      maxRecords: -1,
      maxExports: -1,
      maxAgendaEvents: -1,
      hasWhatsApp: false,
      hasSupport: false,
      hasAdvancedFeatures: false
    }
  });

  const getFreePlanInfo = (): PlanInfo => ({
    name: 'free',
    displayName: 'Plano Free',
    color: 'orange',
    features: [
      'Acesso completo ao app',
      'Registros financeiros ilimitados',
      'Sistema de agenda completo',
      'Exportação de dados',
      'Tema claro/escuro',
      'Responsividade completa'
    ],
    limits: {
      maxRecords: -1, // Ilimitado
      maxExports: -1, // Ilimitado
      maxAgendaEvents: -1, // Ilimitado
      hasWhatsApp: false,
      hasSupport: false,
      hasAdvancedFeatures: false
    }
  });

  const getBasicPlanInfo = (): PlanInfo => ({
    name: 'basic',
    displayName: 'Plano Básico',
    color: 'blue',
    features: [
      'Tudo do plano Free',
      'Agente de Agendamento',
      'Suporte por email',
      'Recursos avançados de relatórios',
      'Backup automático'
    ],
    limits: {
      maxRecords: -1, // Ilimitado
      maxExports: -1, // Ilimitado
      maxAgendaEvents: -1, // Ilimitado
      hasWhatsApp: false,
      hasSupport: true,
      hasAdvancedFeatures: true
    }
  });

  const getBusinessPlanInfo = (): PlanInfo => ({
    name: 'business',
    displayName: 'Plano Business',
    color: 'green',
    features: [
      'Tudo do plano Básico',
      'Número WhatsApp dedicado',
      'Suporte prioritário 24/7',
      'Sub-agentes SDR/Marketing',
      'Integração Google Workspace'
    ],
    limits: {
      maxRecords: -1, // Ilimitado
      maxExports: -1, // Ilimitado
      maxAgendaEvents: -1, // Ilimitado
      hasWhatsApp: true,
      hasSupport: true,
      hasAdvancedFeatures: true
    }
  });

  const getPremiumPlanInfo = (): PlanInfo => ({
    name: 'premium',
    displayName: 'Plano Premium',
    color: 'purple',
    features: [
      'Tudo do plano Business',
      'Web Search avançado',
      'Scrape de dados',
      'Sub-agentes adicionais',
      'Governança de dados ampliada'
    ],
    limits: {
      maxRecords: -1, // Ilimitado
      maxExports: -1, // Ilimitado
      maxAgendaEvents: -1, // Ilimitado
      hasWhatsApp: true,
      hasSupport: true,
      hasAdvancedFeatures: true
    }
  });

  const planInfo = getPlanInfo();
  const refundPeriodEndsAt = cliente?.refund_period_ends_at;
  const isInRefundPeriod = refundPeriodEndsAt && new Date(refundPeriodEndsAt) > new Date();
  
  // ✅ Calcular dias restantes do período de arrependimento
  const refundDaysRemaining = isInRefundPeriod 
    ? Math.ceil((new Date(refundPeriodEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    planInfo,
    isFreePlan: planInfo.name === 'free',
    isLitePlan: planInfo.name === 'lite',
    isBasicPlan: planInfo.name === 'basic',
    isBusinessPlan: planInfo.name === 'business',
    isPremiumPlan: planInfo.name === 'premium',
    isInRefundPeriod, // ✅ Período de arrependimento ativo
    refundPeriodEndsAt, // ✅ Data final do período
    refundDaysRemaining, // ✅ Dias restantes para cancelamento
    getPlanColor: () => planInfo.color,
    getPlanDisplayName: () => planInfo.displayName,
    getPlanFeatures: () => planInfo.features,
    getPlanLimits: () => planInfo.limits
  };
}
