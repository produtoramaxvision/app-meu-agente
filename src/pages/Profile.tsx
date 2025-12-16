import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams } from 'react-router-dom';
import { AvatarUpload } from '@/components/AvatarUpload';
import { PrivacySection } from '@/components/PrivacySection';
import { BackupSection } from '@/components/BackupSection';
import { PlanInfoCard } from '@/components/PlanInfoCard';
import { PlansSection } from '@/components/PlansSection';
import { AnimatedTabs } from '@/components/ui/animated-tabs';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanInfo } from '@/hooks/usePlanInfo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Shield, 
  Database, 
  Settings, 
  Crown,
  Camera,
  Activity,
  Info
} from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string(),
  cpf: z.string().min(14, 'CPF é obrigatório e deve ter 14 caracteres.'),
});

// Função para formatar CPF com máscara
const formatCpf = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export default function Profile() {
  const { cliente, updateAvatar, updateCliente } = useAuth();
  const { planInfo, getPlanColor, getPlanDisplayName } = usePlanInfo();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: cliente?.name || '',
      email: cliente?.email || '',
      phone: cliente?.phone || '',
      cpf: cliente?.cpf || '',
    },
  });

  const refreshUserData = useCallback(async () => {
    if (!cliente) return;
    
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          phone,
          name,
          email,
          cpf,
          avatar_url,
          subscription_active,
          is_active,
          plan_id,
          refund_period_ends_at,
          billing_provider,
          external_subscription_id,
          stripe_customer_id,
          created_at,
          updated_at
        `)
        .eq('phone', cliente.phone)
        .single();

      if (!error && data) {
        // Update the form and avatar state
        form.reset({
          name: data.name,
          email: data.email || '',
          phone: data.phone,
          cpf: data.cpf || '',
        });
        setAvatarUrl(data.avatar_url || null);
        // Update the context
        updateCliente(data);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [cliente, form, setAvatarUrl, updateCliente]);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const portalReturn = searchParams.get('portal_return');

    if (success === 'true' || portalReturn === 'true') {
      if (success === 'true') {
        toast.success("Pagamento realizado com sucesso! Atualizando seu plano...");
      } else {
        toast.info("Verificando atualizações do plano...");
      }
      
      // Adiciona um delay inicial para dar tempo do webhook processar
      const timer1 = setTimeout(() => {
        refreshUserData();
      }, 1500);

      // Adiciona uma segunda verificação de segurança
      const timer2 = setTimeout(() => {
        refreshUserData();
      }, 4000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else if (canceled === 'true') {
      toast.info("O processo de pagamento foi cancelado.");
    }
  }, [searchParams, refreshUserData]);

  useEffect(() => {
    if (cliente) {
      form.reset({
        name: cliente.name,
        email: cliente.email || '',
        phone: cliente.phone,
        cpf: cliente.cpf || '',
      });
      setAvatarUrl(cliente.avatar_url || null);
    }
  }, [cliente, form]);

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    /**
     * BUG FIX - TestSprite TC003
     * Problema: Formulário de perfil não fornecia confirmação ou mensagem de erro após envio
     * Solução: Adicionar feedback visual e mensagens de sucesso/erro
     * Data: 2025-01-06
     * Status: CORRIGIDO E VALIDADO
     */
    if (!cliente) return;

    // Normalizar email (string vazia -> null)
    const newEmailTrimmed = (values.email || '').trim();
    const currentEmailTrimmed = (cliente.email || '').trim();
    const emailChanged = newEmailTrimmed !== currentEmailTrimmed;

    setIsSubmitting(true);
    
    let emailRequiresConfirmation = false;
    let newEmailForConfirmation = '';

    try {
      // 1) Se o email mudou e não está vazio, atualizar primeiro no Supabase Auth
      if (emailChanged && newEmailTrimmed) {
        console.log('[Profile] Atualizando email no Supabase Auth:', {
          oldEmail: currentEmailTrimmed,
          newEmail: newEmailTrimmed,
        });

        const { data: authData, error: authError } = await supabase.auth.updateUser({
          email: newEmailTrimmed,
        });

        console.log('[Profile] Resposta do updateUser:', {
          user: authData?.user,
          userEmail: authData?.user?.email,
          error: authError,
        });

        if (authError) {
          console.error('[Profile] Error updating auth email:', authError);

          let message = 'Erro ao atualizar email no sistema de autenticação.';
          const lower = authError.message.toLowerCase();

          if (
            lower.includes('already registered') ||
            lower.includes('already exists') ||
            lower.includes('email address must be unique') ||
            authError.status === 422
          ) {
            message = 'Este email já está em uso. Use outro email.';
          } else if (
            lower.includes('invalid email') ||
            lower.includes('email format') ||
            authError.status === 400
          ) {
            message = 'Email inválido. Verifique o formato do email.';
          }

          toast.error(message);
          setIsSubmitting(false);
          return;
        }

        // Se não houve erro, o Supabase enviou email de confirmação
        // O email SEMPRE requer confirmação em projetos hospedados
        console.log('[Profile] Email de confirmação enviado para:', newEmailTrimmed);
        emailRequiresConfirmation = true;
        newEmailForConfirmation = newEmailTrimmed;
      }

      // 2) Atualizar dados na tabela clientes
      // IMPORTANTE: Se email requer confirmação, manter o email antigo até a confirmação
      const updatePayload: {
        name: string;
        email?: string | null;
        cpf?: string | null;
      } = {
        name: values.name,
        cpf: values.cpf || null,
      };

      // Só atualizar email se NÃO requer confirmação
      if (!emailRequiresConfirmation) {
        updatePayload.email = newEmailTrimmed || null;
      }

      const { error, data: updateData } = await supabase
        .from('clientes')
        .update(updatePayload)
        .eq('auth_user_id', cliente.auth_user_id)
        .select();

      if (error) {
        console.error('Error updating profile:', error);
        toast.error(`Erro ao salvar: ${error.message}`);
        return;
      }

      if (!updateData || updateData.length === 0) {
        console.error('No rows updated - RLS policy may have blocked the update');
        toast.error("Não foi possível atualizar o perfil. Verifique suas permissões.");
        return;
      }

      // 3) Atualizar contexto com os novos dados (mantendo email antigo se requer confirmação)
      updateCliente({
        ...cliente,
        name: values.name,
        email: emailRequiresConfirmation ? cliente.email : (newEmailTrimmed || undefined),
        cpf: values.cpf || undefined,
      });

      // 4) Mostrar toast unificado com todas as informações
      if (emailRequiresConfirmation) {
        toast.success(
          `Suas informações foram salvas! Um email de confirmação foi enviado para ${newEmailForConfirmation}. Clique no link para confirmar a alteração.`,
          { duration: 6000 }
        );
      } else {
        toast.success("Suas informações foram salvas com sucesso!");
      }

      await refreshUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cliente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "personal",
      label: "Pessoal",
      icon: <User className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
            <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-primary/12 via-transparent to-sky-500/10 opacity-90" />
            <CardHeader className="relative z-10 pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-base font-semibold tracking-tight">Foto de Perfil</CardTitle>
                  <CardDescription className="text-xs text-text-muted">
                    Personalize sua identidade visual no sistema
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-2">
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                userPhone={cliente.phone}
                userName={cliente.name}
                onUploadComplete={async (url) => {
                  setAvatarUrl(url);
                  updateAvatar(url);
                  await refreshUserData();
                }}
              />
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
            <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-primary/12 via-transparent to-sky-500/10 opacity-90" />
            <CardHeader className="relative z-10 pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <CardTitle className="text-base font-semibold tracking-tight">Informações Pessoais</CardTitle>
                  <CardDescription className="text-xs text-text-muted">
                    Mantenha seus dados cadastrais sempre atualizados
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-00" 
                            {...field}
                            value={formatCpf(field.value || '')}
                            onChange={(e) => field.onChange(formatCpf(e.target.value))}
                            maxLength={14}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "privacy",
      label: "Privacidade",
      icon: <Shield className="h-4 w-4" />,
      content: <PrivacySection />,
    },
    {
      id: "backup",
      label: "Backup",
      icon: <Database className="h-4 w-4" />,
      content: <BackupSection />,
    },
    {
      id: "settings",
      label: "Configurações",
      icon: <Settings className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
            <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-violet-500/10 via-transparent to-purple-500/10 opacity-90" />
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
                <div className="h-9 w-9 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-violet-600" />
                </div>
                Configurações da Conta
              </CardTitle>
              <CardDescription className="pl-12 mt-1">
                Gerencie configurações gerais da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2">
                <h4 className="font-medium">Status da Conta</h4>
                <div className="flex items-center gap-2">
                  {/* Indicador de status da conta com efeito pulsante quando ativa */}
                  <div className="relative flex h-3 w-3 items-center justify-center">
                    {cliente?.is_active && (
                      <span
                        className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-green-400 opacity-60"
                      />
                    )}
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full border-2 ${
                        cliente?.is_active
                          ? 'bg-green-500 border-green-500'
                          : 'bg-red-500 border-red-500'
                      }`}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {cliente?.is_active ? 'Conta ativa' : 'Conta inativa'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Assinatura</h4>
                <div className="flex items-center gap-2">
                  {/* Indicador de status do plano com cores por plano e efeito pulsante na borda */}
                  <div className="relative flex h-3 w-3 items-center justify-center">
                    {/* Anel pulsante */}
                    {cliente?.subscription_active && (
                      <span
                        className={`absolute inline-flex h-3 w-3 animate-ping rounded-full opacity-60 ${
                          getPlanColor() === 'orange'
                            ? 'bg-orange-400'
                            : getPlanColor() === 'blue'
                            ? 'bg-blue-400'
                            : getPlanColor() === 'green'
                            ? 'bg-green-400'
                            : getPlanColor() === 'purple'
                            ? 'bg-purple-400'
                            : 'bg-green-400'
                        }`}
                      />
                    )}
                    {/* Bolinha principal */}
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full border-2 ${
                        cliente?.subscription_active
                          ? getPlanColor() === 'orange'
                            ? 'bg-orange-500 border-orange-500'
                            : getPlanColor() === 'blue'
                            ? 'bg-blue-500 border-blue-500'
                            : getPlanColor() === 'green'
                            ? 'bg-green-500 border-green-500'
                            : getPlanColor() === 'purple'
                            ? 'bg-purple-500 border-purple-500'
                            : 'bg-green-500 border-green-500'
                          : 'bg-yellow-500 border-yellow-500'
                      }`}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {cliente?.subscription_active 
                      ? `Assinatura ativa (${getPlanDisplayName().toLowerCase()})` 
                      : 'Assinatura inativa'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Membro desde</h4>
                <p className="text-sm text-muted-foreground">
                  {cliente?.created_at 
                    ? new Date(cliente.created_at).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'Data não disponível'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
            <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-slate-500/10 via-transparent to-zinc-500/10 opacity-90" />
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
                <div className="h-9 w-9 rounded-full bg-slate-500/10 border border-slate-500/30 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-slate-600" />
                </div>
                Informações do Sistema
              </CardTitle>
              <CardDescription className="pl-12 mt-1">
                Detalhes técnicos sobre sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Versão do App</h4>
                  <p className="text-sm text-muted-foreground">1.0.0</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Última Atualização</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">ID da Conta</h4>
                  <p className="text-sm text-muted-foreground font-mono">
                    {cliente?.phone?.slice(-8) || 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Região</h4>
                  <p className="text-sm text-muted-foreground">Brasil (BR)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <PlanInfoCard />
        </div>
      ),
    },
    {
      id: "plans",
      label: "Planos",
      icon: <Crown className="h-4 w-4" />,
      content: <PlansSection />,
    },
  ];

  return (
    <div className="py-4 sm:py-6 lg:py-8 space-y-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-br from-text via-brand-700 to-brand-500 bg-clip-text text-transparent drop-shadow-sm">
              Perfil
            </h1>
            <p className="text-text-muted mt-2">
              Gerencie suas informações pessoais, privacidade e backups
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl">
          <AnimatedTabs
            defaultTab={searchParams.get('tab') || "personal"}
            tabs={tabs}
          />
        </div>
      </div>
    </div>
  );
}
