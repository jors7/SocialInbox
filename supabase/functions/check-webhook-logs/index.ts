import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Get all contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(10);

    // Get all conversations
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('*')
      .limit(10);

    // Get all messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(10);

    // Get Instagram accounts
    const { data: igAccounts, error: igAccountsError } = await supabase
      .from('ig_accounts')
      .select('*')
      .limit(10);

    return new Response(
      JSON.stringify({
        contacts: contacts || [],
        contactsError,
        conversations: conversations || [],
        conversationsError,
        messages: messages || [],
        messagesError,
        igAccounts: igAccounts || [],
        igAccountsError,
      }, null, 2),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
