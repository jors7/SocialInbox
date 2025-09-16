import { z } from 'zod';

// User and Team schemas
export const TeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  owner: z.string().uuid(),
  createdAt: z.date(),
});

export const TeamMemberSchema = z.object({
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'agent', 'viewer']),
  createdAt: z.date(),
});

// Instagram Account schemas
export const IGAccountSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  instagramUserId: z.string(),
  username: z.string(),
  accessTokenEnc: z.string(),
  tokenExpiresAt: z.date().optional(),
  connectedToolsEnabled: z.boolean(),
  pageId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Contact and Conversation schemas
export const ContactSchema = z.object({
  id: z.string().uuid(),
  igAccountId: z.string().uuid(),
  igUserId: z.string(),
  displayName: z.string().optional(),
  tags: z.array(z.string()),
  consent: z.record(z.any()),
  firstSeenAt: z.date(),
});

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  igAccountId: z.string().uuid(),
  igThreadId: z.string(),
  lastUserTs: z.date().optional(),
  lastAgentTs: z.date().optional(),
  windowExpiresAt: z.date().optional(),
  status: z.enum(['open', 'snoozed', 'closed']),
  humanAgentUntil: z.date().optional(),
});

// Message schemas
export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  direction: z.enum(['in', 'out']),
  msgType: z.enum(['text', 'quick_reply', 'media', 'system']),
  payload: z.record(z.any()),
  policyTag: z.enum(['NONE', 'HUMAN_AGENT']),
  deliveryStatus: z.enum(['queued', 'sent', 'delivered', 'failed']),
  sentAt: z.date().optional(),
  createdAt: z.date(),
});

// Flow schemas
export const FlowNodeSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message'),
    text: z.string(),
    go: z.string().optional(),
  }),
  z.object({
    type: z.literal('quick_reply'),
    text: z.string(),
    quickReplies: z.array(z.object({
      text: z.string(),
      go: z.string(),
    })),
  }),
  z.object({
    type: z.literal('condition'),
    condition: z.string(),
    true: z.string(),
    false: z.string(),
  }),
  z.object({
    type: z.literal('action'),
    action: z.string(),
    params: z.record(z.any()).optional(),
    go: z.string(),
  }),
  z.object({
    type: z.literal('wait'),
    duration: z.number(),
    go: z.string(),
  }),
  z.object({
    type: z.literal('end'),
  }),
]);

export const FlowSpecSchema = z.object({
  version: z.string(),
  entry: z.string(),
  nodes: z.record(FlowNodeSchema),
});

export const FlowSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  name: z.string(),
  spec: FlowSpecSchema,
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Trigger schemas
export const TriggerSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  igAccountId: z.string().uuid(),
  triggerType: z.enum(['comment', 'story_reply', 'mention']),
  postScope: z.object({
    mode: z.enum(['all', 'specific', 'next']),
    postIds: z.array(z.string()).optional(),
  }).optional(),
  filters: z.object({
    includeKeywords: z.array(z.string()).optional(),
    excludeKeywords: z.array(z.string()).optional(),
  }).optional(),
  publicReplies: z.array(z.string()),
  flowId: z.string().uuid(),
  isActive: z.boolean(),
  createdAt: z.date(),
});

// Webhook event schemas
export const WebhookEventSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    time: z.number(),
    messaging: z.array(z.any()).optional(),
    changes: z.array(z.any()).optional(),
  })),
});

// API Request/Response schemas
export const CreateTriggerRequestSchema = z.object({
  igAccountId: z.string().uuid(),
  triggerType: z.enum(['comment', 'story_reply', 'mention']),
  postScope: z.object({
    mode: z.enum(['all', 'specific', 'next']),
    postIds: z.array(z.string()).optional(),
  }).optional(),
  filters: z.object({
    includeKeywords: z.array(z.string()).optional(),
    excludeKeywords: z.array(z.string()).optional(),
  }).optional(),
  publicReplies: z.array(z.string()).min(1),
  flowId: z.string().uuid(),
});

export const SendMessageRequestSchema = z.object({
  conversationId: z.string().uuid(),
  msgType: z.enum(['text', 'quick_reply', 'media']),
  text: z.string().optional(),
  quickReplies: z.array(z.object({
    title: z.string(),
    payload: z.string(),
  })).optional(),
  mediaUrl: z.string().url().optional(),
  policyTag: z.enum(['NONE', 'HUMAN_AGENT']).optional(),
});