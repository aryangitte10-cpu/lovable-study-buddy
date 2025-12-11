-- JEE Study Planner Database Schema
-- Create custom types
CREATE TYPE public.subject_type AS ENUM ('math', 'physics', 'chemistry');
CREATE TYPE public.task_type AS ENUM ('new_chapter', 'lecture', 'revision_question', 'revision_recording', 'weekly_test');
CREATE TYPE public.reminder_time AS ENUM ('morning', 'midday', 'evening');
CREATE TYPE public.tone_type AS ENUM ('friendly', 'encouraging', 'stern', 'tough_love');
CREATE TYPE public.webhook_event_type AS ENUM (
  'chapter.created', 'chapter.updated',
  'lecture.created', 'lecture.updated', 'lecture.completed',
  'question.created', 'question.updated', 'question.seen',
  'recording.created', 'recording.marked_done',
  'schedule_task.created', 'schedule_task.updated',
  'daily.audit_summary'
);

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  days_available INTEGER DEFAULT 180,
  max_lectures_per_day INTEGER DEFAULT 4,
  question_interval_high INTEGER DEFAULT 3, -- days for 4-5 star questions
  question_interval_medium INTEGER DEFAULT 7, -- days for 3 star questions
  question_interval_low INTEGER DEFAULT 14, -- days for 1-2 star questions
  reminder_morning TIME DEFAULT '08:00',
  reminder_midday TIME DEFAULT '13:00',
  reminder_evening TIME DEFAULT '19:00',
  tone_preference public.tone_type DEFAULT 'friendly',
  tough_love_consent BOOLEAN DEFAULT FALSE,
  safety_opt_out BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys table for read-only access (n8n)
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  name TEXT NOT NULL,
  is_read_only BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject_type public.subject_type NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject_type)
);

-- Chapters table
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  lectures_total INTEGER DEFAULT 1,
  lectures_done INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT FALSE,
  recording_status TEXT DEFAULT 'pending', -- pending, uploaded, done
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lectures table
CREATE TABLE public.lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lecture_number INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table with spaced repetition
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  stars INTEGER CHECK (stars >= 1 AND stars <= 5) DEFAULT 3,
  tags TEXT[] DEFAULT '{}',
  times_seen INTEGER DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  next_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recordings table
CREATE TABLE public.recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  file_name TEXT,
  duration_seconds INTEGER,
  is_done BOOLEAN DEFAULT FALSE,
  marked_done_at TIMESTAMPTZ,
  scheduled_for DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule tasks table
CREATE TABLE public.schedule_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_type public.task_type NOT NULL,
  task_date DATE NOT NULL,
  reference_id UUID, -- Can reference chapter, lecture, question, or recording
  reference_type TEXT, -- 'chapter', 'lecture', 'question', 'recording'
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders table
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_task_id UUID REFERENCES public.schedule_tasks(id) ON DELETE CASCADE,
  reminder_time public.reminder_time NOT NULL,
  message TEXT NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook subscriptions table
