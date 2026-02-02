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
      ab_tests: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          name: string
          status: string
          user_id: string
          variant_a_id: string
          variant_b_id: string
          winner_variant: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          name: string
          status?: string
          user_id: string
          variant_a_id: string
          variant_b_id: string
          winner_variant?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          name?: string
          status?: string
          user_id?: string
          variant_a_id?: string
          variant_b_id?: string
          winner_variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ab_tests_variant_a_id_fkey"
            columns: ["variant_a_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_tests_variant_b_id_fkey"
            columns: ["variant_b_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      expire_links: {
        Row: {
          created_at: string
          expire_type: string
          expires_at: string | null
          id: string
          is_active: boolean
          link_id: string
          max_clicks: number | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expire_type: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          link_id: string
          max_clicks?: number | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          expire_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          link_id?: string
          max_clicks?: number | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expire_links_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      link_clicks: {
        Row: {
          browser: string | null
          clicked_at: string
          continent: string | null
          converted: boolean
          country: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          link_id: string
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          clicked_at?: string
          continent?: string | null
          converted?: boolean
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id: string
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          clicked_at?: string
          continent?: string | null
          converted?: boolean
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          id: string
          platform: string
          short_code: string
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          short_code: string
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          short_code?: string
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      merchants: {
        Row: {
          created_at: string
          id: string
          shop_domain: string | null
          shopify_access_token: string | null
          shopify_charge_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          trial_end_date: string
          trial_start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shop_domain?: string | null
          shopify_access_token?: string | null
          shopify_charge_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_end_date?: string
          trial_start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shop_domain?: string | null
          shopify_access_token?: string | null
          shopify_charge_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_end_date?: string
          trial_start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          business_niche: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          business_niche?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          business_niche?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      short_links: {
        Row: {
          click_count: number
          created_at: string
          id: string
          last_clicked_at: string | null
          original_url: string
          short_code: string
          user_id: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          id?: string
          last_clicked_at?: string | null
          original_url: string
          short_code: string
          user_id: string
        }
        Update: {
          click_count?: number
          created_at?: string
          id?: string
          last_clicked_at?: string | null
          original_url?: string
          short_code?: string
          user_id?: string
        }
        Relationships: []
      }
      smart_link_clicks: {
        Row: {
          browser: string | null
          clicked_at: string
          continent: string | null
          country: string | null
          destination_url: string
          device_type: string | null
          id: string
          ip_address: string | null
          link_id: string | null
          merchant_id: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          clicked_at?: string
          continent?: string | null
          country?: string | null
          destination_url: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          merchant_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          clicked_at?: string
          continent?: string | null
          country?: string | null
          destination_url?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          merchant_id?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smart_link_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_status: "trial" | "active" | "cancelled" | "expired"
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
      subscription_status: ["trial", "active", "cancelled", "expired"],
    },
  },
} as const
