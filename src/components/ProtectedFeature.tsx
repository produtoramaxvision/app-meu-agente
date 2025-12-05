import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Lock, Crown, Star, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ProtectedFeatureProps {
  children: React.ReactNode;
  permission: keyof ReturnType<typeof usePermissions>['permissions'];
  featureName: string;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function ProtectedFeature({ 
  children, 
  permission, 
  featureName, 
  fallback,
  showUpgradePrompt = true 
}: ProtectedFeatureProps) {
  const { hasPermission, getUpgradeMessage, hasActiveSubscription } = usePermissions();
  const navigate = useNavigate();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="p-3 rounded-full bg-muted-foreground/10">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-lg flex items-center justify-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Recurso Business/Premium
          </CardTitle>
          <CardDescription className="text-sm">
            {getUpgradeMessage(featureName)}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center">
            <Badge variant="outline" className="text-xs">
              Status: {hasActiveSubscription ? 'Assinatura Ativa' : 'Sem Assinatura'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Faça upgrade para desbloquear:
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-medium">
              <Star className="h-4 w-4 text-primary" />
              <span>{featureName}</span>
            </div>
          </div>

          <Button 
            variant="default" 
            size="sm" 
            className="w-full"
            onClick={() => {
              navigate('/perfil?tab=plans');
            }}
          >
            <Crown className="h-4 w-4 mr-2" />
            Ver Planos Disponíveis
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Componente específico para botões de exportação
interface ProtectedExportButtonProps {
  children: React.ReactNode;
  onExportPDF?: () => void;
  onExportJSON?: () => void;
  onExportCSV?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ProtectedExportButton({ 
  children, 
  onExportPDF,
  onExportJSON,
  onExportCSV,
  disabled = false,
  className,
  variant = "default",
  size = "default"
}: ProtectedExportButtonProps) {
  const { hasPermission, getUpgradeMessage, hasActiveSubscription } = usePermissions();
  const navigate = useNavigate();

  if (hasPermission('canExport')) {
    return (
      <div className="relative group inline-block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              className="group relative overflow-hidden rounded-lg px-4 py-2 transition-all duration-200 bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2 text-white"
              variant="default"
              size={size}
            >
              {children}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportJSON} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              Exportar JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer" disabled={disabled}>
              <FileText className="h-4 w-4 mr-2" />
              {disabled ? 'Exportando CSV...' : 'Exportar CSV'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Botão bloqueado para usuários sem plano Business ou Premium
  return (
    <div className="relative group inline-block w-full sm:w-auto">
      <Button 
        onClick={() => {
          // Mostrar toast elaborado de upgrade - CORRIGIDO para mencionar apenas Business/Premium
          toast.error("🔒 Recurso Business/Premium", {
            description: "Esta funcionalidade está disponível apenas nos planos Business e Premium. Faça upgrade para desbloquear este recurso!",
            duration: 5000,
            action: {
              label: "Ver Planos",
              onClick: () => {
                navigate('/perfil?tab=plans');
              },
            },
          });
        }}
        className="relative overflow-hidden rounded-lg px-5 py-3 transition-all duration-500 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 border-2 border-dashed border-amber-400/60 hover:border-amber-500/80 min-w-fit w-full sm:w-auto"
        variant="outline"
        size={size}
        disabled={false} // Permitir clique para mostrar upgrade
      >
        {/* Conteúdo principal */}
        <span className="relative z-10 flex items-center justify-center gap-2 px-2">
          <Lock className="h-4 w-4 text-amber-600 flex-shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-3" />
          <span className="flex items-center gap-2 text-amber-700 font-semibold whitespace-nowrap leading-none transition-colors group-hover:text-amber-800">
            {children}
          </span>
        </span>
        
        {/* Efeito shimmer inspirado no ThemeSwitch - oculto em repouso para não deixar rastro */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent -translate-x-full group-hover:translate-x-full opacity-0 group-hover:opacity-100 transition-all duration-1000 rounded-lg" />
        
        {/* Efeito de brilho adicional */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 via-transparent to-orange-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg" />
      </Button>

      {/* Badge de Business/Premium sobreposto ao botão (centralizado horizontalmente) */}
      <div className="absolute -top-3 inset-x-0 mx-auto w-max bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-[11px] px-3 py-1.5 rounded-full font-bold animate-premium-pulse z-20 transform-gpu shadow-lg hover:shadow-xl transition-all duration-500 border border-amber-400/30 flex items-center justify-center min-w-[4.5rem] h-6 overflow-hidden pointer-events-none">
        <span className="relative z-10 text-center leading-none text-xs font-bold tracking-wide">
          BUSINESS+
        </span>
        {/* Efeito de brilho no badge */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full opacity-0 group-hover:opacity-100 transition-all duration-1500 rounded-full" />
      </div>
      
      {/* Tooltip de upgrade - uma única linha abaixo do botão */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-30 scale-95 group-hover:scale-100">
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white text-xs sm:text-sm px-4 py-3 rounded-xl shadow-2xl whitespace-nowrap border border-gray-700/50">
          <div className="flex items-center gap-2 text-center">
            <Crown className="h-4 w-4 text-amber-400 animate-pulse" />
            <span className="font-medium leading-snug">
              Disponível nos planos Business e Premium.
            </span>
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
        </div>
      </div>
    </div>
  );
}
