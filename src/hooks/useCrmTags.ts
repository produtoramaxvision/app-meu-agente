/**
 * useCrmTags Hook
 * 
 * Hook para gerenciamento de tags do CRM usando modelo relacional.
 * Substitui o antigo useLeadTags que trabalhava com arrays.
 * 
 * @module hooks/useCrmTags
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { CrmTag, CrmTagInsert, CrmTagUpdate, LeadTagAssociation, CrmLeadTagInsert } from '@/types/crm';
import { TAG_COLOR_PALETTE, getTagColorFromHash } from '@/types/crm';

// Helper: pick a unique color per user, avoiding duplicates already in use.
function getUniqueTagColor(existingTags: CrmTag[], desiredName: string): string {
  const usedColors = new Set(existingTags.map((t) => t.tag_color));
  // First, try unused colors from the palette to guarantee uniqueness.
  const availablePaletteColor = TAG_COLOR_PALETTE.find((color) => !usedColors.has(color));
  if (availablePaletteColor) return availablePaletteColor;

  // Fallback: derive a color from the name with a counter until it is unused.
  let attempt = 0;
  while (attempt < 20) {
    const candidate = getTagColorFromHash(`${desiredName}-${attempt}`);
    if (!usedColors.has(candidate)) return candidate;
    attempt += 1;
  }

  // Extreme fallback: reuse the first palette color (should never happen in practice).
  return TAG_COLOR_PALETTE[0];
}

// =============================================================================
// Query Keys
// =============================================================================

export const crmTagsKeys = {
  all: ['crm-tags'] as const,
  list: () => [...crmTagsKeys.all, 'list'] as const,
  detail: (id: string) => [...crmTagsKeys.all, 'detail', id] as const,
  forLead: (leadId: string) => [...crmTagsKeys.all, 'lead', leadId] as const,
};

// =============================================================================
// Types
// =============================================================================

interface UseCrmTagsReturn {
  /** All tags owned by the current user */
  tags: CrmTag[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Create a new tag */
  createTag: (data: { name: string; color?: string }) => Promise<CrmTag>;
  /** Update an existing tag */
  updateTag: (id: string, data: Partial<CrmTagUpdate>) => Promise<CrmTag>;
  /** Delete a tag */
  deleteTag: (id: string) => Promise<void>;
  /** Check if a mutation is pending */
  isPending: boolean;
}

interface UseLeadTagsReturn {
  /** Tags associated with the lead */
  tags: LeadTagAssociation[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Add a tag to the lead */
  addTag: (tagId: string) => Promise<void>;
  /** Remove a tag from the lead */
  removeTag: (tagId: string) => Promise<void>;
  /** Add a new tag and associate it with the lead */
  addNewTag: (data: { name: string; color?: string }) => Promise<void>;
  /** Check if a mutation is pending */
  isPending: boolean;
}

// =============================================================================
// Hook: useCrmTags - Global tag management
// =============================================================================

/**
 * Hook for managing CRM tags (CRUD operations on crm_tags table).
 * Tags are scoped to the authenticated user's phone.
 * 
 * @example
 * ```tsx
 * const { tags, createTag, updateTag, deleteTag, isLoading } = useCrmTags();
 * 
 * // Create a new tag
 * await createTag({ name: 'VIP', color: '#EF4444' });
 * 
 * // Update tag color
 * await updateTag(tagId, { tag_color: '#3B82F6' });
 * 
 * // Delete tag (cascades to all lead associations)
 * await deleteTag(tagId);
 * ```
 */
export function useCrmTags(): UseCrmTagsReturn {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all tags for the user
  const {
    data: tags = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: crmTagsKeys.list(),
    queryFn: async () => {
      if (!cliente?.phone) return [];

      const { data, error: queryError } = await supabase
        .from('crm_tags')
        .select('*')
        .eq('phone', cliente.phone)
        .order('tag_name', { ascending: true });

      if (queryError) {
        console.error('❌ useCrmTags: Error fetching tags:', queryError);
        throw queryError;
      }

      return data as CrmTag[];
    },
    enabled: !!cliente?.phone,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create tag mutation
  const createMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      if (!cliente?.phone) throw new Error('Usuário não autenticado');
      // Garantir cor única por usuário
      const existingTags = queryClient.getQueryData<CrmTag[]>(crmTagsKeys.list()) || tags || [];
      const tagColor = color || getUniqueTagColor(existingTags, name);
      
      const insertData: CrmTagInsert = {
        phone: cliente.phone,
        tag_name: name.trim(),
        tag_color: tagColor,
      };

      const { data, error: insertError } = await supabase
        .from('crm_tags')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error(`Tag "${name}" já existe`);
        }
        throw insertError;
      }

