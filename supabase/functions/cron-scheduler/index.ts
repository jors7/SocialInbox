import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const QUEUE_PROCESSOR_URL = `${SUPABASE_URL}/functions/v1/queue-processor`;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// This function is called by a cron job every minute
serve(async (req) => {
  console.log('Starting queue processing cycle...');
  const results = {
    flow_executions: null,
    message_queue: null,
    api_queue: null,
    cleanup: null,
  };

  try {
    // Process flow executions
    const flowResponse = await fetch(QUEUE_PROCESSOR_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'flow_execution' }),
    });
    results.flow_executions = await flowResponse.json();

    // Process message queue
    const messageResponse = await fetch(QUEUE_PROCESSOR_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'message_send' }),
    });
    results.message_queue = await messageResponse.json();

    // Process API queue (multiple times for higher throughput)
    const apiPromises = [];
    for (let i = 0; i < 5; i++) {
      apiPromises.push(
        fetch(QUEUE_PROCESSOR_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'api_call' }),
        }).then(res => res.json())
      );
    }
    results.api_queue = await Promise.all(apiPromises);

    // Cleanup old data
    results.cleanup = await cleanupOldData();

    console.log('Queue processing cycle completed:', results);
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in queue processing cycle:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// Cleanup old data
async function cleanupOldData() {
  const cleanupResults = {
    flow_executions: 0,
    message_queue: 0,
    api_queue: 0,
    rate_limits: 0,
  };

  try {
    // Clean up old completed flow executions (older than 7 days)
    const { count: flowCount } = await supabase
      .from('flow_executions')
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .select('*', { count: 'exact', head: true });
    cleanupResults.flow_executions = flowCount || 0;

    // Clean up old sent messages (older than 30 days)
    const { count: messageCount } = await supabase
      .from('message_queue')
      .delete()
      .in('status', ['sent', 'failed'])
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .select('*', { count: 'exact', head: true });
    cleanupResults.message_queue = messageCount || 0;

    // Clean up old API queue items (older than 1 day)
    const { count: apiCount } = await supabase
      .from('api_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select('*', { count: 'exact', head: true });
    cleanupResults.api_queue = apiCount || 0;

    // Clean up old rate limit windows (older than 2 hours)
    const { count: rateCount } = await supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .select('*', { count: 'exact', head: true });
    cleanupResults.rate_limits = rateCount || 0;

    return cleanupResults;
  } catch (error) {
    console.error('Error cleaning up old data:', error);
    return cleanupResults;
  }
}

// Additional monitoring functions
async function checkQueueHealth() {
  const health = {
    flow_executions_pending: 0,
    flow_executions_stuck: 0,
    message_queue_pending: 0,
    api_queue_pending: 0,
    rate_limited_accounts: [],
  };

  // Check pending flow executions
  const { count: flowPending } = await supabase
    .from('flow_executions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'queued');
  health.flow_executions_pending = flowPending || 0;

  // Check stuck flow executions (processing for more than 10 minutes)
  const { count: flowStuck } = await supabase
    .from('flow_executions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing')
    .lt('started_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());
  health.flow_executions_stuck = flowStuck || 0;

  // Check pending messages
  const { count: messagePending } = await supabase
    .from('message_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  health.message_queue_pending = messagePending || 0;

  // Check pending API calls
  const { count: apiPending } = await supabase
    .from('api_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  health.api_queue_pending = apiPending || 0;

  // Check rate limited accounts
  const { data: rateLimits } = await supabase
    .from('rate_limits')
    .select('ig_account_id, api_type, request_count, max_requests')
    .gte('window_start', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .filter('request_count', 'gte', 'max_requests');
  
  if (rateLimits) {
    health.rate_limited_accounts = rateLimits;
  }

  // Alert if there are issues
  if (health.flow_executions_stuck > 0 || health.rate_limited_accounts.length > 0) {
    console.warn('Queue health issues detected:', health);
    // Here you could send alerts via email, Slack, etc.
  }

  return health;
}