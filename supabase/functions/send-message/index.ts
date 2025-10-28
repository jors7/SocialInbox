import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { InstagramClient } from '../_shared/instagram.ts';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const ENCRYPTION_KEY = Deno.env.get('APP_ENCRYPTION_KEY')!;

interface SendMessageRequest {
  messageId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messageId } = await req.json() as SendMessageRequest;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Get message details
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select(`
        *,
        conversations!inner(
          ig_thread_id,
          window_expires_at,
          automation_paused,
          human_agent_until,
          contacts!inner(
            ig_user_id
          ),
          ig_accounts!inner(
            id,
            access_token_enc
          )
        )
      `)
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      throw new Error('Message not found');
    }

    const conversation = message.conversations;
    const igAccount = conversation.ig_accounts;
    const contact = conversation.contacts;

    // Check if we can send the message
    const now = new Date();
    const windowExpires = new Date(conversation.window_expires_at);
    
    // Check messaging window
    if (now > windowExpires && message.policy_tag !== 'HUMAN_AGENT') {
      await supabase
        .from('messages')
        .update({ 
          delivery_status: 'failed',
          payload: { 
            ...message.payload, 
            error: 'Outside 24-hour messaging window' 
          }
        })
        .eq('id', messageId);
      
      return new Response(
        JSON.stringify({ error: 'Outside messaging window' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if automation is paused
    if (conversation.automation_paused && message.policy_tag !== 'HUMAN_AGENT') {
      await supabase
        .from('messages')
        .update({ 
          delivery_status: 'failed',
          payload: { 
            ...message.payload, 
            error: 'Automation paused for this conversation' 
          }
        })
        .eq('id', messageId);
      
      return new Response(
        JSON.stringify({ error: 'Automation paused' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt access token
    const { data: tokenData, error: tokenError } = await supabase.rpc('decrypt_token', {
      encrypted_token: igAccount.access_token_enc,
      key: ENCRYPTION_KEY,
    });

    if (tokenError || !tokenData) {
      throw new Error('Failed to decrypt access token');
    }

    const igClient = new InstagramClient(tokenData);

    // Send the message based on type
    let result;
    try {
      switch (message.msg_type) {
        case 'text':
          result = await igClient.sendTextMessage(
            contact.ig_user_id,
            message.payload.text,
            message.policy_tag === 'HUMAN_AGENT' ? 'HUMAN_AGENT' : undefined
          );
          break;
          
        case 'quick_reply':
          result = await igClient.sendQuickReply(
            contact.ig_user_id,
            message.payload.text,
            message.payload.quickReplies
          );
          break;
          
        case 'media':
          result = await igClient.sendMedia(
            contact.ig_user_id,
            message.payload.url,
            message.payload.type || 'image'
          );
          break;
          
        default:
          throw new Error(`Unsupported message type: ${message.msg_type}`);
      }

      // Update message status
      await supabase
        .from('messages')
        .update({ 
          delivery_status: 'sent',
          sent_at: new Date().toISOString(),
          payload: { ...message.payload, ig_message_id: result.message_id }
        })
        .eq('id', messageId);

      // Update conversation timestamps
      await supabase
        .from('conversations')
        .update({ 
          last_agent_ts: new Date().toISOString()
        })
        .eq('id', message.conversation_id);

      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (sendError: any) {
      // Handle rate limiting
      if (sendError.message.includes('rate limit')) {
        // Re-queue the message with backoff
        await supabase
          .from('messages')
          .update({ 
            delivery_status: 'queued',
            payload: { 
              ...message.payload, 
              retry_count: (message.payload.retry_count || 0) + 1,
              retry_after: new Date(Date.now() + 60000).toISOString() // 1 minute
            }
          })
          .eq('id', messageId);
      } else {
        // Mark as failed
        await supabase
          .from('messages')
          .update({ 
            delivery_status: 'failed',
            payload: { 
              ...message.payload, 
              error: sendError.message 
            }
          })
          .eq('id', messageId);
      }
      
      throw sendError;
    }
  } catch (error: any) {
    console.error('Error sending message:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});