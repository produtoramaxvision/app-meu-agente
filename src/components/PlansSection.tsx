import { usePlanInfo } from '@/hooks/usePlanInfo';
import { PricingCard } from '@/components/ui/pricing-card';
import { motion } from 'framer-motion';
import { Star, Sparkles } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Zap, 
  Shield, 
  Users, 
  Calendar,
  Code,
  Video,
  Search,
  Database,
  Mail,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Globe,
  Bot,
  MessageSquare,
  BarChart3,
  Settings,
  Crown
} from 'lucide-react';

interface PlanFeature {
  name: string;
  included: boolean;
  icon: React.ReactNode;
  description?: string;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  description: string;
  color: string;
  badge: string;
  features: PlanFeature[];
  subAgents: string[];
  limits: {
    maxRecords: string;
    maxExports: string;
    maxAgendaEvents: string;
    hasWhatsApp: boolean;
    hasSupport: boolean;
    hasAdvancedFeatures: boolean;
  };
  setup: string;
  maintenance: string;
  isPopular?: boolean;
}

export function PlansSection() {
  const { planInfo } = usePlanInfo();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    
    try {
      setLoadingPlanId(planId);
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan_id: planId,
          success_url: `${window.location.origin}/perfil?tab=plans&success=true`,
          cancel_url: `${window.location.origin}/perfil?tab=plans&canceled=true`,
        },
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handlePortal = async () => {
    try {
      toast.info("Redirecionando para o portal de gerenciamento...");
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          return_url: `${window.location.origin}/perfil?tab=plans&portal_return=true`,
        },
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erro ao acessar o portal. Tente novamente.");
    }
  };

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Plano Free',
      price: 'Gratuito',
      description: 'Acesso completo ao app com todos os recursos básicos para começar a usar o Meu Agente.',
      color: 'orange',
      badge: 'Gratuito',
      features: [
        { name: 'Acesso completo ao app', included: true, icon: <Zap className="h-4 w-4" /> },
        { name: 'Registros financeiros ilimitados', included: true, icon: <DollarSign className="h-4 w-4" /> },
        { name: 'Sistema de agenda completo', included: true, icon: <Calendar className="h-4 w-4" /> },
        { name: 'Exportação de dados', included: true, icon: <FileText className="h-4 w-4" /> },
        { name: 'Tema claro/escuro', included: true, icon: <Settings className="h-4 w-4" /> },
        { name: 'Responsividade completa', included: true, icon: <Globe className="h-4 w-4" /> },
        { name: 'Número WhatsApp dedicado', included: false, icon: <MessageSquare className="h-4 w-4" /> },
        { name: 'Suporte prioritário 24/7', included: false, icon: <Shield className="h-4 w-4" /> },
        { name: 'Sub-agentes especializados', included: false, icon: <Bot className="h-4 w-4" /> },
        { name: 'Integração Google Workspace', included: false, icon: <Calendar className="h-4 w-4" /> }
      ],
      subAgents: [],
      limits: {
        maxRecords: 'Ilimitados',
        maxExports: 'Ilimitadas',
        maxAgendaEvents: 'Ilimitados',
        hasWhatsApp: false,
        hasSupport: false,
        hasAdvancedFeatures: false
      },
      setup: 'Não incluído',
      maintenance: 'Não incluído'
    },
    {
      id: 'basic',
      name: 'Plano Básico',
      price: 'R$ 497,00/mês',
      description: 'Para profissionais e pequenas equipes que desejam começar com agentes de IA no WhatsApp usando infraestrutura em nuvem.',
      color: 'blue',
      badge: 'Básico',
      features: [
        { name: 'Tudo do plano Free', included: true, icon: <CheckCircle className="h-4 w-4" /> },
        { name: 'Agente Financeiro completo', included: true, icon: <DollarSign className="h-4 w-4" /> },
        { name: 'Agente de Scrape', included: true, icon: <Database className="h-4 w-4" /> },
        { name: 'Agente Web Search', included: true, icon: <Search className="h-4 w-4" /> },
        { name: 'Exportação CSV/JSON', included: true, icon: <FileText className="h-4 w-4" /> },
        { name: 'Relatórios básicos', included: true, icon: <BarChart3 className="h-4 w-4" /> },
        { name: 'Número WhatsApp dedicado', included: false, icon: <MessageSquare className="h-4 w-4" /> },
        { name: 'Suporte prioritário', included: false, icon: <Shield className="h-4 w-4" /> },
        { name: 'Sub-agentes especializados', included: false, icon: <Bot className="h-4 w-4" /> },
        { name: 'Integração Google Workspace', included: false, icon: <Calendar className="h-4 w-4" /> }
      ],
      subAgents: [],
      limits: {
        maxRecords: 'Ilimitados',
        maxExports: 'Ilimitadas',
        maxAgendaEvents: 'Ilimitados',
        hasWhatsApp: false,
        hasSupport: false,
        hasAdvancedFeatures: true
      },
      setup: 'Não incluído',
      maintenance: 'R$ 149,00/h'
    },
    {
      id: 'business',
      name: 'Plano Business',
      price: 'R$ 997,00/mês',
      description: 'Para empresas que precisam de número WhatsApp dedicado, suporte prioritário 24/7 e sub-agentes adicionais.',
      color: 'green',
      badge: 'Business',
      isPopular: true,
      features: [
        { name: 'Tudo do plano Básico', included: true, icon: <CheckCircle className="h-4 w-4" /> },
        { name: 'Número WhatsApp dedicado', included: true, icon: <MessageSquare className="h-4 w-4" /> },
        { name: 'Implantação inclusa', included: true, icon: <Settings className="h-4 w-4" /> },
        { name: 'Suporte prioritário 24/7', included: true, icon: <Shield className="h-4 w-4" /> },
        { name: 'Agente SDR', included: true, icon: <Users className="h-4 w-4" /> },
        { name: 'Agente de Marketing', included: true, icon: <TrendingUp className="h-4 w-4" /> },
        { name: 'Agente de Agendamento', included: true, icon: <Calendar className="h-4 w-4" /> },
        { name: 'Agente de Dev', included: true, icon: <Code className="h-4 w-4" /> },
        { name: 'Agente de Vídeo', included: true, icon: <Video className="h-4 w-4" /> },
        { name: 'Integração Google Workspace', included: true, icon: <Calendar className="h-4 w-4" /> }
      ],
      subAgents: [
        'Agente SDR',
        'Agente de Marketing',
        'Agente de Agendamento',
        'Agente de Dev',
        'Agente de Vídeo'
      ],
      limits: {
        maxRecords: 'Ilimitados',
        maxExports: 'Ilimitadas',
        maxAgendaEvents: 'Ilimitados',
        hasWhatsApp: true,
        hasSupport: true,
        hasAdvancedFeatures: true
      },
      setup: 'Inclusa',
      maintenance: 'R$ 149,00/h'
    },
    {
      id: 'premium',
      name: 'Plano Premium',
      price: 'R$ 1.497,00/mês',
      description: 'Tudo do Business, com camada avançada adicional nos agentes de Web Search e Scrape, automações estendidas e governança ampliada.',
      color: 'purple',
      badge: 'Premium',
      features: [
        { name: 'Tudo do plano Business', included: true, icon: <CheckCircle className="h-4 w-4" /> },
        { name: 'Web Search avançado', included: true, icon: <Search className="h-4 w-4" /> },
        { name: 'Scrape avançado', included: true, icon: <Database className="h-4 w-4" /> },
        { name: 'Agente de Confirmação', included: true, icon: <Clock className="h-4 w-4" /> },
        { name: 'Agente de Resumo de Grupos', included: true, icon: <MessageSquare className="h-4 w-4" /> },
        { name: 'Agente de Remarketing', included: true, icon: <TrendingUp className="h-4 w-4" /> },
        { name: 'Agente de Follow-up', included: true, icon: <Mail className="h-4 w-4" /> },
        { name: 'Backups diários off-site', included: true, icon: <Shield className="h-4 w-4" /> },
        { name: 'Governança de dados avançada', included: true, icon: <BarChart3 className="h-4 w-4" /> },
        { name: 'Automações estendidas', included: true, icon: <Sparkles className="h-4 w-4" /> }
      ],
      subAgents: [
        'Todos os sub-agentes do Business',
        'Agente de Confirmação',
        'Agente de Resumo de Grupos',
        'Agente de Remarketing',
        'Agente de Follow-up'
      ],
      limits: {
        maxRecords: 'Ilimitados',
        maxExports: 'Ilimitadas',
        maxAgendaEvents: 'Ilimitados',
        hasWhatsApp: true,
        hasSupport: true,
        hasAdvancedFeatures: true
      },
      setup: 'Inclusa',
      maintenance: 'R$ 149,00/h'
    }
  ];

  const isCurrentPlan = (planId: string) => {
    return planInfo.name === planId;
  };

  const PLAN_LEVELS: Record<string, number> = {
    'free': 0,
    'basic': 1,
    'business': 2,
    'premium': 3
  };

  const currentPlanLevel = PLAN_LEVELS[planInfo.name] || 0;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2 
          className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Planos e Preços
        </motion.h2>
        <motion.p 
          className="text-muted-foreground max-w-2xl mx-auto text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Escolha o plano ideal para suas necessidades. Todos os planos incluem acesso completo ao app 
          com diferentes níveis de funcionalidades e suporte.
        </motion.p>
      </motion.div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
        {plans.map((plan, index) => {
          const planLevel = PLAN_LEVELS[plan.id] || 0;
          const isDowngrade = planLevel < currentPlanLevel;
          
          let buttonText = "Fazer Upgrade";
          let buttonVariant: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link" = "default";
          let onAction = () => handleUpgrade(plan.id);

          if (isDowngrade) {
            buttonText = "Fazer Downgrade";
            buttonVariant = "outline";
            onAction = handlePortal;
          }

          return (
            <PricingCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={isCurrentPlan(plan.id)}
              index={index}
              onUpgrade={onAction}
              isLoading={loadingPlanId === plan.id}
              buttonText={buttonText}
              buttonVariant={buttonVariant}
            />
          );
        })}
      </div>

      {/* Information Section */}
      <motion.div 
        className="mt-16 p-8 bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl border backdrop-blur-sm"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <div className="p-2 bg-primary/10 rounded-lg">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Informações Importantes</h3>
        </motion.div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <div className="space-y-3">
            <p>• <strong className="text-foreground">Impostos não inclusos</strong> nos valores dos planos pagos</p>
            <p>• <strong className="text-foreground">Add-ons opcionais</strong> disponíveis apenas no plano premium, consulte nossos especialistas</p>
            <p>• <strong className="text-foreground">Integração Google Workspace</strong> disponível apenas no plano premium</p>
          </div>
          <div className="space-y-3">
            <p>• <strong className="text-foreground">Scraping</strong> realizado apenas em fontes permitidas e APIs oficiais</p>
            <p>• <strong className="text-foreground">Suporte</strong> disponível conforme especificado em cada plano</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}