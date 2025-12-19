import { useState } from 'react';
import { useCrmTags } from '@/hooks/useCrmTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TAG_COLOR_PALETTE } from '@/types/crm';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TagsManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditingTag {
  id: string;
  name: string;
  color: string;
}

/**
 * Diálogo para gerenciar tags do CRM (criar, editar, excluir).
 * Sistema relacional usando tabelas crm_tags e crm_lead_tags.
 */
export function TagsManagementDialog({ open, onOpenChange }: TagsManagementDialogProps) {
  const { tags, isLoading, createTag, updateTag, deleteTag } = useCrmTags();
  
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLOR_PALETTE[0]);
  const [editingTag, setEditingTag] = useState<EditingTag | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  // Criar nova tag
  const handleCreateTag = async () => {
    const trimmedName = newTagName.trim();
    
    if (!trimmedName) {
      toast.error('Digite um nome para a tag');
      return;
    }

    try {
      await createTag({ name: trimmedName, color: newTagColor });
      setNewTagName('');
      setNewTagColor(TAG_COLOR_PALETTE[0]);
      toast.success('Tag criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar tag:', error);
      // Erro já é exibido pelo hook
    }
  };

  // Iniciar edição
  const handleStartEdit = (tag: { id: string; tag_name: string; tag_color: string }) => {
    setEditingTag({
      id: tag.id,
      name: tag.tag_name,
      color: tag.tag_color,
    });
  };

  // Cancelar edição
  const handleCancelEdit = () => {
    setEditingTag(null);
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!editingTag) return;

    const trimmedName = editingTag.name.trim();
    if (!trimmedName) {
      toast.error('Digite um nome para a tag');
      return;
    }

    try {
      await updateTag(editingTag.id, {
        tag_name: trimmedName,
        tag_color: editingTag.color,
      });
      setEditingTag(null);
    } catch (error) {
      console.error('Erro ao atualizar tag:', error);
    }
  };

  // Confirmar exclusão
  const handleDeleteTag = async () => {
    if (!deletingTagId) return;

    try {
      await deleteTag(deletingTagId);
      setDeletingTagId(null);
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Tags</DialogTitle>
            <DialogDescription>
              Crie, edite ou exclua tags para organizar seus leads no CRM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Criar nova tag */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Criar Nova Tag</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da tag..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                  className="flex-1"
                />
                <div className="flex gap-1">
                  {TAG_COLOR_PALETTE.slice(0, 5).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all hover:scale-110',
                        newTagColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <Button onClick={handleCreateTag} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Criar
                </Button>
              </div>
              <div className="flex gap-1">
                {TAG_COLOR_PALETTE.slice(5).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all hover:scale-110',
                      newTagColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Lista de tags existentes */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Tags Existentes ({tags.length})</Label>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Carregando tags...
                  </div>
                ) : tags.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma tag criada ainda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        {editingTag?.id === tag.id ? (
                          // Modo de edição
                          <>
                            <Input
                              value={editingTag.name}
                              onChange={(e) =>
                                setEditingTag({ ...editingTag, name: e.target.value })
                              }
                              className="flex-1"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              {TAG_COLOR_PALETTE.slice(0, 6).map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() =>
                                    setEditingTag({ ...editingTag, color })
                                  }
                                  className={cn(
                                    'w-6 h-6 rounded-full border-2 transition-all hover:scale-110',
                                    editingTag.color === color
                                      ? 'border-primary ring-2 ring-primary/20'
                                      : 'border-transparent'
                                  )}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSaveEdit}
                                className="h-8 w-8 p-0"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          // Modo de visualização
                          <>
                            <div className="flex items-center gap-2 flex-1">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: tag.tag_color }}
                              />
                              <Badge
                                variant="outline"
                                className="text-sm"
                                style={{
                                  backgroundColor: `${tag.tag_color}15`,
                                  borderColor: tag.tag_color,
                                  color: tag.tag_color,
                                }}
                              >
                                {tag.tag_name}
                              </Badge>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(tag)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeletingTagId(tag.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para confirmar exclusão */}
      <AlertDialog open={!!deletingTagId} onOpenChange={() => setDeletingTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta tag? Esta ação removerá a tag de todos os leads
              associados e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
