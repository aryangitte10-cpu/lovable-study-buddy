import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScheduleTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useScheduleTasks(date?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['schedule_tasks', date],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('schedule_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('task_date')
        .order('created_at');
      
      if (date) {
        query = query.eq('task_date', date);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ScheduleTask[];
    },
    enabled: !!user,
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from('schedule_tasks')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log audit
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'schedule_task.updated',
          resource_type: 'schedule_task',
          resource_id: taskId,
          new_value: data,
        });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_tasks'] });
      toast({ title: 'Task completed!' });
    },
  });

  const createTask = useMutation({
    mutationFn: async (newTask: {
      task_type: ScheduleTask['task_type'];
      task_date: string;
      title: string;
      description?: string;
      reference_id?: string;
      reference_type?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('schedule_tasks')
        .insert({
          ...newTask,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_tasks'] });
    },
  });

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    completeTask,
    createTask,
  };
}
