// Instagram API Constants
export const INSTAGRAM_API_BASE_URL = 'https://graph.facebook.com/v18.0';
export const INSTAGRAM_MESSAGING_WINDOW_HOURS = 24;
export const INSTAGRAM_HUMAN_AGENT_WINDOW_DAYS = 7;

// Rate Limiting
export const RATE_LIMITS = {
  INSTAGRAM_API_CALLS_PER_HOUR: 200,
  INSTAGRAM_COMMENT_WRITES_PER_HOUR: 60,
  INSTAGRAM_MESSAGES_PER_CONVERSATION_PER_HOUR: 200,
  PUBLIC_REPLY_MIN_DELAY_MS: 10000, // 10 seconds
  PUBLIC_REPLY_MAX_DELAY_MS: 60000, // 60 seconds
} as const;

// Queue Names
export const QUEUE_NAMES = {
  SEND_DM: 'send_dm',
  PUBLIC_REPLY: 'public_reply',
  FLOW_STEP: 'flow_step',
  PROCESS_EVENT: 'process_event',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  QUICK_REPLY: 'quick_reply',
  MEDIA: 'media',
  SYSTEM: 'system',
} as const;

// Trigger Types
export const TRIGGER_TYPES = {
  COMMENT: 'comment',
  STORY_REPLY: 'story_reply',
  MENTION: 'mention',
} as const;

// Conversation Status
export const CONVERSATION_STATUS = {
  OPEN: 'open',
  SNOOZED: 'snoozed',
  CLOSED: 'closed',
} as const;

// Team Member Roles
export const TEAM_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  AGENT: 'agent',
  VIEWER: 'viewer',
} as const;

// Flow Node Types
export const FLOW_NODE_TYPES = {
  MESSAGE: 'message',
  QUICK_REPLY: 'quick_reply',
  CONDITION: 'condition',
  ACTION: 'action',
  WAIT: 'wait',
  END: 'end',
} as const;

// Default Flow Templates
export const DEFAULT_FLOW_TEMPLATES = [
  {
    name: 'Welcome Message',
    description: 'Simple welcome message with quick replies',
    category: 'basic',
    spec: {
      version: '1',
      entry: 'start',
      nodes: {
        start: {
          type: 'message',
          text: 'Welcome! How can I help you today?',
          go: 'menu',
        },
        menu: {
          type: 'quick_reply',
          text: 'Please choose an option:',
          quickReplies: [
            { text: 'Get Info', go: 'info' },
            { text: 'Contact Support', go: 'support' },
            { text: 'Exit', go: 'end' },
          ],
        },
        info: {
          type: 'message',
          text: 'Here is the information you requested. Visit our website for more details.',
          go: 'end',
        },
        support: {
          type: 'message',
          text: 'I\'ll connect you with our support team right away.',
          go: 'end',
        },
        end: {
          type: 'end',
        },
      },
    },
  },
  {
    name: 'Lead Capture',
    description: 'Capture email and deliver lead magnet',
    category: 'marketing',
    spec: {
      version: '1',
      entry: 'start',
      nodes: {
        start: {
          type: 'message',
          text: 'Want to get our free guide?',
          go: 'confirm',
        },
        confirm: {
          type: 'quick_reply',
          text: 'Click Yes to receive it instantly!',
          quickReplies: [
            { text: 'Yes, send it!', go: 'capture' },
            { text: 'No thanks', go: 'end' },
          ],
        },
        capture: {
          type: 'action',
          action: 'capture_email',
          go: 'deliver',
        },
        deliver: {
          type: 'message',
          text: 'Great! Check your email for the guide. Here\'s a direct link: {{download_url}}',
          go: 'end',
        },
        end: {
          type: 'end',
        },
      },
    },
  },
] as const;