import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Chapter, SubjectType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { triggerWebhook } from '@/hooks/useWebhookTrigger';

export function useChapters(subjectFilter?: SubjectType | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['chapters', user?.id, subjectFilter],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('chapters')
        .select(`
          *,
          subject:subjects(*)
        `)
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (subjectFilter) {
        const { data: subjects } = await supabase
          .from('subjects')
          .select('id')
          .eq('user_id', user.id)
          .eq('subject_type', subjectFilter);
        
        if (subjects && subjects.length > 0) {
          query = query.eq('subject_id', subjects[0].id);
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as (Chapter & { subject: { id: string; name: string; subject_type: SubjectType; color: string } })[];
    },
    enabled: !!user,
  });

  const createChapter = useMutation({
    mutationFn: async (newChapter: {
      name: string;
      subject_id: string;
      description?: string;
      lectures_total?: number;
      priority?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('chapters')
        .insert({
          ...newChapter,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create lectures
      const lectures = Array.from({ length: newChapter.lectures_total || 1 }, (_, i) => ({
        chapter_id: data.id,
        user_id: user.id,
        name: `Lecture ${i + 1}`,
        lecture_number: i + 1,
      }));
      
      await supabase.from('lectures').insert(lectures);
      
      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'chapter.created',
        resource_type: 'chapter',
        resource_id: data.id,
        new_value: data,
      });
      
      // Trigger webhook
      await triggerWebhook('chapter.created', user.id, { chapter: data });
      
      // Trigger lecture.created webhooks
      for (let i = 0; i < lectures.length; i++) {
        await triggerWebhook('lecture.created', user.id, { lecture: lectures[i] });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      toast({ title: 'Chapter created successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create chapter', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateChapter = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Chapter> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get old value for audit
      const { data: oldData } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', id)
        .single();
      
      const { data, error } = await supabase
        .from('chapters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'chapter.updated',
        resource_type: 'chapter',
        resource_id: id,
        old_value: oldData,
        new_value: data,
      });
      
      // Trigger webhook
      await triggerWebhook('chapter.updated', user.id, { chapter: data, previous: oldData });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      toast({ title: 'Chapter updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update chapter', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const deleteChapter = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get chapter data for audit/webhook
      const { data: chapterData } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', id)
        .single();
      
      // Delete related data first (cascade)
      await supabase.from('questions').delete().eq('chapter_id', id);
      await supabase.from('recordings').delete().eq('chapter_id', id);
      await supabase.from('lectures').delete().eq('chapter_id', id);
      
      // Delete chapter
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'chapter.deleted',
        resource_type: 'chapter',
        resource_id: id,
        old_value: chapterData,
      });
      
      return chapterData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      toast({ title: 'Chapter deleted successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to delete chapter', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  return {
    chapters: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createChapter,
    updateChapter,
    deleteChapter,
  };
}
