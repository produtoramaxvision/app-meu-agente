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
      billing_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          plan_id: string | null
          raw_payload: Json | null
          stripe_event_id: string | null
          user_phone: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          plan_id?: string | null
          raw_payload?: Json | null
          stripe_event_id?: string | null
          user_phone?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          plan_id?: string | null
          raw_payload?: Json | null
          stripe_event_id?: string | null
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_user_phone_fkey"
            columns: ["user_phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      calendars: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendars_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      chat_agente_sdr: {
        Row: {
          id: number
          message: Json | null
          session_id: string | null
        }
        Insert: {
          id?: number
          message?: Json | null
          session_id?: string | null
        }
        Update: {
          id?: number
          message?: Json | null
          session_id?: string | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "chat_ia_messages_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
          {
            foreignKeyName: "chat_ia_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_ia_sessions"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "chat_ia_sessions_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      chat_meu_agente: {
        Row: {
          id: number
          message: Json | null
          session_id: string | null
        }
        Insert: {
          id?: number
          message?: Json | null
          session_id?: string | null
        }
        Update: {
          id?: number
          message?: Json | null
          session_id?: string | null
        }
        Relationships: []
      }
      chat_remarketing: {
        Row: {
          id: number
          message: Json | null
          session_id: string | null
        }
        Insert: {
          id?: number
          message?: Json | null
          session_id?: string | null
        }
        Update: {
          id?: number
          message?: Json | null
          session_id?: string | null
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
      crm_activities: {
        Row: {
          activity_type: string
          contact_id: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          phone: string
          title: string
        }
        Insert: {
          activity_type: string
          contact_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          phone: string
          title: string
        }
        Update: {
          activity_type?: string
          contact_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          phone?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "evolution_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_evolution_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_automations: {
        Row: {
          action_config: Json
          action_type: string
          cliente_phone: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          trigger_config: Json
          trigger_count: number
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          cliente_phone: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          trigger_config?: Json
          trigger_count?: number
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          cliente_phone?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          trigger_config?: Json
          trigger_count?: number
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_automations_cliente_phone_fkey"
            columns: ["cliente_phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      crm_automation_logs: {
        Row: {
          action_type: string
          automation_id: string | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          lead_id: string | null
          status: string
        }
        Insert: {
          action_type: string
          automation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          lead_id?: string | null
          status: string
        }
        Update: {
          action_type?: string
          automation_id?: string | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          lead_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "crm_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_automation_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "evolution_contacts"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "fk_custom_fields_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_evolution_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          comment: string | null
          email: string
          event_id: string
          id: string
          invited_at: string | null
          name: string
          responded_at: string | null
          response: string | null
          role: string | null
        }
        Insert: {
          comment?: string | null
          email: string
          event_id: string
          id?: string
          invited_at?: string | null
          name: string
          responded_at?: string | null
          response?: string | null
          role?: string | null
        }
        Update: {
          comment?: string | null
          email?: string
          event_id?: string
          id?: string
          invited_at?: string | null
          name?: string
          responded_at?: string | null
          response?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          event_id: string
          id: string
          method: string | null
          offset_minutes: number | null
          payload: Json | null
        }
        Insert: {
          event_id: string
          id?: string
          method?: string | null
          offset_minutes?: number | null
          payload?: Json | null
        }
        Update: {
          event_id?: string
          id?: string
          method?: string | null
          offset_minutes?: number | null
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_resources: {
        Row: {
          event_id: string
          resource_id: string
        }
        Insert: {
          event_id: string
          resource_id: string
        }
        Update: {
          event_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_resources_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean | null
          calendar_id: string | null
          category: string | null
          color: string | null
          conference_url: string | null
          created_at: string | null
          description: string | null
          end_ts: string
          exdates: string[] | null
          id: string
          lead_remote_jid: string | null
          location: string | null
          phone: string
          priority: string | null
          privacy: string | null
          rdates: string[] | null
          rrule: string | null
          series_master_id: string | null
          start_ts: string
          status: string | null
          timezone: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          calendar_id?: string | null
          category?: string | null
          color?: string | null
          conference_url?: string | null
          created_at?: string | null
          description?: string | null
          end_ts: string
          exdates?: string[] | null
          id?: string
          lead_remote_jid?: string | null
          location?: string | null
          phone: string
          priority?: string | null
          privacy?: string | null
          rdates?: string[] | null
          rrule?: string | null
          series_master_id?: string | null
          start_ts: string
          status?: string | null
          timezone?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          calendar_id?: string | null
          category?: string | null
          color?: string | null
          conference_url?: string | null
          created_at?: string | null
          description?: string | null
          end_ts?: string
          exdates?: string[] | null
          id?: string
          lead_remote_jid?: string | null
          location?: string | null
          phone?: string
          priority?: string | null
          privacy?: string | null
          rdates?: string[] | null
          rrule?: string | null
          series_master_id?: string | null
          start_ts?: string
          status?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
          {
            foreignKeyName: "events_series_master_id_fkey"
            columns: ["series_master_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
          crm_loss_reason: string | null
          crm_loss_reason_details: string | null
          crm_notes: string | null
          crm_score_updated_at: string | null
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
          crm_loss_reason?: string | null
          crm_loss_reason_details?: string | null
          crm_notes?: string | null
          crm_score_updated_at?: string | null
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
          crm_loss_reason?: string | null
          crm_loss_reason_details?: string | null
          crm_notes?: string | null
          crm_score_updated_at?: string | null
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
        Relationships: [
          {
            foreignKeyName: "evolution_contacts_cache_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "evolution_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_instances: {
        Row: {
          connected_at: string | null
          connection_status: string | null
          created_at: string | null
          display_name: string | null
          id: string
          instance_name: string
          instance_token: string | null
          last_qr_update: string | null
          pairing_code: string | null
          phone: string
          qr_code: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          connected_at?: string | null
          connection_status?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          instance_name: string
          instance_token?: string | null
          last_qr_update?: string | null
          pairing_code?: string | null
          phone: string
          qr_code?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          connected_at?: string | null
          connection_status?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          instance_name?: string
          instance_token?: string | null
          last_qr_update?: string | null
          pairing_code?: string | null
          phone?: string
          qr_code?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_instances_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      financeiro_registros: {
        Row: {
          categoria: string
          created_at: string | null
          data_hora: string | null
          data_vencimento: string | null
          descricao: string | null
          id: number
          phone: string
          recorrencia_fim: string | null
          recorrente: boolean | null
          status: string | null
          tipo: Database["public"]["Enums"]["financeiro_tipo"]
          updated_at: string | null
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data_hora?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id?: number
          phone: string
          recorrencia_fim?: string | null
          recorrente?: boolean | null
          status?: string | null
          tipo: Database["public"]["Enums"]["financeiro_tipo"]
          updated_at?: string | null
          valor: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data_hora?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          id?: number
          phone?: string
          recorrencia_fim?: string | null
          recorrente?: boolean | null
          status?: string | null
          tipo?: Database["public"]["Enums"]["financeiro_tipo"]
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_registros_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      focus_blocks: {
        Row: {
          created_at: string | null
          goal_minutes: number
          id: string
          phone: string
          priority: string | null
          recurrence_rrule: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          goal_minutes: number
          id?: string
          phone: string
          priority?: string | null
          recurrence_rrule?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          goal_minutes?: number
          id?: string
          phone?: string
          priority?: string | null
          recurrence_rrule?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "focus_blocks_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      ingestion_log: {
        Row: {
          external_id: string
          id: string
          phone: string | null
          raw: Json
          received_at: string | null
          source: string
          upserted_event_id: string | null
        }
        Insert: {
          external_id: string
          id?: string
          phone?: string | null
          raw: Json
          received_at?: string | null
          source: string
          upserted_event_id?: string | null
        }
        Update: {
          external_id?: string
          id?: string
          phone?: string | null
          raw?: Json
          received_at?: string | null
          source?: string
          upserted_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_log_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
          {
            foreignKeyName: "ingestion_log_upserted_event_id_fkey"
            columns: ["upserted_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          created_at: string | null
          icone: string | null
          id: string
          meta_principal: boolean | null
          phone: string
          prazo_meses: number | null
          titulo: string
          updated_at: string | null
          valor_atual: number | null
          valor_meta: number
        }
        Insert: {
          created_at?: string | null
          icone?: string | null
          id?: string
          meta_principal?: boolean | null
          phone: string
          prazo_meses?: number | null
          titulo: string
          updated_at?: string | null
          valor_atual?: number | null
          valor_meta: number
        }
        Update: {
          created_at?: string | null
          icone?: string | null
          id?: string
          meta_principal?: boolean | null
          phone?: string
          prazo_meses?: number | null
          titulo?: string
          updated_at?: string | null
          valor_atual?: number | null
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          lida: boolean | null
          mensagem: string
          phone: string
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          lida?: boolean | null
          mensagem: string
          phone: string
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          lida?: boolean | null
          mensagem?: string
          phone?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      plan_access_logs: {
        Row: {
          access_granted: boolean
          action: string
          created_at: string | null
          id: string
          plan_id: string | null
          resource: string
          user_phone: string
        }
        Insert: {
          access_granted: boolean
          action: string
          created_at?: string | null
          id?: string
          plan_id?: string | null
          resource: string
          user_phone: string
        }
        Update: {
          access_granted?: boolean
          action?: string
          created_at?: string | null
          id?: string
          plan_id?: string | null
          resource?: string
          user_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_access_logs_user_phone_fkey"
            columns: ["user_phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          analytics_tracking: boolean | null
          consent_date: string | null
          cookie_consent: boolean | null
          created_at: string | null
          data_collection: boolean | null
          data_processing: boolean | null
          data_retention: number | null
          data_sharing: boolean | null
          id: string
          last_updated: string | null
          marketing_emails: boolean | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          analytics_tracking?: boolean | null
          consent_date?: string | null
          cookie_consent?: boolean | null
          created_at?: string | null
          data_collection?: boolean | null
          data_processing?: boolean | null
          data_retention?: number | null
          data_sharing?: boolean | null
          id?: string
          last_updated?: string | null
          marketing_emails?: boolean | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          analytics_tracking?: boolean | null
          consent_date?: string | null
          cookie_consent?: boolean | null
          created_at?: string | null
          data_collection?: boolean | null
          data_processing?: boolean | null
          data_retention?: number | null
          data_sharing?: boolean | null
          id?: string
          last_updated?: string | null
          marketing_emails?: boolean | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          name: string
          phone: string
          type: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name: string
          phone: string
          type: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          phone?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      scheduling_links: {
        Row: {
          active: boolean | null
          booking_rules: Json | null
          calendar_id: string | null
          created_at: string | null
          id: string
          mode: string | null
          phone: string
          public_slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          booking_rules?: Json | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          mode?: string | null
          phone: string
          public_slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          booking_rules?: Json | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          mode?: string | null
          phone?: string
          public_slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduling_links_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduling_links_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      sdr_agent_config: {
        Row: {
          config_json: Json
          created_at: string | null
          id: string
          instance_id: string | null
          is_active: boolean | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          config_json?: Json
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          config_json?: Json
          created_at?: string | null
          id?: string
          instance_id?: string | null
          is_active?: boolean | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdr_agent_config_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "evolution_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_agent_config_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          attachments: Json | null
          created_at: string | null
          description: string
          id: string
          priority: string | null
          status: string | null
          subject: string
          ticket_number: string
          type: string
          updated_at: string | null
          user_phone: string | null
        }
        Insert: {
          admin_notes?: string | null
          attachments?: Json | null
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          status?: string | null
          subject: string
          ticket_number: string
          type: string
          updated_at?: string | null
          user_phone?: string | null
        }
        Update: {
          admin_notes?: string | null
          attachments?: Json | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string
          type?: string
          updated_at?: string | null
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_phone_fkey"
            columns: ["user_phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      sync_state: {
        Row: {
          created_at: string | null
          error: string | null
          external_calendar_id: string
          id: string
          last_synced_at: string | null
          phone: string
          provider: string
          status: string | null
          sync_token: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          external_calendar_id: string
          id?: string
          last_synced_at?: string | null
          phone: string
          provider: string
          status?: string | null
          sync_token?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          external_calendar_id?: string
          id?: string
          last_synced_at?: string | null
          phone?: string
          provider?: string
          status?: string | null
          sync_token?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_state_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_remote_jid: string | null
          phone: string
          position: number | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_remote_jid?: string | null
          phone: string
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_remote_jid?: string | null
          phone?: string
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_phone_fkey"
            columns: ["phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
        ]
      }
    }
    Views: {
      vw_custom_fields_with_values: {
        Row: {
          cliente_phone: string | null
          contact_id: string | null
          definition_id: string | null
          display_order: number | null
          field_key: string | null
          field_label: string | null
          field_type: string | null
          options: Json | null
          required: boolean | null
          show_in_card: boolean | null
          show_in_list: boolean | null
          value: Json | null
          value_updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_custom_fields_cliente"
            columns: ["cliente_phone"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["phone"]
          },
          {
            foreignKeyName: "fk_custom_fields_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "evolution_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_custom_fields_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "vw_evolution_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_evolution_contacts: {
        Row: {
          created_at: string | null
          crm_favorite: boolean | null
          crm_last_interaction_at: string | null
          crm_lead_score: number | null
          crm_lead_status: string | null
          crm_notes: string | null
          crm_tags: string[] | null
          id: string | null
          instance_id: string | null
          is_group: boolean | null
          is_saved: boolean | null
          phone: string | null
          profile_pic_url: string | null
          push_name: string | null
          remote_jid: string | null
          seconds_since_sync: number | null
          sync_freshness: string | null
          sync_source: string | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crm_favorite?: boolean | null
          crm_last_interaction_at?: string | null
          crm_lead_score?: number | null
          crm_lead_status?: string | null
          crm_notes?: string | null
          crm_tags?: string[] | null
          id?: string | null
          instance_id?: string | null
          is_group?: boolean | null
          is_saved?: boolean | null
          phone?: string | null
          profile_pic_url?: string | null
          push_name?: string | null
          remote_jid?: string | null
          seconds_since_sync?: never
          sync_freshness?: never
          sync_source?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crm_favorite?: boolean | null
          crm_last_interaction_at?: string | null
          crm_lead_score?: number | null
          crm_lead_status?: string | null
          crm_notes?: string | null
          crm_tags?: string[] | null
          id?: string | null
          instance_id?: string | null
          is_group?: boolean | null
          is_saved?: boolean | null
          phone?: string | null
          profile_pic_url?: string | null
          push_name?: string | null
          remote_jid?: string | null
          seconds_since_sync?: never
          sync_freshness?: never
          sync_source?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_contacts_cache_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "evolution_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_create_new_instance: { Args: { p_phone: string }; Returns: boolean }
      check_permission_with_log: {
        Args: {
          p_permission_type: string
          p_resource: string
          p_user_phone: string
        }
        Returns: boolean
      }
      check_phone_exists: { Args: { phone_number: string }; Returns: boolean }
      check_phone_registration: {
        Args: { phone_input: string }
        Returns: {
          email: string
          has_auth_id: boolean
          name: string
          phone_exists: boolean
        }[]
      }
      delete_user_data: { Args: never; Returns: Json }
      email_to_phone: { Args: { email_address: string }; Returns: string }
      export_user_data: { Args: never; Returns: Json }
      generate_instance_display_name: {
        Args: { p_phone: string }
        Returns: string
      }
      generate_ticket_number: { Args: never; Returns: string }
      get_authenticated_user_phone: { Args: never; Returns: string }
      get_max_instances_for_user: { Args: { p_phone: string }; Returns: number }
      get_sdr_config_for_n8n: { Args: { p_phone: string }; Returns: Json }
      get_user_email_by_phone: {
        Args: { phone_number: string }
        Returns: {
          auth_user_id: string
          email: string
        }[]
      }
      get_user_phone_optimized: { Args: never; Returns: string }
      get_user_ticket_limit: {
        Args: { user_phone_param: string }
        Returns: number
      }
      has_active_subscription:
        | {
            Args: { p_plan_id: string; p_subscription_active: boolean }
            Returns: boolean
          }
        | { Args: { user_id?: string }; Returns: boolean }
        | { Args: { user_phone: string }; Returns: boolean }
      invalidate_contacts_cache: {
        Args: { p_instance_id: string }
        Returns: undefined
      }
      is_in_refund_period:
        | { Args: { subscription_date: string }; Returns: boolean }
        | { Args: { user_id?: string }; Returns: boolean }
      link_client_to_auth_user: {
        Args: { auth_user_uuid: string; client_phone: string }
        Returns: boolean
      }
      log_plan_access_attempt: {
        Args: {
          p_access_granted: boolean
          p_action: string
          p_resource: string
          p_user_phone: string
        }
        Returns: undefined
      }
      migrate_users_to_supabase_auth: {
        Args: never
        Returns: {
          auth_user_id: string
          email: string
          error_message: string
          phone: string
          success: boolean
        }[]
      }
      phone_to_email: { Args: { phone_number: string }; Returns: string }
      prepare_user_migration_data: {
        Args: never
        Returns: {
          name: string
          phone: string
          synthetic_email: string
          user_metadata: Json
        }[]
      }
      refund_period_days_remaining:
        | { Args: { subscription_date: string }; Returns: number }
        | { Args: { user_id?: string }; Returns: number }
      sync_cliente_auth_user_id: {
        Args: {
          p_auth_user_id: string
          p_cpf: string
          p_email: string
          p_name: string
          p_phone: string
        }
        Returns: undefined
      }
      sync_cliente_email_from_auth: {
        Args: { user_id: string }
        Returns: boolean
      }
      update_instance_display_name: {
        Args: { p_display_name: string; p_instance_id: string }
        Returns: boolean
      }
      update_sdr_config_section: {
        Args: { p_data: Json; p_phone: string; p_section: string }
        Returns: Json
      }
      update_sdr_ia_config: {
        Args: {
          p_frequency_penalty: number
          p_max_tokens: number
          p_model: string
          p_phone: string
          p_presence_penalty: number
          p_temperature: number
          p_top_p: number
        }
        Returns: Json
      }
      user_has_advanced_features: {
        Args: { user_phone: string }
        Returns: boolean
      }
      user_has_export_permission: {
        Args: { user_phone: string }
        Returns: boolean
      }
      user_has_support_access: {
        Args: { user_phone: string }
        Returns: boolean
      }
      user_has_whatsapp_access: {
        Args: { user_phone: string }
        Returns: boolean
      }
      validate_field_key: { Args: { key: string }; Returns: boolean }
    }
    Enums: {
      delivery_status: "pending" | "delivered" | "failed" | "discarded"
      execution_status:
        | "queued"
        | "running"
        | "succeeded"
        | "failed"
        | "canceled"
      financeiro_tipo: "entrada" | "saida"
      llm_provider: "openai" | "azure_openai" | "anthropic" | "google" | "other"
      message_direction: "inbound" | "outbound"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
      task_priority: "low" | "medium" | "high"
      task_status: "pending" | "done" | "overdue"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Convenience type aliases for CRM Automations
export type CrmAutomation = Tables<"crm_automations">
export type CrmAutomationInsert = TablesInsert<"crm_automations">
export type CrmAutomationUpdate = TablesUpdate<"crm_automations">

// Convenience type aliases for CRM Automation Logs
export type CrmAutomationLog = Tables<"crm_automation_logs">
export type CrmAutomationLogInsert = TablesInsert<"crm_automation_logs">
export type CrmAutomationLogUpdate = TablesUpdate<"crm_automation_logs">

// Trigger types for automations
export type AutomationTriggerType = 
  | "status_change"
  | "time_in_status"
  | "value_threshold"
  | "no_interaction"

// Action types for automations
export type AutomationActionType = 
  | "create_task"
  | "send_notification"
  | "update_field"
  | "send_whatsapp"

// Trigger configuration types
export interface StatusChangeTriggerConfig {
  from_status?: string
  to_status: string
}

export interface TimeInStatusTriggerConfig {
  status: string
  days: number
}

export interface ValueThresholdTriggerConfig {
  field: string
  operator: "gt" | "lt" | "eq" | "gte" | "lte"
  value: number
}

export interface NoInteractionTriggerConfig {
  days: number
}

// Action configuration types
export interface CreateTaskActionConfig {
  title: string
  description?: string
  priority?: "low" | "medium" | "high"
  due_days?: number
}

export interface SendNotificationActionConfig {
  title: string
  message: string
  type?: string
}

export interface UpdateFieldActionConfig {
  field: string
  value: string | number | boolean
}

export interface SendWhatsappActionConfig {
  template?: string
  message?: string
}
