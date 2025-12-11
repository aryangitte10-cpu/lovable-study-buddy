import { supabase } from '@/integrations/supabase/client';
import { WebhookEventType } from '@/lib/types';

export async function triggerWebhook(
  eventType: WebhookEventType,
  userId: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-webhook', {
      body: {
        event_type: eventType,
        user_id: userId,
        data,
      },
    });
    
    if (error) {
      console.error(`Webhook trigger failed for ${eventType}:`, error);
    } else {
      console.log(`Webhook triggered: ${eventType}`);
    }
  } catch (err) {
    console.error(`Webhook trigger error for ${eventType}:`, err);
  }
}
