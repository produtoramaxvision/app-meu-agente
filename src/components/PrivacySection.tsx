import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { 
  Shield, 
  Download, 
  Trash2, 
  CheckCircle, 
  FileText,
  User,
  Database,
  MessageSquare,
  Settings,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PrivacySettings {
  dataCollection: boolean;
  dataProcessing: boolean;
  dataSharing: boolean;
  marketingEmails: boolean;
  analyticsTracking: boolean;
  cookieConsent: boolean;
  dataRetention: number;
  consentDate?: string;
  lastUpdated?: string;
}

export function PrivacySection() {
  const { cliente } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    dataCollection: true,
    dataProcessing: true,
    dataSharing: false,
    marketingEmails: false,
    analyticsTracking: true,
    cookieConsent: true,
    dataRetention: 365,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadPrivacySettings = useCallback(async () => {
    if (!cliente?.phone) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('phone', cliente.phone)
        .single();

      if (data) {
        setSettings({
          dataCollection: data.data_collection ?? true,
          dataProcessing: data.data_processing ?? true,
          dataSharing: data.data_sharing ?? false,
          marketingEmails: data.marketing_emails ?? false,
          analyticsTracking: data.analytics_tracking ?? true,
          cookieConsent: data.cookie_consent ?? true,
          dataRetention: data.data_retention ?? 365,
          consentDate: data.consent_date,
          lastUpdated: data.last_updated,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de privacidade:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cliente?.phone, setIsLoading, setSettings]);

  useEffect(() => {
    loadPrivacySettings();
  }, [loadPrivacySettings]);

  const savePrivacySettings = async () => {
    if (!cliente?.phone) return;
    
    setIsSaving(true);
    try {
      const settingsData = {
        phone: cliente.phone,
        data_collection: settings.dataCollection,
        data_processing: settings.dataProcessing,
        data_sharing: settings.dataSharing,
        marketing_emails: settings.marketingEmails,
        analytics_tracking: settings.analyticsTracking,
        cookie_consent: settings.cookieConsent,
        data_retention: settings.dataRetention,
        consent_date: settings.consentDate || new Date().toISOString(),
        last_updated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('privacy_settings')
        .upsert(settingsData, { 
          onConflict: 'phone',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast.success("Configurações salvas", {
        description: "Suas preferências de privacidade foram atualizadas com sucesso.",
      });

      setSettings(prev => ({
        ...prev,
        lastUpdated: new Date().toISOString(),
      }));

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error("Não foi possível salvar suas configurações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = async () => {
    if (!cliente?.phone) {
      toast.error("Não foi possível identificar sua conta para exportação.");
      return;
    }

    setIsExporting(true);
    const loadingToast = toast.loading("Exportando dados...", {
      description: "Preparando arquivo com seus dados pessoais",
    });

    try {
      // Usar função do Supabase para exportação completa
      const { data, error } = await supabase.rpc('export_user_data');

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro na exportação');
      }

      const jsonContent = JSON.stringify(data.data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `meus_dados_pessoais_${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss(loadingToast);
      toast.success("Dados exportados", {
        description: "Seus dados pessoais foram baixados com sucesso.",
      });

    } catch (error: unknown) {
      console.error('Erro ao exportar dados:', error);
      toast.dismiss(loadingToast);
      const message = error instanceof Error ? error.message : "Tente novamente ou contate o suporte.";
      toast.error("Não foi possível exportar seus dados", {
        description: message,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDataDeletion = async () => {
    setIsDeleting(true);

    // Mostrar feedback de carregamento enquanto processa a exclusão
    const loadingToast = toast.loading("Excluindo seus dados...", {
      description: "Esta operação pode levar alguns segundos.",
    });

    try {
      // Usar função do Supabase para exclusão completa e segura
      const { data, error } = await supabase.rpc('delete_user_data');

      if (error) {
        toast.dismiss(loadingToast);
        throw error;
      }

      if (!data || !data.success) {
        toast.dismiss(loadingToast);
        const errorMsg = (data as { error?: string })?.error || 'Erro na exclusão';
        throw new Error(errorMsg);
      }

      toast.dismiss(loadingToast);
      toast.success("Dados deletados com sucesso", {
        description: `Todos os seus dados foram removidos permanentemente. Tabelas afetadas: ${data.deleted_tables?.join(', ') || 'N/A'}`,
        duration: 5000,
      });

      // Fechar o diálogo de confirmação
      setShowDeleteDialog(false);

      // Redirecionar após pequena pausa
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    } catch (error: unknown) {
      console.error('Erro ao deletar dados:', error);
      toast.dismiss(loadingToast);
      const message = error instanceof Error ? error.message : "Tente novamente ou entre em contato com o suporte.";
      toast.error("Não foi possível deletar seus dados", {
        description: message,
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-600" />
            Configurações de Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status de Conformidade */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 opacity-90" />
        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
            <div className="h-9 w-9 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            Status de Conformidade LGPD
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-elevated/50 border border-border/50 backdrop-blur-sm">
            <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-500/10 px-3 py-1">
              <CheckCircle className="h-3 w-3 mr-1.5" />
              Conforme
            </Badge>
            <span className="text-sm text-text-muted">
              Suas configurações estão em conformidade com a Lei Geral de Proteção de Dados
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Consentimento */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-primary/12 via-transparent to-sky-500/10 opacity-90" />
        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            Consentimento e Preferências
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="dataCollection" className="text-sm font-medium">
                  Coleta de Dados
                </Label>
                <p className="text-xs text-text-muted">
                  Permitir coleta de dados pessoais para funcionalidades do sistema
                </p>
              </div>
              <Switch
                id="dataCollection"
                checked={settings.dataCollection}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, dataCollection: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="dataProcessing" className="text-sm font-medium">
                  Processamento de Dados
                </Label>
                <p className="text-xs text-text-muted">
                  Permitir processamento de dados para análise e relatórios
                </p>
              </div>
              <Switch
                id="dataProcessing"
                checked={settings.dataProcessing}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, dataProcessing: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="dataSharing" className="text-sm font-medium">
                  Compartilhamento de Dados
                </Label>
                <p className="text-xs text-text-muted">
                  Permitir compartilhamento de dados com terceiros (parceiros)
                </p>
              </div>
              <Switch
                id="dataSharing"
                checked={settings.dataSharing}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, dataSharing: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="marketingEmails" className="text-sm font-medium">
                  E-mails de Marketing
                </Label>
                <p className="text-xs text-text-muted">
                  Receber comunicações promocionais e ofertas especiais
                </p>
              </div>
              <Switch
                id="marketingEmails"
                checked={settings.marketingEmails}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, marketingEmails: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="analyticsTracking" className="text-sm font-medium">
                  Rastreamento Analítico
                </Label>
                <p className="text-xs text-text-muted">
                  Permitir coleta de dados de uso para melhorar o serviço
                </p>
              </div>
              <Switch
                id="analyticsTracking"
                checked={settings.analyticsTracking}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, analyticsTracking: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="cookieConsent" className="text-sm font-medium">
                  Cookies
                </Label>
                <p className="text-xs text-text-muted">
                  Permitir uso de cookies para funcionalidades essenciais
                </p>
              </div>
              <Switch
                id="cookieConsent"
                checked={settings.cookieConsent}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, cookieConsent: checked }))
                }
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={savePrivacySettings}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Direitos do Titular */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-purple-500/10 via-transparent to-primary/10 opacity-90" />
        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
            <div className="h-9 w-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <User className="h-4 w-4 text-purple-600" />
            </div>
            Direitos do Titular de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Conforme a LGPD, você tem direito a acessar, corrigir, excluir e portar seus dados pessoais.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={handleDataExport}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar Meus Dados
                </>
              )}
            </Button>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  className="flex items-center gap-2"
                  disabled={isSaving || isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Deletar Todos os Dados
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>⚠️ Atenção: Exclusão Permanente</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá deletar <strong>TODOS</strong> os seus dados permanentemente:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Registros financeiros</li>
                      <li>Tarefas e eventos</li>
                      <li>Metas e configurações</li>
                      <li>Notificações e histórico</li>
                    </ul>
                    <p className="mt-2 font-semibold text-destructive">
                      Esta ação NÃO pode ser desfeita. Tem certeza absoluta de que deseja continuar?
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDataDeletion}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      'Sim, deletar tudo'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre Retenção */}
      {settings.lastUpdated && (
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
          <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-orange-500/10 via-transparent to-primary/10 opacity-90" />
          <CardHeader className="relative z-10 pb-2">
            <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
              <div className="h-9 w-9 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                <Database className="h-4 w-4 text-orange-600" />
              </div>
              Informações de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-2">
              <p className="text-sm text-text-muted">
                <strong>Última atualização:</strong> {new Date(settings.lastUpdated).toLocaleString('pt-BR')}
              </p>
              {settings.consentDate && (
                <p className="text-sm text-text-muted">
                  <strong>Consentimento dado em:</strong> {new Date(settings.consentDate).toLocaleString('pt-BR')}
                </p>
              )}
              <p className="text-sm text-text-muted">
                <strong>Período de retenção:</strong> {settings.dataRetention} dias
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações de Contato */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-blue-500/10 via-transparent to-sky-500/10 opacity-90" />
        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
            <div className="h-9 w-9 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </div>
            Contato e Suporte
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="space-y-2">
            <p className="text-sm text-text-muted">
              Para questões sobre privacidade e proteção de dados, entre em contato:
            </p>
            <div className="space-y-1">
              <p className="text-sm">
                <strong>E-mail:</strong> privacidade@meuagente.api.br
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