CREATE TABLE public.webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  name TEXT NOT NULL,
  event_types public.webhook_event_type[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  ip_allowlist TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook deliveries log
CREATE TABLE public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
  event_type public.webhook_event_type NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 1,
  is_successful BOOLEAN DEFAULT FALSE,
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table (immutable)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message templates table
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tone public.tone_type NOT NULL,
  reminder_time public.reminder_time NOT NULL,
  template_type TEXT NOT NULL, -- 'question', 'lecture', 'recording', 'general'
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_chapters_user_subject ON public.chapters(user_id, subject_id);
CREATE INDEX idx_lectures_chapter ON public.lectures(chapter_id);
CREATE INDEX idx_lectures_user ON public.lectures(user_id);
CREATE INDEX idx_questions_chapter ON public.questions(chapter_id);
CREATE INDEX idx_questions_next_due ON public.questions(user_id, next_due);
CREATE INDEX idx_questions_stars ON public.questions(stars);
CREATE INDEX idx_schedule_tasks_date ON public.schedule_tasks(user_id, task_date);
CREATE INDEX idx_audit_logs_user_date ON public.audit_logs(user_id, created_at);
CREATE INDEX idx_webhook_deliveries_subscription ON public.webhook_deliveries(subscription_id);
CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own api_keys" ON public.api_keys FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subjects" ON public.subjects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own chapters" ON public.chapters FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own lectures" ON public.lectures FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own questions" ON public.questions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recordings" ON public.recordings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own schedule_tasks" ON public.schedule_tasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own webhook_subscriptions" ON public.webhook_subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own webhook_deliveries" ON public.webhook_deliveries FOR SELECT 
  USING (subscription_id IN (SELECT id FROM public.webhook_subscriptions WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own audit_logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own message_templates" ON public.message_templates FOR ALL USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  
  -- Create default subjects
  INSERT INTO public.subjects (user_id, name, subject_type, color)
  VALUES 
    (NEW.id, 'Mathematics', 'math', '#ef4444'),
    (NEW.id, 'Physics', 'physics', '#3b82f6'),
    (NEW.id, 'Chemistry', 'chemistry', '#22c55e');
  
  -- Create default message templates
  INSERT INTO public.message_templates (user_id, name, tone, reminder_time, template_type, content)
  VALUES
    (NEW.id, 'Friendly Morning', 'friendly', 'morning', 'general', 'Good morning! Ready to tackle today''s JEE prep? You''ve got this! 📚'),
    (NEW.id, 'Friendly Lecture', 'friendly', 'morning', 'lecture', 'Time for your next lecture: {title}. Take it one step at a time!'),
    (NEW.id, 'Encouraging Question', 'encouraging', 'midday', 'question', 'You have {count} questions due for review. Every question mastered is progress made!'),
    (NEW.id, 'Stern Reminder', 'stern', 'evening', 'general', 'You haven''t completed today''s tasks. Time is limited. Get back on track.'),
    (NEW.id, 'Tough Love Morning', 'tough_love', 'morning', 'general', 'Wake up. Your competition is already studying. What''s your excuse?'),
    (NEW.id, 'Tough Love Lecture', 'tough_love', 'midday', 'lecture', 'You''re slacking. That lecture won''t watch itself. Move it.'),
    (NEW.id, 'Tough Love Question', 'tough_love', 'evening', 'question', '{count} questions waiting. Stop procrastinating. Start solving.');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON public.lectures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_schedule_tasks_updated_at BEFORE UPDATE ON public.schedule_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_webhook_subscriptions_updated_at BEFORE UPDATE ON public.webhook_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RPC: Mark lecture as done
CREATE OR REPLACE FUNCTION public.mark_lecture_done(p_lecture_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_lecture RECORD;
  v_chapter RECORD;
  v_all_done BOOLEAN;
BEGIN
  -- Get lecture
  SELECT * INTO v_lecture FROM public.lectures WHERE id = p_lecture_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Lecture not found');
  END IF;
  
  -- Update lecture
  UPDATE public.lectures 
  SET is_completed = TRUE, completed_at = NOW()
  WHERE id = p_lecture_id;
  
  -- Update chapter lectures_done count
  UPDATE public.chapters 
  SET lectures_done = lectures_done + 1
  WHERE id = v_lecture.chapter_id;
  
  -- Get updated chapter
  SELECT * INTO v_chapter FROM public.chapters WHERE id = v_lecture.chapter_id;
  
  -- Check if all lectures done
  v_all_done := v_chapter.lectures_done >= v_chapter.lectures_total;
  
  -- If all lectures done, create recording placeholder and schedule task
  IF v_all_done THEN
    UPDATE public.chapters SET is_completed = TRUE WHERE id = v_chapter.id;
    
    INSERT INTO public.recordings (chapter_id, user_id, scheduled_for)
    VALUES (v_chapter.id, p_user_id, CURRENT_DATE + INTERVAL '1 day');
    
    INSERT INTO public.schedule_tasks (user_id, task_type, task_date, reference_id, reference_type, title, description)
    VALUES (p_user_id, 'revision_recording', CURRENT_DATE + INTERVAL '1 day', v_chapter.id, 'chapter', 
            'Record revision for: ' || v_chapter.name, 'All lectures completed. Time to record your revision notes.');
  END IF;
  
  -- Log audit
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_value, metadata)
  VALUES (p_user_id, 'lecture.completed', 'lecture', p_lecture_id, 
          jsonb_build_object('lecture_id', p_lecture_id, 'chapter_id', v_lecture.chapter_id, 'all_done', v_all_done),
          jsonb_build_object('timestamp', NOW()));
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'lecture_id', p_lecture_id,
    'chapter_id', v_lecture.chapter_id,
    'all_lectures_done', v_all_done
  );
END;
$$;

-- RPC: Mark question as seen
CREATE OR REPLACE FUNCTION public.mark_question_seen(p_question_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_question RECORD;
  v_profile RECORD;
  v_interval INTEGER;
  v_next_due DATE;
BEGIN
  -- Get question
  SELECT * INTO v_question FROM public.questions WHERE id = p_question_id AND user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Question not found');
  END IF;
  
  -- Get user profile for intervals
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  
  -- Calculate next_due based on stars
  IF v_question.stars >= 4 THEN
    v_interval := COALESCE(v_profile.question_interval_high, 3);
  ELSIF v_question.stars = 3 THEN
    v_interval := COALESCE(v_profile.question_interval_medium, 7);
  ELSE
    v_interval := COALESCE(v_profile.question_interval_low, 14);
  END IF;
  
  v_next_due := CURRENT_DATE + (v_interval || ' days')::INTERVAL;
  
  -- Update question
  UPDATE public.questions 
  SET last_seen_at = NOW(), times_seen = times_seen + 1, next_due = v_next_due
  WHERE id = p_question_id;
  
  -- Log audit
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_value, metadata)
  VALUES (p_user_id, 'question.seen', 'question', p_question_id,
          jsonb_build_object('question_id', p_question_id, 'stars', v_question.stars, 'next_due', v_next_due, 'times_seen', v_question.times_seen + 1),
          jsonb_build_object('timestamp', NOW()));
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'question_id', p_question_id,
    'stars', v_question.stars,
    'next_due', v_next_due,
    'times_seen', v_question.times_seen + 1
  );
END;
$$;

-- RPC: Mark recording as done
CREATE OR REPLACE FUNCTION public.mark_recording_done(p_chapter_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_recording RECORD;
  v_chapter RECORD;
BEGIN
  -- Get recording
  SELECT * INTO v_recording FROM public.recordings 
  WHERE chapter_id = p_chapter_id AND user_id = p_user_id
  ORDER BY created_at DESC LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Recording not found');
  END IF;
  
  -- Update recording
  UPDATE public.recordings 
  SET is_done = TRUE, marked_done_at = NOW()
  WHERE id = v_recording.id;
  
  -- Update chapter
  UPDATE public.chapters 
  SET recording_status = 'done'
  WHERE id = p_chapter_id;
  
  -- Get chapter for response
  SELECT * INTO v_chapter FROM public.chapters WHERE id = p_chapter_id;
  
  -- Log audit
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_value, metadata)
  VALUES (p_user_id, 'recording.marked_done', 'recording', v_recording.id,
          jsonb_build_object('recording_id', v_recording.id, 'chapter_id', p_chapter_id),
          jsonb_build_object('timestamp', NOW()));
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'recording_id', v_recording.id,
    'chapter_id', p_chapter_id,
    'chapter_name', v_chapter.name
  );
