import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, ShieldCheck, Info } from 'lucide-react';
import { usePlanInfo } from '@/hooks/usePlanInfo';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * ✅ RefundPeriodBanner - Banner de Garantia de 7 Dias Grátis
 * 
 * Mostra ao cliente que ele tem 7 dias para solicitar reembolso após a compra
 * (garantia de satisfação).
 * 
 * IMPORTANTE: O cliente JÁ PAGOU e tem acesso ao plano contratado.
 */
export function TrialBanner() {
  const { 
    isInRefundPeriod, 
    refundDaysRemaining, 
    refundPeriodEndsAt,
    getPlanDisplayName
  } = usePlanInfo();
  const navigate = useNavigate();

  // Não mostrar banner se não estiver em período de arrependimento
  if (!isInRefundPeriod) {
    return null;
  }

  const progressPercentage = ((7 - refundDaysRemaining) / 7) * 100;
  const refundEndDate = refundPeriodEndsAt ? new Date(refundPeriodEndsAt).toLocaleDateString('pt-BR') : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <Card className="border-2 border-green-500/30 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Garantia de 7 Dias
                  <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900">
                    {refundDaysRemaining} {refundDaysRemaining === 1 ? 'dia' : 'dias'} restantes
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3" />
                  Válido até {refundEndDate}
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50 dark:border-green-400 dark:text-green-300"
              onClick={() => navigate('/perfil?tab=support')}
            >
              <Info className="h-4 w-4 mr-2" />
              Solicitar Reembolso
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Tempo de garantia
              </span>
              <span className="font-medium">
                {7 - refundDaysRemaining} de 7 dias decorridos
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 dark:bg-gray-900/50 p-3 rounded-md">
            <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p>
              Você adquiriu o <strong className="text-foreground">{getPlanDisplayName()}</strong> e tem acesso a todos os recursos.
              Caso não esteja satisfeito, pode solicitar <strong className="text-foreground">reembolso integral</strong> dentro de 7 dias da compra.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
