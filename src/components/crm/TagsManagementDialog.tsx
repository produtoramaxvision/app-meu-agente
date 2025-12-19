import { useState } from 'react';
import { useCrmTags } from '@/hooks/useCrmTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Pencil, Trash2, Plus, Check, X, Tag as TagIcon, Palette, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { motion, AnimatePresence } from 'framer-motion';

interface TagsManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditingTag {
  id: string;
  name: string;
  color: string;
}

export function TagsManagementDialog({ open, onOpenChange }: TagsManagementDialogProps) {
  const { tags, isLoading, createTag, updateTag, deleteTag } = useCrmTags();
  
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLOR_PALETTE[0]);
  const [editingTag, setEditingTag] = useState<EditingTag | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTags = tags.filter(tag => 
    tag.tag_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    }
  };

  const handleStartEdit = (tag: { id: string; tag_name: string; tag_color: string }) => {
    setEditingTag({
      id: tag.id,
      name: tag.tag_name,
      color: tag.tag_color,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTag) return;
    const trimmedName = editingTag.name.trim();
    if (!trimmedName) return;

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
        <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden bg-background/80 backdrop-blur-xl border-border/40 shadow-2xl duration-300">
          
          {/* Header & Input Section */}
          <div className="relative overflow-hidden bg-muted/30 border-b border-border/10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
            
            <div className="relative p-6 pb-8">
              <DialogHeader className="mb-6 space-y-1">
                <DialogTitle className="flex items-center gap-2.5 text-2xl font-light tracking-tight">
                  <div className="p-2.5 rounded-xl bg-background shadow-sm ring-1 ring-black/5 dark:ring-white/5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-primary to-primary/60" />
                  </div>
                  Gerenciar Tags
                </DialogTitle>
                <DialogDescription className="text-muted-foreground/80 pl-[3.25rem]">
                  Categorize leads para melhor organização.
                </DialogDescription>
              </DialogHeader>

              {/* Main Input Field */}
              <div className="relative group">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl" 
                />
                
                <div className="relative flex items-center bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all duration-300 transform focus-within:scale-[1.01]">
                  
                  {/* Color Picker Trigger */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button 
                        className="pl-4 pr-3 h-14 flex items-center justify-center transition-colors hover:bg-muted/50 border-r border-border/10 group/color"
                      >
                        <motion.div 
                          className="w-5 h-5 rounded-full shadow-sm ring-2 ring-white/20 dark:ring-black/20"
                          style={{ backgroundColor: newTagColor }}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3 rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl" align="start">
                      <div className="grid grid-cols-5 gap-3">
                        {TAG_COLOR_PALETTE.map((color) => (
                          <motion.button
                            key={color}
                            whileHover={{ scale: 1.15, zIndex: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setNewTagColor(color)}
                            className={cn(
                              'w-8 h-8 rounded-full shadow-sm transition-all',
                              newTagColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:ring-2 hover:ring-black/5 dark:hover:ring-white/10'
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Input
                    placeholder="Nome da nova tag..."
                    value={newTagName}
                    onChange={(e) => {
                      setNewTagName(e.target.value);
                      setSearchQuery(e.target.value); // Auto-search while typing
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                    className="flex-1 h-14 border-none bg-transparent px-4 text-base focus-visible:ring-0 placeholder:text-muted-foreground/50"
                  />
                  
                  <div className="pr-2">
                    <Button 
                      size="sm" 
                      onClick={handleCreateTag}
                      disabled={!newTagName.trim()}
                      className={cn(
                        "h-9 px-4 rounded-xl transition-all duration-300",
                        newTagName.trim() 
                          ? "bg-primary text-primary-foreground shadow-md translate-x-0 opacity-100" 
                          : "bg-muted text-muted-foreground translate-x-4 opacity-0 pointer-events-none w-0 px-0 overflow-hidden"
                      )}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* List Section */}
          <div className="bg-background min-h-[300px] flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">
                {filteredTags.length} Tags Encontradas
              </span>
              {searchQuery && filteredTags.length === 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSearchQuery('')}
                  className="h-6 text-xs text-muted-foreground hover:text-primary"
                >
                  Limpar busca
                </Button>
              )}
            </div>

            <ScrollArea className="flex-1 h-[350px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
              ) : filteredTags.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground/40 py-12">
                  <div className="p-4 rounded-full bg-muted/30">
                    <Search className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="text-sm">Nenhuma tag encontrada para "{searchQuery}"</p>
                </div>
              ) : (
                <div className="px-4 pb-4 space-y-2">
                  <AnimatePresence mode="popLayout">
                    {filteredTags.map((tag) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        key={tag.id}
                        className="group relative flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 border border-transparent hover:border-border/50 transition-colors"
                      >
                        {editingTag?.id === tag.id ? (
                          // Edit Mode
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 w-full bg-background/50 p-1 rounded-lg shadow-sm ring-1 ring-primary/20"
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <button 
                                  className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:scale-105"
                                  style={{ backgroundColor: editingTag.color }}
                                />
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-3 rounded-2xl" align="start">
                                <div className="grid grid-cols-5 gap-3">
                                  {TAG_COLOR_PALETTE.map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => setEditingTag({ ...editingTag, color })}
                                      className={cn(
                                        'w-8 h-8 rounded-full shadow-sm transition-all hover:scale-110',
                                        editingTag.color === color ? 'ring-2 ring-primary ring-offset-2' : ''
                                      )}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                            
                            <Input
                              value={editingTag.name}
                              onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                              className="h-9 border-none bg-transparent focus-visible:ring-0 px-2 font-medium"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit();
                                if (e.key === 'Escape') setEditingTag(null);
                              }}
                            />
                            
                            <div className="flex gap-1 pr-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg" onClick={handleSaveEdit}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-muted rounded-lg" onClick={() => setEditingTag(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ) : (
                          // View Mode
                          <>
                            <div 
                              className="w-2.5 h-8 rounded-full shadow-sm opacity-80 group-hover:opacity-100 transition-opacity"
                              style={{ backgroundColor: tag.tag_color }}
                            />
                            
                            <span className="flex-1 font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                              {tag.tag_name}
                            </span>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                onClick={() => handleStartEdit(tag)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                onClick={() => setDeletingTagId(tag.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTagId} onOpenChange={() => setDeletingTagId(null)}>
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-2xl bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tag?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente a tag e a desvinculará de todos os leads.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-none bg-muted/50 hover:bg-muted">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTag} 
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
