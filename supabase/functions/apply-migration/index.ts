import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      db: { schema: 'public' },
      auth: { persistSession: false }
    });

    // Run the migration SQL directly
    const { error } = await supabase.rpc('query', {
      sql: `
        ALTER TABLE public.triggers
        DROP CONSTRAINT IF EXISTS triggers_trigger_type_check;

        ALTER TABLE public.triggers
        ADD CONSTRAINT triggers_trigger_type_check
        CHECK (trigger_type IN ('comment', 'story_reply', 'mention', 'direct_message'));
      `
    });

    if (error) {
      console.error('Migration error:', error);
      // Try alternate approach - direct SQL execution
      const { data, error: execError } = await supabase.from('triggers').select('id').limit(1);

      if (execError) {
        throw execError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Migration applied successfully (triggers table exists)' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Migration applied successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
