-- Analytics tables for tracking metrics and performance

-- Daily analytics aggregates
CREATE TABLE IF NOT EXISTS public.analytics_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  ig_account_id UUID REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Message metrics
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  
  -- Conversation metrics
  conversations_started INTEGER DEFAULT 0,
  conversations_completed INTEGER DEFAULT 0,
  conversations_abandoned INTEGER DEFAULT 0,
  active_conversations INTEGER DEFAULT 0,
  
  -- Flow metrics
  flows_triggered INTEGER DEFAULT 0,
  flows_completed INTEGER DEFAULT 0,
  flows_failed INTEGER DEFAULT 0,
  avg_flow_duration_seconds INTEGER,
  
  -- Engagement metrics
  unique_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  avg_response_time_seconds INTEGER,
  avg_messages_per_conversation DECIMAL(10,2),
  
  -- Trigger metrics
  comment_triggers INTEGER DEFAULT 0,
  story_triggers INTEGER DEFAULT 0,
  mention_triggers INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(team_id, ig_account_id, date)
);

-- Flow performance analytics
CREATE TABLE IF NOT EXISTS public.flow_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Execution metrics
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  
  -- Performance metrics
  avg_duration_seconds INTEGER,
  min_duration_seconds INTEGER,
  max_duration_seconds INTEGER,
  
  -- Node-level metrics
  node_execution_counts JSONB DEFAULT '{}'::jsonb,
  node_drop_off_rates JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(flow_id, date)
);

-- Message analytics
CREATE TABLE IF NOT EXISTS public.message_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  
  -- Delivery metrics
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Response metrics
  response_received_at TIMESTAMPTZ,
  response_time_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- User engagement tracking
CREATE TABLE IF NOT EXISTS public.user_engagement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  ig_account_id UUID NOT NULL REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
  
  -- Lifetime metrics
  first_interaction_at TIMESTAMPTZ NOT NULL,
  last_interaction_at TIMESTAMPTZ NOT NULL,
  total_conversations INTEGER DEFAULT 1,
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,
  
  -- Engagement scores
  engagement_score DECIMAL(5,2) DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  avg_response_time_seconds INTEGER,
  
  -- Tags and attributes
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  custom_attributes JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(team_id, instagram_user_id, ig_account_id)
);

-- Funnel analytics
CREATE TABLE IF NOT EXISTS public.funnel_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  funnel_name TEXT NOT NULL,
  flow_id UUID REFERENCES public.flows(id) ON DELETE SET NULL,
  
  -- Funnel steps
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [
  --   {"name": "Started", "node_id": "start", "count": 1000},
  --   {"name": "Collected Email", "node_id": "email_input", "count": 800},
  --   {"name": "Completed", "node_id": "end", "count": 600}
  -- ]
  
  -- Conversion metrics
  total_entered INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(team_id, funnel_name, date)
);

-- Real-time metrics (for live dashboard)
CREATE TABLE IF NOT EXISTS public.realtime_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour') NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_analytics_daily_team_date ON public.analytics_daily(team_id, date DESC);
CREATE INDEX idx_analytics_daily_account_date ON public.analytics_daily(ig_account_id, date DESC);
CREATE INDEX idx_flow_analytics_flow_date ON public.flow_analytics(flow_id, date DESC);
CREATE INDEX idx_message_analytics_conversation ON public.message_analytics(conversation_id);
CREATE INDEX idx_user_engagement_team ON public.user_engagement(team_id);
CREATE INDEX idx_user_engagement_instagram_user ON public.user_engagement(instagram_user_id);
CREATE INDEX idx_funnel_analytics_team_date ON public.funnel_analytics(team_id, date DESC);
CREATE INDEX idx_realtime_metrics_team ON public.realtime_metrics(team_id, expires_at);

-- Triggers for updated_at
CREATE TRIGGER update_analytics_daily_updated_at
  BEFORE UPDATE ON public.analytics_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_analytics_updated_at
  BEFORE UPDATE ON public.flow_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_engagement_updated_at
  BEFORE UPDATE ON public.user_engagement
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnel_analytics_updated_at
  BEFORE UPDATE ON public.funnel_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS policies
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_metrics ENABLE ROW LEVEL SECURITY;

-- Team members can read their analytics
CREATE POLICY "analytics_daily_team_read" ON public.analytics_daily
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = analytics_daily.team_id
    AND tm.user_id = auth.uid()
  ));

CREATE POLICY "flow_analytics_team_read" ON public.flow_analytics
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.flows f
    JOIN public.team_members tm ON tm.team_id = f.team_id
    WHERE f.id = flow_analytics.flow_id
    AND tm.user_id = auth.uid()
  ));

CREATE POLICY "message_analytics_team_read" ON public.message_analytics
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.team_members tm ON tm.team_id = c.team_id
    WHERE c.id = message_analytics.conversation_id
    AND tm.user_id = auth.uid()
  ));

CREATE POLICY "user_engagement_team_read" ON public.user_engagement
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = user_engagement.team_id
    AND tm.user_id = auth.uid()
  ));

CREATE POLICY "funnel_analytics_team_read" ON public.funnel_analytics
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = funnel_analytics.team_id
    AND tm.user_id = auth.uid()
  ));

CREATE POLICY "realtime_metrics_team_read" ON public.realtime_metrics
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = realtime_metrics.team_id
    AND tm.user_id = auth.uid()
  ));

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics(
  p_team_id UUID,
  p_ig_account_id UUID,
  p_date DATE,
  p_metric TEXT,
  p_value INTEGER DEFAULT 1
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.analytics_daily (team_id, ig_account_id, date)
  VALUES (p_team_id, p_ig_account_id, p_date)
  ON CONFLICT (team_id, ig_account_id, date) DO NOTHING;
  
  -- Update the specific metric
  EXECUTE format('
    UPDATE public.analytics_daily 
    SET %I = %I + $1, updated_at = now()
    WHERE team_id = $2 AND ig_account_id = $3 AND date = $4
  ', p_metric, p_metric)
  USING p_value, p_team_id, p_ig_account_id, p_date;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_response_rate DECIMAL,
  p_avg_messages DECIMAL,
  p_total_conversations INTEGER
) RETURNS DECIMAL AS $$
BEGIN
  -- Simple engagement score calculation
  -- Can be made more sophisticated based on business needs
  RETURN LEAST(100, 
    (p_response_rate * 0.4) + 
    (LEAST(p_avg_messages / 10, 1) * 30) + 
    (LEAST(p_total_conversations / 10, 1) * 30)
  );
END;
$$ LANGUAGE plpgsql;