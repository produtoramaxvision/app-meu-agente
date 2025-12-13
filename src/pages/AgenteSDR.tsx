// =============================================================================
// Página: AgenteSDR
// Página principal do Agente SDR com conexão WhatsApp, configuração e playground
// =============================================================================

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ProtectedFeature } from '@/components/ProtectedFeature';
import { SDRConnectionCard, SDRConfigForm, SDRPlayground, SDRStatusBadge } from '@/components/sdr';
import { EvolutionContactsList } from '@/components/sdr/EvolutionContactsList';
import { useSDRAgent } from '@/hooks/useSDRAgent';
import { 
  Bot, 
  Zap, 
  Settings, 
  TestTube2, 
  BarChart3, 
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  Users
} from 'lucide-react';

export default function AgenteSDR() {
  const {
    instance,
    config,
    isAgentActive,
    isConnected,
    isLoadingInstance,
    isLoadingConfig,
    toggleActive,
    isSaving,
  } = useSDRAgent();

  const [activeTab, setActiveTab] = useState('conexao');

  const isLoading = isLoadingInstance || isLoadingConfig;

  return (
    <ProtectedFeature permission="canAccessSDRAgent" featureName="Agente SDR">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 mt-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              Agente SDR
            </h1>
            <p className="text-muted-foreground">
              Configure seu assistente de vendas com inteligência artificial
            </p>
          </div>

          {/* Status e Controle */}
          <div className="flex flex-row items-center justify-between w-full sm:w-auto gap-4">
            {/* Status da Conexão */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">WhatsApp:</span>
              <SDRStatusBadge status={instance?.connection_status || 'disconnected'} />
            </div>

            {/* Toggle Ativo/Pausado */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2 sm:w-auto">
              <Label htmlFor="agent-active" className="flex items-center gap-2 cursor-pointer">
                {isAgentActive ? (
                  <>
                    <Play className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium hidden sm:inline">Ativo</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    <span className="text-sm font-medium hidden sm:inline">Pausado</span>
                  </>
                )}
              </Label>
              <Switch
                id="agent-active"
                checked={isAgentActive}
                onCheckedChange={(checked) => toggleActive(checked)}
                disabled={isSaving || !isConnected}
              />
            </div>
          </div>
        </div>

        {/* Alertas */}
        {!isConnected && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  WhatsApp não conectado
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Conecte seu WhatsApp na aba "Conexão" para começar a receber mensagens.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isConnected && !isAgentActive && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
            <CardContent className="flex items-center gap-3 py-4">
              <Pause className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Agente pausado
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  O agente não está respondendo mensagens. Ative-o quando estiver pronto.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isConnected && isAgentActive && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Agente ativo e funcionando
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Seu agente SDR está respondendo mensagens no WhatsApp automaticamente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="conexao" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Conexão</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configurar</span>
            </TabsTrigger>
            <TabsTrigger value="contatos" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Contatos</span>
            </TabsTrigger>
            <TabsTrigger value="playground" className="flex items-center gap-2">
              <TestTube2 className="h-4 w-4" />
              <span className="hidden sm:inline">Testar</span>
            </TabsTrigger>
            <TabsTrigger value="metricas" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Métricas</span>
            </TabsTrigger>
          </TabsList>

          {/* Conexão WhatsApp */}
          <TabsContent value="conexao" className="space-y-6">
            <SDRConnectionCard />
          </TabsContent>

          {/* Configuração do Agente */}
          <TabsContent value="config" className="space-y-6">
            {isLoadingConfig ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : (
              <SDRConfigForm />
            )}
          </TabsContent>

          {/* Contatos WhatsApp */}
          <TabsContent value="contatos" className="space-y-6">
            {!isConnected ? (
              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mb-4" />
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    WhatsApp não conectado
                  </h3>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 max-w-md">
                    Conecte seu WhatsApp na aba "Conexão" para visualizar os contatos sincronizados.
                  </p>
                </CardContent>
              </Card>
            ) : instance ? (
              <EvolutionContactsList
                instanceId={instance.id}
                instanceName={instance.instance_name}
                evolutionApiUrl={import.meta.env.VITE_EVOLUTION_API_URL || 'https://evolution-api.com'}
                evolutionApiKey={import.meta.env.VITE_EVOLUTION_API_KEY || ''}
                cacheTtlMinutes={60}
                onContactClick={(contact) => {
                  console.log('Contato selecionado:', contact);
                  // TODO: Abrir modal com detalhes do contato ou iniciar conversa
                }}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Playground de Testes */}
          <TabsContent value="playground" className="space-y-6">
            <SDRPlayground />
          </TabsContent>

          {/* Métricas */}
          <TabsContent value="metricas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métricas de Desempenho
                </CardTitle>
                <CardDescription>
                  Acompanhe o desempenho do seu agente SDR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {/* Cards de métricas placeholder */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Conversas Hoje</p>
                    <p className="text-3xl font-bold">--</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Leads Qualificados</p>
                    <p className="text-3xl font-bold">--</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Reuniões Agendadas</p>
                    <p className="text-3xl font-bold">--</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
                    <p className="text-3xl font-bold">--%</p>
                  </div>
                </div>

                <div className="mt-8 text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Métricas detalhadas estarão disponíveis após ativar o agente</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedFeature>
  );
}
