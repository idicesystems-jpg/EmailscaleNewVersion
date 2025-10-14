export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      domains: {
        Row: {
          created_at: string | null
          domain_name: string
          expiry_date: string | null
          id: string
          notes: string | null
          purchase_date: string | null
          registrar: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          domain_name: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string | null
          registrar?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          domain_name?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          purchase_date?: string | null
          registrar?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domains_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          id: string
          inbox_id: string
          placement: string | null
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          inbox_id: string
          placement?: string | null
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          inbox_id?: string
          placement?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_inbox_id_fkey"
            columns: ["inbox_id"]
            isOneToOne: false
            referencedRelation: "inboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inboxes: {
        Row: {
          created_at: string | null
          domain_id: string | null
          email_address: string
          first_name: string | null
          health_score: number | null
          id: string
          imap_host: string | null
          imap_password: string | null
          imap_port: number | null
          imap_username: string | null
          last_name: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_username: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          domain_id?: string | null
          email_address: string
          first_name?: string | null
          health_score?: number | null
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          last_name?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          domain_id?: string | null
          email_address?: string
          first_name?: string | null
          health_score?: number | null
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          last_name?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inboxes_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inboxes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_blacklist_checks: {
        Row: {
          blacklist_name: string
          checked_at: string | null
          created_at: string | null
          id: string
          ip_address: string
          is_blacklisted: boolean | null
          monitored_ip_id: string | null
          response_details: string | null
        }
        Insert: {
          blacklist_name: string
          checked_at?: string | null
          created_at?: string | null
          id?: string
          ip_address: string
          is_blacklisted?: boolean | null
          monitored_ip_id?: string | null
          response_details?: string | null
        }
        Update: {
          blacklist_name?: string
          checked_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string
          is_blacklisted?: boolean | null
          monitored_ip_id?: string | null
          response_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_blacklist_checks_monitored_ip_id_fkey"
            columns: ["monitored_ip_id"]
            isOneToOne: false
            referencedRelation: "monitored_ips"
            referencedColumns: ["id"]
          },
        ]
      }
      monitored_ips: {
        Row: {
          created_at: string | null
          hostname: string | null
          id: string
          ip_address: string
          notes: string | null
          server_location: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hostname?: string | null
          id?: string
          ip_address: string
          notes?: string | null
          server_location?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hostname?: string | null
          id?: string
          ip_address?: string
          notes?: string | null
          server_location?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_locked: boolean | null
          account_paused: boolean | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_active_at: string | null
          last_login: string | null
          next_billing_date: string | null
          phone: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          account_locked?: boolean | null
          account_paused?: boolean | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          last_active_at?: string | null
          last_login?: string | null
          next_billing_date?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          account_locked?: boolean | null
          account_paused?: boolean | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_active_at?: string | null
          last_login?: string | null
          next_billing_date?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spam_complaints: {
        Row: {
          complaint_details: string | null
          complaint_source: string | null
          complaint_type: string | null
          created_at: string | null
          email_address: string
          id: string
          ip_address: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string | null
        }
        Insert: {
          complaint_details?: string | null
          complaint_source?: string | null
          complaint_type?: string | null
          created_at?: string | null
          email_address: string
          id?: string
          ip_address?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string | null
        }
        Update: {
          complaint_details?: string | null
          complaint_source?: string | null
          complaint_type?: string | null
          created_at?: string | null
          email_address?: string
          id?: string
          ip_address?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spam_complaints_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          ticket_number: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_notes: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          note: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          note: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          note?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_notes_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warmup_accounts: {
        Row: {
          created_at: string | null
          current_daily_sent: number | null
          daily_limit: number | null
          id: string
          inbox_id: string
          progress_percentage: number | null
          updated_at: string | null
          user_id: string
          warmup_increment: number | null
          warmup_limit: number | null
          warmup_status: string | null
        }
        Insert: {
          created_at?: string | null
          current_daily_sent?: number | null
          daily_limit?: number | null
          id?: string
          inbox_id: string
          progress_percentage?: number | null
          updated_at?: string | null
          user_id: string
          warmup_increment?: number | null
          warmup_limit?: number | null
          warmup_status?: string | null
        }
        Update: {
          created_at?: string | null
          current_daily_sent?: number | null
          daily_limit?: number | null
          id?: string
          inbox_id?: string
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string
          warmup_increment?: number | null
          warmup_limit?: number | null
          warmup_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warmup_accounts_inbox_id_fkey"
            columns: ["inbox_id"]
            isOneToOne: false
            referencedRelation: "inboxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warmup_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warmup_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          from_email: string
          id: string
          landed_in: string | null
          message_id: string | null
          pool_account_id: string | null
          received_at: string | null
          replied_at: string | null
          sent_at: string | null
          status: string
          subject: string | null
          thread_id: string | null
          to_email: string
          updated_at: string | null
          warmup_account_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          from_email: string
          id?: string
          landed_in?: string | null
          message_id?: string | null
          pool_account_id?: string | null
          received_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status: string
          subject?: string | null
          thread_id?: string | null
          to_email: string
          updated_at?: string | null
          warmup_account_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          from_email?: string
          id?: string
          landed_in?: string | null
          message_id?: string | null
          pool_account_id?: string | null
          received_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          thread_id?: string | null
          to_email?: string
          updated_at?: string | null
          warmup_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warmup_logs_pool_account_id_fkey"
            columns: ["pool_account_id"]
            isOneToOne: false
            referencedRelation: "warmup_pool"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warmup_logs_warmup_account_id_fkey"
            columns: ["warmup_account_id"]
            isOneToOne: false
            referencedRelation: "warmup_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      warmup_pool: {
        Row: {
          created_at: string | null
          daily_sends: number | null
          email_address: string
          id: string
          imap_host: string | null
          imap_password: string | null
          imap_port: number | null
          imap_username: string | null
          last_send_at: string | null
          provider: string
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_username: string | null
          status: string | null
          total_sends: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_sends?: number | null
          email_address: string
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          last_send_at?: string | null
          provider: string
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: string | null
          total_sends?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_sends?: number | null
          email_address?: string
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          last_send_at?: string | null
          provider?: string
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: string | null
          total_sends?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "super_admin"
        | "admin_editor"
        | "admin_viewer"
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
  public: {
    Enums: {
      app_role: [
        "admin",
        "user",
        "super_admin",
        "admin_editor",
        "admin_viewer",
      ],
    },
  },
} as const
