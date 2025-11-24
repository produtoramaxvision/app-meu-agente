import { useState, useEffect } from 'react';
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
  Crown
} from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string(),
  cpf: z.string().min(14, 'CPF é obrigatório e deve ter 14 caracteres.'),
});

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

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success("Pagamento realizado com sucesso! Atualizando seu plano...");
      
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
  }, [searchParams]);

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

  const refreshUserData = async () => {
    if (!cliente) return;
    
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('phone, name, email, cpf, avatar_url, subscription_active, is_active, created_at, plan_id')
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
  };

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    /**
     * BUG FIX - TestSprite TC003
     * Problema: Formulário de perfil não fornecia confirmação ou mensagem de erro após envio
     * Solução: Adicionar feedback visual e mensagens de sucesso/erro
     * Data: 2025-01-06
     * Status: CORRIGIDO E VALIDADO
     */
    if (!cliente) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          name: values.name,
          email: values.email || null,
          cpf: values.cpf || null,
        })
        .eq('phone', cliente.phone);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error("Ocorreu um erro ao salvar suas informações. Tente novamente.");
        return;
      }

      // Update context with new data
      updateCliente({
        ...cliente,
        name: values.name,
        email: values.email || undefined,
        cpf: values.cpf || undefined,
      });

      toast.success("Suas informações foram salvas com sucesso!");

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
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
              <CardDescription>
                Adicione ou altere sua foto de perfil
              </CardDescription>
            </CardHeader>
            <CardContent>
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

          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize seus dados cadastrais
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                          <Input placeholder="000.000.000-00" {...field} />
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
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Conta</CardTitle>
              <CardDescription>
                Gerencie configurações gerais da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Status da Conta</h4>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${cliente?.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-muted-foreground">
                    {cliente?.is_active ? 'Conta ativa' : 'Conta inativa'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Assinatura</h4>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    cliente?.subscription_active 
                      ? (getPlanColor() === 'orange' ? 'bg-orange-500' : 'bg-green-500')
                      : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-muted-foreground">
                    {cliente?.subscription_active 
                      ? `Assinatura ativa (${getPlanDisplayName().toLowerCase()})` 
                      : 'Assinatura inativa'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Telefone</h4>
                <p className="text-sm text-muted-foreground">{cliente?.phone}</p>
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

          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
              <CardDescription>
                Detalhes técnicos sobre sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-3xl font-bold">Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais, privacidade e backups
          </p>
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