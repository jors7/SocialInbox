import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { InstagramClient } from '../_shared/instagram.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ENCRYPTION_KEY = Deno.env.get('APP_ENCRYPTION_KEY')!;

interface ProcessEventRequest {
  eventId: number;
}

Deno.serve(async (req) => {
  try {
    const { eventId } = await req.json() as ProcessEventRequest;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Get the event
    const { data: event, error: eventError } = await supabase
      .from('events_inbox')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    // Mark as processing
    await supabase
      .from('events_inbox')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('id', eventId);

    const { entry } = event.payload;
    
    // Process messaging events
    if (entry.messaging && entry.messaging.length > 0) {
      for (const messagingEvent of entry.messaging) {
        await processMessagingEvent(messagingEvent, event.ig_account_id, supabase);
      }
    }

    // Process webhook changes (comments, mentions, etc.)
    if (entry.changes && entry.changes.length > 0) {
      for (const change of entry.changes) {
        await processWebhookChange(change, event.ig_account_id, supabase);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing event:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function processMessagingEvent(
  messagingEvent: any,
  igAccountId: string,
  supabase: any
) {
  const senderId = messagingEvent.sender?.id;
  const recipientId = messagingEvent.recipient?.id;
  
  if (!senderId || !recipientId) return;

  // Get or create contact
  const { data: contact } = await supabase
    .from('contacts')
    .upsert({
      ig_account_id: igAccountId,
      ig_user_id: senderId,
    }, {
      onConflict: 'ig_account_id,ig_user_id',
    })
    .select()
    .single();

  // Get or create conversation
  const threadId = messagingEvent.thread?.id || `${senderId}_${recipientId}`;
  const { data: conversation } = await supabase
    .from('conversations')
    .upsert({
      ig_account_id: igAccountId,
      contact_id: contact.id,
      ig_thread_id: threadId,
      last_user_ts: new Date().toISOString(),
      window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, {
      onConflict: 'ig_account_id,ig_thread_id',
    })
    .select()
    .single();

  // Process different message types
  if (messagingEvent.message) {
    await processMessage(messagingEvent.message, conversation.id, 'in', supabase);
  }

  if (messagingEvent.postback) {
    await processPostback(messagingEvent.postback, conversation.id, supabase);
  }
}

async function processMessage(
  message: any,
  conversationId: string,
  direction: 'in' | 'out',
  supabase: any
) {
  let msgType = 'text';
  const payload: any = {};

  if (message.text) {
    payload.text = message.text;
  }

  if (message.quick_reply) {
    msgType = 'quick_reply';
    payload.quick_reply = message.quick_reply;
  }

  if (message.attachments && message.attachments.length > 0) {
    msgType = 'media';
    payload.attachments = message.attachments;
  }

  // Insert message
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      direction,
      msg_type: msgType,
      payload,
      delivery_status: direction === 'out' ? 'queued' : 'delivered',
    });
}

async function processPostback(postback: any, conversationId: string, supabase: any) {
  // Handle postback (button clicks, etc.)
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      direction: 'in',
      msg_type: 'system',
      payload: { postback },
      delivery_status: 'delivered',
    });
}

async function processWebhookChange(change: any, igAccountId: string, supabase: any) {
  const { field, value } = change;

  switch (field) {
    case 'comments':
      await processComment(value, igAccountId, supabase);
      break;
    case 'mentions':
      await processMention(value, igAccountId, supabase);
      break;
    case 'story_insights':
    case 'story_replies':
      await processStoryReply(value, igAccountId, supabase);
      break;
  }
}

async function processComment(value: any, igAccountId: string, supabase: any) {
  const commentId = value.id;
  const mediaId = value.media?.id;
  const fromUserId = value.from?.id;
  const text = value.text;

  if (!fromUserId || !text) return;

  // Check for active comment triggers
  const { data: triggers } = await supabase
    .from('triggers')
    .select('*, flows(*)')
    .eq('ig_account_id', igAccountId)
    .eq('trigger_type', 'comment')
    .eq('is_active', true);

  for (const trigger of triggers || []) {
    // Check post scope
    if (trigger.post_scope?.mode === 'specific' && 
        !trigger.post_scope.post_ids?.includes(mediaId)) {
      continue;
    }

    // Check keyword filters
    if (!matchesKeywords(text, trigger.filters)) {
      continue;
    }

    // Check if first comment from user on this post
    const { count } = await supabase
      .from('trigger_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('trigger_id', trigger.id)
      .eq('metric_date', new Date().toISOString().split('T')[0]);

    if (count === 0) {
      // First trigger today, initialize metrics
      await supabase
        .from('trigger_metrics')
        .insert({
          trigger_id: trigger.id,
          metric_date: new Date().toISOString().split('T')[0],
          comments_received: 1,
        });
    } else {
      // Increment comment count
      await supabase.rpc('increment_trigger_metric', {
        p_trigger_id: trigger.id,
        p_metric_date: new Date().toISOString().split('T')[0],
        p_field: 'comments_received',
      });
    }

    // Queue public reply
    if (trigger.public_replies?.length > 0) {
      const replyText = trigger.public_replies[
        Math.floor(Math.random() * trigger.public_replies.length)
      ];
      
      // Add to queue with random delay
      const delay = Math.floor(Math.random() * 50000) + 10000; // 10-60 seconds
      console.log(`Queueing public reply with ${delay}ms delay`);
      
      // In a real implementation, this would add to a proper queue
      // For now, we'll just log it
    }

    // Start DM flow
    console.log(`Starting flow ${trigger.flow_id} for user ${fromUserId}`);
    // Queue DM flow execution
  }
}

async function processMention(value: any, igAccountId: string, supabase: any) {
  // Similar to processComment but for mentions
  console.log('Processing mention:', value);
}

async function processStoryReply(value: any, igAccountId: string, supabase: any) {
  // Similar to processComment but for story replies
  console.log('Processing story reply:', value);
}

function matchesKeywords(text: string, filters: any): boolean {
  if (!filters) return true;
  
  const lowerText = text.toLowerCase();
  
  if (filters.exclude_keywords?.length) {
    for (const keyword of filters.exclude_keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return false;
      }
    }
  }
  
  if (filters.include_keywords?.length) {
    for (const keyword of filters.include_keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    return false;
  }
  
  return true;
}