      return data as CrmTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmTagsKeys.all });
    },
    onError: (error) => {
      console.error('❌ useCrmTags: Error creating tag:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar tag');
    },
  });

  // Update tag mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CrmTagUpdate> }) => {
      const { data: updated, error: updateError } = await supabase
        .from('crm_tags')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated as CrmTag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmTagsKeys.all });
      toast.success('Tag atualizada');
    },
    onError: (error) => {
      console.error('❌ useCrmTags: Error updating tag:', error);
      toast.error('Erro ao atualizar tag');
    },
  });

  // Delete tag mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase
        .from('crm_tags')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmTagsKeys.all });
      toast.success('Tag excluída');
    },
    onError: (error) => {
      console.error('❌ useCrmTags: Error deleting tag:', error);
      toast.error('Erro ao excluir tag');
    },
  });

  return {
    tags,
    isLoading,
    error: error as Error | null,
    createTag: createMutation.mutateAsync,
    updateTag: (id, data) => updateMutation.mutateAsync({ id, data }),
    deleteTag: deleteMutation.mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}

// =============================================================================
// Hook: useLeadTagsRelational - Tags for a specific lead
// =============================================================================

/**
 * Hook for managing tags associated with a specific lead.
 * Uses the crm_lead_tags pivot table.
 * 
 * @param leadId - UUID of the lead (evolution_contacts.id)
 * 
 * @example
 * ```tsx
 * const { tags, addTag, removeTag, addNewTag, isLoading } = useLeadTagsRelational(contact.id);
 * 
 * // Add existing tag to lead
 * await addTag(existingTagId);
 * 
 * // Create new tag and add to lead
 * await addNewTag('Urgente', '#EF4444');
 * 
 * // Remove tag from lead
 * await removeTag(tagId);
 * ```
 */
