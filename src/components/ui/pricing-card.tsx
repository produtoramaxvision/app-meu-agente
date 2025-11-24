"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  XCircle, 
  Star, 
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
  Crown,
  Sparkles
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

interface PricingCardProps {
  plan: Plan;
  isCurrentPlan: boolean;
  index: number;
  onUpgrade?: () => void;
  isLoading?: boolean;
  buttonText?: string;
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function PricingCard({ plan, isCurrentPlan, index, onUpgrade, isLoading, buttonText, buttonVariant }: PricingCardProps) {
  const getPlanBadgeColor = (color: string) => {
    switch (color) {
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
      case 'purple':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const getPlanBorderColor = (color: string) => {
    switch (color) {
      case 'orange':
        return 'border-orange-200 dark:border-orange-800';
      case 'blue':
        return 'border-blue-200 dark:border-blue-800';
      case 'green':
        return 'border-green-200 dark:border-green-800';
      case 'purple':
        return 'border-purple-200 dark:border-purple-800';
      default:
        return 'border-gray-200 dark:border-gray-800';
    }
  };

  const getPlanGradient = (color: string) => {
    switch (color) {
      case 'orange':
        return 'from-orange-500/10 to-orange-600/5';
      case 'blue':
        return 'from-blue-500/10 to-blue-600/5';
      case 'green':
        return 'from-green-500/10 to-green-600/5';
      case 'purple':
        return 'from-purple-500/10 to-purple-600/5';
      default:
        return 'from-gray-500/10 to-gray-600/5';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="relative h-full flex mt-8"
    >
      <Card 
        className={cn(
          // Removido overflow-hidden para não cortar o badge "Mais Popular"
          "relative flex flex-col h-full w-full transition-all duration-300",
          "hover:shadow-xl hover:shadow-primary/5",
          getPlanBorderColor(plan.color),
          isCurrentPlan && "ring-2 ring-primary ring-offset-2",
          plan.isPopular && "shadow-lg shadow-primary/10"
        )}
        style={{ minHeight: '600px' }}
      >
        {/* Background Gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50",
          getPlanGradient(plan.color)
        )} />
        
        {/* Badges Container */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 flex flex-col gap-1.5">
          {/* Popular Badge */}
          {plan.isPopular && !isCurrentPlan && (
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.4, ease: "backOut" }}
            >
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl border-2 border-white/20 px-4 py-1.5 text-xs font-semibold tracking-wide">
                <Star className="h-3 w-3 mr-1.5 fill-current" />
                Mais Popular
              </Badge>
            </motion.div>
          )}

          {/* Current Plan Badge */}
          {isCurrentPlan && !plan.isPopular && (
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl border-2 border-white/20 px-4 py-1.5 text-xs font-semibold tracking-wide">
                <Crown className="h-3 w-3 mr-1.5 fill-current" />
                Plano Atual
              </Badge>
            </motion.div>
          )}

          {/* Combined Badge for Current + Popular */}
          {plan.isPopular && isCurrentPlan && (
            <motion.div
              initial={{ scale: 0, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, duration: 0.4, ease: "backOut" }}
            >
              <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-xl border-2 border-white/20 px-4 py-1.5 text-xs font-semibold tracking-wide">
                <Star className="h-3 w-3 mr-1.5 fill-current" />
                Atual + Popular
              </Badge>
            </motion.div>
          )}
        </div>
        
        <CardHeader className="text-center pb-4 pt-6 relative z-10 flex-shrink-0">
          <div className="flex justify-center mb-2">
            <Badge className={getPlanBadgeColor(plan.color)}>
              {plan.badge}
            </Badge>
          </div>
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          <motion.div 
            className="text-2xl font-bold text-primary mt-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {plan.price}
          </motion.div>
          <CardDescription className="text-sm mt-2 min-h-[2.5rem] flex items-center justify-center">
            {plan.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 relative z-10 p-6">
          {/* Conteúdo principal - cresce para ocupar espaço disponível */}
          <div className="flex-1 space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Recursos Incluídos:</h4>
              <div className="space-y-2">
                {plan.features.map((feature, featureIndex) => (
                  <motion.div 
                    key={featureIndex} 
                    className="flex items-start gap-2 text-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + featureIndex * 0.05 }}
                  >
                    <motion.div 
                      className={`mt-0.5 ${feature.included ? 'text-green-600' : 'text-gray-400'}`}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {feature.included ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </motion.div>
                    <span className={`${feature.included ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {feature.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {plan.subAgents.length > 0 && (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <h4 className="font-medium text-sm">Sub-agentes:</h4>
                <div className="space-y-1">
                  {plan.subAgents.map((agent, agentIndex) => (
                    <motion.div 
                      key={agentIndex} 
                      className="flex items-center gap-2 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + agentIndex * 0.05 }}
                    >
                      <Bot className="h-3 w-3 text-blue-600" />
                      <span className="text-muted-foreground">{agent}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Spacer para garantir que os botões fiquem alinhados */}
          <div className="flex-1" />

          {/* Informações de setup e manutenção - altura fixa */}
          <motion.div 
            className="space-y-3 pt-4 border-t"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Setup:</span>
              <span className="font-medium">{plan.setup}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Manutenção:</span>
              <span className="font-medium">{plan.maintenance}</span>
            </div>
          </motion.div>

          {/* Botão - sempre na parte inferior */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            {!isCurrentPlan && (
              <Button 
                className="w-full" 
                variant={buttonVariant || (plan.id === 'free' ? 'outline' : 'default')}
                size="lg"
                onClick={onUpgrade}
                disabled={isLoading || plan.id === 'free'}
              >
                {isLoading ? "Processando..." : (buttonText || (plan.id === 'free' ? 'Já Incluído' : 'Fazer Upgrade'))}
              </Button>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}