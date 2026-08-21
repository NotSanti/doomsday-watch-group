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
      group_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          group_id: string
          id: string
          max_uses: number | null
          revoked_at: string | null
          token_hash: string
          token: string | null
          use_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          group_id: string
          id?: string
          max_uses?: number | null
          revoked_at?: string | null
          token_hash: string
          token?: string | null
          use_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          group_id?: string
          id?: string
          max_uses?: number | null
          revoked_at?: string | null
          token_hash?: string
          token?: string | null
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          role: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_skipped_titles: {
        Row: {
          group_id: string
          skipped_at: string
          skipped_by: string
          title_id: string
        }
        Insert: {
          group_id: string
          skipped_at?: string
          skipped_by: string
          title_id: string
        }
        Update: {
          group_id?: string
          skipped_at?: string
          skipped_by?: string
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_skipped_titles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_skipped_titles_skipped_by_fkey"
            columns: ["skipped_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_skipped_titles_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          current_title_id: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          target_date: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_title_id?: string | null
          description?: string | null
          id?: string
          name: string
          owner_id: string
          target_date: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_title_id?: string | null
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          target_date?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_current_title_id_fkey"
            columns: ["current_title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_title_progress: {
        Row: {
          group_id: string
          started_at: string | null
          status: string
          title_id: string
          updated_at: string
          user_id: string
          watched_at: string | null
        }
        Insert: {
          group_id: string
          started_at?: string | null
          status: string
          title_id: string
          updated_at?: string
          user_id: string
          watched_at?: string | null
        }
        Update: {
          group_id?: string
          started_at?: string | null
          status?: string
          title_id?: string
          updated_at?: string
          user_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_title_progress_group_id_user_id_fkey"
            columns: ["group_id", "user_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "user_id"]
          },
          {
            foreignKeyName: "member_title_progress_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_outbox: {
        Row: {
          created_at: string
          error: string | null
          id: number
          notification_type: string
          payload: Json
          recipient_id: string
          sent_at: string | null
          status: Database['public']['Enums']['notification_outbox_status']
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: never
          notification_type: string
          payload?: Json
          recipient_id: string
          sent_at?: string | null
          status?: Database['public']['Enums']['notification_outbox_status']
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: never
          notification_type?: string
          payload?: Json
          recipient_id?: string
          sent_at?: string | null
          status?: Database['public']['Enums']['notification_outbox_status']
        }
        Relationships: [
          {
            foreignKeyName: "notification_outbox_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          daily_countdown: boolean
          group_ready_for_next_title: boolean
          last_daily_countdown_sent_on: string | null
          member_joined: boolean
          member_rated: boolean
          member_reviewed: boolean
          member_watched: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_countdown?: boolean
          group_ready_for_next_title?: boolean
          last_daily_countdown_sent_on?: string | null
          member_joined?: boolean
          member_rated?: boolean
          member_reviewed?: boolean
          member_watched?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_countdown?: boolean
          group_ready_for_next_title?: boolean
          last_daily_countdown_sent_on?: string | null
          member_joined?: boolean
          member_rated?: boolean
          member_reviewed?: boolean
          member_watched?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: [        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          contains_spoilers: boolean
          created_at: string
          group_id: string
          id: string
          rating: number
          title_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          contains_spoilers?: boolean
          created_at?: string
          group_id: string
          id?: string
          rating: number
          title_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          contains_spoilers?: boolean
          created_at?: string
          group_id?: string
          id?: string
          rating?: number
          title_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_group_id_user_id_fkey"
            columns: ["group_id", "user_id"]
            isOneToOne: false
            referencedRelation: "group_members"
            referencedColumns: ["group_id", "user_id"]
          },
          {
            foreignKeyName: "reviews_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      titles: {
        Row: {
          backdrop_path: string | null
          doomsday_order: number | null
          episode_count: number | null
          era: string | null
          id: string
          importance: string
          is_active: boolean
          media_type: string
          metadata_updated_at: string | null
          name: string
          phase: number | null
          poster_path: string | null
          release_date: string | null
          release_order: number
          runtime_minutes: number | null
          saga: string | null
          synopsis: string | null
          tmdb_id: number | null
        }
        Insert: {
          backdrop_path?: string | null
          doomsday_order?: number | null
          episode_count?: number | null
          era?: string | null
          id?: string
          importance: string
          is_active?: boolean
          media_type: string
          metadata_updated_at?: string | null
          name: string
          phase?: number | null
          poster_path?: string | null
          release_date?: string | null
          release_order: number
          runtime_minutes?: number | null
          saga?: string | null
          synopsis?: string | null
          tmdb_id?: number | null
        }
        Update: {
          backdrop_path?: string | null
          doomsday_order?: number | null
          episode_count?: number | null
          era?: string | null
          id?: string
          importance?: string
          is_active?: boolean
          media_type?: string
          metadata_updated_at?: string | null
          name?: string
          phase?: number | null
          poster_path?: string | null
          release_date?: string | null
          release_order?: number
          runtime_minutes?: number | null
          saga?: string | null
          synopsis?: string | null
          tmdb_id?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_group: {
        Args: {
          p_description?: string
          p_name: string
          p_target_date?: string
          p_timezone?: string
        }
        Returns: {
          created_at: string
          current_title_id: string | null
          description: string | null
          id: string
          name: string
          owner_id: string
          target_date: string
          timezone: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "groups"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_invite: {
        Args: { p_expires_at?: string; p_group_id: string; p_max_uses?: number }
        Returns: {
          expires_at: string
          invite_id: string
          max_uses: number
          token: string
        }[]
      }
      current_user_is_membership: {
        Args: { group_uuid: string; user_uuid: string }
        Returns: boolean
      }
      hash_invite_token: { Args: { raw_token: string }; Returns: string }
      is_group_member: { Args: { group_uuid: string }; Returns: boolean }
      is_group_owner: { Args: { group_uuid: string }; Returns: boolean }
      leave_group: { Args: { p_group_id: string }; Returns: undefined }
      preview_invite: {
        Args: { p_token: string }
        Returns: {
          group_name: string
          invalid_reason: string
          is_valid: boolean
          member_count: number
          owner_display_name: string
        }[]
      }
      redeem_invite: {
        Args: { p_token: string }
        Returns: {
          already_member: boolean
          group_id: string
        }[]
      }
      advance_current_title_if_ready: {
        Args: { p_group_id: string }
        Returns: string
      }
      revoke_invite: { Args: { p_invite_id: string }; Returns: undefined }
      delete_invite: { Args: { p_invite_id: string }; Returns: undefined }
      transfer_ownership: {
        Args: { p_group_id: string; p_new_owner_id: string }
        Returns: undefined
      }
    }
    Enums: {
      notification_outbox_status: 'pending' | 'sent' | 'failed'
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