export function useLeadTagsRelational(leadId: string): UseLeadTagsReturn {
  const { cliente } = useAuth();
  const queryClient = useQueryClient();

  // Fetch tags for this lead with tag details via join
  const {
    data: tags = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: crmTagsKeys.forLead(leadId),
    queryFn: async () => {
      if (!leadId) return [];

      // Use a join to get tag details along with the association
      const { data, error: queryError } = await supabase
        .from('crm_lead_tags')
        .select(`
          tag_id,
          assigned_at,
          crm_tags!inner (
            id,
            tag_name,
            tag_color
          )
        `)
        .eq('lead_id', leadId);

      if (queryError) {
        console.error('❌ useLeadTagsRelational: Error fetching lead tags:', queryError);
        throw queryError;
      }

      // Define type for the joined query result
      interface JoinedLeadTag {
        tag_id: string;
        assigned_at: string;
        crm_tags: {
          id: string;
          tag_name: string;
          tag_color: string;
        };
      }

      // Transform the data to a flat structure
      return (data || []).map((item: JoinedLeadTag) => ({
        tag_id: item.tag_id,
        tag_name: item.crm_tags.tag_name,
        tag_color: item.crm_tags.tag_color,
        assigned_at: item.assigned_at,
      })) as LeadTagAssociation[];
    },
    enabled: !!leadId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Add tag to lead mutation
  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const insertData: CrmLeadTagInsert = {
        lead_id: leadId,
        tag_id: tagId,
      };

      const { error: insertError } = await supabase
        .from('crm_lead_tags')
        .insert(insertData);

      if (insertError) {
        // Ignore duplicate key errors (tag already associated)
        if (insertError.code === '23505') {
          console.log('Tag already associated with lead');
          return;
        }
        throw insertError;
      }
    },
    onMutate: async (tagId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: crmTagsKeys.forLead(leadId) });

      // Snapshot previous value
      const previousTags = queryClient.getQueryData<LeadTagAssociation[]>(crmTagsKeys.forLead(leadId));

      // Optimistically update - we need tag details from cache
      const allTags = queryClient.getQueryData<CrmTag[]>(crmTagsKeys.list()) || [];
      const tagToAdd = allTags.find(t => t.id === tagId);
      
      if (tagToAdd && previousTags) {
        queryClient.setQueryData<LeadTagAssociation[]>(crmTagsKeys.forLead(leadId), [
          ...previousTags,
          {
            tag_id: tagId,
            tag_name: tagToAdd.tag_name,
            tag_color: tagToAdd.tag_color,
            assigned_at: new Date().toISOString(),
          },
        ]);
      }

      return { previousTags };
    },
    onError: (err, tagId, context) => {
      // Rollback on error
      if (context?.previousTags) {
        queryClient.setQueryData(crmTagsKeys.forLead(leadId), context.previousTags);
      }
      console.error('❌ useLeadTagsRelational: Error adding tag:', err);
      toast.error('Erro ao adicionar tag');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: crmTagsKeys.forLead(leadId) });
    },
  });

  // Remove tag from lead mutation
  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error: deleteError } = await supabase
        .from('crm_lead_tags')
        .delete()
        .eq('lead_id', leadId)
        .eq('tag_id', tagId);

      if (deleteError) throw deleteError;
    },
    onMutate: async (tagId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: crmTagsKeys.forLead(leadId) });

      // Snapshot previous value
      const previousTags = queryClient.getQueryData<LeadTagAssociation[]>(crmTagsKeys.forLead(leadId));

      // Optimistically remove
      if (previousTags) {
        queryClient.setQueryData<LeadTagAssociation[]>(
          crmTagsKeys.forLead(leadId),
          previousTags.filter(t => t.tag_id !== tagId)
        );
      }

      return { previousTags };
    },
    onError: (err, tagId, context) => {
      // Rollback on error
      if (context?.previousTags) {
        queryClient.setQueryData(crmTagsKeys.forLead(leadId), context.previousTags);
      }
      console.error('❌ useLeadTagsRelational: Error removing tag:', err);
      toast.error('Erro ao remover tag');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: crmTagsKeys.forLead(leadId) });
    },
  });

  // Create new tag and add to lead in one operation
  const addNewTagMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      if (!cliente?.phone) throw new Error('Usuário não autenticado');
      // Garantir cor única por usuário
      const existingTags = queryClient.getQueryData<CrmTag[]>(crmTagsKeys.list()) || tags || [];
      const tagColor = color || getUniqueTagColor(existingTags, name);

      // First, create the tag
      const { data: newTag, error: createError } = await supabase
        .from('crm_tags')
        .insert({
          phone: cliente.phone,
          tag_name: name.trim(),
          tag_color: tagColor,
        })
        .select()
        .single();

      if (createError) {
        // If tag already exists, get it instead
        if (createError.code === '23505') {
          const { data: existingTag, error: fetchError } = await supabase
            .from('crm_tags')
            .select()
            .eq('phone', cliente.phone)
            .eq('tag_name', name.trim())
            .single();

          if (fetchError) throw fetchError;
          
          // Associate existing tag with lead
          await supabase
            .from('crm_lead_tags')
            .insert({ lead_id: leadId, tag_id: existingTag.id })
            .single();

          return;
        }
        throw createError;
      }

      // Associate new tag with lead
      const { error: associateError } = await supabase
        .from('crm_lead_tags')
        .insert({ lead_id: leadId, tag_id: newTag.id });

      if (associateError) throw associateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmTagsKeys.all });
      queryClient.invalidateQueries({ queryKey: crmTagsKeys.forLead(leadId) });
    },
    onError: (error) => {
      console.error('❌ useLeadTagsRelational: Error adding new tag:', error);
      toast.error('Erro ao criar e adicionar tag');
    },
  });

  return {
    tags,
    isLoading,
    error: error as Error | null,
    addTag: addTagMutation.mutateAsync,
    removeTag: removeTagMutation.mutateAsync,
    addNewTag: ({ name, color }: { name: string; color?: string }) => 
      addNewTagMutation.mutateAsync({ name, color }),
    isPending: addTagMutation.isPending || removeTagMutation.isPending || addNewTagMutation.isPending,
  };
}

