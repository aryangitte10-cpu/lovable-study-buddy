import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Question } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface MarkQuestionSeenResult {
  success?: boolean;
  question_id?: string;
  stars?: number;
  next_due?: string;
  times_seen?: number;
  error?: string;
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
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
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
      const { data, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'question.updated',
          resource_type: 'question',
          resource_id: id,
          new_value: data,
        });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
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
      return data as MarkQuestionSeenResult;
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
    isLoading: query.isLoading,
    error: query.error,
    createQuestion,
    updateQuestion,
    markQuestionSeen,
  };
}
