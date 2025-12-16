import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Database, 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCustomFieldDefinitions, CustomFieldDefinition, FieldType } from '@/hooks/useCustomFields';
import { CreateFieldDialog } from './CreateFieldDialog';
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
import { cn } from '@/lib/utils';

export function CustomFieldsManager() {
  const { 
    definitions, 
    isLoading, 
    createDefinition, 
    updateDefinition, 
    deleteDefinition,
    reorderDefinitions 
  } = useCustomFieldDefinitions();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null);
  const [fieldToDelete, setFieldToDelete] = useState<CustomFieldDefinition | null>(null);

  // Mapeamento de ícones e cores por tipo
  const fieldTypeConfig: Record<FieldType, { label: string; color: string }> = {
    text: { label: 'Texto', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    number: { label: 'Número', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    boolean: { label: 'Sim/Não', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    date: { label: 'Data', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    select: { label: 'Lista', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    multiselect: { label: 'Multi-seleção', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
    currency: { label: 'Moeda', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
    url: { label: 'URL', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  };

  const handleEdit = (field: CustomFieldDefinition) => {
    setEditingField(field);
    setShowCreateDialog(true);
  };

  const handleDelete = async () => {
    if (!fieldToDelete) return;
    await deleteDefinition.mutateAsync(fieldToDelete.id);
    setFieldToDelete(null);
  };

  const toggleShowInCard = async (field: CustomFieldDefinition) => {
    await updateDefinition.mutateAsync({
      id: field.id,
      updates: { show_in_card: !field.show_in_card }
    });
  };

  const toggleShowInList = async (field: CustomFieldDefinition) => {
    await updateDefinition.mutateAsync({
      id: field.id,
      updates: { show_in_list: !field.show_in_list }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Campos Personalizados</CardTitle>
              <CardDescription className="text-sm mt-1">
                Configure campos extras para qualificar seus leads
              </CardDescription>
            </div>
            <Button 
              onClick={() => {
                setEditingField(null);
                setShowCreateDialog(true);
              }}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Campo
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {definitions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Nenhum campo personalizado ainda</p>
              <p className="text-xs mt-1">Crie campos específicos para seu negócio</p>
            </div>
          ) : (
            <div className="space-y-2">
              {definitions.map((field) => {
                const typeConfig = fieldTypeConfig[field.field_type];
                
                return (
                  <div 
                    key={field.id} 
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border rounded-lg",
                      "hover:bg-muted/30 transition-colors"
                    )}
                  >
                    {/* Drag Handle + Type Badge */}
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab hidden sm:block" />
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs font-medium border-0", typeConfig.color)}
                      >
                        {typeConfig.label}
                      </Badge>
                    </div>
                    
                    {/* Field Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {field.field_label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        <code className="bg-muted px-1 py-0.5 rounded">{field.field_key}</code>
                        {field.required && (
                          <span className="ml-2 text-destructive">(obrigatório)</span>
                        )}
                      </p>
                    </div>
                    
                    {/* Visibility Toggles - Desktop */}
                    <div className="hidden sm:flex items-center gap-4">
                      {/* Show in Card */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleShowInCard(field)}
                          title={field.show_in_card ? 'Visível no card' : 'Oculto no card'}
                        >
                          {field.show_in_card ? (
                            <Eye className="h-4 w-4 text-primary" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <span className="text-xs text-muted-foreground">Card</span>
                      </div>

                      {/* Show in List */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleShowInList(field)}
                          title={field.show_in_list ? 'Visível na lista' : 'Oculto na lista'}
                        >
                          {field.show_in_list ? (
                            <Eye className="h-4 w-4 text-primary" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <span className="text-xs text-muted-foreground">Lista</span>
                      </div>
                    </div>

                    {/* Visibility Toggles - Mobile */}
                    <div className="flex sm:hidden gap-4 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch 
                          checked={field.show_in_card}
                          onCheckedChange={() => toggleShowInCard(field)}
                          className="scale-75"
                        />
                        <span className="text-muted-foreground">Card</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch 
                          checked={field.show_in_list}
                          onCheckedChange={() => toggleShowInList(field)}
                          className="scale-75"
                        />
                        <span className="text-muted-foreground">Lista</span>
                      </label>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9"
                        onClick={() => handleEdit(field)}
                      >
                        <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setFieldToDelete(field)}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <CreateFieldDialog 
        open={showCreateDialog} 
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) setEditingField(null);
        }}
        onSubmit={async (data) => {
          if (editingField) {
            await updateDefinition.mutateAsync({
              id: editingField.id,
              updates: data
            });
          } else {
            await createDefinition.mutateAsync(data);
          }
          setShowCreateDialog(false);
          setEditingField(null);
        }}
        editingField={editingField}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!fieldToDelete} onOpenChange={(open) => !open && setFieldToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover campo personalizado?</AlertDialogTitle>
            <AlertDialogDescription>
              O campo <strong>{fieldToDelete?.field_label}</strong> será removido permanentemente.
              Todos os valores já preenchidos em leads serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
