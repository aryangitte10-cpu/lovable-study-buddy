import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event_type: string;
  user_id: string;
  timestamp: string;
  webhook_id: string;
  data: Record<string, unknown>;
}

function generateHmacSignature(secret: string, payload: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

async function sendWebhookWithRetry(
  url: string,
  payload: WebhookPayload,
  secret: string,
  maxRetries: number = 3
): Promise<{ status: number; body: string; success: boolean }> {
  const payloadString = JSON.stringify(payload);
  const signature = generateHmacSignature(secret, payloadString);
  
  let lastError: Error | null = null;
  let lastStatus = 0;
  let lastBody = '';
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Exponential backoff
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      console.log(`Webhook attempt ${attempt + 1} to ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Lovable-Signature': `sha256=${signature}`,
          'X-Webhook-ID': payload.webhook_id,
          'X-Event-Type': payload.event_type,
        },
        body: payloadString,
      });
      
      lastStatus = response.status;
      lastBody = await response.text();
      
      if (response.ok) {
        console.log(`Webhook delivered successfully: ${lastStatus}`);
        return { status: lastStatus, body: lastBody, success: true };
      }
      
      console.log(`Webhook attempt ${attempt + 1} failed: ${lastStatus}`);
    } catch (error) {
      lastError = error as Error;
      console.error(`Webhook attempt ${attempt + 1} error:`, error);
    }
  }
  
  return { 
    status: lastStatus || 0, 
    body: lastBody || lastError?.message || 'Unknown error', 
    success: false 
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event_type, user_id, data } = await req.json();
    
    if (!event_type || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing event_type or user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing webhook event: ${event_type} for user: ${user_id}`);

    // Fetch active webhook subscriptions for this user and event type
    const { data: subscriptions, error: subError } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', delivered: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter subscriptions by event type (empty array means all events)
    const matchingSubscriptions = subscriptions.filter(sub => {
      if (!sub.event_types || sub.event_types.length === 0) return true;
      return sub.event_types.includes(event_type);
    });

    console.log(`Found ${matchingSubscriptions.length} matching subscriptions`);

    const results = [];

    for (const subscription of matchingSubscriptions) {
      const webhookId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      
      const payload: WebhookPayload = {
        event_type,
        user_id,
        timestamp,
        webhook_id: webhookId,
        data,
      };

      // Send webhook with retry
      const result = await sendWebhookWithRetry(
        subscription.url,
        payload,
        subscription.secret_key
      );

      // Record delivery attempt
      const { error: deliveryError } = await supabase
        .from('webhook_deliveries')
        .insert({
          subscription_id: subscription.id,
          event_type,
          payload: payload as unknown as Record<string, unknown>,
          response_status: result.status || null,
          response_body: result.body?.substring(0, 1000) || null,
          attempts: 3,
          is_successful: result.success,
          last_attempt_at: new Date().toISOString(),
        });

      if (deliveryError) {
        console.error('Error recording delivery:', deliveryError);
      }

      results.push({
        subscription_id: subscription.id,
        subscription_name: subscription.name,
        success: result.success,
        status: result.status,
      });
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Webhook delivery complete: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({ 
        message: 'Webhooks processed',
        delivered: successCount,
        total: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook function error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
