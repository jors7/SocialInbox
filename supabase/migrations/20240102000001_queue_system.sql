-- Queue system tables for message processing

-- Flow executions queue
CREATE TABLE IF NOT EXISTS public.flow_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  trigger_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_node_id TEXT,
  execution_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Message send queue
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

-- API calls queue (for rate limiting)
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

-- Rate limiting tracking
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

-- Indexes for performance
CREATE INDEX idx_flow_executions_status ON public.flow_executions(status, created_at);
CREATE INDEX idx_flow_executions_conversation ON public.flow_executions(conversation_id);
CREATE INDEX idx_message_queue_status ON public.message_queue(status, scheduled_at);
CREATE INDEX idx_message_queue_conversation ON public.message_queue(conversation_id);
CREATE INDEX idx_api_queue_status ON public.api_queue(status, priority, scheduled_at);
CREATE INDEX idx_api_queue_account ON public.api_queue(ig_account_id);
CREATE INDEX idx_rate_limits_account ON public.rate_limits(ig_account_id, api_type, window_start);

-- Updated at triggers
CREATE TRIGGER update_flow_executions_updated_at
  BEFORE UPDATE ON public.flow_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_queue_updated_at
  BEFORE UPDATE ON public.message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_queue_updated_at
  BEFORE UPDATE ON public.api_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE public.flow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Flow executions policies
CREATE POLICY "flow_executions_team_read" ON public.flow_executions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.team_members tm ON tm.team_id = c.team_id
    WHERE c.id = flow_executions.conversation_id
    AND tm.user_id = auth.uid()
  ));

-- Message queue policies
CREATE POLICY "message_queue_team_read" ON public.message_queue
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.team_members tm ON tm.team_id = c.team_id
    WHERE c.id = message_queue.conversation_id
    AND tm.user_id = auth.uid()
  ));

-- API queue policies (service role only)
CREATE POLICY "api_queue_service_role" ON public.api_queue
  FOR ALL
  USING (auth.uid() IS NULL);

-- Rate limits policies (service role only)
CREATE POLICY "rate_limits_service_role" ON public.rate_limits
  FOR ALL
  USING (auth.uid() IS NULL);

-- Functions for queue management

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ig_account_id UUID,
  p_api_type TEXT,
  p_max_requests INTEGER DEFAULT 200,
  p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  v_window_start := date_trunc('hour', now() - interval '1 minute' * (EXTRACT(minute FROM now())::integer % p_window_minutes));
  
  -- Get or create rate limit record
  INSERT INTO public.rate_limits (
    ig_account_id, 
    api_type, 
    window_start, 
    window_duration_minutes, 
    request_count, 
    max_requests
  )
  VALUES (
    p_ig_account_id, 
    p_api_type, 
    v_window_start, 
    p_window_minutes, 
    1, 
    p_max_requests
  )
  ON CONFLICT (ig_account_id, api_type, window_start)
  DO UPDATE SET
    request_count = rate_limits.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_current_count;
  
  RETURN v_current_count <= p_max_requests;
END;
$$ LANGUAGE plpgsql;

-- Function to queue API call
CREATE OR REPLACE FUNCTION queue_api_call(
  p_ig_account_id UUID,
  p_api_type TEXT,
  p_payload JSONB,
  p_priority INTEGER DEFAULT 5
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.api_queue (
    ig_account_id,
    api_type,
    payload,
    priority,
    status
  ) VALUES (
    p_ig_account_id,
    p_api_type,
    p_payload,
    p_priority,
    'pending'
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get next queued item
CREATE OR REPLACE FUNCTION get_next_api_queue_item()
RETURNS TABLE (
  id UUID,
  ig_account_id UUID,
  api_type TEXT,
  payload JSONB
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.api_queue
  SET status = 'processing',
      processed_at = now()
  WHERE id = (
    SELECT q.id
    FROM public.api_queue q
    WHERE q.status = 'pending'
    AND q.scheduled_at <= now()
    AND EXISTS (
      SELECT 1 FROM check_rate_limit(q.ig_account_id, q.api_type) AS can_proceed
      WHERE can_proceed = true
    )
    ORDER BY q.priority DESC, q.scheduled_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING api_queue.id, api_queue.ig_account_id, api_queue.api_type, api_queue.payload;
END;
$$ LANGUAGE plpgsql;