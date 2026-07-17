export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          author_id: string
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          occurred_at: string
          type: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          occurred_at?: string
          type: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          occurred_at?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          deal_id: string | null
          end_at: string
          google_event_id: string
          id: string
          meet_link: string | null
          start_at: string
          synced_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          end_at: string
          google_event_id: string
          id?: string
          meet_link?: string | null
          start_at: string
          synced_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          end_at?: string
          google_event_id?: string
          id?: string
          meet_link?: string | null
          start_at?: string
          synced_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          archived_at: string | null
          created_at: string
          deleted_at: string | null
          domain: string | null
          id: string
          industry: string | null
          logo_path: string | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          deleted_at?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          logo_path?: string | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          deleted_at?: string | null
          domain?: string | null
          id?: string
          industry?: string | null
          logo_path?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          deleted_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          deleted_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          deleted_at: string | null
          expected_close_date: string | null
          id: string
          job_title: string | null
          next_action: string | null
          notes: string | null
          owner_id: string
          primary_contact_id: string | null
          probability: number | null
          product_use_case: string | null
          stage: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          deleted_at?: string | null
          expected_close_date?: string | null
          id?: string
          job_title?: string | null
          next_action?: string | null
          notes?: string | null
          owner_id: string
          primary_contact_id?: string | null
          probability?: number | null
          product_use_case?: string | null
          stage?: string
          title?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          deleted_at?: string | null
          expected_close_date?: string | null
          id?: string
          job_title?: string | null
          next_action?: string | null
          notes?: string | null
          owner_id?: string
          primary_contact_id?: string | null
          probability?: number | null
          product_use_case?: string | null
          stage?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          attempt_number: number
          channel: string
          created_at: string
          id: string
          invoice_id: string
          scheduled_for: string
          status: string
          updated_at: string
        }
        Insert: {
          attempt_number?: number
          channel: string
          created_at?: string
          id?: string
          invoice_id: string
          scheduled_for: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempt_number?: number
          channel?: string
          created_at?: string
          id?: string
          invoice_id?: string
          scheduled_for?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          id: string
          provider: string
          provider_account_id: string | null
          refresh_token: string | null
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider: string
          provider_account_id?: string | null
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          provider?: string
          provider_account_id?: string | null
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          account_manager_id: string | null
          amount_due: number
          company_id: string
          created_at: string
          currency: string
          deleted_at: string | null
          due_date: string | null
          id: string
          invoice_number: string
          payment_link: string | null
          quote_id: string
          status: string
          stripe_invoice_id: string | null
          updated_at: string
        }
        Insert: {
          account_manager_id?: string | null
          amount_due?: number
          company_id: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          payment_link?: string | null
          quote_id: string
          status?: string
          stripe_invoice_id?: string | null
          updated_at?: string
        }
        Update: {
          account_manager_id?: string | null
          amount_due?: number
          company_id?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          payment_link?: string | null
          quote_id?: string
          status?: string
          stripe_invoice_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_account_manager_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          company_id: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          industry: string | null
          job_title: string | null
          linkedin_url: string | null
          location: string | null
          next_follow_up_date: string | null
          notes: string | null
          phone: string | null
          product_interest: string | null
          source: string | null
          status: string
          title: string | null
          updated_at: string
          value_estimate: number | null
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          linkedin_url?: string | null
          location?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          product_interest?: string | null
          source?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          value_estimate?: number | null
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          linkedin_url?: string | null
          location?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          phone?: string | null
          product_interest?: string | null
          source?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          value_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          invoice_id: string
          paid_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id: string
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string
          paid_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          description: string | null
          id: string
          name: string
          tax_rate: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name: string
          tax_rate?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          name?: string
          tax_rate?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_approvals: {
        Row: {
          approved_at: string | null
          approved_by_email: string | null
          approved_by_name: string | null
          created_at: string
          id: string
          ip_address: string | null
          magic_link_token: string
          quote_version_id: string
          signature_data: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_email?: string | null
          approved_by_name?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          magic_link_token: string
          quote_version_id: string
          signature_data?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by_email?: string | null
          approved_by_name?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          magic_link_token?: string
          quote_version_id?: string
          signature_data?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_approvals_quote_version_id_fkey"
            columns: ["quote_version_id"]
            isOneToOne: false
            referencedRelation: "quote_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_versions: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_current: boolean
          line_items: Json
          pdf_path: string | null
          quote_id: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          version_number: number
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_current?: boolean
          line_items?: Json
          pdf_path?: string | null
          quote_id: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          version_number: number
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_current?: boolean
          line_items?: Json
          pdf_path?: string | null
          quote_id?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_versions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          current_version: number
          deal_id: string
          deleted_at: string | null
          id: string
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          current_version?: number
          deal_id: string
          deleted_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          current_version?: number
          deal_id?: string
          deleted_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      slack_channels: {
        Row: {
          channel_name: string
          created_at: string
          deal_id: string
          id: string
          slack_channel_id: string
          updated_at: string
        }
        Insert: {
          channel_name: string
          created_at?: string
          deal_id: string
          id?: string
          slack_channel_id: string
          updated_at?: string
        }
        Update: {
          channel_name?: string
          created_at?: string
          deal_id?: string
          id?: string
          slack_channel_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_channels_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

