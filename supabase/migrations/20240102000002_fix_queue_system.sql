-- Fix queue system tables
-- Drop existing indexes that might fail
DROP INDEX IF EXISTS idx_flow_executions_status;
DROP INDEX IF EXISTS idx_flow_executions_conversation;
DROP INDEX IF EXISTS idx_message_queue_status;
DROP INDEX IF EXISTS idx_message_queue_conversation;
DROP INDEX IF EXISTS idx_api_queue_status;
DROP INDEX IF EXISTS idx_api_queue_account;
DROP INDEX IF EXISTS idx_rate_limits_account;

-- Add missing columns if they don't exist
ALTER TABLE public.flow_executions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;

-- Recreate indexes with correct columns
CREATE INDEX IF NOT EXISTS idx_flow_executions_status ON public.flow_executions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_flow_executions_conversation ON public.flow_executions(conversation_id);

-- Create message_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  flow_execution_id UUID REFERENCES public.flow_executions(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'template')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'rate_limited')),
  scheduled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  sent_at TIMESTAMPTZ,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create api_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.api_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ig_account_id UUID NOT NULL REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
  api_type TEXT NOT NULL CHECK (api_type IN ('send_message', 'get_messages', 'reply_comment', 'get_comments', 'get_mentions')),
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rate_limited')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  scheduled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  processed_at TIMESTAMPTZ,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create rate_limits table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ig_account_id UUID NOT NULL REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
  api_type TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_duration_minutes INTEGER NOT NULL,
  request_count INTEGER DEFAULT 0,
  max_requests INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(ig_account_id, api_type, window_start)
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON public.message_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_message_queue_conversation ON public.message_queue(conversation_id);
CREATE INDEX IF NOT EXISTS idx_api_queue_status ON public.api_queue(status, priority, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_api_queue_account ON public.api_queue(ig_account_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_account ON public.rate_limits(ig_account_id, api_type, window_start);

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_flow_executions_updated_at ON public.flow_executions;
CREATE TRIGGER update_flow_executions_updated_at
  BEFORE UPDATE ON public.flow_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_message_queue_updated_at ON public.message_queue;
CREATE TRIGGER update_message_queue_updated_at
  BEFORE UPDATE ON public.message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_queue_updated_at ON public.api_queue;
CREATE TRIGGER update_api_queue_updated_at
  BEFORE UPDATE ON public.api_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON public.rate_limits;
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();