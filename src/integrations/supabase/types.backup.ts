export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      custom_fields_definitions: {
        Row: {
          cliente_phone: string
          created_at: string | null
          display_order: number | null
          field_key: string
          field_label: string
          field_type: string
          id: string
          options: Json | null
          required: boolean | null
          show_in_card: boolean | null
          show_in_list: boolean | null
          updated_at: string | null
        }
        Insert: {
          cliente_phone: string
          created_at?: string | null
          display_order?: number | null
          field_key: string
          field_label: string
          field_type: string
          id?: string
          options?: Json | null
          required?: boolean | null
          show_in_card?: boolean | null
          show_in_list?: boolean | null
          updated_at?: string | null
        }
        Update: {
          cliente_phone?: string
          created_at?: string | null
          display_order?: number | null
          field_key?: string
          field_label?: string
          field_type?: string
          id?: string
          options?: Json | null
          required?: boolean | null
          show_in_card?: boolean | null
          show_in_list?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_custom_fields_cliente"
            columns: ["cliente_phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      custom_fields_values: {
        Row: {
          contact_id: string
          field_key: string
          id: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          contact_id: string
          field_key: string
          id?: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          contact_id?: string
          field_key?: string
          id?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fk_custom_fields_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "evolution_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_ia_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          phone: string
          role: string
          session_id: string
          status: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          phone: string
          role: string
          session_id: string
          status?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          phone?: string
          role?: string
          session_id?: string
          status?: string
        }
        Relationships: []
      }
      chat_ia_sessions: {
        Row: {
          created_at: string | null
          id: string
          phone: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          phone: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          phone?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          billing_provider: string | null
          cpf: string | null
          created_at: string
          email: string | null
          external_subscription_id: string | null
          is_active: boolean
          last_seen_at: string | null
          name: string
          phone: string
          plan_id: string | null
          refund_period_ends_at: string | null
          stripe_customer_id: string | null
          subscription_active: boolean
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          billing_provider?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          external_subscription_id?: string | null
          is_active?: boolean
          last_seen_at?: string | null
          name: string
          phone: string
          plan_id?: string | null
          refund_period_ends_at?: string | null
          stripe_customer_id?: string | null
          subscription_active?: boolean
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          billing_provider?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          external_subscription_id?: string | null
          is_active?: boolean
          last_seen_at?: string | null
          name?: string
          phone?: string
          plan_id?: string | null
          refund_period_ends_at?: string | null
          stripe_customer_id?: string | null
          subscription_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      evolution_contacts: {
        Row: {
          created_at: string | null
          crm_closed_at: string | null
          crm_estimated_value: number | null
          crm_favorite: boolean | null
          crm_last_interaction_at: string | null
          crm_lead_score: number | null
          crm_lead_status: string | null
          crm_notes: string | null
          crm_tags: string[] | null
          id: string
          instance_id: string
          is_group: boolean | null
          is_saved: boolean | null
          phone: string
          profile_pic_url: string | null
          push_name: string | null
          remote_jid: string
          sync_source: string | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crm_closed_at?: string | null
          crm_estimated_value?: number | null
          crm_favorite?: boolean | null
          crm_last_interaction_at?: string | null
          crm_lead_score?: number | null
          crm_lead_status?: string | null
          crm_notes?: string | null
          crm_tags?: string[] | null
          id?: string
          instance_id: string
          is_group?: boolean | null
          is_saved?: boolean | null
          phone: string
          profile_pic_url?: string | null
          push_name?: string | null
          remote_jid: string
          sync_source?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crm_closed_at?: string | null
          crm_estimated_value?: number | null
          crm_favorite?: boolean | null
          crm_last_interaction_at?: string | null
          crm_lead_score?: number | null
          crm_lead_status?: string | null
          crm_notes?: string | null
          crm_tags?: string[] | null
          id?: string
          instance_id?: string
          is_group?: boolean | null
          is_saved?: boolean | null
          phone?: string
          profile_pic_url?: string | null
          push_name?: string | null
          remote_jid?: string
          sync_source?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
