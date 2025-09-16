import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ENCRYPTION_KEY = Deno.env.get('APP_ENCRYPTION_KEY')!;

interface TestConnectionRequest {
  accountId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accountId } = await req.json() as TestConnectionRequest;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Get account details
    const { data: account, error: accountError } = await supabase
      .from('ig_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Account not found');
    }

    // Decrypt access token
    const { data: decryptedToken, error: decryptError } = await supabase.rpc('decrypt_token', {
      token_enc: account.access_token_enc,
      key: ENCRYPTION_KEY,
    });

    if (decryptError || !decryptedToken) {
      throw new Error('Failed to decrypt token');
    }

    // Check token validity
    const tokenCheckResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${decryptedToken}`
    );

    const tokenCheckData = await tokenCheckResponse.json();

    if (tokenCheckData.error) {
      // Token is invalid or expired
      return new Response(
        JSON.stringify({ 
          connected: false, 
          error: 'invalid_token',
          message: 'Access token is invalid or expired'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to access Instagram messaging endpoint to check Connected Tools
    const messagingCheckResponse = await fetch(
      `https://graph.facebook.com/v18.0/${account.instagram_user_id}/conversations?` +
      `access_token=${decryptedToken}&limit=1`
    );

    const messagingCheckData = await messagingCheckResponse.json();

    // Check for Connected Tools specific error
    let connectedToolsEnabled = true;
    if (messagingCheckData.error) {
      if (messagingCheckData.error.code === 190 && 
          messagingCheckData.error.error_subcode === 463) {
        // Connected Tools is disabled
        connectedToolsEnabled = false;
      } else if (messagingCheckData.error.message?.includes('Connected Tools')) {
        connectedToolsEnabled = false;
      }
    }

    // Get account info for additional details
    const accountInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/${account.instagram_user_id}?` +
      `fields=id,username,profile_picture_url&` +
      `access_token=${decryptedToken}`
    );

    const accountInfo = await accountInfoResponse.json();

    return new Response(
      JSON.stringify({ 
        connected: true,
        connectedToolsEnabled,
        accountInfo: {
          id: accountInfo.id,
          username: accountInfo.username,
          profilePicture: accountInfo.profile_picture_url,
        },
        tokenValid: true,
        tokenExpiresAt: account.token_expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error testing connection:', error);
    return new Response(
      JSON.stringify({ 
        connected: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});