import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const META_WEBHOOK_VERIFY_TOKEN = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const META_GRAPH_API_VERSION = Deno.env.get('META_GRAPH_API_VERSION') || 'v20.0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const method = req.method;
  const url = new URL(req.url);

  // Handle webhook verification
  if (method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === META_WEBHOOK_VERIFY_TOKEN) {
      console.log('Webhook verified');
      return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
  }

  // Handle webhook events
  if (method === 'POST') {
    try {
      const body = await req.json();
      console.log('=== WEBHOOK RECEIVED ===');
      console.log('Full body:', JSON.stringify(body, null, 2));
      console.log('Entry count:', body.entry?.length || 0);

      // Process Instagram webhook events
      // Instagram Messaging events come through the Instagram object subscription
      for (const entry of body.entry || []) {
        const igAccountId = entry.id;
        console.log('Processing entry for IG account:', igAccountId);
        console.log('Entry has changes:', !!entry.changes, 'count:', entry.changes?.length || 0);
        console.log('Entry has messaging:', !!entry.messaging, 'count:', entry.messaging?.length || 0);

        // Process changes (Instagram webhook format)
        for (const change of entry.changes || []) {
          console.log('Change field:', change.field);
          // Handle Instagram messages via Messenger API format
          if (change.field === 'messages') {
            console.log('Processing messages change');
            const messageData = change.value;
            await processInstagramMessage(messageData, igAccountId);
          }
          // Handle comments
          else if (change.field === 'comments') {
            await processComment(change.value, igAccountId);
          }
          // Handle mentions
          else if (change.field === 'mentions') {
            await processMention(change.value, igAccountId);
          }
        }

        // Also handle direct messaging format (if present)
        for (const messaging of entry.messaging || []) {
          console.log('Processing messaging event');
          await processDirectMessage(messaging, igAccountId);
        }
      }

      console.log('=== WEBHOOK PROCESSING COMPLETE ===');
      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('!!! ERROR PROCESSING WEBHOOK !!!', error);
      console.error('Error stack:', error.stack);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
});

async function processInstagramMessage(messageData: any, igAccountId: string) {
  try {
    console.log('processInstagramMessage called with igAccountId:', igAccountId);
    console.log('messageData:', JSON.stringify(messageData, null, 2));

    // Get the Instagram account from database
    const { data: igAccount, error: accountError } = await supabase
      .from('ig_accounts')
      .select('*')
      .eq('instagram_user_id', igAccountId)
      .single();

    if (!igAccount) {
      console.error('Instagram account not found:', igAccountId, 'error:', accountError);
      return;
    }

    console.log('Found IG account:', igAccount.username);

    // Extract message details from Instagram webhook format
    const { from, to, message } = messageData;
    const senderId = from.id;
    const recipientId = to.data[0]?.id || igAccountId;

    // Skip if message is from the business account
    if (senderId === igAccount.instagram_user_id) {
      return;
    }

    // Get or create conversation
    let conversation = await getOrCreateConversation(igAccount, senderId, from.username);

    // Process the message
    if (message) {
      // Insert message
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          direction: 'in',
          msg_type: message.attachments ? 'media' : 'text',
          payload: {
            text: message.text,
            attachments: message.attachments,
            mid: message.mid || messageData.id,
            timestamp: messageData.timestamp,
          },
          delivery_status: 'delivered',
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting message:', error);
        return;
      }

      // Update conversation
      await supabase
        .from('conversations')
        .update({
          last_user_ts: new Date().toISOString(),
          status: 'open',
        })
        .eq('id', conversation.id);

      // TODO: Add flow execution logic here when flows are implemented
      // For now, just log that we received the message
      console.log('Message saved successfully:', newMessage.id);
    }
  } catch (error) {
    console.error('Error processing Instagram message:', error);
  }
}

async function processDirectMessage(messaging: any, igAccountId: string) {
  // This handles the Messenger-style format if it comes through
  try {
    // Get the Instagram account from database
    const { data: igAccount } = await supabase
      .from('ig_accounts')
      .select('*')
      .eq('instagram_user_id', igAccountId)
      .single();

    if (!igAccount) {
      console.error('Instagram account not found:', igAccountId);
      return;
    }

    await processMessagingEvent(messaging, igAccount);
  } catch (error) {
    console.error('Error processing direct message:', error);
  }
}

async function processMessagingEvent(messaging: any, igAccount: any) {
  const senderId = messaging.sender.id;
  const recipientId = messaging.recipient.id;
  
  // Skip if message is from the business account
  if (senderId === igAccount.instagram_user_id) {
    return;
  }

  // Get or create conversation
  let conversation = await getOrCreateConversation(igAccount, senderId);

  // Process different message types
  if (messaging.message) {
    const message = messaging.message;

    // Insert message
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'in',
        msg_type: message.quick_reply ? 'quick_reply' : (message.attachments ? 'media' : 'text'),
        payload: {
          text: message.text,
          attachments: message.attachments,
          quick_reply: message.quick_reply,
          reply_to: message.reply_to,
          mid: message.mid,
        },
        delivery_status: 'delivered',
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting message:', error);
      return;
    }

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        last_user_ts: new Date().toISOString(),
        status: 'open',
      })
      .eq('id', conversation.id);

    // TODO: Add flow execution logic here when flows are implemented
    console.log('Message saved successfully:', newMessage.id);
  }

  // Handle postback (button clicks)
  if (messaging.postback) {
    console.log('Postback received:', messaging.postback);
    // Process postback payload
  }

  // Handle delivery/read receipts
  if (messaging.delivery || messaging.read) {
    console.log('Receipt received');
    // Update message status
  }
}

