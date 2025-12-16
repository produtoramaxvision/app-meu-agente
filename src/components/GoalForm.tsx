import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { goalIcons } from '@/constants/goalIcons';
import { GoalIcon } from './GoalIcons';

import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { Goal } from '@/hooks/useGoalsData';

const formSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  valor_meta: z.string().min(1, 'Valor da meta é obrigatório'),
  valor_atual: z.string().optional(),
  prazo_meses: z.coerce.number().int().positive('Prazo deve ser um número positivo').optional(),
  icone: z.string().min(1, 'Ícone é obrigatório'),
  meta_principal: z.boolean().default(false),
});

interface GoalFormProps {
  goalToEdit?: Goal | null;
  onSuccess: () => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GoalForm({ goalToEdit, onSuccess, children, open: externalOpen, onOpenChange: externalOnOpenChange }: GoalFormProps) {
  const { cliente } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      valor_meta: '',
      valor_atual: '0',
      icone: '',
      meta_principal: false,
    },
  });

  useEffect(() => {
    if (goalToEdit) {
      form.reset({
        titulo: goalToEdit.titulo,
        valor_meta: goalToEdit.valor_meta ? String(goalToEdit.valor_meta).replace('.', ',') : '',
        valor_atual: goalToEdit.valor_atual ? String(goalToEdit.valor_atual).replace('.', ',') : '0',
        prazo_meses: goalToEdit.prazo_meses || undefined,
        icone: goalToEdit.icone || '',
        meta_principal: goalToEdit.meta_principal,
      });
    } else {
      form.reset();
    }
  }, [goalToEdit, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!cliente) return;
    setIsSubmitting(true);

    try {
      const valorMetaNum = parseFloat(values.valor_meta.replace(/\./g, '').replace(',', '.'));
      const valorAtualNum = parseFloat((values.valor_atual || '0').replace(/\./g, '').replace(',', '.'));

      const payload = {
        phone: cliente.phone,
        titulo: values.titulo,
        valor_meta: valorMetaNum,
        valor_atual: valorAtualNum,
        prazo_meses: values.prazo_meses || null,
        icone: values.icone,
        meta_principal: values.meta_principal,
      };

      if (values.meta_principal) {
        await supabase.from('metas').update({ meta_principal: false }).eq('phone', cliente.phone);
      }

      const { error } = goalToEdit
        ? await supabase.from('metas').update(payload).eq('id', goalToEdit.id)
        : await supabase.from('metas').insert(payload);

      if (error) throw error;

      toast.success(`Meta ${goalToEdit ? 'atualizada' : 'criada'} com sucesso.`);
      onSuccess();
      setOpen(false);
    } catch (error) {
      toast.error('Não foi possível salvar a meta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{goalToEdit ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
          <DialogDescription>Defina um objetivo financeiro para acompanhar seu progresso.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="titulo" render={({ field }) => (
              <FormItem>
                <FormLabel>Título da Meta</FormLabel>
                <FormControl><Input placeholder="Ex: Viagem para a Europa" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="valor_atual" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Atual</FormLabel>
                  <FormControl>
                    <CurrencyInput 
                      placeholder="R$ 0,00" 
                      value={field.value} 
                      onValueChange={field.onChange} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="valor_meta" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Meta</FormLabel>
                  <FormControl>
                    <CurrencyInput 
                      placeholder="R$ 10.000,00" 
                      value={field.value} 
                      onValueChange={field.onChange} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="icone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ícone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um ícone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(goalIcons).map(([key, { icon: Icon, label }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="prazo_meses" render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo (meses)</FormLabel>
                  <FormControl><Input type="number" placeholder="Ex: 12" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="meta_principal" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Marcar como meta principal?</FormLabel>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="group relative overflow-hidden bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] text-white hover:shadow-lg hover:scale-105 transition-all duration-200 hover:bg-gradient-to-br hover:from-[hsl(var(--brand-900))] hover:to-[hsl(var(--brand-700))]">
                <span className="relative z-10">{isSubmitting ? 'Salvando...' : 'Salvar Meta'}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}