END;
$$;

-- RPC: Get today's tasks (for n8n read-only access)
CREATE OR REPLACE FUNCTION public.get_todays_tasks(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tasks JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
  INTO v_tasks
  FROM (
    SELECT id, task_type, task_date, reference_id, reference_type, title, description, is_completed, completed_at
    FROM public.schedule_tasks
    WHERE user_id = p_user_id AND task_date = p_date
    ORDER BY created_at
  ) t;
  
  RETURN v_tasks;
END;
$$;

-- RPC: Get due questions (for n8n read-only access)
CREATE OR REPLACE FUNCTION public.get_due_questions(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_questions JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(q)), '[]'::jsonb)
  INTO v_questions
  FROM (
    SELECT q.id, q.chapter_id, q.content, q.stars, q.tags, q.times_seen, q.last_seen_at, q.next_due, c.name as chapter_name
    FROM public.questions q
    JOIN public.chapters c ON c.id = q.chapter_id
    WHERE q.user_id = p_user_id AND q.next_due <= p_date
    ORDER BY q.stars DESC, q.next_due
  ) q;
  
  RETURN v_questions;
END;
$$;

-- RPC: Get recordings ready for today
CREATE OR REPLACE FUNCTION public.get_recordings_ready(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_recordings JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
  INTO v_recordings
  FROM (
    SELECT r.id, r.chapter_id, r.scheduled_for, r.is_done, c.name as chapter_name
    FROM public.recordings r
    JOIN public.chapters c ON c.id = r.chapter_id
    WHERE r.user_id = p_user_id AND r.scheduled_for = p_date AND r.is_done = FALSE
    ORDER BY r.created_at
  ) r;
  
  RETURN v_recordings;
END;
$$;

-- RPC: Get audit state (for verification)
CREATE OR REPLACE FUNCTION public.get_audit_state(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_state JSONB;
BEGIN
  SELECT jsonb_build_object(
    'date', p_date,
    'chapters_completed', (SELECT COUNT(*) FROM public.chapters WHERE user_id = p_user_id AND is_completed = TRUE AND updated_at::date = p_date),
    'lectures_completed', (SELECT COUNT(*) FROM public.lectures WHERE user_id = p_user_id AND is_completed = TRUE AND completed_at::date = p_date),
    'questions_seen', (SELECT COUNT(*) FROM public.questions WHERE user_id = p_user_id AND last_seen_at::date = p_date),
    'recordings_done', (SELECT COUNT(*) FROM public.recordings WHERE user_id = p_user_id AND is_done = TRUE AND marked_done_at::date = p_date),
    'tasks_completed', (SELECT COUNT(*) FROM public.schedule_tasks WHERE user_id = p_user_id AND is_completed = TRUE AND completed_at::date = p_date)
  )
  INTO v_state;
  
  RETURN v_state;
END;
$$;

-- RPC: Get changes since timestamp (for n8n verification)
CREATE OR REPLACE FUNCTION public.get_changes_since(p_user_id UUID, p_since TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_changes JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(a)), '[]'::jsonb)
  INTO v_changes
  FROM (
    SELECT id, action, resource_type, resource_id, new_value, metadata, created_at
    FROM public.audit_logs
    WHERE user_id = p_user_id AND created_at >= p_since
    ORDER BY created_at
  ) a;
  
  RETURN v_changes;
END;
$$;

-- RPC: Get daily expected state
CREATE OR REPLACE FUNCTION public.get_daily_expected_state(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_expected JSONB;
BEGIN
  SELECT jsonb_build_object(
    'date', p_date,
    'expected_tasks', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT id, task_type, title, is_completed FROM public.schedule_tasks
        WHERE user_id = p_user_id AND task_date = p_date
      ) t
    ),
    'due_questions', (
      SELECT COALESCE(jsonb_agg(row_to_json(q)), '[]'::jsonb)
      FROM (
        SELECT id, content, stars, next_due FROM public.questions
        WHERE user_id = p_user_id AND next_due = p_date
      ) q
    ),
    'pending_recordings', (
      SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
      FROM (
        SELECT r.id, r.chapter_id, c.name as chapter_name FROM public.recordings r
        JOIN public.chapters c ON c.id = r.chapter_id
        WHERE r.user_id = p_user_id AND r.scheduled_for = p_date AND r.is_done = FALSE
      ) r
    )
  )
  INTO v_expected;
  
  RETURN v_expected;
END;
$$;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chapters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lectures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recordings;