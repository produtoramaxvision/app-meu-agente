import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, XCircle } from 'lucide-react';

export const LOSS_REASONS = [
  { id: 'price', label: 'Preço muito alto' },
  { id: 'competitor', label: 'Escolheu concorrente' },
  { id: 'timing', label: 'Não é o momento' },
  { id: 'no_budget', label: 'Sem orçamento' },
  { id: 'no_response', label: 'Sem resposta' },
  { id: 'not_qualified', label: 'Lead não qualificado' },
  { id: 'changed_needs', label: 'Necessidades mudaram' },
  { id: 'other', label: 'Outro motivo' },
] as const;

export type LossReasonId = typeof LOSS_REASONS[number]['id'];

interface LossReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  onConfirm: (reason: LossReasonId, details?: string) => Promise<void>;
}

export function LossReasonDialog({ 
  open, 
  onOpenChange, 
  leadName, 
  onConfirm 
}: LossReasonDialogProps) {
  const [selectedReason, setSelectedReason] = useState<LossReasonId | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await onConfirm(selectedReason, details || undefined);
      // Reset form
      setSelectedReason(null);
      setDetails('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar motivo de perda:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setSelectedReason(null);
    setDetails('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <DialogTitle>Motivo da Perda</DialogTitle>
          </div>
          <DialogDescription>
            Por que o lead <span className="font-semibold text-foreground">{leadName}</span> foi perdido?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label htmlFor="loss-reason" className="text-sm font-medium">
              Selecione o motivo principal <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              id="loss-reason"
              value={selectedReason || ''}
              onValueChange={(value) => setSelectedReason(value as LossReasonId)}
              className="space-y-2"
            >
              {LOSS_REASONS.map((reason) => (
                <div key={reason.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.id} id={reason.id} />
                  <Label
                    htmlFor={reason.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-sm font-medium">
              Detalhes adicionais (opcional)
            </Label>
            <Textarea
              id="details"
              placeholder="Adicione mais informações sobre o motivo da perda..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedReason || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Confirmar Perda'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
