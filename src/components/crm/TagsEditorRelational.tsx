/**
 * TagsEditorRelational
 * 
 * Editor de tags para leads do CRM usando modelo relacional.
 * Substituição do TagsEditor original que usava arrays.
 * 
 * Features:
 * - ColorPicker para seleção de cores de tags
 * - Autocomplete de tags existentes do usuário
 * - Criar novas tags com cor customizada
 * - Otimistic updates para UX fluida
 * - Limite de 10 tags por lead
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { X, Check, Plus, Tag, Loader2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCrmTags, useLeadTagsRelational } from '@/hooks/useCrmTags';
import { TAG_COLOR_PALETTE, getContrastingTextColor } from '@/types/crm';
import type { CrmTag, LeadTagAssociation } from '@/types/crm';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_TAGS_PER_LEAD = 10;

// ============================================================================
// TYPES
// ============================================================================

interface TagsEditorRelationalProps {
  /** UUID do lead (evolution_contacts.id) */
  leadId: string;
  /** UUID da instância (para contexto) */
  instanceId?: string;
  /** Desabilitar edição */
  disabled?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Color picker mini para seleção de cor da tag
 * Filtra cores já em uso para evitar duplicatas
 */
function ColorPickerMini({
  value,
  onChange,
  usedColors = [],
}: {
  value: string;
  onChange: (color: string) => void;
  usedColors?: string[];
}) {
  const [open, setOpen] = useState(false);
  const usedColorsSet = useMemo(() => new Set(usedColors), [usedColors]);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-1 rounded hover:bg-muted transition-colors"
          aria-label="Escolher cor"
        >
          <div 
            className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
            style={{ backgroundColor: value }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start" side="bottom">
        <div className="grid grid-cols-5 gap-1.5">
          {TAG_COLOR_PALETTE.map((color) => {
            const isUsed = usedColorsSet.has(color);
            const isSelected = value === color;
            
            return (
              <button
                key={color}
                type="button"
                onClick={() => {
                  if (!isUsed || isSelected) {
                    onChange(color);
                    setOpen(false);
                  }
                }}
                disabled={isUsed && !isSelected}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-all relative',
                  isSelected && 'border-primary scale-110',
                  !isSelected && !isUsed && 'border-transparent hover:border-muted-foreground/50',
                  isUsed && !isSelected && 'opacity-30 cursor-not-allowed'
                )}
                style={{ backgroundColor: color }}
                aria-label={`Cor ${color}${isUsed && !isSelected ? ' (em uso)' : ''}`}
                title={isUsed && !isSelected ? 'Cor já em uso por outra tag' : undefined}
              >
                {isUsed && !isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <X className="h-3 w-3 text-white drop-shadow" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Badge de tag com cor customizada
 */
function TagBadge({
  tag,
  onRemove,
  disabled,
  isRemoving,
}: {
  tag: LeadTagAssociation;
  onRemove?: () => void;
  disabled?: boolean;
  isRemoving?: boolean;
}) {
  const textColor = getContrastingTextColor(tag.tag_color);
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border transition-colors',
        disabled && 'opacity-60',
        isRemoving && 'opacity-50'
      )}
      style={{ 
        backgroundColor: `${tag.tag_color}20`,
        borderColor: `${tag.tag_color}40`,
        color: tag.tag_color,
      }}
    >
      <Tag className="h-3 w-3" />
      {tag.tag_name}
      {onRemove && !disabled && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          className={cn(
            'ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/20 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/50',
            isRemoving && 'cursor-not-allowed opacity-50'
          )}
          aria-label={`Remover tag ${tag.tag_name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Editor de tags para leads usando modelo relacional.
 * 
 * @example
 * ```tsx
 * <TagsEditorRelational
 *   leadId={contact.id}
 *   instanceId={instance?.id}
 * />
 * ```
 */
export function TagsEditorRelational({
  leadId,
  instanceId,
  disabled = false,
  className,
}: TagsEditorRelationalProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // Hooks de dados
  const { tags: allUserTags, isLoading: isLoadingAllTags } = useCrmTags();
  const { 
    tags: leadTags, 
    isLoading: isLoadingLeadTags, 
    addTag, 
    removeTag, 
    addNewTag,
    isPending,
  } = useLeadTagsRelational(leadId);

  // Cores já em uso por tags do usuário (para evitar duplicatas)
  const usedColors = useMemo(() => 
    allUserTags.map(t => t.tag_color),
    [allUserTags]
  );

  // Primeira cor disponível (não usada)
  const firstAvailableColor = useMemo(() => {
    const usedSet = new Set(usedColors);
    return TAG_COLOR_PALETTE.find(c => !usedSet.has(c)) || TAG_COLOR_PALETTE[0];
  }, [usedColors]);

  const [newTagColor, setNewTagColor] = useState<string>(firstAvailableColor);

  // Atualizar cor padrão quando as cores usadas mudarem
  useMemo(() => {
    setNewTagColor(firstAvailableColor);
  }, [firstAvailableColor]);

  // Tags não associadas ao lead (sugestões)
  const suggestedTags = useMemo(() => {
    const leadTagIds = new Set(leadTags.map(t => t.tag_id));
    return allUserTags
      .filter(tag => 
        !leadTagIds.has(tag.id) &&
        tag.tag_name.toLowerCase().includes(inputValue.toLowerCase())
      )
      .slice(0, 8);
  }, [allUserTags, leadTags, inputValue]);

  // Verificações
  const hasReachedMax = leadTags.length >= MAX_TAGS_PER_LEAD;
  const isLoading = isLoadingAllTags || isLoadingLeadTags;
  
  // Verificar se a tag digitada é nova
  const isNewTag = useMemo(() => {
    const trimmed = inputValue.trim().toLowerCase();
    if (!trimmed) return false;
    return !allUserTags.some(tag => tag.tag_name.toLowerCase() === trimmed);
  }, [inputValue, allUserTags]);

  // Adicionar tag existente
  const handleAddExistingTag = useCallback(async (tag: CrmTag) => {
    if (hasReachedMax) return;
    
    try {
      await addTag(tag.id);
      setInputValue('');
      setOpen(false);
    } catch (error) {
      console.error('Erro ao adicionar tag:', error);
    }
  }, [addTag, hasReachedMax]);

  // Criar e adicionar nova tag
  const handleAddNewTag = useCallback(async () => {
    const name = inputValue.trim();
    if (!name || hasReachedMax) return;
    
    try {
      await addNewTag({ name, color: newTagColor });
      setInputValue('');
      setNewTagColor(firstAvailableColor);
      setOpen(false);
    } catch (error) {
      console.error('Erro ao criar tag:', error);
    }
  }, [inputValue, newTagColor, addNewTag, hasReachedMax, firstAvailableColor]);

  // Remover tag do lead
  const handleRemoveTag = useCallback(async (tagId: string) => {
    try {
      await removeTag(tagId);
    } catch (error) {
      console.error('Erro ao remover tag:', error);
    }
  }, [removeTag]);

  // Handler para Enter no input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (isNewTag) {
        handleAddNewTag();
      }
    }
  }, [inputValue, isNewTag, handleAddNewTag]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Tags do lead */}
      <div className="flex flex-wrap gap-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Carregando tags...</span>
          </div>
        ) : leadTags.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Nenhuma tag adicionada
          </p>
        ) : (
          leadTags.map((tag) => (
            <TagBadge
              key={tag.tag_id}
              tag={tag}
              onRemove={() => handleRemoveTag(tag.tag_id)}
              disabled={disabled}
              isRemoving={isPending}
            />
          ))
        )}
      </div>

      {/* Popover para adicionar tags */}
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={hasReachedMax || isPending}
              className={cn(
                'w-full sm:w-auto gap-2 justify-start font-normal',
                hasReachedMax && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {hasReachedMax 
                ? `Máximo de ${MAX_TAGS_PER_LEAD} tags` 
                : 'Adicionar tag'
              }
            </Button>
          </PopoverTrigger>
          
          <PopoverContent 
            className="w-[280px] sm:w-[320px] p-0" 
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Digite ou selecione uma tag..."
                value={inputValue}
                onValueChange={setInputValue}
                onKeyDown={handleKeyDown}
              />
              <CommandList>
                {isLoadingAllTags ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Criar nova tag */}
                    {isNewTag && (
                      <CommandGroup heading="Criar nova tag">
                        <CommandItem
                          value={`create-${inputValue.trim()}`}
                          onSelect={handleAddNewTag}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4 text-primary" />
                          <span>Criar</span>
                          <span 
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                            style={{ 
                              backgroundColor: `${newTagColor}20`,
                              borderColor: `${newTagColor}40`,
                              color: newTagColor,
                            }}
                          >
                            {inputValue.trim()}
                          </span>
                          <div className="ml-auto">
                            <ColorPickerMini 
                              value={newTagColor} 
                              onChange={setNewTagColor}
                              usedColors={usedColors}
                            />
                          </div>
                        </CommandItem>
                      </CommandGroup>
                    )}

                    {/* Sugestões de tags existentes */}
                    {suggestedTags.length > 0 && (
                      <CommandGroup heading="Tags disponíveis">
                        {suggestedTags.map((tag) => (
                          <CommandItem
                            key={tag.id}
                            value={tag.id}
                            onSelect={() => handleAddExistingTag(tag)}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4 opacity-0" />
                            <span 
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border"
                              style={{ 
                                backgroundColor: `${tag.tag_color}20`,
                                borderColor: `${tag.tag_color}40`,
                                color: tag.tag_color,
                              }}
                            >
                              {tag.tag_name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {/* Empty state */}
                    {suggestedTags.length === 0 && !isNewTag && (
                      <CommandEmpty>
                        {inputValue 
                          ? 'Pressione Enter para criar nova tag'
                          : 'Digite para buscar ou criar uma tag'
                        }
                      </CommandEmpty>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Contador de tags */}
      <p className="text-xs text-muted-foreground">
        {leadTags.length}/{MAX_TAGS_PER_LEAD} tags
      </p>
    </div>
  );
}

/**
 * Componente wrapper para retrocompatibilidade.
 * Permite usar o novo TagsEditorRelational onde antes usava TagsEditor com string[].
 * 
 * @deprecated Use TagsEditorRelational diretamente com leadId
 */
export function TagsEditorCompat({
  leadId,
  tags: _legacyTags, // Ignorado - agora vem do banco relacional
  onTagsChange: _legacyOnTagsChange, // Ignorado - hooks fazem a mutação
  instanceId,
  disabled,
  className,
}: {
  leadId: string;
  tags?: string[];
  onTagsChange?: (tags: string[]) => Promise<void>;
  instanceId?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <TagsEditorRelational
      leadId={leadId}
      instanceId={instanceId}
      disabled={disabled}
      className={className}
    />
  );
}
