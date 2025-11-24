import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { CATEGORIAS_DESPESAS, CATEGORIAS_RECEITAS } from '@/constants/categories';
import { useDuplicateDetection } from '@/hooks/useDuplicateDetection';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { SegmentedControl } from '@/components/ui/segmented-control';

const formSchema = z.object({
  tipo: z.enum(['entrada', 'saida']),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  valor: z.string()
    .min(1, 'Valor é obrigatório')
    .refine((val) => {
      const numericValue = parseFloat(val.replace(/\./g, '').replace(',', '.'));
      return !isNaN(numericValue) && numericValue > 0 && numericValue <= 9999999999.99;
    }, 'Valor deve estar entre R$ 0,01 e R$ 9.999.999.999,99'),
  descricao: z.string().optional(),
  data: z.date(),
  agendar: z.boolean().default(false), // This field now means "isPaid"
  recorrente: z.boolean().default(false),
  recorrencia_fim: z.date().optional(),
}).refine(data => !data.recorrente || data.recorrencia_fim, {
  message: "Data final da recorrência é obrigatória.",
  path: ["recorrencia_fim"],
});

interface FinanceRecordFormProps {
  userPhone: string;
  onSuccess?: () => void;
  recordToEdit?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FinanceRecordForm({ userPhone, onSuccess, recordToEdit, open: controlledOpen, onOpenChange }: FinanceRecordFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRecurrenceDatePickerOpen, setIsRecurrenceDatePickerOpen] = useState(false);
  const { cliente } = useAuth();
  
  // ✅ CORREÇÃO: Hook customizado para detecção de duplicatas
  const { checkDuplicate, isChecking } = useDuplicateDetection();

  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen! : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  // CORREÇÃO CRÍTICA: Função para verificar se usuário pode criar registros financeiros
  const canCreateFinancialRecords = () => {
    if (!cliente) return false;

    const isUserActive = cliente.is_active === true;
    if (!isUserActive) {
      // Conta realmente inativa/bloqueada
      return false;
    }

    const isFreePlan =
      cliente.subscription_active === false &&
      (!cliente.plan_id || cliente.plan_id === 'free');

    const hasPaidPlan = cliente.subscription_active === true;

    // Usuários FREE com conta ativa ou com plano pago podem criar registros
    return isFreePlan || hasPaidPlan;
  };

