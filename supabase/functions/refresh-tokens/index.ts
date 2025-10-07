import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const ENCRYPTION_KEY = Deno.env.get('APP_ENCRYPTION_KEY')!;
const META_APP_ID = Deno.env.get('META_APP_ID')!;
const META_APP_SECRET = Deno.env.get('META_APP_SECRET')!;
const META_GRAPH_API_VERSION = Deno.env.get('META_GRAPH_API_VERSION') || 'v20.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Find accounts with tokens expiring in the next 7 days
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: accounts, error: fetchError } = await supabase
      .from('ig_accounts')
      .select('*')
      .lt('token_expires_at', sevenDaysFromNow);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${accounts?.length || 0} accounts with tokens expiring soon`);

    const results = [];

    for (const account of accounts || []) {
      try {
        console.log(`Refreshing token for account: ${account.username}`);

        // Decrypt current token
        const { data: decryptedToken, error: decryptError } = await supabase.rpc('decrypt_token', {
          encrypted_token: account.access_token_enc,
          key: ENCRYPTION_KEY,
        });

        if (decryptError) {
          throw new Error(`Failed to decrypt token: ${decryptError.message}`);
        }

        // Exchange for new long-lived token
        const refreshResponse = await fetch(
          `https://graph.facebook.com/${META_GRAPH_API_VERSION}/oauth/access_token?` +
          `grant_type=fb_exchange_token&` +
          `client_id=${META_APP_ID}&` +
          `client_secret=${META_APP_SECRET}&` +
          `fb_exchange_token=${decryptedToken}`
        );

        const refreshData = await refreshResponse.json();

        if (!refreshData.access_token) {
          throw new Error(`Failed to refresh token: ${JSON.stringify(refreshData)}`);
        }

        const newToken = refreshData.access_token;
        const expiresIn = refreshData.expires_in || 5184000; // 60 days default

        // Encrypt new token
        const { data: encryptedNewToken, error: encryptError } = await supabase.rpc('encrypt_token', {
          token: newToken,
          key: ENCRYPTION_KEY,
        });

        if (encryptError) {
          throw new Error(`Failed to encrypt token: ${encryptError.message}`);
        }

        // Update account with new token
        const { error: updateError } = await supabase
          .from('ig_accounts')
          .update({
            access_token_enc: encryptedNewToken,
            token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`✓ Successfully refreshed token for ${account.username}`);
        results.push({
          username: account.username,
          success: true,
          new_expiry: new Date(Date.now() + expiresIn * 1000).toISOString(),
        });
      } catch (error: any) {
        console.error(`✗ Failed to refresh token for ${account.username}:`, error.message);
        results.push({
          username: account.username,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        refreshed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error refreshing tokens:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
