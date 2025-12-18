import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

export type FieldType = 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'currency' | 'url';

export interface CustomFieldDefinition {
  id: string;
  cliente_phone: string;
  field_key: string;
  field_label: string;
  field_type: FieldType;
  options?: string[] | null;
  required: boolean;
  show_in_card: boolean;
  show_in_list: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldValue {
  id: string;
  contact_id: string;
  field_key: string;
  value: unknown; // JSON value
  updated_at: string;
}

export interface CreateFieldDefinitionInput {
  field_key: string;
  field_label: string;
  field_type: FieldType;
  options?: string[];
  required?: boolean;
  show_in_card?: boolean;
  show_in_list?: boolean;
  display_order?: number;
}

export interface UpdateFieldDefinitionInput {
  field_label?: string;
  field_type?: FieldType;
  options?: string[];
  required?: boolean;
  show_in_card?: boolean;
  show_in_list?: boolean;
  display_order?: number;
}

// ============================================================================
// HOOK: useCustomFieldDefinitions
// Gerencia as definições de campos personalizados de um cliente
// ============================================================================

export function useCustomFieldDefinitions() {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todas as definições do cliente
  const { data: definitions, isLoading, error } = useQuery({
    queryKey: ['custom-fields-definitions', cliente?.phone],
    queryFn: async () => {
      if (!cliente?.phone) return [];

      const { data, error } = await supabase
        .from('custom_fields_definitions')
        .select('*')
        .eq('cliente_phone', cliente.phone)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as CustomFieldDefinition[];
    },
    enabled: !!cliente?.phone,
  });

  // Criar nova definição
  const createDefinition = useMutation({
    mutationFn: async (input: CreateFieldDefinitionInput) => {
      if (!cliente?.phone) throw new Error('Cliente não autenticado');

      // Validar field_key (apenas letras minúsculas, números e underscores)
      const keyRegex = /^[a-z][a-z0-9_]*$/;
      if (!keyRegex.test(input.field_key)) {
        throw new Error('Chave do campo deve conter apenas letras minúsculas, números e underscores, começando com letra');
      }

      const { data, error } = await supabase
        .from('custom_fields_definitions')
        .insert({
          cliente_phone: cliente.phone,
          ...input,
          options: input.options ? JSON.stringify(input.options) : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CustomFieldDefinition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields-definitions', cliente?.phone] });
      toast.success('Campo personalizado criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar campo personalizado:', error);
      toast.error('Erro ao criar campo', {
        description: error.message,
      });
    },
  });

  // Atualizar definição existente
  const updateDefinition = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateFieldDefinitionInput }) => {
      const { data, error } = await supabase
        .from('custom_fields_definitions')
        .update({
          ...updates,
          options: updates.options ? JSON.stringify(updates.options) : undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CustomFieldDefinition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields-definitions', cliente?.phone] });
      toast.success('Campo atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar campo:', error);
      toast.error('Erro ao atualizar campo', {
        description: error.message,
      });
    },
  });

  // Deletar definição
  const deleteDefinition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_fields_definitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields-definitions', cliente?.phone] });
      toast.success('Campo removido com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao remover campo:', error);
      toast.error('Erro ao remover campo', {
        description: error.message,
      });
    },
  });

  // Reordenar campos
  const reorderDefinitions = useMutation({
    mutationFn: async (reorderedIds: string[]) => {
      // Atualizar display_order de cada campo
      const updates = reorderedIds.map((id, index) => ({
        id,
        display_order: index,
      }));

      const promises = updates.map(({ id, display_order }) =>
        supabase
          .from('custom_fields_definitions')
          .update({ display_order })
          .eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields-definitions', cliente?.phone] });
    },
    onError: (error: Error) => {
      console.error('Erro ao reordenar campos:', error);
      toast.error('Erro ao reordenar campos');
    },
  });

  return {
    definitions: definitions || [],
    isLoading,
    error,
    createDefinition,
    updateDefinition,
    deleteDefinition,
    reorderDefinitions,
  };
}

// ============================================================================
// HOOK: useCustomFieldValues
// Gerencia os valores de campos personalizados de um contato específico
// ============================================================================

export function useCustomFieldValues(contactId?: string) {
  const queryClient = useQueryClient();

  // Buscar valores de um contato
  const { data: valuesArray, isLoading, error } = useQuery({
    queryKey: ['custom-fields-values', contactId],
    queryFn: async () => {
      if (!contactId) return [];

      const { data, error } = await supabase
        .from('custom_fields_values')
        .select('*')
        .eq('contact_id', contactId);

      if (error) throw error;
      return data as CustomFieldValue[];
    },
    enabled: !!contactId,
  });

  // Transformar array em objeto { field_key: value } para fácil acesso
  const values = valuesArray?.reduce((acc, item) => {
    acc[item.field_key] = item.value;
    return acc;
  }, {} as Record<string, unknown>);

  // Salvar ou atualizar valor
  const saveValue = useMutation({
    mutationFn: async ({ field_key, value }: { field_key: string; value: unknown }) => {
      if (!contactId) throw new Error('Contact ID não fornecido');

      const { data, error } = await supabase
        .from('custom_fields_values')
        .upsert(
          {
            contact_id: contactId,
            field_key,
            value: value as Json,
          },
          {
            onConflict: 'contact_id,field_key',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data as CustomFieldValue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields-values', contactId] });
    },
    onError: (error: Error) => {
      console.error('Erro ao salvar valor do campo:', error);
      toast.error('Erro ao salvar campo', {
        description: error.message,
      });
    },
  });

  // Deletar valor
  const deleteValue = useMutation({
    mutationFn: async (field_key: string) => {
      if (!contactId) throw new Error('Contact ID não fornecido');

      const { error } = await supabase
        .from('custom_fields_values')
        .delete()
        .eq('contact_id', contactId)
        .eq('field_key', field_key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields-values', contactId] });
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar valor do campo:', error);
      toast.error('Erro ao deletar campo');
    },
  });

  return {
    values: values || {},
    valuesArray: valuesArray || [],
    isLoading,
    error,
    saveValue,
    deleteValue,
  };
}
