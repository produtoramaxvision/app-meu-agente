import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Phone, Mail, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Schema de validação Zod
const createLeadSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(20, 'Telefone muito longo')
    .regex(/^[0-9+\-\s()]+$/, 'Telefone deve conter apenas números, +, -, espaços e parênteses'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  estimatedValue: z.string().optional(),
  status: z.enum(['novo', 'contatado', 'qualificado', 'proposta', 'negociando']).default('novo'),
  notes: z.string().max(500, 'Notas devem ter no máximo 500 caracteres').optional(),
});

type CreateLeadFormData = z.infer<typeof createLeadSchema>;

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateLead: (data: CreateLeadFormData) => Promise<void>;
}

const statusOptions = [
  { value: 'novo', label: 'Novo', icon: '🆕', description: 'Lead recém-chegado' },
  { value: 'contatado', label: 'Contatado', icon: '📞', description: 'Primeiro contato realizado' },
  { value: 'qualificado', label: 'Qualificado', icon: '✅', description: 'Lead validado e com potencial' },
  { value: 'proposta', label: 'Proposta', icon: '📄', description: 'Proposta enviada' },
  { value: 'negociando', label: 'Negociando', icon: '💬', description: 'Em processo de negociação' },
];

export function CreateLeadDialog({ open, onOpenChange, onCreateLead }: CreateLeadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      estimatedValue: '',
      status: 'novo',
      notes: '',
    },
  });

  const selectedStatus = form.watch('status');
  const currentStatusOption = statusOptions.find(opt => opt.value === selectedStatus);

  const handleSubmit = async (data: CreateLeadFormData) => {
    try {
      setIsSubmitting(true);
      await onCreateLead(data);
      
      // Reset form e fechar dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating lead:', error);
      // O erro já é tratado no componente pai com toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <motion.div 
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <TrendingUp className="h-6 w-6 text-primary" />
            </motion.div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Novo Lead
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Preencha as informações do novo lead. Campos com * são obrigatórios.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nome Completo *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: João da Silva"
                      className="h-11"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Telefone e Email (Grid) */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Telefone/WhatsApp *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 11987654321"
                        className="h-11"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="exemplo@email.com"
                        className="h-11"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Valor Estimado e Status (Grid) */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="estimatedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      Valor Estimado (R$)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="h-11"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Status Inicial
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status Info Card (Animated) */}
            <AnimatePresence mode="wait">
              {currentStatusOption && (
                <motion.div
                  key={selectedStatus}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "p-3 rounded-lg border bg-muted/30 flex items-center gap-3",
                    "text-sm text-muted-foreground"
                  )}
                >
                  <span className="text-2xl">{currentStatusOption.icon}</span>
                  <div>
                    <p className="font-medium text-foreground">{currentStatusOption.label}</p>
                    <p className="text-xs">{currentStatusOption.description}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notas */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Notas/Observações
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione informações relevantes sobre o lead..."
                      className="min-h-[100px] resize-none"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/500 caracteres
                  </p>
                </FormItem>
              )}
            />

            {/* Footer */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Criar Lead
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
