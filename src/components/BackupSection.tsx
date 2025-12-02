import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ButtonGroup, ButtonGroupSeparator } from '@/components/ui/button-group';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Upload, 
  Database, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  HardDrive,
  Calendar,
  FileText,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupInfo {
  id: string;
  created_at: string;
  size: number;
  status: 'completed' | 'failed' | 'in_progress';
  type: 'automatic' | 'manual';
  description: string;
}

export function BackupSection() {
  const { cliente } = useAuth();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  // Simular dados de backup (em produção, viria do Supabase)
  useEffect(() => {
    const mockBackups: BackupInfo[] = [
      {
        id: '1',
        created_at: new Date().toISOString(),
        size: 2048576, // 2MB
        status: 'completed',
        type: 'automatic',
        description: 'Backup automático diário'
      },
      {
        id: '2',
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
        size: 1856432, // 1.8MB
        status: 'completed',
        type: 'manual',
        description: 'Backup manual antes da atualização'
      },
      {
        id: '3',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
        size: 1954321, // 1.9MB
        status: 'completed',
        type: 'automatic',
        description: 'Backup automático diário'
      }
    ];
    
    setBackups(mockBackups);
    setLoading(false);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    
    try {
      // Simular criação de backup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newBackup: BackupInfo = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        size: Math.floor(Math.random() * 2000000) + 1000000,
        status: 'completed',
        type: 'manual',
        description: 'Backup manual criado pelo usuário'
      };
      
      setBackups(prev => [newBackup, ...prev]);
      toast.success('Backup criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      // Simular download
      toast.info('Iniciando download do backup...');
      
      // Em produção, aqui seria feita a chamada para o Supabase
      // para baixar o arquivo de backup
      
      setTimeout(() => {
        toast.success('Download concluído!');
      }, 2000);
    } catch (error) {
      toast.error('Erro ao baixar backup');
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    setRestoring(true);
    setSelectedBackup(backupId);
    
    try {
      // Simular restauração
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      toast.success('Backup restaurado com sucesso!');
    } catch (error) {
      toast.error('Erro ao restaurar backup');
    } finally {
      setRestoring(false);
      setSelectedBackup(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">Em Progresso</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
          <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-primary/12 via-transparent to-sky-500/10 opacity-90" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs font-medium text-text-muted uppercase tracking-wide">Total de Backups</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">{backups.length}</div>
            <p className="text-xs text-text-muted mt-1">
              {backups.filter(b => b.status === 'completed').length} concluídos
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
          <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 opacity-90" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs font-medium text-text-muted uppercase tracking-wide">Último Backup</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">
              {backups.length > 0 ? format(new Date(backups[0].created_at), 'dd/MM', { locale: ptBR }) : '--'}
            </div>
            <p className="text-xs text-text-muted mt-1">
              {backups.length > 0 ? format(new Date(backups[0].created_at), 'HH:mm', { locale: ptBR }) : 'Nenhum backup'}
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
          <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-blue-500/10 via-transparent to-indigo-500/10 opacity-90" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-xs font-medium text-text-muted uppercase tracking-wide">Espaço Usado</CardTitle>
            <HardDrive className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">
              {formatFileSize(backups.reduce((acc, b) => acc + b.size, 0))}
            </div>
            <p className="text-xs text-text-muted mt-1">
              Total de todos os backups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Botão Criar Backup */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-primary/12 via-transparent to-sky-500/10 opacity-90" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
            <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Database className="h-4 w-4 text-primary" />
            </div>
            Criar Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <Button
            onClick={handleCreateBackup}
            disabled={creatingBackup}
            className="w-full group relative overflow-hidden rounded-lg bg-gradient-to-br from-[hsl(var(--brand-900))] to-[hsl(var(--brand-700))] hover:shadow-lg hover:scale-105"
          >
            <span className="relative z-10 flex items-center">
              <Database className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              {creatingBackup ? 'Criando...' : 'Criar Backup Manual'}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </CardContent>
      </Card>

      {/* Backup Progress */}
      {creatingBackup && (
        <Alert className="border-primary/20 bg-primary/5 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-primary font-medium">Criando backup dos seus dados...</p>
              <Progress value={66} className="w-full h-2 bg-primary/10" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Restore Progress */}
      {restoring && (
        <Alert className="border-blue-500/20 bg-blue-500/5 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="text-blue-700 font-medium">Restaurando backup selecionado...</p>
              <Progress value={75} className="w-full h-2 bg-blue-500/10" />
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Backups List */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-gray-500/10 via-transparent to-slate-500/10 opacity-90" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
            <div className="h-9 w-9 rounded-full bg-gray-500/10 border border-gray-500/30 flex items-center justify-center">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            Histórico de Backups
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {loading ? (
            <div className="space-y-4">
              <div className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              <div className="h-16 bg-muted/50 rounded-xl animate-pulse" />
              <div className="h-16 bg-muted/50 rounded-xl animate-pulse" />
            </div>
          ) : backups.length > 0 ? (
            <div className="space-y-4">
              {backups.map((backup, index) => (
                <Card 
                  key={backup.id} 
                  className="overflow-hidden transition-all duration-300 hover:shadow-md border border-border/40 hover:border-primary/20 bg-surface-elevated/30 backdrop-blur-sm"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-4">
                    {/* Layout Principal */}
                    <div className="flex flex-col space-y-4">
                      {/* Informações Principais */}
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(backup.status)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Título e Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm truncate">{backup.description}</h3>
                              {getStatusBadge(backup.status)}
                            </div>
                            <Badge variant="outline" className="text-xs w-fit border-primary/20 bg-primary/5 text-primary">
                              {backup.type === 'automatic' ? 'Automático' : 'Manual'}
                            </Badge>
                          </div>
                          
                          {/* Metadados */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>{format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3 flex-shrink-0" />
                              <span>{formatFileSize(backup.size)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ações - Layout Responsivo */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2 border-t border-border/30">
                        <ButtonGroup 
                          className="w-full sm:w-auto" 
                          aria-label={`Ações para backup ${backup.description}`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadBackup(backup.id)}
                            disabled={backup.status !== 'completed'}
                            className="flex-1 sm:flex-none hover:bg-primary/10 hover:text-primary text-xs h-8"
                          >
                            <Download className="h-3.5 w-3.5 mr-2" />
                            Baixar
                          </Button>
                          <ButtonGroupSeparator className="bg-border/40" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreBackup(backup.id)}
                            disabled={backup.status !== 'completed' || restoring}
                            className="flex-1 sm:flex-none hover:bg-blue-500/10 hover:text-blue-600 text-xs h-8"
                          >
                            <Upload className="h-3.5 w-3.5 mr-2" />
                            Restaurar
                          </Button>
                        </ButtonGroup>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Database className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum backup encontrado</h3>
              <p className="text-sm text-text-muted mb-6">
                Crie seu primeiro backup para proteger seus dados
              </p>
              <Button onClick={handleCreateBackup} disabled={creatingBackup}>
                <Database className="mr-2 h-4 w-4" />
                Criar Primeiro Backup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-surface via-surface/95 to-background shadow-xl">
        <div className="pointer-events-none absolute inset-px rounded-[1.1rem] bg-gradient-to-br from-purple-500/10 via-transparent to-indigo-500/10 opacity-90" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-3 text-base font-semibold tracking-tight">
            <div className="h-9 w-9 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <Settings className="h-4 w-4 text-purple-600" />
            </div>
            Informações sobre Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-surface-elevated/50 border border-border/50">
              <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Backups Automáticos
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Backups automáticos são criados diariamente às 02:00 para proteger seus dados sem que você precise se preocupar.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-elevated/50 border border-border/50">
              <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Retenção de Dados
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Mantemos os últimos 30 backups automaticamente. Backups manuais são mantidos indefinidamente até que você os exclua.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-elevated/50 border border-border/50">
              <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                O que é Incluído
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Todos os seus dados financeiros, tarefas, agenda e configurações são incluídos no arquivo de backup criptografado.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface-elevated/50 border border-border/50">
              <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Restauração
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A restauração substitui todos os dados atuais pelos dados do backup selecionado. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
