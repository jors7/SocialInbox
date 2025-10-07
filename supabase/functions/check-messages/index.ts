import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Check messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Check conversations
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .order('last_user_ts', { ascending: false, nullsFirst: false })
      .limit(5);

    return new Response(
      JSON.stringify({
        messages: messages || [],
        messagesError: msgError,
        conversations: conversations || [],
        conversationsError: convError
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
