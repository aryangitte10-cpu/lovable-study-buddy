import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Lecture } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useLectures(chapterId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['lectures', chapterId],
    queryFn: async () => {
      if (!user || !chapterId) return [];
      
      const { data, error } = await supabase
        .from('lectures')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('lecture_number');
      
      if (error) throw error;
      return data as Lecture[];
    },
    enabled: !!user && !!chapterId,
  });

  const markLectureDone = useMutation({
    mutationFn: async (lectureId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('mark_lecture_done', {
        p_lecture_id: lectureId,
        p_user_id: user.id,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data: Record<string, unknown> | null) => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      
      if (data?.all_lectures_done) {
        toast({ 
          title: 'Chapter completed! 🎉', 
          description: 'Recording task scheduled for tomorrow.' 
        });
      } else {
        toast({ title: 'Lecture marked as done' });
      }
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to mark lecture', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const createLecture = useMutation({
    mutationFn: async (newLecture: {
      chapter_id: string;
      name: string;
      lecture_number: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('lectures')
        .insert({
          ...newLecture,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update chapter lectures_total
      await supabase
        .from('chapters')
        .update({ lectures_total: newLecture.lecture_number })
        .eq('id', newLecture.chapter_id);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
  });

  return {
    lectures: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    markLectureDone,
    createLecture,
  };
}
