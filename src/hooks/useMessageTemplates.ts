import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageTemplate, ToneType, ReminderTime } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useMessageTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['message_templates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('reminder_time')
        .order('name');
      
      if (error) throw error;
      return data as MessageTemplate[];
    },
    enabled: !!user,
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MessageTemplate> & { id: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message_templates'] });
      toast({ title: 'Template updated successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update template', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (newTemplate: {
      name: string;
      tone: ToneType;
      reminder_time: ReminderTime;
      template_type: string;
      content: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          ...newTemplate,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message_templates'] });
      toast({ title: 'Template created successfully' });
    },
  });

  return {
    templates: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    updateTemplate,
    createTemplate,
  };
}
