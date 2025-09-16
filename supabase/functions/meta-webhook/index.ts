import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN')!;
const APP_SECRET = Deno.env.get('META_APP_SECRET')!;

interface WebhookEntry {
  id: string;
  time: number;
  messaging?: Array<any>;
  changes?: Array<any>;
}

interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Handle webhook verification (GET request from Meta)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      return new Response(challenge || '', { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
  }

  // Handle webhook events (POST request from Meta)
  if (req.method === 'POST') {
    try {
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
      
      // Verify webhook signature
      const signature = req.headers.get('x-hub-signature-256');
      if (!signature) {
        return new Response('No signature', { status: 401 });
      }

      const body = await req.text();
      const payload: WebhookPayload = JSON.parse(body);

      // Verify signature (implement HMAC-SHA256 verification)
      // For now, we'll skip this in development but it's CRITICAL for production
      // TODO: Implement signature verification

      // Process each entry
      for (const entry of payload.entry) {
        // Extract Instagram account ID from the entry
        const igAccountId = entry.id;

        // Find the corresponding IG account in our database
        const { data: igAccount } = await supabase
          .from('ig_accounts')
          .select('id')
          .eq('instagram_user_id', igAccountId)
          .single();

        // Store the raw event for processing
        const { error: insertError } = await supabase
          .from('events_inbox')
          .insert({
            ig_account_id: igAccount?.id || null,
            payload: { object: payload.object, entry },
            processed: false,
          });

        if (insertError) {
          console.error('Failed to insert event:', insertError);
        }
      }

      // Return 200 OK immediately (important for Meta)
      return new Response('ok', { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    } catch (error) {
      console.error('Webhook processing error:', error);
      // Still return 200 to prevent Meta from retrying
      return new Response('ok', { status: 200 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});