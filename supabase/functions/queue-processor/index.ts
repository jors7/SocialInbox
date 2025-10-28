import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const META_APP_ID = Deno.env.get('META_APP_ID')!;
const ENCRYPTION_KEY = Deno.env.get('APP_ENCRYPTION_KEY')!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Process different queue types
serve(async (req) => {
  const { type } = await req.json();

  switch (type) {
    case 'flow_execution':
      return await processFlowExecutions();
    case 'message_send':
      return await processMessageQueue();
    case 'api_call':
      return await processApiQueue();
    default:
      return new Response(JSON.stringify({ error: 'Unknown queue type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
  }
});

// Process flow executions
async function processFlowExecutions() {
  const { data: executions, error } = await supabase
    .from('flow_executions')
    .select(`
      *,
      flows (
        id,
        name,
        spec,
        team_id
      ),
      conversations (
        id,
        contact_id,
        ig_account_id
      )
    `)
    .eq('status', 'active')
    .order('started_at', { ascending: true })
    .limit(10);

  if (error || !executions) {
    console.error('Error fetching executions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch executions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = [];
  
  for (const execution of executions) {
    try {
      // Update status to processing
      await supabase
        .from('flow_executions')
        .update({ 
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', execution.id);

      // Process the flow
      const result = await processFlow(execution);
      results.push({ execution_id: execution.id, success: true, result });
    } catch (error) {
      console.error(`Error processing execution ${execution.id}:`, error);
      
      // Update status to failed
      await supabase
        .from('flow_executions')
        .update({
          status: 'failed',
          context: {
            ...execution.context,
            error: error.message,
          },
        })
        .eq('id', execution.id);

      results.push({ execution_id: execution.id, success: false, error: error.message });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Process a single flow
async function processFlow(execution: any) {
  const flow = execution.flows;
  const conversation = execution.conversations;
  const spec = flow.spec || {};
  const nodes = Object.values(spec.nodes || {});
  const edges = spec.edges || [];

  // Initialize execution context
  let context = {
    ...execution.context,
    conversation,
    execution_id: execution.id,
    variables: execution.context.variables || {},
  };

  // Find start node
  const startNode = nodes.find((n: any) => n.type === 'start');
  if (!startNode) {
    throw new Error('No start node found in flow');
  }

  // Execute flow nodes
  let currentNodeId = startNode.id;
  const visitedNodes = new Set<string>();

  while (currentNodeId) {
    // Prevent infinite loops
    if (visitedNodes.has(currentNodeId)) {
      console.warn('Loop detected in flow execution');
      break;
    }
    visitedNodes.add(currentNodeId);

    // Update current node
    await supabase
      .from('flow_executions')
      .update({ current_node_id: currentNodeId })
      .eq('id', execution.id);

    // Find and execute current node
    const currentNode = nodes.find((n: any) => n.id === currentNodeId);
    if (!currentNode) {
      throw new Error(`Node ${currentNodeId} not found`);
    }

    // Execute node based on type
    const nodeResult = await executeNode(currentNode, context);
    
    // Update context with node results
    context = { ...context, ...nodeResult.context };

    // Update execution context
    await supabase
      .from('flow_executions')
      .update({
        context: {
          ...execution.context,
          variables: context.variables,
          node_results: {
            ...(execution.context.node_results || {}),
            [currentNodeId]: nodeResult,
          },
        },
      })
      .eq('id', execution.id);

    // Find next node
    const outgoingEdges = edges.filter((e: any) => e.source === currentNodeId);
    
    if (outgoingEdges.length === 0) {
      // No more nodes to execute
      currentNodeId = null;
    } else if (outgoingEdges.length === 1) {
      // Single path
      currentNodeId = outgoingEdges[0].target;
    } else {
      // Multiple paths - need to evaluate conditions
      currentNodeId = await evaluateConditions(outgoingEdges, context);
    }
  }

  // Mark execution as completed
  await supabase
    .from('flow_executions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', execution.id);

  return { nodes_executed: visitedNodes.size, context };
}

// Execute a single node
async function executeNode(node: any, context: any) {
  console.log(`Executing node ${node.id} of type ${node.type}`);
  
  const nodeData = node.data || {};
  const result: any = { success: true, context: {} };

  switch (node.type) {
    case 'start':
      // Start node doesn't do anything
      break;

    case 'message':
    case 'sendMessage':
      // Queue message for sending by inserting directly into messages table
      const messageContent = replaceVariables(nodeData.text || nodeData.message || '', context.variables);
      await supabase
        .from('messages')
        .insert({
          conversation_id: context.conversation.id,
          direction: 'out',
          msg_type: 'text',
          payload: {
            text: messageContent,
            flow_execution_id: context.execution_id,
          },
          delivery_status: 'queued',
        });
      break;

    case 'delay':
      // Calculate delay time
      const delayMinutes = nodeData.delayMinutes || 1;
      const scheduledAt = new Date(Date.now() + delayMinutes * 60 * 1000);

      // Pause execution by updating status
      await supabase
        .from('flow_executions')
        .update({
          status: 'waiting',
          context: {
            ...context,
            scheduled_for: scheduledAt.toISOString(),
          },
        })
        .eq('id', context.execution_id);

      // Stop execution for now
      throw new Error('DELAY_NODE');

    case 'condition':
      // Condition evaluation happens in edge selection
      result.context.last_condition_result = await evaluateCondition(nodeData.condition, context);
      break;

    case 'collectInput':
      // Pause execution and wait for user input
      await supabase
        .from('flow_executions')
        .update({
          status: 'waiting',
          context: {
            ...context,
            waiting_for_input: true,
            input_type: nodeData.inputType || 'text',
          },
        })
        .eq('id', context.execution_id);

      // Stop execution for now
      throw new Error('WAITING_FOR_INPUT');

    case 'action':
      // Execute custom action
      result.context = await executeAction(nodeData.actionType, nodeData.actionConfig, context);
      break;

    case 'end':
      // End node - mark execution as completed
      result.context.flow_ended = true;
      break;

    default:
      console.warn(`Unknown node type: ${node.type}`);
  }

  return result;
}

// Helper function to replace variables in text
function replaceVariables(text: string, variables: any): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || match;
  });
}

// Evaluate condition
async function evaluateCondition(condition: any, context: any): Promise<boolean> {
  const { field, operator, value } = condition;
  const fieldValue = context.variables[field];

  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'not_equals':
      return fieldValue !== value;
    case 'contains':
      return String(fieldValue).includes(value);
    case 'not_contains':
      return !String(fieldValue).includes(value);
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    default:
      return false;
  }
}

// Evaluate conditions for edge selection
async function evaluateConditions(edges: any[], context: any): Promise<string | null> {
  for (const edge of edges) {
    if (!edge.data?.condition || await evaluateCondition(edge.data.condition, context)) {
      return edge.target;
    }
  }
  return null;
}

// Execute custom action
async function executeAction(actionType: string, config: any, context: any): Promise<any> {
  switch (actionType) {
    case 'add_tag':
      // Add tag to contact
      const { data: contact } = await supabase
        .from('contacts')
        .select('tags')
        .eq('id', context.conversation.contact_id)
        .single();

      const currentTags = contact?.tags || [];
      await supabase
        .from('contacts')
        .update({
          tags: [...currentTags, config.tag],
        })
        .eq('id', context.conversation.contact_id);
      return { tags: [...currentTags, config.tag] };

    case 'update_status':
      // Update conversation status
      await supabase
        .from('conversations')
        .update({
          status: config.status,
        })
        .eq('id', context.conversation.id);
      return { status: config.status };

    case 'pause_automation':
      // Pause automation for this conversation
      await supabase
        .from('conversations')
        .update({
          automation_paused: true,
        })
        .eq('id', context.conversation.id);
      return { automation_paused: true };

    default:
      console.warn(`Unknown action type: ${actionType}`);
      return {};
  }
}

// Process message send queue
async function processMessageQueue() {
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      conversations (
        id,
        ig_account_id,
        contact_id,
        contacts (
          ig_user_id
        )
      )
    `)
    .eq('delivery_status', 'queued')
    .eq('direction', 'out')
    .order('created_at', { ascending: true })
    .limit(10);

  if (error || !messages) {
    console.error('Error fetching messages:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = [];

  for (const message of messages) {
    try {
      // Get Instagram account with token
      const { data: igAccount } = await supabase
        .from('ig_accounts')
        .select('*')
        .eq('id', message.conversations.ig_account_id)
        .single();

      if (!igAccount) {
        throw new Error('Instagram account not found');
      }

      // Decrypt token
      const { data: decryptedToken, error: decryptError } = await supabase.rpc('decrypt_token', {
        encrypted_token: igAccount.access_token_enc,
        key: ENCRYPTION_KEY,
      });

      if (decryptError || !decryptedToken) {
        throw new Error(`Failed to decrypt token: ${decryptError?.message || 'Unknown error'}`);
      }

      // Send message directly
      const recipientId = message.conversations.contacts?.ig_user_id;
      if (!recipientId) {
        throw new Error('Recipient ID not found');
      }

      const result = await sendInstagramMessage(decryptedToken, {
        recipient_id: recipientId,
        message: {
          text: message.payload.text,
        },
      });

      // Update message status
      await supabase
        .from('messages')
        .update({
          delivery_status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', message.id);

      results.push({ message_id: message.id, success: true, result });
    } catch (error) {
      console.error(`Error sending message ${message.id}:`, error);

      await supabase
        .from('messages')
        .update({
          delivery_status: 'failed',
          payload: {
            ...message.payload,
            error: error.message,
          },
        })
        .eq('id', message.id);

      results.push({ message_id: message.id, success: false, error: error.message });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

// Process API call queue
async function processApiQueue() {
  // Get next item from queue
  const { data: queueItem, error } = await supabase.rpc('get_next_api_queue_item');

  if (error) {
    console.error('Error getting queue item:', error);
    return new Response(JSON.stringify({ error: 'Failed to get queue item' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!queueItem || queueItem.length === 0) {
    return new Response(JSON.stringify({ message: 'No items to process' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const item = queueItem[0];

  try {
    // Get Instagram account with decrypted token
    const { data: igAccount } = await supabase
      .from('ig_accounts')
      .select('*, page_access_token')
      .eq('id', item.ig_account_id)
      .single();

    if (!igAccount) {
      throw new Error('Instagram account not found');
    }

    // Decrypt token
    const { data: decryptedToken } = await supabase.rpc('decrypt_token', {
      encrypted_token: igAccount.page_access_token,
    });

    // Process based on API type
    let result;
    switch (item.api_type) {
      case 'send_message':
        result = await sendInstagramMessage(decryptedToken, item.payload);
        break;
      case 'reply_comment':
        result = await replyToComment(decryptedToken, item.payload);
        break;
      default:
        throw new Error(`Unknown API type: ${item.api_type}`);
    }

    // Update queue item as completed
    await supabase
      .from('api_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    // Handle post-processing
    if (item.api_type === 'send_message' && item.payload.message_queue_id) {
      // Update message queue
      await supabase
        .from('message_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', item.payload.message_queue_id);

      // Note: Messages are already in the messages table from flow execution
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`Error processing API call ${item.id}:`, error);
    
    // Update queue item as failed
    await supabase
      .from('api_queue')
      .update({
        status: item.retry_count < item.max_retries ? 'pending' : 'failed',
        error: error.message,
        retry_count: item.retry_count + 1,
        scheduled_at: new Date(Date.now() + 60000 * (item.retry_count + 1)).toISOString(), // Exponential backoff
      })
      .eq('id', item.id);

    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Send Instagram message
async function sendInstagramMessage(accessToken: string, payload: any) {
  const { recipient_id, message } = payload;
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipient_id },
        messaging_type: 'RESPONSE',
        message,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

// Reply to comment
async function replyToComment(accessToken: string, payload: any) {
  const { comment_id, message } = payload;
  
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${comment_id}/replies`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}