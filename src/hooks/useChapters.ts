import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Chapter, SubjectType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

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
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
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
      const { data, error } = await supabase
        .from('chapters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log audit
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'chapter.updated',
          resource_type: 'chapter',
          resource_id: id,
          new_value: data,
        });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
    },
  });

  return {
    chapters: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createChapter,
    updateChapter,
  };
}