async function processComment(comment: any, igAccountId: string) {
  console.log('Processing comment:', comment);

  // Get the Instagram account from database
  const { data: igAccount } = await supabase
    .from('ig_accounts')
    .select('*')
    .eq('instagram_user_id', igAccountId)
    .single();

  if (!igAccount) {
    console.error('Instagram account not found:', igAccountId);
    return;
  }
  
  // Check if we have triggers for comments
  const { data: triggers } = await supabase
    .from('triggers')
    .select('*')
    .eq('ig_account_id', igAccount.id)
    .eq('trigger_type', 'comment')
    .eq('is_active', true);

  if (!triggers || triggers.length === 0) {
    return;
  }

  // Process each trigger
  for (const trigger of triggers) {
    // Check if comment matches trigger criteria
    if (shouldTrigger(comment, trigger)) {
      // Send public reply if configured
      if (trigger.public_replies?.length > 0) {
        const replyText = trigger.public_replies[Math.floor(Math.random() * trigger.public_replies.length)];
        // This would use Instagram API to reply to comment
        console.log('Would reply with:', replyText);
      }

      // Start DM flow
      const senderId = comment.from.id;
      const conversation = await getOrCreateConversation(igAccount, senderId, comment.from.username);
      
      // Activate flow
      if (trigger.flow_id) {
        await activateFlow(conversation, trigger.flow_id, {
          trigger_type: 'comment',
          comment_text: comment.text,
          post_id: comment.media?.id,
        });
      }
    }
  }
}

async function processMention(mention: any, igAccountId: string) {
  console.log('Processing mention:', mention);

  // Get the Instagram account from database
  const { data: igAccount } = await supabase
    .from('ig_accounts')
    .select('*')
    .eq('instagram_user_id', igAccountId)
    .single();

  if (!igAccount) {
    console.error('Instagram account not found:', igAccountId);
    return;
  }
  
  // Similar to comment processing but for mentions
  const { data: triggers } = await supabase
    .from('triggers')
    .select('*')
    .eq('ig_account_id', igAccount.id)
    .eq('trigger_type', 'mention')
    .eq('is_active', true);

  if (!triggers || triggers.length === 0) {
    return;
  }

  // Process triggers...
}

async function getOrCreateConversation(igAccount: any, userId: string, username?: string) {
  // First, get or create contact
  let { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('ig_account_id', igAccount.id)
    .eq('ig_user_id', userId)
    .single();

  if (!contact) {
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        ig_account_id: igAccount.id,
        ig_user_id: userId,
        display_name: username || 'Unknown',
      })
      .select()
      .single();

    if (contactError) {
      console.error('Error creating contact:', contactError);
      throw contactError;
    }

    contact = newContact;
  }

  // Check if conversation exists
  let { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('ig_account_id', igAccount.id)
    .eq('contact_id', contact.id)
    .single();

  if (!conversation) {
    // Create new conversation with unique ig_thread_id
    const threadId = `${igAccount.instagram_user_id}_${userId}`;
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        ig_account_id: igAccount.id,
        contact_id: contact.id,
        ig_thread_id: threadId,
        status: 'open',
        last_user_ts: new Date().toISOString(),
        window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }

    conversation = newConversation;
  }

  return conversation;
}

function shouldTrigger(comment: any, trigger: any): boolean {
  const text = comment.text?.toLowerCase() || '';
  
  // Check post scope
  if (trigger.post_scope) {
    if (trigger.post_scope.mode === 'specific' && trigger.post_scope.postIds) {
      if (!trigger.post_scope.postIds.includes(comment.media?.id)) {
        return false;
      }
    }
    // Note: 'next' mode would need additional logic
  }

  // Check filters
  if (trigger.filters) {
    // Include keywords
    if (trigger.filters.include_keywords?.length > 0) {
      const hasKeyword = trigger.filters.include_keywords.some(
        (keyword: string) => text.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) {
        return false;
      }
    }

    // Exclude keywords
    if (trigger.filters.exclude_keywords?.length > 0) {
      const hasExcluded = trigger.filters.exclude_keywords.some(
        (keyword: string) => text.includes(keyword.toLowerCase())
      );
      if (hasExcluded) {
        return false;
      }
    }
  }

  return true;
}

async function queueFlowExecution(conversation: any, message: any, flowId: string) {
  // Insert into flow_executions queue
  const { error } = await supabase
    .from('flow_executions')
    .insert({
      flow_id: flowId,
      conversation_id: conversation.id,
      status: 'active',
      context: {
        message_id: message.id,
        message_text: message.payload?.text,
      },
    });

  if (error) {
    console.error('Error queuing flow execution:', error);
  }
}

async function activateFlow(conversation: any, flowId: string, context: any) {
  // Queue flow execution
  const { error } = await supabase
    .from('flow_executions')
    .insert({
      flow_id: flowId,
      conversation_id: conversation.id,
      status: 'active',
      context,
    });

  if (error) {
    console.error('Error activating flow:', error);
  }
}