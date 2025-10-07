import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ENCRYPTION_KEY = Deno.env.get('APP_ENCRYPTION_KEY')!;

Deno.serve(async (req) => {
  try {
    console.log('Test connection started');

    // Test 1: Check environment variables
    const envTest = {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceKey: !!SERVICE_KEY,
      hasEncryptionKey: !!ENCRYPTION_KEY,
      supabaseUrl: SUPABASE_URL,
    };
    console.log('Environment test:', envTest);

    // Test 2: Create Supabase client
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    console.log('Supabase client created');

    // Test 3: Check pgcrypto extension
    const { data: extensions, error: extError } = await supabase
      .from('pg_extension')
      .select('*')
      .eq('extname', 'pgcrypto')
      .single();

    console.log('pgcrypto check:', { extensions, extError });

    // Test 4: Try encryption
    let encryptionTest = null;
    try {
      const { data: encrypted, error: encErr } = await supabase.rpc('pgp_sym_encrypt', {
        data: 'test-token',
        psw: ENCRYPTION_KEY,
      });
      encryptionTest = { encrypted: !!encrypted, error: encErr };
      console.log('Encryption test:', encryptionTest);
    } catch (e) {
      encryptionTest = { error: e.message };
      console.log('Encryption test failed:', e);
    }

    // Test 5: Check tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['ig_accounts', 'team_members', 'teams']);

    console.log('Tables check:', { tables, tablesError });

    return new Response(
      JSON.stringify({
        success: true,
        tests: {
          environment: envTest,
          pgcrypto: { extensions, extError },
          encryption: encryptionTest,
          tables: { tables, tablesError },
        },
      }, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Test failed:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
