import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Recording } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useRecordings(chapterId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['recordings', chapterId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('recordings')
        .select(`
          *,
          chapter:chapters(id, name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as (Recording & { chapter: { id: string; name: string } })[];
    },
    enabled: !!user,
  });

  const markRecordingDone = useMutation({
    mutationFn: async (chapterId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.rpc('mark_recording_done', {
        p_chapter_id: chapterId,
        p_user_id: user.id,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      toast({ title: 'Recording marked as done! 🎙️' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to mark recording', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  return {
    recordings: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    markRecordingDone,
  };
}
