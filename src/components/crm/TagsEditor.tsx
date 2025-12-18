'use client';

import { useState, useCallback, useMemo } from 'react';
import { X, Check, Plus, Tag, Loader2 } from 'lucide-react';
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
import { useLeadTags, getTagColor, MAX_TAGS_PER_LEAD } from '@/hooks/useLeadTags';

// ============================================================================
// TYPES
// ============================================================================

interface TagsEditorProps {
  /** Tags atuais do lead */
  tags: string[];
  /** Callback quando tags são atualizadas */
  onTagsChange: (tags: string[]) => Promise<void>;
  /** UUID da instância para sugestões (opcional) */
  instanceId?: string;
  /** Desabilitar edição */
  disabled?: boolean;
  /** Classe CSS adicional */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Editor de tags para leads do CRM.
 * 
 * Features:
 * - Input com autocomplete de tags existentes
 * - Criar novas tags digitando e pressionando Enter
 * - Remover tags clicando no X
 * - Cores consistentes por tag (hash-based)
 * - Limite de 10 tags por lead
 * - Responsivo para mobile
 * 
 * @example
 * ```tsx
 * <TagsEditor
 *   tags={contact.crm_tags || []}
 *   onTagsChange={async (newTags) => {
 *     await updateContact(contact.id, { crm_tags: newTags });
 *   }}
 *   instanceId={instance.id}
 * />
 * ```
 */
export function TagsEditor({
  tags = [],
  onTagsChange,
  instanceId,
  disabled = false,
  className,
}: TagsEditorProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Buscar tags disponíveis para sugestões
  const { availableTags, isLoading: isLoadingTags } = useLeadTags({ instanceId });

  // Tags que ainda não foram selecionadas (para sugestões)
  const suggestedTags = useMemo(() => {
    return availableTags.filter(
      (tag) => !tags.includes(tag) && 
      tag.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [availableTags, tags, inputValue]);

  // Verificar se atingiu o limite
  const hasReachedMax = tags.length >= MAX_TAGS_PER_LEAD;

  // Adicionar tag
  const handleAddTag = useCallback(async (tagToAdd: string) => {
    const trimmedTag = tagToAdd.trim();
    
    // Validações
    if (!trimmedTag) return;
    if (tags.includes(trimmedTag)) return;
    if (hasReachedMax) return;
    
    setIsUpdating(true);
    try {
      await onTagsChange([...tags, trimmedTag]);
      setInputValue('');
    } catch (error) {
      console.error('Erro ao adicionar tag:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [tags, hasReachedMax, onTagsChange]);

  // Remover tag
  const handleRemoveTag = useCallback(async (tagToRemove: string) => {
    setIsUpdating(true);
    try {
      await onTagsChange(tags.filter((t) => t !== tagToRemove));
    } catch (error) {
      console.error('Erro ao remover tag:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [tags, onTagsChange]);

  // Handler para Enter no input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      handleAddTag(inputValue);
    }
  }, [inputValue, handleAddTag]);

  // Verificar se a tag digitada já existe nas sugestões
  const isNewTag = inputValue.trim() && 
    !availableTags.some(tag => tag.toLowerCase() === inputValue.toLowerCase().trim());

  return (
    <div className={cn('space-y-3', className)}>
      {/* Tags selecionadas */}
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Nenhuma tag adicionada
          </p>
        ) : (
          tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border transition-colors',
                getTagColor(tag),
                disabled && 'opacity-60'
              )}
            >
              <Tag className="h-3 w-3" />
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  disabled={isUpdating}
                  className={cn(
                    'ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/20 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/50',
                    isUpdating && 'cursor-not-allowed opacity-50'
                  )}
                  aria-label={`Remover tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
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
              disabled={hasReachedMax || isUpdating}
              className={cn(
                'w-full sm:w-auto gap-2 justify-start font-normal',
                hasReachedMax && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {hasReachedMax 
                ? `Máximo de ${MAX_TAGS_PER_LEAD} tags atingido` 
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
                {isLoadingTags ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Criar nova tag */}
                    {isNewTag && (
                      <CommandGroup heading="Criar nova tag">
                        <CommandItem
                          value={`create-${inputValue}`}
                          onSelect={() => handleAddTag(inputValue)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4 text-primary" />
                          <span>Criar</span>
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
                            getTagColor(inputValue.trim())
                          )}>
                            {inputValue.trim()}
                          </span>
                        </CommandItem>
                      </CommandGroup>
                    )}

                    {/* Sugestões */}
                    {suggestedTags.length > 0 && (
                      <CommandGroup heading="Sugestões">
                        {suggestedTags.slice(0, 8).map((tag) => (
                          <CommandItem
                            key={tag}
                            value={tag}
                            onSelect={() => handleAddTag(tag)}
                            className="gap-2"
                          >
                            <Check
                              className={cn(
                                'h-4 w-4',
                                tags.includes(tag) ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <span className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
                              getTagColor(tag)
                            )}>
                              {tag}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {/* Empty state */}
                    {suggestedTags.length === 0 && !isNewTag && (
                      <CommandEmpty>
                        {inputValue 
                          ? 'Nenhuma tag encontrada. Pressione Enter para criar.'
                          : 'Digite para buscar ou criar uma tag.'
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
        {tags.length}/{MAX_TAGS_PER_LEAD} tags
      </p>
    </div>
  );
}
