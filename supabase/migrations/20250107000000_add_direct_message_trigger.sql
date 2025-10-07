-- Add direct_message as a valid trigger type
ALTER TABLE public.triggers
DROP CONSTRAINT IF EXISTS triggers_trigger_type_check;

ALTER TABLE public.triggers
ADD CONSTRAINT triggers_trigger_type_check
CHECK (trigger_type IN ('comment', 'story_reply', 'mention', 'direct_message'));
