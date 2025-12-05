import { useAuth } from '@/contexts/AuthContext';

export interface Permission {
  canExport: boolean;
  canAccessWhatsApp: boolean;
  canAccessSupport: boolean;
  canAccessAdvancedFeatures: boolean;
  canAccessAIFeatures: boolean; // Search, Think, Canvas, History - Business/Premium only
}

export function usePermissions() {
  const { cliente } = useAuth();

  // CORREÇÃO CRÍTICA: Validação baseada nas políticas RLS do Supabase
  // Usar a mesma lógica das funções SQL para consistência
  
  // Verificar se o usuário tem assinatura ativa
  const hasActiveSubscription = cliente?.subscription_active === true;
  
  // Verificar se é um plano pago (basic, business, premium)
  const isPaidPlan = hasActiveSubscription && cliente?.plan_id && ['basic', 'business', 'premium'].includes(cliente.plan_id);
  
  // Verificar se é plano business ou premium
  const isBusinessOrPremium = hasActiveSubscription && cliente?.plan_id && ['business', 'premium'].includes(cliente.plan_id);
  
  // Verificar se usuário está ativo
  const isUserActive = cliente?.is_active === true;

  const permissions: Permission = {
    // CORREÇÃO: Exportação apenas para usuários com planos PAGOS e ativos
    canExport: isUserActive && (isPaidPlan || hasActiveSubscription),
    
    // WhatsApp apenas para business e premium (com subscription ativa e usuário ativo)
    canAccessWhatsApp: isUserActive && hasActiveSubscription && (cliente?.plan_id === 'business' || cliente?.plan_id === 'premium'),
    
    // Suporte para usuários com subscription ativa e usuário ativo
    canAccessSupport: isUserActive && hasActiveSubscription,
    
    // Recursos avançados para usuários com subscription ativa e usuário ativo
    canAccessAdvancedFeatures: isUserActive && hasActiveSubscription,
    
    // Funcionalidades de IA avançadas (Search, Think, Canvas, History) - apenas Business/Premium
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
    
    if (!hasActiveSubscription) {
      return `Esta funcionalidade (${feature}) está disponível apenas para usuários com planos pagos (Basic, Business ou Premium). Faça upgrade para acessar este recurso.`;
    }
    
    if (feature === 'WhatsApp' && !['business', 'premium'].includes(cliente?.plan_id || '')) {
      return `A integração WhatsApp está disponível apenas nos planos Business e Premium. Faça upgrade para acessar este recurso.`;
    }
    
    // Mensagem para funcionalidades de IA avançadas
    if (['Search', 'Think', 'Canvas', 'History', 'AI Features'].includes(feature) && !isBusinessOrPremium) {
      return `As funcionalidades avançadas de IA (${feature}) estão disponíveis apenas nos planos Business e Premium. Faça upgrade para acessar este recurso.`;
    }
    
    return `Esta funcionalidade (${feature}) está disponível apenas para usuários com planos pagos (Basic, Business ou Premium). Faça upgrade para acessar este recurso.`;
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
