import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    console.log('Starting queue processing...');

    const results = {
      flow_executions: null as any,
      message_sending: null as any,
    };

    // Process flow executions
    const flowResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/queue-processor`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'flow_execution' }),
      }
    );

    if (flowResponse.ok) {
      results.flow_executions = await flowResponse.json();
      console.log('Flow executions processed:', results.flow_executions);
    } else {
      console.error('Flow execution processing failed:', await flowResponse.text());
    }

    // Process message queue
    const messageResponse = await fetch(
      `${SUPABASE_URL}/functions/v1/queue-processor`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'message_send' }),
      }
    );

    if (messageResponse.ok) {
      results.message_sending = await messageResponse.json();
      console.log('Messages processed:', results.message_sending);
    } else {
      console.error('Message processing failed:', await messageResponse.text());
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Queue processing completed',
        results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Queue processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
