import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    console.log('=== DAILY CRON JOB STARTED ===');
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Refresh tokens that are expiring soon
    console.log('1. Refreshing tokens...');
    const refreshResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/refresh-tokens`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const refreshResult = await refreshResponse.json();
    console.log('Token refresh result:', refreshResult);

    // 2. Clean up old messages (optional - keep last 90 days)
    console.log('2. Cleaning up old messages...');
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { error: cleanupError } = await supabase
      .from('messages')
      .delete()
      .lt('created_at', ninetyDaysAgo);

    if (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    } else {
      console.log('✓ Old messages cleaned up');
    }

    // 3. Check for expired conversations (24-hour window)
    console.log('3. Checking expired conversations...');
    const now = new Date().toISOString();

    const { data: expiredConvos, error: expiredError } = await supabase
      .from('conversations')
      .update({ automation_paused: true })
      .lt('window_expires_at', now)
      .eq('automation_paused', false)
      .select('id');

    if (expiredError) {
      console.error('Expired conversation error:', expiredError);
    } else {
      console.log(`✓ Paused automation for ${expiredConvos?.length || 0} expired conversations`);
    }

    console.log('=== DAILY CRON JOB COMPLETED ===');

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results: {
          tokenRefresh: refreshResult,
          messagesCleanedUp: true,
          conversationsPaused: expiredConvos?.length || 0,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Cron job error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
