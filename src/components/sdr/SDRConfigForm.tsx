// =============================================================================
// Componente: SDRConfigForm
// Formulário de configuração do Agente SDR com tabs
// =============================================================================

import { useState, useEffect } from 'react';
import { Save, RotateCcw, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SliderWithTooltip } from './SliderWithTooltip';
import { TextareaWithCharacterLimit } from './TextareaWithCharacterLimit';
import { useSDRAgent } from '@/hooks/useSDRAgent';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AI_MODELS,
  SLIDER_CONFIGS,
  DEFAULT_CONFIG_JSON,
  type AgenteConfigJSON,
  type IAConfig,
} from '@/types/sdr';
import { cn } from '@/lib/utils';

export function SDRConfigForm() {
  const {
    config,
    configJson,
    isLoadingConfig,
    isSaving,
    isAgentActive,
    saveConfig,
    updateIAConfig,
    toggleActive,
  } = useSDRAgent();

  // Estado local para o formulário
  const [formData, setFormData] = useState<AgenteConfigJSON>(DEFAULT_CONFIG_JSON);
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializar com dados do banco
  useEffect(() => {
    if (configJson) {
      setFormData(configJson);
      setHasChanges(false);
    }
  }, [configJson]);

  // Atualizar campo genérico
  const updateField = <K extends keyof AgenteConfigJSON>(
    section: K,
    field: keyof AgenteConfigJSON[K],
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  // Salvar configuração
  const handleSave = () => {
    saveConfig(formData);
    setHasChanges(false);
  };

  // Resetar para padrão
  const handleReset = () => {
    setFormData(DEFAULT_CONFIG_JSON);
    setHasChanges(true);
  };

  if (isLoadingConfig) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>⚙️ Configuração do Agente</CardTitle>
            <CardDescription>
              Personalize como seu Agente SDR se comporta e responde
            </CardDescription>
          </div>

          {/* Toggle Ativo/Inativo */}
          <div className="flex items-center gap-3">
            <Label htmlFor="agent-active" className="text-sm">
              {isAgentActive ? (
                <span className="text-green-600 flex items-center gap-1">
                  <Power className="h-4 w-4" />
                  Ativo
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1">
                  <PowerOff className="h-4 w-4" />
                  Pausado
                </span>
              )}
            </Label>
            <Switch
              id="agent-active"
              checked={isAgentActive}
              onCheckedChange={toggleActive}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="identidade" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
            <TabsTrigger value="identidade">Identidade</TabsTrigger>
            <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
            <TabsTrigger value="ia">IA Config</TabsTrigger>
            <TabsTrigger value="comportamento">Comportamento</TabsTrigger>
            <TabsTrigger value="qualificacao">Qualificação</TabsTrigger>
            <TabsTrigger value="limitacoes">Limitações</TabsTrigger>
          </TabsList>

          {/* TAB: Identidade */}
          <TabsContent value="identidade" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome_agente">Nome do Agente</Label>
                <Input
                  id="nome_agente"
                  value={formData.identidade.nome_agente}
                  onChange={(e) =>
                    updateField('identidade', 'nome_agente', e.target.value)
                  }
                  placeholder="Ex: Maria, Assistente SDR"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_empresa">Nome da Empresa</Label>
                <Input
                  id="nome_empresa"
                  value={formData.identidade.nome_empresa}
                  onChange={(e) =>
                    updateField('identidade', 'nome_empresa', e.target.value)
                  }
                  placeholder="Ex: Minha Empresa LTDA"
                />
              </div>
            </div>

            <TextareaWithCharacterLimit
              value={formData.identidade.descricao_empresa}
              onChange={(value) =>
                updateField('identidade', 'descricao_empresa', value)
              }
              maxLength={500}
              label="Descrição da Empresa"
              placeholder="Descreva o que sua empresa faz, seus serviços e diferenciais..."
              rows={3}
            />

            <TextareaWithCharacterLimit
              value={formData.identidade.missao}
              onChange={(value) => updateField('identidade', 'missao', value)}
              maxLength={300}
              label="Missão do Agente"
              placeholder="O que o agente deve fazer? Ex: Criar conexão genuína, coletar informações e agendar reuniões..."
              rows={2}
            />
          </TabsContent>

          {/* TAB: Mensagens */}
          <TabsContent value="mensagens" className="space-y-6">
            <TextareaWithCharacterLimit
              value={formData.mensagens.saudacao || ''}
              onChange={(value) =>
                updateField('mensagens', 'saudacao', value || null)
              }
              maxLength={500}
              label="Mensagem de Saudação"
              placeholder="Olá! Como posso ajudar você hoje?"
              rows={2}
            />

            <TextareaWithCharacterLimit
              value={formData.mensagens.fallback}
              onChange={(value) => updateField('mensagens', 'fallback', value)}
              maxLength={300}
              label="Mensagem de Fallback"
              placeholder="Quando o agente não entender..."
              rows={2}
              required
            />

            <TextareaWithCharacterLimit
              value={formData.mensagens.encerramento || ''}
              onChange={(value) =>
                updateField('mensagens', 'encerramento', value || null)
              }
              maxLength={300}
              label="Mensagem de Encerramento"
              placeholder="Obrigado pelo contato! Até logo!"
              rows={2}
            />

            <TextareaWithCharacterLimit
              value={formData.mensagens.fora_horario || ''}
              onChange={(value) =>
                updateField('mensagens', 'fora_horario', value || null)
              }
              maxLength={300}
              label="Mensagem Fora do Horário"
              placeholder="Nosso horário de atendimento é das 09h às 18h..."
              rows={2}
            />
          </TabsContent>

          {/* TAB: IA Config (SLIDERS) */}
          <TabsContent value="ia" className="space-y-6">
            <div className="space-y-2">
              <Label>Modelo de IA</Label>
              <Select
                value={formData.ia_config.model}
                onValueChange={(value: IAConfig['model']) =>
                  updateField('ia_config', 'model', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex flex-col">
                        <span>{model.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg p-4 space-y-6 bg-muted/30">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Parâmetros Avançados
              </h4>

              <SliderWithTooltip
                value={formData.ia_config.temperature}
                onChange={(value) => updateField('ia_config', 'temperature', value)}
                min={SLIDER_CONFIGS.temperature.min}
                max={SLIDER_CONFIGS.temperature.max}
                step={SLIDER_CONFIGS.temperature.step}
                label={SLIDER_CONFIGS.temperature.label}
                description={SLIDER_CONFIGS.temperature.description}
              />

              <SliderWithTooltip
                value={formData.ia_config.top_p}
                onChange={(value) => updateField('ia_config', 'top_p', value)}
                min={SLIDER_CONFIGS.top_p.min}
                max={SLIDER_CONFIGS.top_p.max}
                step={SLIDER_CONFIGS.top_p.step}
                label={SLIDER_CONFIGS.top_p.label}
                description={SLIDER_CONFIGS.top_p.description}
              />

              <SliderWithTooltip
                value={formData.ia_config.frequency_penalty}
                onChange={(value) =>
                  updateField('ia_config', 'frequency_penalty', value)
                }
                min={SLIDER_CONFIGS.frequency_penalty.min}
                max={SLIDER_CONFIGS.frequency_penalty.max}
                step={SLIDER_CONFIGS.frequency_penalty.step}
                label={SLIDER_CONFIGS.frequency_penalty.label}
                description={SLIDER_CONFIGS.frequency_penalty.description}
              />

              <SliderWithTooltip
                value={formData.ia_config.presence_penalty}
                onChange={(value) =>
                  updateField('ia_config', 'presence_penalty', value)
                }
                min={SLIDER_CONFIGS.presence_penalty.min}
                max={SLIDER_CONFIGS.presence_penalty.max}
                step={SLIDER_CONFIGS.presence_penalty.step}
                label={SLIDER_CONFIGS.presence_penalty.label}
                description={SLIDER_CONFIGS.presence_penalty.description}
              />

              <SliderWithTooltip
                value={formData.ia_config.max_tokens}
                onChange={(value) => updateField('ia_config', 'max_tokens', value)}
                min={SLIDER_CONFIGS.max_tokens.min}
                max={SLIDER_CONFIGS.max_tokens.max}
                step={SLIDER_CONFIGS.max_tokens.step}
                label={SLIDER_CONFIGS.max_tokens.label}
                description={SLIDER_CONFIGS.max_tokens.description}
                formatValue={(v) => v.toString()}
              />
            </div>
          </TabsContent>

          {/* TAB: Comportamento */}
          <TabsContent value="comportamento" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="horario_inicio">Horário de Início</Label>
                <Input
                  id="horario_inicio"
                  type="time"
                  value={formData.comportamento.horario_atendimento.inicio}
                  onChange={(e) =>
                    updateField('comportamento', 'horario_atendimento', {
                      ...formData.comportamento.horario_atendimento,
                      inicio: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario_fim">Horário de Fim</Label>
                <Input
                  id="horario_fim"
                  type="time"
                  value={formData.comportamento.horario_atendimento.fim}
                  onChange={(e) =>
                    updateField('comportamento', 'horario_atendimento', {
                      ...formData.comportamento.horario_atendimento,
                      fim: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Agendamento Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que o agente agende reuniões automaticamente
                </p>
              </div>
              <Switch
                checked={formData.comportamento.agendamento_automatico}
                onCheckedChange={(checked) =>
                  updateField('comportamento', 'agendamento_automatico', checked)
                }
              />
            </div>

            {formData.comportamento.agendamento_automatico && (
              <div className="space-y-2">
                <Label htmlFor="calendario_link">Link do Calendário</Label>
                <Input
                  id="calendario_link"
                  type="url"
                  value={formData.comportamento.link_calendario || ''}
                  onChange={(e) =>
                    updateField('comportamento', 'link_calendario', e.target.value || null)
                  }
                  placeholder="https://calendly.com/seu-link"
                />
              </div>
            )}

            {/* Reações */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Usar Reações no WhatsApp</Label>
                <p className="text-sm text-muted-foreground">
                  Reagir mensagens com emojis para criar proximidade
                </p>
              </div>
              <Switch
                checked={formData.conducao.usar_reacoes}
                onCheckedChange={(checked) =>
                  updateField('conducao', 'usar_reacoes', checked)
                }
              />
            </div>

            {formData.conducao.usar_reacoes && (
              <SliderWithTooltip
                value={formData.conducao.frequencia_reacoes}
                onChange={(value) =>
                  updateField('conducao', 'frequencia_reacoes', value)
                }
                min={1}
                max={10}
                step={1}
                label="Frequência de Reações"
                description="A cada quantas mensagens reagir"
                formatValue={(v) => `A cada ${v} mensagens`}
              />
            )}
          </TabsContent>

          {/* TAB: Qualificação */}
          <TabsContent value="qualificacao" className="space-y-6">
            <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
              <p>
                Configure os requisitos mínimos e perguntas de mapeamento para qualificar leads.
              </p>
              <p className="mt-2 text-xs">
                💡 Esta funcionalidade será expandida em uma próxima versão.
              </p>
            </div>
          </TabsContent>

          {/* TAB: Limitações */}
          <TabsContent value="limitacoes" className="space-y-6">
            <div className="space-y-2">
              <Label>Limitações do Agente</Label>
              <p className="text-sm text-muted-foreground">
                O que o agente NÃO deve fazer
              </p>
            </div>

            <div className="space-y-2">
              {formData.limitacoes.map((limitacao, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                >
                  <span className="text-sm flex-1">{limitacao}</span>
                </div>
              ))}
            </div>

            <TextareaWithCharacterLimit
              value=""
              onChange={() => {}}
              maxLength={200}
              label="Adicionar Nova Limitação"
              placeholder="Ex: Não fornecer informações de preços sem consultar..."
              rows={2}
            />
          </TabsContent>
        </Tabs>

        {/* Botões de ação */}
        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={cn(!hasChanges && 'opacity-50')}
          >
            {isSaving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-pulse" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