  // ✅ CORREÇÃO: Função para verificar duplicatas financeiras usando hook customizado
  const checkForDuplicates = async (payload: any) => {
    const duplicateResult = await checkDuplicate({
      phone: userPhone,
      tipo: payload.tipo,
      categoria: payload.categoria,
      valor: payload.valor,
      descricao: payload.descricao,
      data_hora: payload.data_hora
    });
    
    return duplicateResult.isDuplicate;
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: 'saida',
      categoria: '',
      valor: '',
      descricao: '',
      data: new Date(),
      agendar: false,
      recorrente: false,
    },
  });

  useEffect(() => {
    if (recordToEdit) {
      form.reset({
        tipo: recordToEdit.tipo,
        categoria: recordToEdit.categoria,
        valor: recordToEdit.valor ? recordToEdit.valor.toFixed(2).replace('.', ',') : '',
        descricao: recordToEdit.descricao || '',
        data: new Date(recordToEdit.data_vencimento || recordToEdit.data_hora),
        agendar: recordToEdit.status === 'pago', // 'agendar' toggle is ON if status is 'pago'
        recorrente: recordToEdit.recorrente || false,
        recorrencia_fim: recordToEdit.recorrencia_fim ? new Date(recordToEdit.recorrencia_fim) : undefined,
      });
    } else if (open) { // Reset only when opening for a new record
      form.reset({
        tipo: 'saida',
        categoria: '',
        valor: '',
        descricao: '',
        data: new Date(),
        agendar: false,
        recorrente: false,
      });
    }
  }, [recordToEdit, open, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // CORREÇÃO CRÍTICA: Verificar se usuário pode criar registros financeiros
    if (!canCreateFinancialRecords()) {
      toast.error('Acesso Restrito: Sua conta não está ativa. Entre em contato com o suporte.');
      return;
    }

    setIsSubmitting(true);
    try {
      const valorNumerico = parseFloat(
        values.valor.replace(/\./g, '').replace(',', '.')
      );

      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        throw new Error('Valor inválido');
      }

      const isPaid = values.agendar;

      const payload = {
        phone: userPhone,
        tipo: values.tipo,
        categoria: values.categoria,
        valor: valorNumerico,
        descricao: values.descricao || null,
        recorrente: values.recorrente,
        recorrencia_fim: values.recorrente ? values.recorrencia_fim?.toISOString().split('T')[0] : null,
        
        // Corrected logic as per user request
        status: isPaid ? 'pago' : 'pendente',
        data_vencimento: isPaid ? null : values.data.toISOString(),
        data_hora: isPaid ? values.data.toISOString() : new Date().toISOString(),
      };

      // CORREÇÃO CRÍTICA: Verificar duplicatas apenas para novos registros
      if (!recordToEdit) {
        const isDuplicate = await checkForDuplicates(payload);
        if (isDuplicate) {
          toast.error('Registro duplicado detectado!', {
            description: 'Já existe um registro similar. Verifique os dados ou aguarde alguns minutos.'
          });
          return;
        }
      }

      let error;
      
      if (recordToEdit) {
        const { phone, ...updatePayload } = payload;
        ({ error } = await supabase
          .from('financeiro_registros')
          .update(updatePayload)
          .eq('id', recordToEdit.id));
      } else {
        console.log('Tentando inserir registro:', payload);
        const { data, error } = await supabase
          .from('financeiro_registros')
          .insert(payload)
          .select();
        
        console.log('Resultado da inserção:', { data, error });
        
        if (error) {
          console.error('Erro na inserção:', error);
          throw error;
        }
      }

      if (error) throw error;

      toast.success(recordToEdit 
        ? 'Registro atualizado com sucesso!' 
        : 'Registro financeiro adicionado com sucesso!');

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(`Erro ao ${recordToEdit ? 'atualizar' : 'adicionar'} o registro.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPaid = form.watch('agendar');
  const recorrente = form.watch('recorrente');
  const transactionType = form.watch('tipo');

  const paymentToggleLabel =
    transactionType === 'entrada' ? 'Marcar como recebido?' : 'Marcar como pago?';

  const paymentToggleDescription = isPaid
    ? transactionType === 'entrada'
      ? 'A transação será registrada como recebida.'
      : 'A transação será registrada como paga.'
    : transactionType === 'entrada'
      ? 'A conta será criada como pendente (a receber).'
      : 'A conta será criada como pendente (a pagar).';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!recordToEdit && !isControlled && (
        <DialogTrigger asChild>
          <Button className="w-full group relative overflow-hidden">
            <span className="relative z-10">Adicionar Registro</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{recordToEdit ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
          <DialogDescription>
            {recordToEdit 
              ? 'Modifique os dados do registro.' 
              : 'Adicione uma transação ou agende uma conta.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      {/* PADRONIZAÇÃO - Aplicando SegmentedControl com padrão da agenda
                          Mantendo funcionalidade existente com design consistente
                          Data: 2025-01-16 */}
                      <SegmentedControl
                        value={field.value}
                        onValueChange={field.onChange}
                        options={[
                          { value: "saida", label: "Saída" },
                          { value: "entrada", label: "Entrada" },
                        ]}
                        size="sm"
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <CurrencyInput 
                        placeholder="0,00" 
                        value={field.value} 
                        onValueChange={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} key={form.watch('tipo')}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(form.watch('tipo') === 'entrada' ? CATEGORIAS_RECEITAS : CATEGORIAS_DESPESAS).map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{isPaid ? 'Data do Pagamento/Recebimento' : 'Data de Vencimento'}</FormLabel>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-text-muted')}>
                          {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Selecione</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        mode="single" 
                        selected={field.value} 
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsDatePickerOpen(false);
                        }} 
                        initialFocus 
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="recorrente"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <FormLabel>É recorrente?</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              {recorrente && (
                <FormField
                  control={form.control}
                  name="recorrencia_fim"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-2">
                      <FormLabel>Data final da recorrência</FormLabel>
                      <Popover open={isRecurrenceDatePickerOpen} onOpenChange={setIsRecurrenceDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-text-muted')}>
                              {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Selecione</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar 
                            mode="single" 
                            selected={field.value} 
                            onSelect={(date) => {
                              field.onChange(date);
                              setIsRecurrenceDatePickerOpen(false);
                            }} 
                            initialFocus 
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="agendar"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <FormLabel>{paymentToggleLabel}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <p className="text-sm text-text-muted">
                {paymentToggleDescription}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}