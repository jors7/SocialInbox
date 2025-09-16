import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ENCRYPTION_KEY = Deno.env.get('APP_ENCRYPTION_KEY')!;
const META_APP_ID = Deno.env.get('META_APP_ID')!;

interface ConnectInstagramRequest {
  accessToken: string;
  refreshToken?: string;
  userId: string;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { accessToken, refreshToken, userId } = await req.json() as ConnectInstagramRequest;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Get user's team
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .single();

    if (teamError || !teamMember) {
      throw new Error('User team not found');
    }

    // Exchange short-lived token for long-lived token
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${META_APP_ID}&` +
      `client_secret=${Deno.env.get('META_APP_SECRET')}&` +
      `fb_exchange_token=${accessToken}`
    );

    const longLivedTokenData = await longLivedTokenResponse.json();
    
    if (!longLivedTokenData.access_token) {
      throw new Error('Failed to get long-lived token');
    }

    const longLivedToken = longLivedTokenData.access_token;
    const expiresIn = longLivedTokenData.expires_in || 5184000; // 60 days default

    // Get user's Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account{id,username}&` +
      `access_token=${longLivedToken}`
    );

    const pagesData = await pagesResponse.json();
    
    if (!pagesData.data || pagesData.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'no_pages', message: 'No Facebook Pages found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find pages with Instagram Business accounts
    const pagesWithInstagram = pagesData.data.filter(
      (page: FacebookPage) => page.instagram_business_account
    );

    if (pagesWithInstagram.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'no_instagram', 
          message: 'No Instagram Business accounts found. Make sure your Instagram account is connected to a Facebook Page.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, connect the first Instagram account found
    // TODO: Allow user to select which account to connect if multiple
    const selectedPage = pagesWithInstagram[0];
    const igAccount = selectedPage.instagram_business_account!;

    // Get page access token (long-lived)
    const pageTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/${selectedPage.id}?` +
      `fields=access_token&` +
      `access_token=${longLivedToken}`
    );

    const pageTokenData = await pageTokenResponse.json();
    const pageAccessToken = pageTokenData.access_token || selectedPage.access_token;

    // Encrypt the token
    const { data: encryptedToken, error: encryptError } = await supabase.rpc('pgp_sym_encrypt', {
      data: pageAccessToken,
      psw: ENCRYPTION_KEY,
    });

    if (encryptError) {
      throw new Error('Failed to encrypt token');
    }

    // Check if Instagram account already exists
    const { data: existingAccount } = await supabase
      .from('ig_accounts')
      .select('id')
      .eq('instagram_user_id', igAccount.id)
      .single();

    let accountId;

    if (existingAccount) {
      // Update existing account
      const { data: updatedAccount, error: updateError } = await supabase
        .from('ig_accounts')
        .update({
          username: igAccount.username,
          access_token_enc: encryptedToken,
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          page_id: selectedPage.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      accountId = updatedAccount.id;
    } else {
      // Create new account
      const { data: newAccount, error: createError } = await supabase
        .from('ig_accounts')
        .insert({
          team_id: teamMember.team_id,
          instagram_user_id: igAccount.id,
          username: igAccount.username,
          access_token_enc: encryptedToken,
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          page_id: selectedPage.id,
          connected_tools_enabled: false, // Will be checked separately
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      accountId = newAccount.id;
    }

    // Subscribe to webhooks
    await subscribeToWebhooks(igAccount.id, pageAccessToken);

    // Test connection and check Connected Tools status
    const connectedToolsEnabled = await testConnection(igAccount.id, pageAccessToken);

    // Update Connected Tools status
    await supabase
      .from('ig_accounts')
      .update({ connected_tools_enabled: connectedToolsEnabled })
      .eq('id', accountId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        accountId,
        username: igAccount.username,
        connectedToolsEnabled,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error connecting Instagram:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function subscribeToWebhooks(igUserId: string, accessToken: string) {
  try {
    // Subscribe to Instagram webhooks
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/meta-webhook`;
    
    const subscribeResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/subscribed_apps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          access_token: accessToken,
          subscribed_fields: 'messages,messaging_postbacks,messaging_optins,message_deliveries,message_reads,messaging_payments,messaging_pre_checkouts,messaging_checkout_updates,messaging_handovers,messaging_policy_enforcement',
        }),
      }
    );

    const result = await subscribeResponse.json();
    console.log('Webhook subscription result:', result);
  } catch (error) {
    console.error('Failed to subscribe to webhooks:', error);
    // Non-critical error, continue
  }
}

async function testConnection(igUserId: string, accessToken: string): Promise<boolean> {
  try {
    // Try to send a test message to check if Connected Tools is enabled
    // This will fail if Connected Tools is not enabled
    const testResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: igUserId }, // Send to self
          message: { text: 'Test connection' },
          access_token: accessToken,
        }),
      }
    );

    const result = await testResponse.json();
    
    // If we get a specific error about Connected Tools, it's disabled
    if (result.error?.error_subcode === 2018001) {
      return false;
    }

    // If successful or other error, assume it's enabled
    return !result.error;
  } catch (error) {
    console.error('Failed to test connection:', error);
    return false;
  }
}