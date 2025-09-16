import { z } from 'zod';

export const TriggerTypeSchema = z.enum(['comment', 'story_reply', 'mention']);

export const PostScopeSchema = z.object({
  mode: z.enum(['all', 'specific', 'next']),
  postIds: z.array(z.string()).optional(),
});

export const TriggerFiltersSchema = z.object({
  includeKeywords: z.array(z.string()).optional(),
  excludeKeywords: z.array(z.string()).optional(),
});

export const CreateTriggerRequestSchema = z.object({
  igAccountId: z.string().uuid(),
  triggerType: TriggerTypeSchema,
  postScope: PostScopeSchema.optional(),
  filters: TriggerFiltersSchema.optional(),
  publicReplies: z.array(z.string()),
  flowId: z.string().uuid(),
});

export const CreateTriggerResponseSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  igAccountId: z.string().uuid(),
  triggerType: TriggerTypeSchema,
  postScope: PostScopeSchema.optional(),
  filters: TriggerFiltersSchema.optional(),
  publicReplies: z.array(z.string()),
  flowId: z.string().uuid(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UpdateTriggerRequestSchema = z.object({
  igAccountId: z.string().uuid(),
  postScope: PostScopeSchema.optional(),
  filters: TriggerFiltersSchema.optional(),
  publicReplies: z.array(z.string()),
  flowId: z.string().uuid(),
  isActive: z.boolean(),
});

export type CreateTriggerRequest = z.infer<typeof CreateTriggerRequestSchema>;
export type CreateTriggerResponse = z.infer<typeof CreateTriggerResponseSchema>;
export type UpdateTriggerRequest = z.infer<typeof UpdateTriggerRequestSchema>;