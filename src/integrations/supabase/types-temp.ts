export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bd_ativo: {
        Row: {
          created_at: string | null
          id: number
          number: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          number?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          number?: string | null
        }
        Relationships: []
      }
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
    }
  }
}
