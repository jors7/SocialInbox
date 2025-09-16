import { INSTAGRAM_MESSAGING_WINDOW_HOURS, RATE_LIMITS } from './constants';

/**
 * Calculate when the 24-hour messaging window expires
 */
export function calculateWindowExpiry(lastUserMessageTime: Date): Date {
  const expiry = new Date(lastUserMessageTime);
  expiry.setHours(expiry.getHours() + INSTAGRAM_MESSAGING_WINDOW_HOURS);
  return expiry;
}

/**
 * Check if we're still within the messaging window
 */
export function isWithinMessagingWindow(windowExpiresAt?: Date | null): boolean {
  if (!windowExpiresAt) return false;
  return new Date() < new Date(windowExpiresAt);
}

/**
 * Generate a random delay for public replies (anti-spam)
 */
export function getPublicReplyDelay(): number {
  const min = RATE_LIMITS.PUBLIC_REPLY_MIN_DELAY_MS;
  const max = RATE_LIMITS.PUBLIC_REPLY_MAX_DELAY_MS;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Extract Instagram user ID from various webhook payloads
 */
export function extractIGUserId(payload: any): string | null {
  // For messages
  if (payload.sender?.id) {
    return payload.sender.id;
  }
  
  // For comments
  if (payload.from?.id) {
    return payload.from.id;
  }
  
  // For mentions
  if (payload.user?.id) {
    return payload.user.id;
  }
  
  return null;
}

/**
 * Extract message text from webhook payload
 */
export function extractMessageText(payload: any): string | null {
  // Text message
  if (payload.message?.text) {
    return payload.message.text;
  }
  
  // Quick reply
  if (payload.message?.quick_reply?.payload) {
    return payload.message.quick_reply.payload;
  }
  
  // Comment
  if (payload.text) {
    return payload.text;
  }
  
  return null;
}

/**
 * Check if keywords match the text (case-insensitive)
 */
export function matchesKeywords(
  text: string,
  includeKeywords?: string[],
  excludeKeywords?: string[]
): boolean {
  const lowerText = text.toLowerCase();
  
  // Check exclude keywords first
  if (excludeKeywords?.length) {
    for (const keyword of excludeKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return false;
      }
    }
  }
  
  // Check include keywords (if specified, at least one must match)
  if (includeKeywords?.length) {
    for (const keyword of includeKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return true;
      }
    }
    return false; // No include keywords matched
  }
  
  // No filters specified, matches by default
  return true;
}

/**
 * Format error for logging
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

/**
 * Sleep for a specified duration (useful for rate limiting)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Chunk an array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Generate a unique conversation key
 */
export function getConversationKey(igAccountId: string, igThreadId: string): string {
  return `${igAccountId}:${igThreadId}`;
}

/**
 * Sanitize user input for display
 */
export function sanitizeUserInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML
    .trim()
    .slice(0, 1000); // Limit length
}