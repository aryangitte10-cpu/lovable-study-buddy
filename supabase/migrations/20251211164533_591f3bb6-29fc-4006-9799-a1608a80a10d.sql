-- Fix question interval logic: 3★ → 7 days (was 14), 4★/5★ → 3 days
CREATE OR REPLACE FUNCTION public.mark_question_seen(p_question_id uuid, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Calculate next_due based on stars (FIXED LOGIC)
  -- 5★ and 4★ = high priority = 3 days (shorter interval for harder questions)
  -- 3★ = medium priority = 7 days
  -- 2★ and 1★ = low priority = 14 days
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
$function$;