import * as dotenv from 'dotenv';
import * as cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const QUEUE_PROCESSOR_URL = `${SUPABASE_URL}/functions/v1/queue-processor`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.log('🚀 SocialInbox Worker started');

// Process queues every minute
cron.schedule('* * * * *', async () => {
  console.log('⏰ Running queue processing cycle...');
  
  try {
    // Process flow executions
    const flowResponse = await fetch(QUEUE_PROCESSOR_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'flow_execution' }),
    });
    const flowResult = await flowResponse.json() as { processed: number };
    console.log('✅ Flow executions processed:', flowResult.processed);

    // Process message queue
    const messageResponse = await fetch(QUEUE_PROCESSOR_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'message_send' }),
    });
    const messageResult = await messageResponse.json() as { processed: number };
    console.log('✅ Messages processed:', messageResult.processed);

    // Process API queue (multiple times for throughput)
    const apiPromises = [];
    for (let i = 0; i < 3; i++) {
      apiPromises.push(
        fetch(QUEUE_PROCESSOR_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'api_call' }),
        }).then(res => res.json())
      );
    }
    const apiResults = await Promise.all(apiPromises) as { processed: number }[];
    const totalApiProcessed = apiResults.reduce((sum, result) => sum + (result.processed || 0), 0);
    console.log('✅ API calls processed:', totalApiProcessed);

  } catch (error) {
    console.error('❌ Error in queue processing:', error);
  }
});

// Health check every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('🏥 Running health check...');
  
  try {
    // Check for stuck executions
    const { data: stuckExecutions } = await supabase
      .from('flow_executions')
      .select('id, conversation_id, started_at')
      .eq('status', 'processing')
      .lt('started_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (stuckExecutions && stuckExecutions.length > 0) {
      console.warn('⚠️  Found stuck executions:', stuckExecutions.length);
      
      // Reset stuck executions
      for (const execution of stuckExecutions) {
        await supabase
          .from('flow_executions')
          .update({ 
            status: 'queued',
            error: 'Execution timeout - resetting',
            retry_count: 1 // Simple increment for now
          })
          .eq('id', execution.id);
      }
    }

    // Check queue sizes
    const { count: flowQueueSize } = await supabase
      .from('flow_executions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued');

    const { count: messageQueueSize } = await supabase
      .from('message_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    console.log(`📊 Queue sizes - Flows: ${flowQueueSize}, Messages: ${messageQueueSize}`);

    // Alert if queues are too large
    if ((flowQueueSize || 0) > 100 || (messageQueueSize || 0) > 500) {
      console.error('🚨 Queue backlog detected! Consider scaling workers.');
    }

  } catch (error) {
    console.error('❌ Error in health check:', error);
  }
});

// Cleanup old data daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🧹 Running daily cleanup...');
  
  try {
    // Clean old flow executions
    const { count: flowCleaned } = await supabase
      .from('flow_executions')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Clean old messages
    const { count: messageCleaned } = await supabase
      .from('message_queue')
      .delete()
      .in('status', ['sent', 'failed'])
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    console.log(`✅ Cleanup completed - Flows: ${flowCleaned}, Messages: ${messageCleaned}`);
  } catch (error) {
    console.error('❌ Error in cleanup:', error);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down worker...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down worker...');
  process.exit(0);
});

// Keep the process running
process.stdin.resume();