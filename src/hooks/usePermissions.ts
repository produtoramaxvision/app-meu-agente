import { useAuth } from '@/contexts/AuthContext';

export interface Permission {
  canExport: boolean;
  canAccessWhatsApp: boolean;
  canAccessSupport: boolean;
  canAccessAdvancedFeatures: boolean;
  canAccessAIFeatures: boolean; // Search, Think, Canvas, History - Business/Premium only
}

/**
 * Hook de permissões corrigido e consistente com os planos do PlansSection.tsx
 * 
 * REGRAS DE ACESSO POR PLANO:
 * ===========================
 * 
 * FREE:
 *   - Acesso básico ao app
 *   - NÃO tem: Exportação, Suporte, WhatsApp, IA Avançada, Recursos Avançados
 * 
 * BASIC:
 *   - Acesso ao app + recursos básicos
 *   - NÃO tem: Exportação, Suporte, WhatsApp, IA Avançada (hasSupport: false, hasWhatsApp: false)
 * 
 * BUSINESS e PREMIUM:
 *   - TODOS os recursos: Exportação, Suporte, WhatsApp, IA Avançada, Recursos Avançados
 *   - (hasSupport: true, hasWhatsApp: true, hasAdvancedFeatures: true)
 * 
 * IMPORTANTE: Exportação, Suporte e Recursos Avançados estão disponíveis APENAS
 * nos planos BUSINESS e PREMIUM, NÃO no plano BASIC!
 */
export function usePermissions() {
  const { cliente } = useAuth();

  // Verificar se o usuário tem assinatura ativa
  const hasActiveSubscription = cliente?.subscription_active === true;
  
  // Verificar se é um plano pago (basic, business, premium)
  const isPaidPlan = hasActiveSubscription && cliente?.plan_id && ['basic', 'business', 'premium'].includes(cliente.plan_id);
  
  // Verificar se é plano business ou premium - ESTES SÃO OS ÚNICOS COM ACESSO COMPLETO
  const isBusinessOrPremium = hasActiveSubscription && cliente?.plan_id && ['business', 'premium'].includes(cliente.plan_id);
  
  // Verificar se usuário está ativo
  const isUserActive = cliente?.is_active === true;

  const permissions: Permission = {
    /**
     * CORREÇÃO: Exportação APENAS para Business e Premium
     * O plano Basic NÃO tem acesso à exportação (conforme PlansSection.tsx)
     */
    canExport: isUserActive && isBusinessOrPremium,
    
    /**
     * WhatsApp APENAS para Business e Premium
     * Conforme PlansSection.tsx: Basic hasWhatsApp: false
     */
    canAccessWhatsApp: isUserActive && isBusinessOrPremium,
    
    /**
     * CORREÇÃO: Suporte APENAS para Business e Premium
     * Conforme PlansSection.tsx: Basic hasSupport: false
     */
    canAccessSupport: isUserActive && isBusinessOrPremium,
    
    /**
     * CORREÇÃO: Recursos avançados APENAS para Business e Premium
     * Isso inclui: Relatórios avançados, Integrações Google, etc.
     */
    canAccessAdvancedFeatures: isUserActive && isBusinessOrPremium,
    
    /**
     * Funcionalidades de IA avançadas (Search, Think, Canvas, History)
     * APENAS Business e Premium
     */
    canAccessAIFeatures: isUserActive && isBusinessOrPremium,
  };

  const hasPermission = (permission: keyof Permission): boolean => {
    return permissions[permission];
  };

  const requirePermission = (permission: keyof Permission): boolean => {
    if (!hasPermission(permission)) {
      console.warn(`Acesso negado: usuário sem permissão para ${permission}. Status: subscription=${hasActiveSubscription}, plan=${cliente?.plan_id}, active=${isUserActive}`);
      return false;
    }
    return true;
  };

  const getUpgradeMessage = (feature: string): string => {
    if (!isUserActive) {
      return `Sua conta está inativa. Entre em contato com o suporte para reativar.`;
    }
    
    // TODAS as funcionalidades bloqueadas requerem Business ou Premium
    // Não há mais menção ao plano Basic pois ele não dá acesso a essas features
    if (!isBusinessOrPremium) {
      return `Esta funcionalidade (${feature}) está disponível apenas nos planos Business e Premium. Faça upgrade para desbloquear este recurso.`;
    }
    
    // Se chegou aqui, o usuário tem Business ou Premium mas ainda assim não pode acessar
    // (situação rara, mas pode acontecer por conta inativa)
    return `Esta funcionalidade (${feature}) está disponível apenas nos planos Business e Premium. Faça upgrade para desbloquear este recurso.`;
  };

  const getPlanInfo = () => {
    return {
      planId: cliente?.plan_id || 'free',
      subscriptionActive: hasActiveSubscription,
      isActive: isUserActive,
      isPaidPlan,
      isBusinessOrPremium,
    };
  };

  return {
    permissions,
    hasPermission,
    requirePermission,
    getUpgradeMessage,
    hasActiveSubscription,
    isPaidPlan,
    isBusinessOrPremium,
    isUserActive,
    getPlanInfo,
  };
}
