import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Check triggers
    const { data: triggers, error: triggerError } = await supabase
      .from('triggers')
      .select('*')
      .order('created_at', { ascending: false });

    // Check flows
    const { data: flows, error: flowError } = await supabase
      .from('flows')
      .select('id, name, is_active')
      .order('created_at', { ascending: false });

    // Check flow_executions
    const { data: executions, error: execError } = await supabase
      .from('flow_executions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);

    return new Response(
      JSON.stringify({
        triggers: triggers || [],
        triggerError,
        flows: flows || [],
        flowError,
        executions: executions || [],
        execError
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
