import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Webhook, Plus, CheckCircle2, XCircle, Clock, 
  Copy, Eye, EyeOff, Loader2, Trash2, RefreshCw 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const EVENT_TYPES = [
  'chapter.created', 'chapter.updated',
  'lecture.created', 'lecture.updated', 'lecture.completed',
  'question.created', 'question.updated', 'question.seen',
  'recording.created', 'recording.marked_done',
  'schedule_task.created', 'schedule_task.updated',
  'daily.audit_summary',
] as const;

export default function Webhooks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    event_types: [] as string[],
  });

  // Fetch webhooks
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch recent deliveries
  const { data: deliveries } = useQuery({
    queryKey: ['webhook_deliveries', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('webhook_deliveries')
        .select('*, subscription:webhook_subscriptions(name)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Create webhook
  const createWebhook = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      // Generate a random secret
      const secret = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .insert([{
          user_id: user.id,
          name: newWebhook.name,
          url: newWebhook.url,
          secret_key: secret,
          event_types: newWebhook.event_types.length > 0 ? newWebhook.event_types : [],
          is_active: true,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, revealed_secret: secret };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({ 
        title: 'Webhook created!',
        description: 'Make sure to copy the secret key - it won\'t be shown again.',
      });
      setShowSecrets(prev => ({ ...prev, [data.id]: true }));
      setNewWebhook({ name: '', url: '', event_types: [] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create webhook', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Toggle webhook active status
  const toggleWebhook = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    },
  });

  // Delete webhook
  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({ title: 'Webhook deleted' });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const toggleEventType = (eventType: string) => {
    setNewWebhook(prev => ({
      ...prev,
      event_types: prev.event_types.includes(eventType)
        ? prev.event_types.filter(e => e !== eventType)
        : [...prev.event_types, eventType],
    }));
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground mt-1">
              Send events to external services (e.g., n8n)
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Webhook Subscription</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., n8n Production"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Webhook URL *</Label>
                  <Input
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://your-n8n-instance.com/webhook/..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Events to Subscribe</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                    {EVENT_TYPES.map((eventType) => (
                      <label
                        key={eventType}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={newWebhook.event_types.includes(eventType)}
                          onChange={() => toggleEventType(eventType)}
                          className="rounded"
                        />
                        {eventType}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to subscribe to all events
                  </p>
                </div>
                
                <Button 
                  onClick={() => createWebhook.mutate()} 
                  className="w-full"
                  disabled={!newWebhook.name || !newWebhook.url || createWebhook.isPending}
                >
                  {createWebhook.isPending ? 'Creating...' : 'Create Webhook'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Webhooks List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>
              Webhooks receive HMAC-signed POST requests when events occur
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !webhooks || webhooks.length === 0 ? (
              <div className="text-center py-8">
                <Webhook className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No webhooks configured</p>
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div 
                    key={webhook.id}
                    className="p-4 rounded-lg border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{webhook.name}</h3>
                          <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                            {webhook.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                          {webhook.url}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Secret:</span>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {showSecrets[webhook.id] 
                              ? webhook.secret_key 
                              : '••••••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setShowSecrets(prev => ({ 
                              ...prev, 
                              [webhook.id]: !prev[webhook.id] 
                            }))}
                          >
                            {showSecrets[webhook.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(webhook.secret_key)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {webhook.event_types && webhook.event_types.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {webhook.event_types.slice(0, 3).map((event: string) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                            {webhook.event_types.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{webhook.event_types.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={(checked) => 
                            toggleWebhook.mutate({ id: webhook.id, is_active: checked })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteWebhook.mutate(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Recent Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!deliveries || deliveries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No deliveries yet
              </div>
            ) : (
              <div className="space-y-2">
                {deliveries.map((delivery: any) => (
                  <div 
                    key={delivery.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {delivery.is_successful ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{delivery.event_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {delivery.subscription?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={delivery.is_successful ? 'default' : 'destructive'}>
                        {delivery.response_status || 'Failed'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(delivery.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
