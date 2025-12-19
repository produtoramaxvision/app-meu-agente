/**
 * CRM Domain Types
 * 
 * Types for the CRM module including tags, leads, and related entities.
 * These are domain-specific types that may differ from the raw Supabase types.
 */

import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// =============================================================================
// CRM Tags Types
// =============================================================================

/** Raw CRM Tag from database */
export type CrmTag = Tables<'crm_tags'>;

/** Insert payload for creating a new tag */
export type CrmTagInsert = TablesInsert<'crm_tags'>;

/** Update payload for modifying a tag */
export type CrmTagUpdate = TablesUpdate<'crm_tags'>;

/** Raw Lead-Tag relationship from database */
export type CrmLeadTag = Tables<'crm_lead_tags'>;

/** Insert payload for associating a tag to a lead */
export type CrmLeadTagInsert = TablesInsert<'crm_lead_tags'>;

/** Tag with computed properties for UI display */
export interface CrmTagWithMeta extends CrmTag {
  /** Number of leads using this tag */
  usage_count?: number;
}

/** Tag associated with a specific lead (for display) */
export interface LeadTagAssociation {
  tag_id: string;
  tag_name: string;
  tag_color: string;
  assigned_at: string;
}

// =============================================================================
// Lead Status Types
// =============================================================================

/** Valid lead status values */
export type LeadStatus = 
  | 'novo' 
  | 'contatado' 
  | 'qualificado' 
  | 'proposta' 
  | 'negociando' 
  | 'ganho' 
  | 'perdido';

/** Lead status configuration for pipeline columns */
export interface LeadStatusConfig {
  value: LeadStatus;
  label: string;
  color: string;
  defaultProbability: number;
}

/** Default status configurations */
export const LEAD_STATUS_CONFIG: Record<LeadStatus, LeadStatusConfig> = {
  novo: { value: 'novo', label: 'Novo', color: '#3B82F6', defaultProbability: 10 },
  contatado: { value: 'contatado', label: 'Contatado', color: '#8B5CF6', defaultProbability: 20 },
  qualificado: { value: 'qualificado', label: 'Qualificado', color: '#10B981', defaultProbability: 40 },
  proposta: { value: 'proposta', label: 'Proposta', color: '#F59E0B', defaultProbability: 60 },
  negociando: { value: 'negociando', label: 'Negociando', color: '#EF4444', defaultProbability: 80 },
  ganho: { value: 'ganho', label: 'Ganho', color: '#22C55E', defaultProbability: 100 },
  perdido: { value: 'perdido', label: 'Perdido', color: '#6B7280', defaultProbability: 0 },
};

// =============================================================================
// Tag Color Palette
// =============================================================================

/** Predefined color palette for tags (hex values) */
export const TAG_COLOR_PALETTE = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#10B981', // green
  '#F59E0B', // yellow/amber
  '#EF4444', // red
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#F97316', // orange
  '#06B6D4', // cyan
] as const;

export type TagColor = typeof TAG_COLOR_PALETTE[number];

/** Maximum number of tags per lead */
export const MAX_TAGS_PER_LEAD = 10;

/** Maximum number of tags displayed in card preview */
export const MAX_TAGS_IN_CARD = 3;

// =============================================================================
// Filter Types
// =============================================================================

/** Filters for lead list/pipeline views */
export interface LeadFilters {
  status: LeadStatus[];
  scoreRange: [number, number];
  valueRange: [number, number];
  dateRange: { from: Date | undefined; to: Date | undefined };
  tags: string[]; // Tag IDs
  customFields: Record<string, unknown>;
}

/** Default filter values */
export const DEFAULT_LEAD_FILTERS: LeadFilters = {
  status: [],
  scoreRange: [0, 100],
  valueRange: [0, 1000000],
  dateRange: { from: undefined, to: undefined },
  tags: [],
  customFields: {},
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Gets a consistent color from the palette based on tag name hash.
 * Used as fallback when tag has no custom color.
 */
export function getTagColorFromHash(tagName: string): TagColor {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    const char = tagName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index];
}

/**
 * Validates if a string is a valid hex color.
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Gets contrasting text color (black or white) for a given background color.
 */
export function getContrastingTextColor(hexColor: string): '#000000' | '#FFFFFF' {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
