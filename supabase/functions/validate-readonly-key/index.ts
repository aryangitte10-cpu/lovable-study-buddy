import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Allowed read-only RPC functions
const ALLOWED_RPCS = [
  'get_todays_tasks',
  'get_due_questions',
  'get_audit_state',
  'get_changes_since',
  'get_recordings_ready',
  'get_daily_expected_state',
];

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    // Get API key from header
    const authHeader = req.headers.get('authorization') || req.headers.get('x-api-key');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing API key. Use Authorization: Bearer <key> or X-API-Key: <key>' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract key (handle both "Bearer <key>" and raw key formats)
    const apiKey = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!apiKey.startsWith('jee_')) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the key to compare with stored hash
    const keyHash = await hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 12);

    // Look up the API key
    const { data: apiKeyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('key_prefix', keyPrefix)
      .eq('is_active', true)
      .maybeSingle();

    if (keyError || !apiKeyRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check expiration
    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'API key has expired' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the requested RPC function
    const { rpc_name, params } = await req.json();

    if (!rpc_name) {
      return new Response(
        JSON.stringify({ error: 'Missing rpc_name in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is a read-only function
    if (!ALLOWED_RPCS.includes(rpc_name)) {
      return new Response(
        JSON.stringify({ 
          error: 'Access denied. This API key only allows read-only operations.',
          allowed_functions: ALLOWED_RPCS 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce read-only for read-only keys
    if (apiKeyRecord.is_read_only) {
      // All allowed RPCs are read-only, so this is fine
    }

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id);

    // Execute the RPC with the user's ID
    const rpcParams = {
      ...params,
      p_user_id: apiKeyRecord.user_id,
    };

    const { data: rpcResult, error: rpcError } = await supabase.rpc(rpc_name, rpcParams);

    if (rpcError) {
      console.error('RPC error:', rpcError);
      return new Response(
        JSON.stringify({ error: rpcError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ data: rpcResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Validate key error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
