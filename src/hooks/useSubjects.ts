import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Subject, SubjectType } from '@/lib/types';

export function useSubjects() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['subjects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');
      
      if (error) throw error;
      return data.map(s => ({
        ...s,
        subject_type: s.subject_type as SubjectType
      })) as Subject[];
    },
    enabled: !!user,
  });

  return {
    subjects: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
