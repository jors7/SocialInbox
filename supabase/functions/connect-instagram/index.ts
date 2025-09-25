import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ENCRYPTION_KEY = Deno.env.get('APP_ENCRYPTION_KEY')!;
const META_APP_ID = Deno.env.get('META_APP_ID')!;
const META_APP_SECRET = Deno.env.get('META_APP_SECRET')!;
const META_GRAPH_API_VERSION = Deno.env.get('META_GRAPH_API_VERSION') || 'v20.0';

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
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${META_APP_ID}&` +
      `client_secret=${META_APP_SECRET}&` +
      `fb_exchange_token=${accessToken}`
    );

    const longLivedTokenData = await longLivedTokenResponse.json();
    
    if (!longLivedTokenData.access_token) {
      throw new Error('Failed to get long-lived token');
    }

    const longLivedToken = longLivedTokenData.access_token;
    const expiresIn = longLivedTokenData.expires_in || 5184000; // 60 days default

    // Get user's Facebook pages with Instagram Business accounts
    const pagesResponse = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/me/accounts?` +
      `fields=id,name,access_token,instagram_business_account{id,username,profile_picture_url}&` +
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
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${selectedPage.id}?` +
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

    // Note: Webhook subscription is configured in Meta App Dashboard for Instagram object
    // Not via API for Instagram Messaging

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

// Webhook subscription for Instagram Messaging is configured in the Meta App Dashboard
// Under Webhooks > Instagram > Edit Subscription
// This is different from Facebook Page webhooks which use /subscribed_apps

async function testConnection(igUserId: string, accessToken: string): Promise<boolean> {
  try {
    // Test Instagram Messaging API access
    // This checks if the account has proper permissions
    const testResponse = await fetch(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/me/messages`,
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