import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Question } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { triggerWebhook } from '@/hooks/useWebhookTrigger';

interface MarkQuestionSeenResult {
  success?: boolean;
  question_id?: string;
  stars?: number;
  next_due?: string;
  times_seen?: number;
  error?: string;
}

interface QuestionStarCounts {
  [chapterId: string]: {
    star3: number;
    star4: number;
    star5: number;
  };
}

export function useQuestions(chapterId?: string, dueDate?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['questions', chapterId, dueDate],
    queryFn: async () => {
      if (!user) return [];
      
      let q = supabase
        .from('questions')
        .select(`
          *,
          chapter:chapters(id, name, subject_id)
        `)
        .eq('user_id', user.id)
        .order('stars', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (chapterId) {
        q = q.eq('chapter_id', chapterId);
      }
      
      if (dueDate) {
        q = q.lte('next_due', dueDate);
      }
      
      const { data, error } = await q;
      
      if (error) throw error;
      return data as (Question & { chapter: { id: string; name: string; subject_id: string } })[];
    },
    enabled: !!user,
  });

  // Fetch star counts per chapter for display on chapter cards
  const starCountsQuery = useQuery({
    queryKey: ['question_star_counts', user?.id],
    queryFn: async () => {
      if (!user) return {};
      
      const { data, error } = await supabase
        .from('questions')
        .select('chapter_id, stars')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const counts: QuestionStarCounts = {};
      
      data.forEach((q) => {
        if (!counts[q.chapter_id]) {
          counts[q.chapter_id] = { star3: 0, star4: 0, star5: 0 };
        }
        if (q.stars === 3) counts[q.chapter_id].star3++;
        else if (q.stars === 4) counts[q.chapter_id].star4++;
        else if (q.stars === 5) counts[q.chapter_id].star5++;
      });
      
      return counts;
    },
    enabled: !!user,
  });

  const createQuestion = useMutation({
    mutationFn: async (newQuestion: {
      chapter_id: string;
      content: string;
      stars?: number;
      tags?: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('questions')
        .insert({
          ...newQuestion,
          user_id: user.id,
          next_due: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'question.created',
        resource_type: 'question',
        resource_id: data.id,
        new_value: data,
      });
      
      // Trigger webhook
      await triggerWebhook('question.created', user.id, { question: data });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['question_star_counts'] });
      toast({ title: 'Question added successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to add question', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Question> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get old value
      const { data: oldData } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();
      
      const { data, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'question.updated',
        resource_type: 'question',
        resource_id: id,
        old_value: oldData,
        new_value: data,
      });
      
      // Trigger webhook
      await triggerWebhook('question.updated', user.id, { question: data, previous: oldData });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['question_star_counts'] });
    },
  });

  const markQuestionSeen = useMutation({
    mutationFn: async (questionId: string): Promise<MarkQuestionSeenResult> => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('mark_question_seen', {
        p_question_id: questionId,
        p_user_id: user.id,
      });
      
      if (error) throw error;
      
      const result = data as MarkQuestionSeenResult;
      
      // Trigger webhook
      await triggerWebhook('question.seen', user.id, {
        question_id: questionId,
        stars: result.stars,
        next_due: result.next_due,
        times_seen: result.times_seen,
      });
      
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      const nextDue = data?.next_due ? new Date(data.next_due).toLocaleDateString() : 'soon';
      toast({ 
        title: 'Question reviewed', 
        description: `Next review: ${nextDue}` 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to mark question', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  return {
    questions: query.data || [],
    starCounts: starCountsQuery.data || {},
    isLoading: query.isLoading,
    error: query.error,
    createQuestion,
    updateQuestion,
    markQuestionSeen,
  };
}
