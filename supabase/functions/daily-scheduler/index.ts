import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];
    console.log(`Running daily scheduler for ${today}`);

    // Get all users with profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id');

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      throw profileError;
    }

    let totalTasksCreated = 0;

    for (const profile of profiles || []) {
      const userId = profile.id;
      console.log(`Processing user: ${userId}`);

      // 1. Fetch questions due today or earlier
      const { data: dueQuestions, error: qError } = await supabase
        .from('questions')
        .select('id, chapter_id, content, stars')
        .eq('user_id', userId)
        .lte('next_due', today);

      if (qError) {
        console.error(`Error fetching questions for user ${userId}:`, qError);
        continue;
      }

      // Check existing tasks for today to avoid duplicates
      const { data: existingTasks } = await supabase
        .from('schedule_tasks')
        .select('reference_id')
        .eq('user_id', userId)
        .eq('task_date', today)
        .eq('task_type', 'revision_question');

      const existingQuestionIds = new Set(existingTasks?.map(t => t.reference_id) || []);

      // Create tasks for due questions
      for (const question of dueQuestions || []) {
        if (existingQuestionIds.has(question.id)) continue;

        const { error: insertError } = await supabase
          .from('schedule_tasks')
          .insert({
            user_id: userId,
            task_type: 'revision_question',
            task_date: today,
            reference_id: question.id,
            reference_type: 'question',
            title: `Review: ${question.content.substring(0, 50)}${question.content.length > 50 ? '...' : ''}`,
            description: `${question.stars}★ question due for revision`,
          });

        if (!insertError) {
          totalTasksCreated++;
          
          // Send webhook for task creation
          try {
            await supabase.functions.invoke('send-webhook', {
              body: {
                event_type: 'schedule_task.created',
                user_id: userId,
                data: {
                  task_type: 'revision_question',
                  question_id: question.id,
                },
              },
            });
          } catch (webhookError) {
            console.error('Webhook error:', webhookError);
          }
        }
      }

      // 2. Fetch pending recordings scheduled for today
      const { data: pendingRecordings, error: rError } = await supabase
        .from('recordings')
        .select('id, chapter_id')
        .eq('user_id', userId)
        .eq('scheduled_for', today)
        .eq('is_done', false);

      if (rError) {
        console.error(`Error fetching recordings for user ${userId}:`, rError);
        continue;
      }

      // Check existing recording tasks
      const { data: existingRecordingTasks } = await supabase
        .from('schedule_tasks')
        .select('reference_id')
        .eq('user_id', userId)
        .eq('task_date', today)
        .eq('task_type', 'revision_recording');

      const existingRecordingIds = new Set(existingRecordingTasks?.map(t => t.reference_id) || []);

      for (const recording of pendingRecordings || []) {
        if (existingRecordingIds.has(recording.chapter_id)) continue;

        // Get chapter name
        const { data: chapter } = await supabase
          .from('chapters')
          .select('name')
          .eq('id', recording.chapter_id)
          .single();

        const { error: insertError } = await supabase
          .from('schedule_tasks')
          .insert({
            user_id: userId,
            task_type: 'revision_recording',
            task_date: today,
            reference_id: recording.chapter_id,
            reference_type: 'chapter',
            title: `Record revision: ${chapter?.name || 'Unknown chapter'}`,
            description: 'Complete your revision recording for this chapter',
          });

        if (!insertError) {
          totalTasksCreated++;
        }
      }
    }

    console.log(`Daily scheduler complete. Created ${totalTasksCreated} tasks.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        date: today,
        tasks_created: totalTasksCreated 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Daily scheduler error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
