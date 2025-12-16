// =============================================================================
// Componente: SDRConfigForm
// Formulário de configuração do Agente SDR com tabs
// =============================================================================

import { useState, useEffect } from 'react';
import { Save, RotateCcw, GripVertical, Trash2, Plus, User, MessageSquare, Brain, CheckSquare, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AnimatedSlider } from './AnimatedSlider';
import { TextareaWithCharacterLimit } from './TextareaWithCharacterLimit';
import { useSDRAgent } from '@/hooks/useSDRAgent';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SLIDER_CONFIGS,
  DEFAULT_CONFIG_JSON,
  type AgenteConfigJSON,
} from '@/types/sdr';
import { cn } from '@/lib/utils';

export function SDRConfigForm() {
  const {
    config,
    configJson,
    isLoadingConfig,
    isSaving,
    saveConfig,
    updateIAConfig,
  } = useSDRAgent();

  // Estado local para o formulário
  const [formData, setFormData] = useState<AgenteConfigJSON>(DEFAULT_CONFIG_JSON);
  const [hasChanges, setHasChanges] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedSaudacaoIndex, setDraggedSaudacaoIndex] = useState<number | null>(null);
  const [draggedObjecaoIndex, setDraggedObjecaoIndex] = useState<number | null>(null);

  // Inicializar com dados do banco
  useEffect(() => {
    if (configJson) {
      // Migração: Se tem saudacao mas não tem modelos, converter
      let apresentacaoModelos = configJson.apresentacao?.modelos || [];
      if (apresentacaoModelos.length === 0 && configJson.mensagens?.saudacao) {
        // Dividir saudação por linhas vazias ou números no início
        const saudacaoTexto = configJson.mensagens.saudacao;
        const exemplos = saudacaoTexto
          .split(/\n\n+|\n(?=\d+\s*-\s*)/)
          .map(s => s.trim().replace(/^\d+\s*-\s*/, '').replace(/^["']|["']$/g, ''))
          .filter(s => s.length > 0);
        
        apresentacaoModelos = exemplos.map((texto, idx) => ({
          id: `saudacao_${Date.now()}_${idx}`,
          texto,
          ativo: true,
        }));
      }
      
      // Garantir estrutura mínima
      if (apresentacaoModelos.length === 0) {
        apresentacaoModelos = [{ id: `saudacao_${Date.now()}`, texto: '', ativo: true }];
      }

      const mergedConfig = {
        ...DEFAULT_CONFIG_JSON,
        ...configJson,
        qualificacao: {
          requisitos: configJson.qualificacao?.requisitos || DEFAULT_CONFIG_JSON.qualificacao.requisitos,
        },
        apresentacao: {
          modelos: apresentacaoModelos,
        },
      };
      setFormData(mergedConfig);
      setHasChanges(false);
    }
  }, [configJson]);

  // Handlers para drag & drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newRequisitos = [...formData.qualificacao.requisitos];
    const draggedItem = newRequisitos[draggedIndex];
    
    newRequisitos.splice(draggedIndex, 1);
    newRequisitos.splice(index, 0, draggedItem);

    setFormData((prev) => ({
      ...prev,
      qualificacao: {
        requisitos: newRequisitos,
      },
    }));
    setDraggedIndex(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleAddRequisito = () => {
    const newRequisitos = [...formData.qualificacao.requisitos, ''];
    updateField('qualificacao', 'requisitos', newRequisitos);
  };

  const handleRemoveRequisito = (index: number) => {
    const newRequisitos = formData.qualificacao.requisitos.filter((_, i) => i !== index);
    updateField('qualificacao', 'requisitos', newRequisitos);
  };

  const handleUpdateRequisito = (index: number, value: string) => {
    const newRequisitos = [...formData.qualificacao.requisitos];
    newRequisitos[index] = value;
    updateField('qualificacao', 'requisitos', newRequisitos);
  };

  // Handlers para drag & drop de saudações
  const handleDragStartSaudacao = (index: number) => {
    setDraggedSaudacaoIndex(index);
  };

  const handleDragOverSaudacao = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSaudacaoIndex === null || draggedSaudacaoIndex === index) return;

    const newModelos = [...formData.apresentacao.modelos];
    const draggedItem = newModelos[draggedSaudacaoIndex];
    
    newModelos.splice(draggedSaudacaoIndex, 1);
    newModelos.splice(index, 0, draggedItem);

    setFormData((prev) => ({
      ...prev,
      apresentacao: {
        modelos: newModelos,
      },
    }));
    setDraggedSaudacaoIndex(index);
    setHasChanges(true);
  };

  const handleDragEndSaudacao = () => {
    setDraggedSaudacaoIndex(null);
  };

  const handleAddSaudacao = () => {
    const newId = `saudacao_${Date.now()}`;
    const newModelos = [...formData.apresentacao.modelos, { id: newId, texto: '', ativo: true }];
    updateField('apresentacao', 'modelos', newModelos);
  };

  const handleRemoveSaudacao = (index: number) => {
    const newModelos = formData.apresentacao.modelos.filter((_, i) => i !== index);
    updateField('apresentacao', 'modelos', newModelos);
  };

  const handleUpdateSaudacao = (index: number, value: string) => {
    const newModelos = [...formData.apresentacao.modelos];
    newModelos[index] = { ...newModelos[index], texto: value };
    updateField('apresentacao', 'modelos', newModelos);
  };

  // Handlers para drag & drop de objeções
  const handleDragStartObjecao = (index: number) => {
    setDraggedObjecaoIndex(index);
  };

  const handleDragOverObjecao = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedObjecaoIndex === null || draggedObjecaoIndex === index) return;

    const newTecnicas = [...formData.objecoes.tecnicas];
    const draggedItem = newTecnicas[draggedObjecaoIndex];
    
    newTecnicas.splice(draggedObjecaoIndex, 1);
    newTecnicas.splice(index, 0, draggedItem);

    setFormData((prev) => ({
      ...prev,
      objecoes: {
        tecnicas: newTecnicas,
      },
    }));
    setDraggedObjecaoIndex(index);
    setHasChanges(true);
  };

  const handleDragEndObjecao = () => {
    setDraggedObjecaoIndex(null);
  };

  const handleAddObjecao = () => {
    const newId = `objecao_${Date.now()}`;
    const newTecnicas = [...formData.objecoes.tecnicas, { id: newId, tecnica: '', exemplo: '' }];
    updateField('objecoes', 'tecnicas', newTecnicas);
  };

  const handleRemoveObjecao = (index: number) => {
    const newTecnicas = formData.objecoes.tecnicas.filter((_, i) => i !== index);
    updateField('objecoes', 'tecnicas', newTecnicas);
  };

  const handleUpdateObjecao = (index: number, field: 'tecnica' | 'exemplo', value: string) => {
    const newTecnicas = [...formData.objecoes.tecnicas];
    newTecnicas[index] = { ...newTecnicas[index], [field]: value };
    updateField('objecoes', 'tecnicas', newTecnicas);
  };

  // Atualizar campo genérico
  const updateField = <K extends keyof AgenteConfigJSON>(
    section: K,
    field: keyof AgenteConfigJSON[K],
    value: AgenteConfigJSON[K][keyof AgenteConfigJSON[K]]
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
    // Força o modelo a null (controle interno via N8N)
    const payload = {
      ...formData,
      ia_config: {
        ...formData.ia_config,
        model: null,
      },
    };
    saveConfig(payload);
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
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="identidade" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6 h-auto">
            <TabsTrigger value="identidade" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Identidade</span>
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Mensagens</span>
            </TabsTrigger>
            <TabsTrigger value="ia" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">IA Config</span>
            </TabsTrigger>
            <TabsTrigger value="objecoes" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Objeções</span>
            </TabsTrigger>
            <TabsTrigger value="qualificacao" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Qualificação</span>
            </TabsTrigger>
            <TabsTrigger value="limitacoes" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Limitações</span>
            </TabsTrigger>
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  💬 Exemplos de Mensagens de Saudação
                </Label>
                <p className="text-sm text-muted-foreground">
                  Adicione diferentes formas de se apresentar ao lead. Arraste para reordenar.
                </p>
              </div>

              <div className="space-y-2">
                {formData.apresentacao.modelos.map((modelo, index) => (
                  <div
                    key={modelo.id}
                    draggable
                    onDragStart={() => handleDragStartSaudacao(index)}
                    onDragOver={(e) => handleDragOverSaudacao(e, index)}
                    onDragEnd={handleDragEndSaudacao}
                    className={cn(
                      'flex items-center gap-3 p-3 border rounded-lg bg-card transition-all',
                      'hover:border-primary/50 hover:shadow-sm cursor-move',
                      draggedSaudacaoIndex === index && 'opacity-50 scale-95'
                    )}
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing flex-shrink-0" />
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <Input
                      value={modelo.texto}
                      onChange={(e) => handleUpdateSaudacao(index, e.target.value)}
                      placeholder={`Exemplo ${index + 1}`}
                      className="text-sm flex-1"
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSaudacao(index)}
                      className="flex-shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
                      disabled={formData.apresentacao.modelos.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSaudacao}
                className="w-full"
              >
                + Adicionar Exemplo de Saudação
              </Button>
            </div>

            <TextareaWithCharacterLimit
              value={formData.mensagens.fallback}
              onChange={(value) => updateField('mensagens', 'fallback', value)}
              maxLength={300}
              label="Mensagem de Fallback"
              placeholder="Quando o agente não entender..."
              rows={2}
              required
            />
          </TabsContent>

          {/* TAB: IA Config (SLIDERS) */}
          <TabsContent value="ia" className="space-y-6">
            <div className="border rounded-lg p-4 space-y-6 bg-muted/30">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Parâmetros Avançados
              </h4>

              <AnimatedSlider
                value={formData.ia_config.temperature}
                onChange={(value) => updateField('ia_config', 'temperature', value)}
                min={SLIDER_CONFIGS.temperature.min}
                max={SLIDER_CONFIGS.temperature.max}
                step={SLIDER_CONFIGS.temperature.step}
                label={SLIDER_CONFIGS.temperature.label}
                description={SLIDER_CONFIGS.temperature.description}
                disabled={isSaving}
              />

              <AnimatedSlider
                value={formData.ia_config.top_p}
                onChange={(value) => updateField('ia_config', 'top_p', value)}
                min={SLIDER_CONFIGS.top_p.min}
                max={SLIDER_CONFIGS.top_p.max}
                step={SLIDER_CONFIGS.top_p.step}
                label={SLIDER_CONFIGS.top_p.label}
                description={SLIDER_CONFIGS.top_p.description}
                disabled={isSaving}
              />

              <AnimatedSlider
                value={formData.ia_config.frequency_penalty}
                onChange={(value) =>
                  updateField('ia_config', 'frequency_penalty', value)
                }
                min={SLIDER_CONFIGS.frequency_penalty.min}
                max={SLIDER_CONFIGS.frequency_penalty.max}
                step={SLIDER_CONFIGS.frequency_penalty.step}
                label={SLIDER_CONFIGS.frequency_penalty.label}
                description={SLIDER_CONFIGS.frequency_penalty.description}
                disabled={isSaving}
              />

              <AnimatedSlider
                value={formData.ia_config.presence_penalty}
                onChange={(value) =>
                  updateField('ia_config', 'presence_penalty', value)
                }
                min={SLIDER_CONFIGS.presence_penalty.min}
                max={SLIDER_CONFIGS.presence_penalty.max}
                step={SLIDER_CONFIGS.presence_penalty.step}
                label={SLIDER_CONFIGS.presence_penalty.label}
                description={SLIDER_CONFIGS.presence_penalty.description}
                disabled={isSaving}
              />

              <AnimatedSlider
                value={formData.ia_config.max_tokens}
                onChange={(value) => updateField('ia_config', 'max_tokens', value)}
                min={SLIDER_CONFIGS.max_tokens.min}
                max={SLIDER_CONFIGS.max_tokens.max}
                step={SLIDER_CONFIGS.max_tokens.step}
                label={SLIDER_CONFIGS.max_tokens.label}
                description={SLIDER_CONFIGS.max_tokens.description}
                formatValue={(v) => v.toString()}
                disabled={isSaving}
              />
            </div>
          </TabsContent>

          {/* TAB: Objeções */}
          <TabsContent value="objecoes" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  🛡️ Técnicas de Contorno de Objeções
                </Label>
                <p className="text-sm text-muted-foreground">
                  Defina como o agente deve responder a objeções comuns dos clientes.
                  Arraste para reordenar.
                </p>
              </div>

              <div className="space-y-2">
                {formData.objecoes.tecnicas.map((tecnica, index) => (
                  <div
                    key={tecnica.id}
                    draggable
                    onDragStart={() => handleDragStartObjecao(index)}
                    onDragOver={handleDragOverObjecao}
                    onDrop={() => handleDragEndObjecao(index)}
                    className="flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-move"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="shrink-0">
                      {index + 1}
                    </Badge>
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Objeção (ex: Está muito caro)"
                        value={tecnica.tecnica}
                        onChange={(e) =>
                          handleUpdateObjecao(index, 'tecnica', e.target.value)
                        }
                        className="w-full"
                        disabled={isSaving}
                      />
                      <Input
                        placeholder="Exemplo de resposta (opcional)"
                        value={tecnica.exemplo || ''}
                        onChange={(e) =>
                          handleUpdateObjecao(index, 'exemplo', e.target.value)
                        }
                        className="w-full"
                        disabled={isSaving}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveObjecao(index)}
                      disabled={isSaving}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddObjecao}
                className="w-full"
                disabled={isSaving}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Técnica
              </Button>
            </div>
          </TabsContent>

          {/* TAB: Qualificação */}
          <TabsContent value="qualificacao" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  ✅ Requisitos de Qualificação
                </Label>
                <p className="text-sm text-muted-foreground">
                  Defina as perguntas que o agente deve fazer para qualificar o lead. 
                  Arraste para reordenar.
                </p>
              </div>

              <div className="space-y-2">
                {formData.qualificacao.requisitos.map((requisito, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-3 p-3 border rounded-lg bg-card transition-all',
                      'hover:border-primary/50 hover:shadow-sm cursor-move',
                      draggedIndex === index && 'opacity-50 scale-95'
                    )}
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing flex-shrink-0" />
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <Input
                      value={requisito}
                      onChange={(e) => handleUpdateRequisito(index, e.target.value)}
                      placeholder={`Requisito ${index + 1}`}
                      className="text-sm flex-1"
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveRequisito(index)}
                      className="flex-shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive"
                      disabled={formData.qualificacao.requisitos.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRequisito}
                className="w-full"
              >
                + Adicionar Requisito
              </Button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                💡 Como Funciona
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>
                  <strong>Requisitos de Qualificação:</strong> Lista de perguntas que o agente fará para coletar informações do lead
                </li>
                <li>
                  <strong>Ordem das Perguntas:</strong> Clique e arraste o ícone de grade para reordenar as perguntas
                </li>
                <li>
                  Os dados coletados serão salvos no CRM e usados para qualificar o lead automaticamente
                </li>
              </ul>
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
        <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-6 pt-6 border-t gap-3 w-full">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            disabled={!hasChanges}
            className="w-full sm:w-auto overflow-hidden"
          >
            <RotateCcw className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Restaurar Padrões</span>
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={cn('w-full sm:w-auto overflow-hidden', !hasChanges && 'opacity-50')}
          >
            {isSaving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-pulse flex-shrink-0" />
                <span className="truncate">Salvando...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">Salvar Configurações</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
