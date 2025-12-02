import { usePlanInfo } from '@/hooks/usePlanInfo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Star, Zap, Shield, Users, Crown } from 'lucide-react';

export function PlanInfoCard() {
  const { planInfo, getPlanFeatures, getPlanLimits } = usePlanInfo();

  const getIcon = (feature: string) => {
    if (feature.includes('WhatsApp')) return <Users className="h-4 w-4" />;
    if (feature.includes('Suporte')) return <Shield className="h-4 w-4" />;
    if (feature.includes('avançado') || feature.includes('Premium')) return <Star className="h-4 w-4" />;
    if (feature.includes('ilimitado') || feature.includes('completo')) return <Zap className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getPlanBadgeColor = () => {
    switch (planInfo.name) {
      case 'free':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'business':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
      <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 opacity-90" />
      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
              <div className="h-9 w-9 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <Crown className="h-4 w-4 text-amber-600" />
              </div>
              Informações do Plano
              <Badge className={getPlanBadgeColor() + " ml-2"}>
                {planInfo.displayName}
              </Badge>
            </CardTitle>
            <CardDescription className="pl-12 mt-1">
              Recursos e limitações do seu plano atual
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Recursos Incluídos:</h4>
          <div className="grid gap-2">
            {getPlanFeatures().map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="text-green-600">
                  {getIcon(feature)}
                </div>
                <span className="text-text-muted">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Limitações:</h4>
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-text-muted">
                Registros financeiros: {getPlanLimits().maxRecords === -1 ? 'Ilimitados' : getPlanLimits().maxRecords}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-text-muted">
                Exportações: {getPlanLimits().maxExports === -1 ? 'Ilimitadas' : getPlanLimits().maxExports}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="text-blue-600">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-text-muted">
                Eventos na agenda: {getPlanLimits().maxAgendaEvents === -1 ? 'Ilimitados' : getPlanLimits().maxAgendaEvents}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={getPlanLimits().hasWhatsApp ? "text-green-600" : "text-red-600"}>
                {getPlanLimits().hasWhatsApp ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </div>
              <span className="text-text-muted">
                WhatsApp: {getPlanLimits().hasWhatsApp ? 'Incluído' : 'Não incluído'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={getPlanLimits().hasSupport ? "text-green-600" : "text-red-600"}>
                {getPlanLimits().hasSupport ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              </div>
              <span className="text-text-muted">
                Suporte: {getPlanLimits().hasSupport ? 'Incluído' : 'Não incluído'}
              </span>
            </div>
          </div>
        </div>

        {planInfo.name === 'free' && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Plano Gratuito:</strong> Você tem acesso completo ao app com todos os recursos básicos. 
              Para recursos avançados como WhatsApp e suporte prioritário, considere fazer upgrade para um plano pago.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
