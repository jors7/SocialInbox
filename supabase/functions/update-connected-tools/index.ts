import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Update all ig_accounts to set connected_tools_enabled to true
    const { data, error } = await supabase
      .from('ig_accounts')
      .update({ connected_tools_enabled: true })
      .eq('username', 'thejanorsula')
      .select();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, updated: data }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
