export type SubjectType = 'math' | 'physics' | 'chemistry';
export type TaskType = 'new_chapter' | 'lecture' | 'revision_question' | 'revision_recording' | 'weekly_test';
export type ReminderTime = 'morning' | 'midday' | 'evening';
export type ToneType = 'friendly' | 'encouraging' | 'stern' | 'tough_love';
export type WebhookEventType = 
  | 'chapter.created' | 'chapter.updated'
  | 'lecture.created' | 'lecture.updated' | 'lecture.completed'
  | 'question.created' | 'question.updated' | 'question.seen'
  | 'recording.created' | 'recording.marked_done'
  | 'schedule_task.created' | 'schedule_task.updated'
  | 'daily.audit_summary';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  start_date: string | null;
  days_available: number | null;
  max_lectures_per_day: number | null;
  question_interval_high: number | null;
  question_interval_medium: number | null;
  question_interval_low: number | null;
  reminder_morning: string | null;
  reminder_midday: string | null;
  reminder_evening: string | null;
  tone_preference: ToneType | null;
  tough_love_consent: boolean | null;
  safety_opt_out: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  subject_type: SubjectType;
  color: string | null;
  created_at: string | null;
}

export interface Chapter {
  id: string;
  user_id: string;
  subject_id: string;
  name: string;
  description: string | null;
  lectures_total: number;
  lectures_done: number;
  priority: number;
  is_completed: boolean;
  recording_status: string;
  recording_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  subject?: Subject;
}

export interface Lecture {
  id: string;
  chapter_id: string;
  user_id: string;
  name: string;
  lecture_number: number;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Question {
  id: string;
  chapter_id: string;
  user_id: string;
  content: string;
  stars: number;
  tags: string[];
  times_seen: number;
  last_seen_at: string | null;
  next_due: string | null;
  created_at: string | null;
  updated_at: string | null;
  chapter?: Chapter;
}

export interface Recording {
  id: string;
  chapter_id: string;
  user_id: string;
  file_url: string | null;
  file_name: string | null;
  duration_seconds: number | null;
  is_done: boolean;
  marked_done_at: string | null;
  scheduled_for: string | null;
  created_at: string | null;
}

export interface ScheduleTask {
  id: string;
  user_id: string;
  task_type: TaskType;
  task_date: string;
  reference_id: string | null;
  reference_type: string | null;
  title: string;
  description: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface WebhookSubscription {
  id: string;
  user_id: string;
  url: string;
  secret_key: string;
  name: string;
  event_types: WebhookEventType[];
  is_active: boolean;
  ip_allowlist: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface WebhookDelivery {
  id: string;
  subscription_id: string;
  event_type: WebhookEventType;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  attempts: number;
  is_successful: boolean;
  last_attempt_at: string | null;
  created_at: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  is_read_only: boolean;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string | null;
  expires_at: string | null;
}

export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  tone: ToneType;
  reminder_time: ReminderTime;
  template_type: string;
  content: string;
  is_active: boolean;
  created_at: string | null;
}

// Subject display config
export const SUBJECT_CONFIG: Record<SubjectType, { label: string; color: string; gradient: string }> = {
  math: { label: 'Mathematics', color: 'text-math', gradient: 'gradient-math' },
  physics: { label: 'Physics', color: 'text-physics', gradient: 'gradient-physics' },
  chemistry: { label: 'Chemistry', color: 'text-chemistry', gradient: 'gradient-chemistry' },
};

// Star colors
export const STAR_COLORS: Record<number, string> = {
  5: 'text-amber-500',
  4: 'text-amber-400',
  3: 'text-slate-400',
  2: 'text-slate-300',
  1: 'text-slate-200',
};