// =============================================================================
// Hook: useLeadTagsReadOnly - Simple read-only hook for display purposes
// =============================================================================

/**
 * Simplified hook for reading lead tags (display only, no mutations).
 * Use this in components that only need to display tags (KanbanCard, LeadDetailsSheet header).
 * 
 * @example
 * ```tsx
 * const { tags, isLoading } = useLeadTagsReadOnly(contact.id);
 * ```
 */
export function useLeadTagsReadOnly(leadId: string | undefined) {
  const { data: tags = [], isLoading } = useQuery({
    queryKey: crmTagsKeys.forLead(leadId || ''),
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('crm_lead_tags')
        .select(`
          tag_id,
          assigned_at,
          crm_tags!inner (
            id,
            tag_name,
            tag_color
          )
        `)
        .eq('lead_id', leadId);

      if (error) {
        console.error('Error fetching lead tags:', error);
        return [];
      }

      // Transform joined data
      return (data || []).map((item: JoinedLeadTag) => ({
        tag_id: item.tag_id,
        tag_name: item.crm_tags.tag_name,
        tag_color: item.crm_tags.tag_color,
        assigned_at: item.assigned_at,
      }));
    },
    enabled: !!leadId,
    staleTime: 30000, // 30s cache for display purposes
  });

  return { tags, isLoading };
}

// =============================================================================
// Utility Exports (for backwards compatibility)
// =============================================================================

export { TAG_COLOR_PALETTE, getTagColorFromHash } from '@/types/crm';

/**
 * @deprecated Use getTagColorFromHash or tag.tag_color directly
 * Kept for backwards compatibility with existing TagsEditor
 */
export function getTagColor(tagName: string): string {
  const hexColor = getTagColorFromHash(tagName);
  // Return Tailwind classes for backwards compatibility
  const colorMap: Record<string, string> = {
    '#3B82F6': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    '#8B5CF6': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    '#10B981': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
    '#F59E0B': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    '#EF4444': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
    '#EC4899': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    '#6366F1': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    '#14B8A6': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    '#F97316': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    '#06B6D4': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  };
  return colorMap[hexColor] || colorMap['#3B82F6'];
}

// =============================================================================
// Hook: useAllLeadsTags - Bulk load tags for multiple leads
// =============================================================================

/**
 * Hook to load tags for all leads at once. Useful for filtering in CRM views.
 * Returns a Map of lead_id -> array of tag names.
 * 
 * @example
 * ```tsx
 * const { tagsByLeadId, isLoading } = useAllLeadsTags();
 * 
 * // Filter contacts by tag
 * const hasMatchingTag = filters.tags.some(tag => 
 *   tagsByLeadId.get(contact.id)?.includes(tag)
 * );
 * ```
 */
export function useAllLeadsTags() {
  const { cliente } = useAuth();

  const { data: tagsByLeadId = new Map<string, string[]>(), isLoading } = useQuery({
    queryKey: [...crmTagsKeys.all, 'all-leads-tags'],
    queryFn: async () => {
      if (!cliente?.phone) return new Map<string, string[]>();

      const { data, error } = await supabase
        .from('crm_lead_tags')
        .select(`
          lead_id,
          crm_tags!inner (
            tag_name
          )
        `);

      if (error) {
        console.error('Error fetching all leads tags:', error);
        return new Map<string, string[]>();
      }

      // Build map of lead_id -> tag names
      const result = new Map<string, string[]>();
      for (const item of data || []) {
        const leadId = item.lead_id;
        const tagName = (item.crm_tags as { tag_name: string }).tag_name;
        
        if (!result.has(leadId)) {
          result.set(leadId, []);
        }
        result.get(leadId)!.push(tagName);
      }

      return result;
    },
    enabled: !!cliente?.phone,
    staleTime: 60000, // 1 min cache - tags don't change often
  });

  return { tagsByLeadId, isLoading };
}
