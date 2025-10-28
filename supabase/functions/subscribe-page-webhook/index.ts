import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const META_GRAPH_API_VERSION = Deno.env.get('META_GRAPH_API_VERSION') || 'v23.0';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get the Instagram account
    const { data: igAccount } = await supabase
      .from('ig_accounts')
      .select('*')
      .eq('username', 'thejanorsula')
      .single();

    if (!igAccount) {
      return new Response(
        JSON.stringify({ error: 'Instagram account not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt the page access token
    const encryptionKey = Deno.env.get('APP_ENCRYPTION_KEY')!;

    // Convert bytea to base64 string
    const tokenBase64 = igAccount.access_token_enc;

    const { data: decryptedToken, error: decryptError } = await supabase.rpc('decrypt_token', {
      encrypted_token: tokenBase64,
      key: encryptionKey,
    });

    console.log('Decrypt result:', { decryptedToken, decryptError });

    if (!decryptedToken) {
      return new Response(
        JSON.stringify({ error: 'Failed to decrypt token' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Subscribe the page to webhooks
    const subscribeUrl = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${igAccount.page_id}/subscribed_apps`;

    const response = await fetch(subscribeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        subscribed_fields: 'messages,messaging_postbacks,message_reactions',
        access_token: decryptedToken,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: 'Failed to subscribe page',
          details: result,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify subscription
    const verifyUrl = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${igAccount.page_id}/subscribed_apps?fields=subscribed_fields&access_token=${decryptedToken}`;
    const verifyResponse = await fetch(verifyUrl);
    const verification = await verifyResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Page subscribed to webhooks successfully',
        subscriptionResult: result,
        verification: verification,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error subscribing page:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
