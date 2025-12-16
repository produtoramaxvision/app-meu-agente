import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { Plus, X, Loader2 } from 'lucide-react';
import { CreateFieldDefinitionInput, CustomFieldDefinition, FieldType } from '@/hooks/useCustomFields';

interface CreateFieldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateFieldDefinitionInput) => Promise<void>;
  editingField?: CustomFieldDefinition | null;
}

export function CreateFieldDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  editingField
}: CreateFieldDialogProps) {
  const [fieldKey, setFieldKey] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<FieldType>('text');
  const [required, setRequired] = useState(false);
  const [showInCard, setShowInCard] = useState(false);
  const [showInList, setShowInList] = useState(true);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form quando abrir/fechar ou mudar editingField
  useEffect(() => {
    if (open) {
      if (editingField) {
        // Modo edição - preencher com dados existentes
        setFieldKey(editingField.field_key);
        setFieldLabel(editingField.field_label);
        setFieldType(editingField.field_type);
        setRequired(editingField.required);
        setShowInCard(editingField.show_in_card);
        setShowInList(editingField.show_in_list);
        setOptions(editingField.options || []);
      } else {
        // Modo criação - limpar form
        setFieldKey('');
        setFieldLabel('');
        setFieldType('text');
        setRequired(false);
        setShowInCard(false);
        setShowInList(true);
        setOptions([]);
      }
      setNewOption('');
    }
  }, [open, editingField]);

  // Gerar field_key automaticamente a partir do field_label
  const handleLabelChange = (label: string) => {
    setFieldLabel(label);
    
    // Apenas gerar automaticamente se estiver criando (não editando)
    if (!editingField) {
      // Converter para snake_case
      const key = label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
        .trim()
        .replace(/\s+/g, '_'); // Substitui espaços por underscore
      
      setFieldKey(key);
    }
  };

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (option: string) => {
    setOptions(options.filter((o) => o !== option));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fieldLabel.trim() || !fieldKey.trim()) return;
    
    // Validar opções para select/multiselect
    if ((fieldType === 'select' || fieldType === 'multiselect') && options.length === 0) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        field_key: fieldKey,
        field_label: fieldLabel,
        field_type: fieldType,
        required,
        show_in_card: showInCard,
        show_in_list: showInList,
        options: (fieldType === 'select' || fieldType === 'multiselect') ? options : undefined,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsOptions = fieldType === 'select' || fieldType === 'multiselect';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingField ? 'Editar Campo' : 'Novo Campo Personalizado'}
          </DialogTitle>
          <DialogDescription>
            {editingField 
              ? 'Atualize as informações do campo personalizado'
              : 'Crie um campo extra para qualificar seus leads'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Nome do Campo */}
          <div className="space-y-2">
            <Label htmlFor="field_label">
              Nome do Campo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="field_label"
              value={fieldLabel}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="Ex: Número de Funcionários"
              required
            />
          </div>

          {/* Chave do Campo (field_key) */}
          <div className="space-y-2">
            <Label htmlFor="field_key">
              Chave do Campo <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-2">
                (usado internamente - snake_case)
              </span>
            </Label>
            <Input
              id="field_key"
              value={fieldKey}
              onChange={(e) => setFieldKey(e.target.value)}
              placeholder="Ex: num_funcionarios"
              required
              disabled={!!editingField} // Não permitir editar key
              className="font-mono text-sm"
            />
            {fieldKey && !/^[a-z][a-z0-9_]*$/.test(fieldKey) && (
              <p className="text-xs text-destructive">
                Use apenas letras minúsculas, números e underscore, começando com letra
              </p>
            )}
          </div>

          {/* Tipo do Campo */}
          <div className="space-y-2">
            <Label htmlFor="field_type">
              Tipo do Campo <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={fieldType} 
              onValueChange={(value) => setFieldType(value as FieldType)}
              disabled={!!editingField} // Não permitir mudar tipo ao editar
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">📝 Texto</SelectItem>
                <SelectItem value="number">🔢 Número</SelectItem>
                <SelectItem value="boolean">✅ Sim/Não</SelectItem>
                <SelectItem value="date">📅 Data</SelectItem>
                <SelectItem value="select">📋 Lista (única escolha)</SelectItem>
                <SelectItem value="multiselect">☑️ Multi-seleção</SelectItem>
                <SelectItem value="currency">💰 Moeda (R$)</SelectItem>
                <SelectItem value="url">🔗 URL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opções (apenas para select/multiselect) */}
          {needsOptions && (
            <div className="space-y-2">
              <Label>
                Opções <span className="text-destructive">*</span>
              </Label>
              
              {/* Opções já adicionadas */}
              {options.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {options.map((option) => (
                    <Badge key={option} variant="secondary" className="gap-1">
                      {option}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleRemoveOption(option)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Input para adicionar nova opção */}
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                  placeholder="Digite uma opção"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={handleAddOption}
                  disabled={!newOption.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {options.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Adicione pelo menos uma opção
                </p>
              )}
            </div>
          )}

          {/* Configurações */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Campo obrigatório</Label>
                <p className="text-xs text-muted-foreground">
                  Exigir preenchimento deste campo
                </p>
              </div>
              <Switch checked={required} onCheckedChange={setRequired} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Exibir no card do Kanban</Label>
                <p className="text-xs text-muted-foreground">
                  Mostra campo nos cards do pipeline
                </p>
              </div>
              <Switch checked={showInCard} onCheckedChange={setShowInCard} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Exibir na lista</Label>
                <p className="text-xs text-muted-foreground">
                  Mostra campo na visualização em lista
                </p>
              </div>
              <Switch checked={showInList} onCheckedChange={setShowInList} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !fieldLabel || !fieldKey || (needsOptions && options.length === 0)}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                editingField ? 'Atualizar' : 'Criar Campo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
