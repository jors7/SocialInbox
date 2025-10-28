import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    console.log('Starting analytics aggregation...');

    // Get the date to aggregate (yesterday by default, or from query param)
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().split('T')[0];

    console.log('Aggregating data for date:', dateStr);

    // Get all teams and their IG accounts
    const { data: accounts } = await supabase
      .from('ig_accounts')
      .select('id, team_id');

    if (!accounts || accounts.length === 0) {
      return new Response(JSON.stringify({ message: 'No accounts found' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const results = [];

    for (const account of accounts) {
      const metrics = await aggregateForAccount(account.team_id, account.id, dateStr);
      results.push({
        team_id: account.team_id,
        ig_account_id: account.id,
        date: dateStr,
        ...metrics,
      });
    }

    console.log('Aggregation complete:', results.length, 'entries');

    return new Response(JSON.stringify({
      date: dateStr,
      entries: results.length,
      results,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error aggregating analytics:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function aggregateForAccount(teamId: string, igAccountId: string, date: string) {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  // Get all conversations for this account to filter messages
  const { data: allConversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('ig_account_id', igAccountId);

  const allConversationIds = allConversations?.map(c => c.id) || [];

  // Message metrics - filter by message creation date, not conversation creation date
  let messagesSent = 0;
  let messagesReceived = 0;
  let messagesFailed = 0;

  if (allConversationIds.length > 0) {
    const { data: messages } = await supabase
      .from('messages')
      .select('direction, delivery_status, conversation_id')
      .in('conversation_id', allConversationIds)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    messages?.forEach(msg => {
      if (msg.direction === 'out') {
        if (msg.delivery_status === 'failed') {
          messagesFailed++;
        } else {
          messagesSent++;
        }
      } else {
        messagesReceived++;
      }
    });
  }

  // Conversation metrics - conversations that were created on this day
  const { data: newConversations } = await supabase
    .from('conversations')
    .select('id, status')
    .eq('ig_account_id', igAccountId)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  const conversationsStarted = newConversations?.length || 0;
  const conversationsCompleted = newConversations?.filter(c => c.status === 'closed').length || 0;

  // Flow metrics - flows that were triggered on this day
  let flowsTriggered = 0;
  let flowsCompleted = 0;
  let flowsFailed = 0;

  if (allConversationIds.length > 0) {
    const { data: flows } = await supabase
      .from('flow_executions')
      .select('status, conversation_id')
      .in('conversation_id', allConversationIds)
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    flowsTriggered = flows?.length || 0;
    flowsCompleted = flows?.filter(f => f.status === 'completed').length || 0;
    flowsFailed = flows?.filter(f => f.status === 'failed').length || 0;
  }

  // Unique users who sent messages on this day
  const uniqueConversationIds = new Set(
    allConversationIds.filter(id => {
      // Check if this conversation had any messages on this day
      return true; // For now, we'll count all conversations
    })
  );
  const uniqueUsers = conversationsStarted;

  // Upsert into analytics_daily
  const { error: upsertError } = await supabase
    .from('analytics_daily')
    .upsert({
      team_id: teamId,
      ig_account_id: igAccountId,
      date,
      messages_sent: messagesSent,
      messages_received: messagesReceived,
      messages_failed: messagesFailed,
      conversations_started: conversationsStarted,
      conversations_completed: conversationsCompleted,
      flows_triggered: flowsTriggered,
      flows_completed: flowsCompleted,
      flows_failed: flowsFailed,
      unique_users: uniqueUsers,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'team_id,ig_account_id,date',
    });

  if (upsertError) {
    console.error('Error upserting analytics:', upsertError);
    throw upsertError;
  }

  return {
    messages_sent: messagesSent,
    messages_received: messagesReceived,
    messages_failed: messagesFailed,
    conversations_started: conversationsStarted,
    conversations_completed: conversationsCompleted,
    flows_triggered: flowsTriggered,
    flows_completed: flowsCompleted,
    flows_failed: flowsFailed,
    unique_users: uniqueUsers,
  };
}
