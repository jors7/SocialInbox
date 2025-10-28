import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const META_GRAPH_API_VERSION = Deno.env.get('META_GRAPH_API_VERSION') || 'v20.0';
const ENCRYPTION_KEY = Deno.env.get('APP_ENCRYPTION_KEY')!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    console.log('Starting contact name update...');

    // Get all contacts with "Unknown" display names
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select(`
        id,
        ig_user_id,
        display_name,
        ig_accounts!inner (
          id,
          access_token_enc
        )
      `)
      .or('display_name.eq.Unknown,display_name.is.null');

    if (contactsError) {
      throw contactsError;
    }

    console.log(`Found ${contacts?.length || 0} contacts to update`);

    const results = {
      total: contacts?.length || 0,
      updated: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Update each contact
    for (const contact of contacts || []) {
      try {
        console.log(`Fetching profile for user ${contact.ig_user_id}...`);

        // Decrypt access token
        const { data: decryptedToken, error: decryptError } = await supabase.rpc('decrypt_token', {
          encrypted_token: (contact.ig_accounts as any).access_token_enc,
          key: ENCRYPTION_KEY,
        });

        if (decryptError || !decryptedToken) {
          throw new Error(`Failed to decrypt token: ${decryptError?.message || 'Unknown error'}`);
        }

        const userProfile = await fetchInstagramUserProfile(contact.ig_user_id, decryptedToken);

        const displayName = userProfile.name || userProfile.username || contact.ig_user_id;

        console.log(`Updating contact ${contact.id} to: ${displayName}`);

        const { error: updateError } = await supabase
          .from('contacts')
          .update({ display_name: displayName })
          .eq('id', contact.id);

        if (updateError) {
          throw updateError;
        }

        results.updated++;
      } catch (error) {
        console.error(`Failed to update contact ${contact.id}:`, error);
        results.failed++;
        results.errors.push({
          contact_id: contact.id,
          error: error.message,
        });
      }
    }

    console.log('Update complete:', results);

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating contact names:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function fetchInstagramUserProfile(userId: string, accessToken: string) {
  const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${userId}?fields=name,username&access_token=${accessToken}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch user profile: ${response.status} ${errorText}`);
  }

  return await response.json();
}
