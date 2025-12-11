import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Settings as SettingsIcon, Key, MessageSquare, Bell, 
  Shield, Copy, Plus, Trash2, Loader2, Eye, EyeOff,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToneType } from '@/lib/types';

export default function Settings() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [newApiKeyName, setNewApiKeyName] = useState('');

  // Fetch API keys
  const { data: apiKeys, isLoading: apiKeysLoading } = useQuery({
    queryKey: ['api_keys', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
      toast({ title: 'Settings saved' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to save settings', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // Create API key
  const createApiKey = useMutation({
    mutationFn: async () => {
      if (!user || !newApiKeyName) throw new Error('Name required');
      
      const rawKey = `jee_${crypto.randomUUID().replace(/-/g, '')}`;
      const keyHash = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(rawKey)
      );
      const hashArray = Array.from(new Uint8Array(keyHash));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newApiKeyName,
          key_hash: hashHex,
          key_prefix: rawKey.substring(0, 12),
          is_read_only: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, rawKey };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
      toast({ 
        title: 'API Key created!',
        description: `Key: ${data.rawKey} - Copy it now, it won't be shown again!`,
      });
      navigator.clipboard.writeText(data.rawKey);
      setNewApiKeyName('');
    },
  });

  // Delete API key
  const deleteApiKey = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
      toast({ title: 'API Key deleted' });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const handleToneChange = (tone: ToneType) => {
    updateProfile.mutate({ tone_preference: tone });
  };

  const handleToughLoveConsent = (consent: boolean) => {
    updateProfile.mutate({ tough_love_consent: consent });
  };

  const handleSafetyOptOut = (optOut: boolean) => {
    updateProfile.mutate({ safety_opt_out: optOut });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your preferences and integrations
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="tone" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Tone Control
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Study Settings</CardTitle>
                <CardDescription>Configure your study schedule and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Max Lectures per Day</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={profile?.max_lectures_per_day || 4}
                      onChange={(e) => updateProfile.mutate({ 
                        max_lectures_per_day: parseInt(e.target.value) 
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>High Star Interval (days)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={profile?.question_interval_high || 3}
                      onChange={(e) => updateProfile.mutate({ 
                        question_interval_high: parseInt(e.target.value) 
                      })}
                    />
                    <p className="text-xs text-muted-foreground">For 4-5★ questions</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Medium Star Interval (days)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={profile?.question_interval_medium || 7}
                      onChange={(e) => updateProfile.mutate({ 
                        question_interval_medium: parseInt(e.target.value) 
                      })}
                    />
                    <p className="text-xs text-muted-foreground">For 3★ questions</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label>Reminder Times</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Morning</Label>
                      <Input
                        type="time"
                        value={profile?.reminder_morning || '08:00'}
                        onChange={(e) => updateProfile.mutate({ 
                          reminder_morning: e.target.value 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Midday</Label>
                      <Input
                        type="time"
                        value={profile?.reminder_midday || '13:00'}
                        onChange={(e) => updateProfile.mutate({ 
                          reminder_midday: e.target.value 
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Evening</Label>
                      <Input
                        type="time"
                        value={profile?.reminder_evening || '19:00'}
                        onChange={(e) => updateProfile.mutate({ 
                          reminder_evening: e.target.value 
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Create read-only API keys for external integrations like n8n
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Key name (e.g., n8n-production)"
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                  />
                  <Button 
                    onClick={() => createApiKey.mutate()}
                    disabled={!newApiKeyName || createApiKey.isPending}
                  >
                    {createApiKey.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  {apiKeysLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : !apiKeys || apiKeys.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">
                      No API keys yet
                    </p>
                  ) : (
                    apiKeys.map((key) => (
                      <div 
                        key={key.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {key.key_prefix}...
                            </code>
                            <Badge variant={key.is_active ? 'default' : 'secondary'}>
                              {key.is_read_only ? 'Read-only' : 'Full access'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteApiKey.mutate(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Usage with n8n</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Use these endpoints with your API key in the Authorization header:
                  </p>
                  <code className="text-xs block bg-background p-2 rounded">
                    Authorization: Bearer jee_your_api_key_here
                  </code>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• GET /rpc/get_todays_tasks</li>
                    <li>• GET /rpc/get_due_questions</li>
                    <li>• GET /rpc/get_audit_state</li>
                    <li>• GET /rpc/get_changes_since</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tone Control */}
          <TabsContent value="tone">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Message Tone</CardTitle>
                  <CardDescription>
                    Choose the tone for reminder messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select 
                    value={profile?.tone_preference || 'friendly'}
                    onValueChange={(value) => handleToneChange(value as ToneType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">
                        😊 Friendly - Supportive and encouraging
                      </SelectItem>
                      <SelectItem value="encouraging">
                        💪 Encouraging - Motivational and uplifting
                      </SelectItem>
                      <SelectItem value="stern">
                        📢 Stern - Direct and no-nonsense
                      </SelectItem>
                      <SelectItem value="tough_love">
                        🔥 Tough Love - Blunt and provocative
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Preview</h4>
                    <p className="text-sm italic">
                      {profile?.tone_preference === 'friendly' && 
                        '"Good morning! Ready to tackle today\'s JEE prep? You\'ve got this! 📚"'}
                      {profile?.tone_preference === 'encouraging' && 
                        '"You have 5 questions due. Every question mastered is progress made!"'}
                      {profile?.tone_preference === 'stern' && 
                        '"You haven\'t completed today\'s tasks. Time is limited. Get back on track."'}
                      {profile?.tone_preference === 'tough_love' && 
                        '"You\'re slacking. That lecture won\'t watch itself. Move it."'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Tough Love Settings */}
              <Card className="border-warning/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Tough Love Mode
                  </CardTitle>
                  <CardDescription>
                    Enable blunt, provocative messages to push you harder
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Tough Love Messages</p>
                      <p className="text-sm text-muted-foreground">
                        Allow stern, provocative reminders (may include mild insults)
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Switch
                          checked={profile?.tough_love_consent || false}
                          onCheckedChange={() => {
                            if (!profile?.tough_love_consent) {
                              // Show dialog for consent
                            } else {
                              handleToughLoveConsent(false);
                            }
                          }}
                        />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Enable Tough Love Mode?</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>
                              This enables blunt, provocative messages that may include mild insults 
                              like "You're slacking" or "Stop making excuses."
                            </p>
                            <p className="font-medium">
                              These messages will NEVER:
                            </p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>Encourage self-harm or suicide</li>
                              <li>Contain hateful slurs or threats</li>
                              <li>Include personalized harassment</li>
                            </ul>
                            <p>
                              You can disable this at any time.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleToughLoveConsent(true)}>
                            I Understand, Enable It
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Emergency Stop</p>
                      <p className="text-sm text-muted-foreground">
                        Immediately disable all provocative messages
                      </p>
                    </div>
                    <Switch
                      checked={profile?.safety_opt_out || false}
                      onCheckedChange={handleSafetyOptOut}
                    />
                  </div>

                  {profile?.safety_opt_out && (
                    <div className="bg-success/10 border border-success/30 p-3 rounded-lg">
                      <p className="text-sm text-success flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Safety mode enabled. All messages will be friendly.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
