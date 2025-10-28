// @ts-ignore: Deno deploy
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const META_WEBHOOK_VERIFY_TOKEN = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const META_GRAPH_API_VERSION = Deno.env.get('META_GRAPH_API_VERSION') || 'v20.0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Fetch Instagram user profile from Graph API
async function fetchInstagramUserProfile(userId: string, accessToken: string) {
  const url = `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${userId}?fields=name,username&access_token=${accessToken}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

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

      // Save raw webhook to events_inbox for debugging
      await supabase.from('events_inbox').insert({
        payload: body,
        processed: false,
      });

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
    // Try both instagram_user_id and page_id since Meta can send either
    let { data: igAccount, error: accountError } = await supabase
      .from('ig_accounts')
      .select('*')
      .eq('instagram_user_id', igAccountId)
      .maybeSingle();

    // If not found by instagram_user_id, try page_id
    if (!igAccount) {
      const { data: accountByPageId } = await supabase
        .from('ig_accounts')
        .select('*')
        .eq('page_id', igAccountId)
        .maybeSingle();

      igAccount = accountByPageId;
    }

    if (!igAccount) {
      console.error('Instagram account not found for ID:', igAccountId, 'error:', accountError);
      console.error('Tried both instagram_user_id and page_id');
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
          window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Reset 24h window
        })
        .eq('id', conversation.id);

      console.log('Message saved successfully:', newMessage.id);

      // Check if there are any active message triggers for this account
      await checkAndTriggerFlows(igAccount, conversation, newMessage, message.text || '');
    }
  } catch (error) {
    console.error('Error processing Instagram message:', error);
  }
}

async function processDirectMessage(messaging: any, igAccountId: string) {
  // This handles the Messenger-style format if it comes through
  try {
    // Get the Instagram account from database
    let { data: igAccount } = await supabase
      .from('ig_accounts')
      .select('*')
      .eq('instagram_user_id', igAccountId)
      .maybeSingle();

    if (!igAccount) {
      const { data: accountByPageId } = await supabase
        .from('ig_accounts')
        .select('*')
        .eq('page_id', igAccountId)
        .maybeSingle();

      igAccount = accountByPageId;
    }

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

    console.log('Message saved successfully:', newMessage.id);

    // Check if there are any active message triggers for this account
    await checkAndTriggerFlows(igAccount, conversation, newMessage, message.text || '');
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

// Check for message-based triggers and start flows
async function checkAndTriggerFlows(igAccount: any, conversation: any, message: any, messageText: string) {
  try {
    console.log('[TRIGGER CHECK] Starting trigger check for:', {
      igAccountId: igAccount.id,
      messageText,
      messageId: message.id,
    });

    // Check if there are active triggers for "direct_message" type
    const { data: triggers, error: triggerError } = await supabase
      .from('triggers')
      .select('*')
      .eq('ig_account_id', igAccount.id)
      .eq('trigger_type', 'direct_message')
      .eq('is_active', true);

    console.log('[TRIGGER CHECK] Query result:', {
      triggersFound: triggers?.length || 0,
      error: triggerError,
      triggers: triggers,
    });

    if (triggerError) {
      console.error('Error fetching triggers:', triggerError);
      return;
    }

    if (!triggers || triggers.length === 0) {
      console.log('[TRIGGER CHECK] No active message triggers found for ig_account_id:', igAccount.id);
      return;
    }

    // Check each trigger's filters
    for (const trigger of triggers) {
      console.log('[TRIGGER CHECK] Evaluating trigger:', {
        triggerId: trigger.id,
        flowId: trigger.flow_id,
        filters: trigger.filters,
      });

      if (shouldTriggerFlow(messageText, trigger)) {
        console.log(`[TRIGGER CHECK] ✅ Triggering flow ${trigger.flow_id} for message "${messageText}"`);

        // Start the flow
        await activateFlow(conversation, trigger.flow_id, {
          trigger_type: 'direct_message',
          message_text: messageText,
          message_id: message.id,
          triggered_at: new Date().toISOString(),
        });
      } else {
        console.log(`[TRIGGER CHECK] ❌ Trigger ${trigger.id} did not match`);
      }
    }
  } catch (error) {
    console.error('Error checking/triggering flows:', error);
  }
}

// Check if message should trigger a flow based on trigger filters
function shouldTriggerFlow(messageText: string, trigger: any): boolean {
  const text = messageText.toLowerCase();
  const filters = trigger.filters || {};

  // Check include keywords
  if (filters.include_keywords && filters.include_keywords.length > 0) {
    const hasKeyword = filters.include_keywords.some(
      (keyword: string) => text.includes(keyword.toLowerCase())
    );
    if (!hasKeyword) {
      return false;
    }
  }

  // Check exclude keywords
  if (filters.exclude_keywords && filters.exclude_keywords.length > 0) {
    const hasExcluded = filters.exclude_keywords.some(
      (keyword: string) => text.includes(keyword.toLowerCase())
    );
    if (hasExcluded) {
      return false;
    }
  }

  return true;
}

async function processComment(comment: any, igAccountId: string) {
  console.log('Processing comment:', comment);

  // Get the Instagram account from database
  let { data: igAccount } = await supabase
    .from('ig_accounts')
    .select('*')
    .eq('instagram_user_id', igAccountId)
    .maybeSingle();

  if (!igAccount) {
    const { data: accountByPageId } = await supabase
      .from('ig_accounts')
      .select('*')
      .eq('page_id', igAccountId)
      .maybeSingle();

    igAccount = accountByPageId;
  }

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
  let { data: igAccount } = await supabase
    .from('ig_accounts')
    .select('*')
    .eq('instagram_user_id', igAccountId)
    .maybeSingle();

  if (!igAccount) {
    const { data: accountByPageId } = await supabase
      .from('ig_accounts')
      .select('*')
      .eq('page_id', igAccountId)
      .maybeSingle();

    igAccount = accountByPageId;
  }

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
    // Fetch user profile from Instagram API if no username provided
    let displayName = username || 'Unknown';

    if (!username) {
      try {
        const userProfile = await fetchInstagramUserProfile(userId, igAccount.access_token);
        displayName = userProfile.name || userProfile.username || userId;
        console.log('Fetched user profile:', { userId, displayName });
      } catch (error) {
        console.error('Failed to fetch user profile, using fallback:', error);
      }
    }

    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        ig_account_id: igAccount.id,
        ig_user_id: userId,
        display_name: displayName,
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
