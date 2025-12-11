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
      api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_read_only: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_read_only?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_read_only?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          resource_id: string | null
          resource_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          lectures_done: number | null
          lectures_total: number | null
          name: string
          priority: number | null
          recording_status: string | null
          recording_url: string | null
          subject_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          lectures_done?: number | null
          lectures_total?: number | null
          name: string
          priority?: number | null
          recording_status?: string | null
          recording_url?: string | null
          subject_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          lectures_done?: number | null
          lectures_total?: number | null
          name?: string
          priority?: number | null
          recording_status?: string | null
          recording_url?: string | null
          subject_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lectures: {
        Row: {
          chapter_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          lecture_number: number
          name: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          lecture_number: number
          name: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          lecture_number?: number
          name?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lectures_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lectures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          reminder_time: Database["public"]["Enums"]["reminder_time"]
          template_type: string
          tone: Database["public"]["Enums"]["tone_type"]
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          reminder_time: Database["public"]["Enums"]["reminder_time"]
          template_type: string
          tone: Database["public"]["Enums"]["tone_type"]
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          reminder_time?: Database["public"]["Enums"]["reminder_time"]
          template_type?: string
          tone?: Database["public"]["Enums"]["tone_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          days_available: number | null
          display_name: string | null
          email: string | null
          id: string
          max_lectures_per_day: number | null
          question_interval_high: number | null
          question_interval_low: number | null
          question_interval_medium: number | null
          reminder_evening: string | null
          reminder_midday: string | null
          reminder_morning: string | null
          safety_opt_out: boolean | null
          start_date: string | null
          tone_preference: Database["public"]["Enums"]["tone_type"] | null
          tough_love_consent: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_available?: number | null
          display_name?: string | null
          email?: string | null
          id: string
          max_lectures_per_day?: number | null
          question_interval_high?: number | null
          question_interval_low?: number | null
          question_interval_medium?: number | null
          reminder_evening?: string | null
          reminder_midday?: string | null
          reminder_morning?: string | null
          safety_opt_out?: boolean | null
          start_date?: string | null
          tone_preference?: Database["public"]["Enums"]["tone_type"] | null
          tough_love_consent?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_available?: number | null
          display_name?: string | null
          email?: string | null
          id?: string
          max_lectures_per_day?: number | null
          question_interval_high?: number | null
          question_interval_low?: number | null
          question_interval_medium?: number | null
          reminder_evening?: string | null
          reminder_midday?: string | null
          reminder_morning?: string | null
          safety_opt_out?: boolean | null
          start_date?: string | null
          tone_preference?: Database["public"]["Enums"]["tone_type"] | null
          tough_love_consent?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          chapter_id: string
          content: string
          created_at: string | null
          id: string
          last_seen_at: string | null
          next_due: string | null
          stars: number | null
          tags: string[] | null
          times_seen: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          content: string
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          next_due?: string | null
          stars?: number | null
          tags?: string[] | null
          times_seen?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          content?: string
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          next_due?: string | null
          stars?: number | null
          tags?: string[] | null
          times_seen?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recordings: {
        Row: {
          chapter_id: string
          created_at: string | null
          duration_seconds: number | null
          file_name: string | null
          file_url: string | null
          id: string
          is_done: boolean | null
          marked_done_at: string | null
          scheduled_for: string | null
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_done?: boolean | null
          marked_done_at?: string | null
          scheduled_for?: string | null
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_done?: boolean | null
          marked_done_at?: string | null
          scheduled_for?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string | null
          id: string
          is_sent: boolean | null
          message: string
          reminder_time: Database["public"]["Enums"]["reminder_time"]
          schedule_task_id: string | null
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          message: string
          reminder_time: Database["public"]["Enums"]["reminder_time"]
          schedule_task_id?: string | null
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          message?: string
          reminder_time?: Database["public"]["Enums"]["reminder_time"]
          schedule_task_id?: string | null
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_schedule_task_id_fkey"
            columns: ["schedule_task_id"]
            isOneToOne: false
            referencedRelation: "schedule_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          reference_id: string | null
          reference_type: string | null
          task_date: string
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          task_date: string
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          reference_id?: string | null
          reference_type?: string | null
          task_date?: string
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          subject_type: Database["public"]["Enums"]["subject_type"]
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          subject_type: Database["public"]["Enums"]["subject_type"]
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          subject_type?: Database["public"]["Enums"]["subject_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempts: number | null
          created_at: string | null
          event_type: Database["public"]["Enums"]["webhook_event_type"]
          id: string
          is_successful: boolean | null
          last_attempt_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          subscription_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          event_type: Database["public"]["Enums"]["webhook_event_type"]
          id?: string
          is_successful?: boolean | null
          last_attempt_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          subscription_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          event_type?: Database["public"]["Enums"]["webhook_event_type"]
          id?: string
          is_successful?: boolean | null
          last_attempt_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "webhook_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_subscriptions: {
        Row: {
          created_at: string | null
          event_types:
            | Database["public"]["Enums"]["webhook_event_type"][]
            | null
          id: string
          ip_allowlist: string[] | null
          is_active: boolean | null
          name: string
          secret_key: string
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_types?:
            | Database["public"]["Enums"]["webhook_event_type"][]
            | null
          id?: string
          ip_allowlist?: string[] | null
          is_active?: boolean | null
          name: string
          secret_key: string
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_types?:
            | Database["public"]["Enums"]["webhook_event_type"][]
            | null
          id?: string
          ip_allowlist?: string[] | null
          is_active?: boolean | null
          name?: string
          secret_key?: string
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_audit_state: {
        Args: { p_date?: string; p_user_id: string }
        Returns: Json
      }
      get_changes_since: {
        Args: { p_since: string; p_user_id: string }
        Returns: Json
      }
      get_daily_expected_state: {
        Args: { p_date?: string; p_user_id: string }
        Returns: Json
      }
      get_due_questions: {
        Args: { p_date?: string; p_user_id: string }
        Returns: Json
      }
      get_recordings_ready: {
        Args: { p_date?: string; p_user_id: string }
        Returns: Json
      }
      get_todays_tasks: {
        Args: { p_date?: string; p_user_id: string }
        Returns: Json
      }
      mark_lecture_done: {
        Args: { p_lecture_id: string; p_user_id: string }
        Returns: Json
      }
      mark_question_seen: {
        Args: { p_question_id: string; p_user_id: string }
        Returns: Json
      }
      mark_recording_done: {
        Args: { p_chapter_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      reminder_time: "morning" | "midday" | "evening"
      subject_type: "math" | "physics" | "chemistry"
      task_type:
        | "new_chapter"
        | "lecture"
        | "revision_question"
        | "revision_recording"
        | "weekly_test"
      tone_type: "friendly" | "encouraging" | "stern" | "tough_love"
      webhook_event_type:
        | "chapter.created"
        | "chapter.updated"
        | "lecture.created"
        | "lecture.updated"
        | "lecture.completed"
        | "question.created"
        | "question.updated"
        | "question.seen"
        | "recording.created"
        | "recording.marked_done"
        | "schedule_task.created"
        | "schedule_task.updated"
        | "daily.audit_summary"
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
      reminder_time: ["morning", "midday", "evening"],
      subject_type: ["math", "physics", "chemistry"],
      task_type: [
        "new_chapter",
        "lecture",
        "revision_question",
        "revision_recording",
        "weekly_test",
      ],
      tone_type: ["friendly", "encouraging", "stern", "tough_love"],
      webhook_event_type: [
        "chapter.created",
        "chapter.updated",
        "lecture.created",
        "lecture.updated",
        "lecture.completed",
        "question.created",
        "question.updated",
        "question.seen",
        "recording.created",
        "recording.marked_done",
        "schedule_task.created",
        "schedule_task.updated",
        "daily.audit_summary",
      ],
    },
  },
} as const
