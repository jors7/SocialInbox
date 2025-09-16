export interface Team {
  id: string;
  name: string;
  owner: string;
  createdAt: Date;
}

export interface IGAccount {
  id: string;
  teamId: string;
  instagramUserId: string;
  username: string;
  accessTokenEnc: string;
  tokenExpiresAt?: Date;
  connectedToolsEnabled: boolean;
  pageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  igAccountId: string;
  igUserId: string;
  displayName?: string;
  tags: string[];
  consent: Record<string, any>;
  firstSeenAt: Date;
}

export interface Conversation {
  id: string;
  igAccountId: string;
  igThreadId: string;
  lastUserTs?: Date;
  lastAgentTs?: Date;
  windowExpiresAt?: Date;
  status: 'open' | 'snoozed' | 'closed';
  humanAgentUntil?: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: 'in' | 'out';
  msgType: 'text' | 'quick_reply' | 'media' | 'system';
  payload: Record<string, any>;
  policyTag: 'NONE' | 'HUMAN_AGENT';
  deliveryStatus: 'queued' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  createdAt: Date;
}

export interface Flow {
  id: string;
  teamId: string;
  name: string;
  spec: FlowSpec;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FlowSpec {
  version: string;
  entry: string;
  nodes: Record<string, FlowNode>;
}

export type FlowNode = 
  | MessageNode
  | QuickReplyNode
  | ConditionNode
  | ActionNode
  | WaitNode
  | EndNode;

export interface MessageNode {
  type: 'message';
  text: string;
  go?: string;
}

export interface QuickReplyNode {
  type: 'quick_reply';
  text: string;
  quickReplies: Array<{
    text: string;
    go: string;
  }>;
}

export interface ConditionNode {
  type: 'condition';
  condition: string;
  true: string;
  false: string;
}

export interface ActionNode {
  type: 'action';
  action: string;
  params?: Record<string, any>;
  go: string;
}

export interface WaitNode {
  type: 'wait';
  duration: number;
  go: string;
}

export interface EndNode {
  type: 'end';
}

export interface Trigger {
  id: string;
  teamId: string;
  igAccountId: string;
  triggerType: 'comment' | 'story_reply' | 'mention';
  postScope?: {
    mode: 'all' | 'specific' | 'next';
    postIds?: string[];
  };
  filters?: {
    includeKeywords?: string[];
    excludeKeywords?: string[];
  };
  publicReplies: string[];
  flowId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface WebhookEvent {
  id: string;
  igAccountId?: string;
  payload: Record<string, any>;
  receivedAt: Date;
  processed: boolean;
}

export interface TriggerMetric {
  id: string;
  triggerId: string;
  metricDate: Date;
  commentsReceived: number;
  dmsStarted: number;
  optIns: number;
  ctr: number;
}