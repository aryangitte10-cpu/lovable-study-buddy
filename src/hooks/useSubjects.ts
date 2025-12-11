import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Subject } from '@/lib/types';

export function useSubjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subjects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at');
      
      if (error) throw error;
      return data as Subject[];
    },
    enabled: !!user,
  });
}
