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
      cliplyst_captions: {
        Row: {
          caption_text: string
          clip_id: string | null
          created_at: string
          hashtags: string[] | null
          id: string
          is_selected: boolean | null
          platform: string
          seo_score: number | null
          tone: string | null
          trend_id: string | null
          user_id: string
        }
        Insert: {
          caption_text: string
          clip_id?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: string
          is_selected?: boolean | null
          platform: string
          seo_score?: number | null
          tone?: string | null
          trend_id?: string | null
          user_id: string
        }
        Update: {
          caption_text?: string
          clip_id?: string | null
          created_at?: string
          hashtags?: string[] | null
          id?: string
          is_selected?: boolean | null
          platform?: string
          seo_score?: number | null
          tone?: string | null
          trend_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliplyst_captions_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "cliplyst_clips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliplyst_captions_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "cliplyst_trends"
            referencedColumns: ["id"]
          },
        ]
      }
      cliplyst_clips: {
        Row: {
          ai_score: number | null
          created_at: string
          duration_seconds: number | null
          end_time: number | null
          id: string
          platform_id: string | null
          start_time: number | null
          status: string
          storage_path: string | null
          title: string
          updated_at: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          ai_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: number | null
          id?: string
          platform_id?: string | null
          start_time?: number | null
          status?: string
          storage_path?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          ai_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          end_time?: number | null
          id?: string
          platform_id?: string | null
          start_time?: number | null
          status?: string
          storage_path?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliplyst_clips_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "cliplyst_platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliplyst_clips_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "cliplyst_videos"
            referencedColumns: ["id"]
          },
        ]
      }
      cliplyst_platforms: {
        Row: {
          aspect_ratio: string | null
          created_at: string
          icon: string | null
          id: string
          max_duration_seconds: number | null
          name: string
        }
        Insert: {
          aspect_ratio?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          max_duration_seconds?: number | null
          name: string
        }
        Update: {
          aspect_ratio?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          max_duration_seconds?: number | null
          name?: string
        }
        Relationships: []
      }
      cliplyst_schedules: {
        Row: {
          caption_id: string | null
          clip_id: string | null
          created_at: string
          error_message: string | null
          id: string
          platform: string
          published_at: string | null
          scheduled_at: string
          status: string
          updated_at: string
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          caption_id?: string | null
          clip_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          published_at?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          caption_id?: string | null
          clip_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          published_at?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliplyst_schedules_caption_id_fkey"
            columns: ["caption_id"]
            isOneToOne: false
            referencedRelation: "cliplyst_captions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliplyst_schedules_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "cliplyst_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      cliplyst_trends: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_selected: boolean | null
          niche: string
          platform: string
          scraped_at: string
          source_url: string | null
          title: string
          trend_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_selected?: boolean | null
          niche: string
          platform: string
          scraped_at?: string
          source_url?: string | null
          title: string
          trend_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_selected?: boolean | null
          niche?: string
          platform?: string
          scraped_at?: string
          source_url?: string | null
          title?: string
          trend_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      cliplyst_videos: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          status: string
          storage_path: string
          thumbnail_path: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          status?: string
          storage_path: string
          thumbnail_path?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          status?: string
          storage_path?: string
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          link_id: string | null
          original_url: string
          short_code: string
          user_id: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          id?: string
          last_clicked_at?: string | null
          link_id?: string | null
          original_url: string
          short_code: string
          user_id: string
        }
        Update: {
          click_count?: number
          created_at?: string
          id?: string
          last_clicked_at?: string | null
          link_id?: string | null
          original_url?: string
          short_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "short_links_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "links"
            referencedColumns: ["id"]
          },
        ]
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
      cliplyst_calculate_trend_score: {
        Args: { _engagement?: number; _relevance?: number; _velocity?: number }
        Returns: number
      }
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
