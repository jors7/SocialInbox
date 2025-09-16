-- Enhanced messaging features: templates, broadcasts, rich media, A/B testing

-- Message templates
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'marketing', 'support', 'notification', 'custom')),
  
  -- Template content
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'carousel', 'quick_reply')),
  content JSONB NOT NULL,
  -- For text: { "text": "Hello {{first_name}}, welcome!" }
  -- For image: { "url": "...", "caption": "..." }
  -- For carousel: { "cards": [{ "title": "...", "subtitle": "...", "image_url": "...", "buttons": [...] }] }
  -- For quick_reply: { "text": "...", "quick_replies": [{ "title": "...", "payload": "..." }] }
  
  -- Variables used in template
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Broadcast campaigns
CREATE TABLE IF NOT EXISTS public.broadcast_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  ig_account_id UUID NOT NULL REFERENCES public.ig_accounts(id) ON DELETE CASCADE,
  
  -- Campaign details
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL DEFAULT 'immediate' CHECK (campaign_type IN ('immediate', 'scheduled', 'recurring')),
  
  -- Targeting
  audience_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Examples:
  -- { "tags": ["customer", "vip"] }
  -- { "last_interaction": { "days": 7 } }
  -- { "custom_attributes": { "location": "US" } }
  
  estimated_audience_size INTEGER DEFAULT 0,
  
  -- Content
  template_id UUID REFERENCES public.message_templates(id),
  custom_content JSONB,
  
  -- A/B testing
  is_ab_test BOOLEAN DEFAULT false,
  ab_variants JSONB,
  -- Example: [
  --   { "variant": "A", "template_id": "...", "percentage": 50 },
  --   { "variant": "B", "template_id": "...", "percentage": 50 }
  -- ]
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  recurring_schedule JSONB,
  -- Example: { "frequency": "weekly", "day_of_week": 1, "time": "10:00" }
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  
  -- Results
  total_recipients INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_read INTEGER DEFAULT 0,
  messages_clicked INTEGER DEFAULT 0,
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Broadcast recipients
CREATE TABLE IF NOT EXISTS public.broadcast_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id),
  
  -- A/B testing
  variant TEXT,
  
  -- Personalization data
  personalization_data JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'opted_out')),
  
  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(campaign_id, instagram_user_id)
);

-- A/B test results
CREATE TABLE IF NOT EXISTS public.ab_test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  
  -- Metrics
  recipients INTEGER DEFAULT 0,
  sent INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  read INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  
  -- Rates
  delivery_rate DECIMAL(5,2) DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Statistical significance
  is_winner BOOLEAN DEFAULT false,
  confidence_level DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  UNIQUE(campaign_id, variant)
);

-- Rich media attachments
CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  
  -- Media details
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'document')),
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- in bytes
  mime_type TEXT NOT NULL,
  
  -- URLs
  storage_url TEXT NOT NULL, -- Supabase storage URL
  public_url TEXT NOT NULL,   -- CDN URL
  thumbnail_url TEXT,          -- For videos
  
  -- Metadata
  width INTEGER,
  height INTEGER,
  duration INTEGER, -- For video/audio in seconds
  
  -- Organization
  folder TEXT DEFAULT '/',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Quick reply presets
CREATE TABLE IF NOT EXISTS public.quick_reply_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Quick replies
  quick_replies JSONB NOT NULL,
  -- Example: [
  --   { "title": "Yes", "payload": "YES_PAYLOAD" },
  --   { "title": "No", "payload": "NO_PAYLOAD" },
  --   { "title": "Maybe", "payload": "MAYBE_PAYLOAD" }
  -- ]
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Message performance tracking
CREATE TABLE IF NOT EXISTS public.message_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  
  -- Source tracking
  template_id UUID REFERENCES public.message_templates(id),
  campaign_id UUID REFERENCES public.broadcast_campaigns(id),
  ab_variant TEXT,
  
  -- Performance metrics
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Link tracking
  links_clicked JSONB DEFAULT '[]'::jsonb,
  -- Example: [{ "url": "...", "clicked_at": "...", "click_count": 1 }]
  
  -- User actions
  user_replied BOOLEAN DEFAULT false,
  reply_time_seconds INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_message_templates_team ON public.message_templates(team_id);
CREATE INDEX idx_message_templates_category ON public.message_templates(category);
CREATE INDEX idx_broadcast_campaigns_team ON public.broadcast_campaigns(team_id);
CREATE INDEX idx_broadcast_campaigns_status ON public.broadcast_campaigns(status);
CREATE INDEX idx_broadcast_campaigns_scheduled ON public.broadcast_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_broadcast_recipients_campaign ON public.broadcast_recipients(campaign_id);
CREATE INDEX idx_broadcast_recipients_status ON public.broadcast_recipients(status);
CREATE INDEX idx_ab_test_results_campaign ON public.ab_test_results(campaign_id);
CREATE INDEX idx_media_library_team ON public.media_library(team_id);
CREATE INDEX idx_media_library_type ON public.media_library(media_type);
CREATE INDEX idx_quick_reply_sets_team ON public.quick_reply_sets(team_id);
CREATE INDEX idx_message_performance_message ON public.message_performance(message_id);
CREATE INDEX idx_message_performance_template ON public.message_performance(template_id);
CREATE INDEX idx_message_performance_campaign ON public.message_performance(campaign_id);

-- Triggers
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broadcast_campaigns_updated_at
  BEFORE UPDATE ON public.broadcast_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_test_results_updated_at
  BEFORE UPDATE ON public.ab_test_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quick_reply_sets_updated_at
  BEFORE UPDATE ON public.quick_reply_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_performance_updated_at
  BEFORE UPDATE ON public.message_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_reply_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_performance ENABLE ROW LEVEL SECURITY;

-- Team access policies
CREATE POLICY "message_templates_team_access" ON public.message_templates
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = message_templates.team_id
    AND tm.user_id = auth.uid()
  ));

CREATE POLICY "broadcast_campaigns_team_access" ON public.broadcast_campaigns
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = broadcast_campaigns.team_id
    AND tm.user_id = auth.uid()
  ));

CREATE POLICY "media_library_team_access" ON public.media_library
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = media_library.team_id
    AND tm.user_id = auth.uid()
  ));

CREATE POLICY "quick_reply_sets_team_access" ON public.quick_reply_sets
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.team_id = quick_reply_sets.team_id
    AND tm.user_id = auth.uid()
  ));

-- Read-only policies for related tables
CREATE POLICY "broadcast_recipients_read" ON public.broadcast_recipients
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.broadcast_campaigns bc
    JOIN public.team_members tm ON tm.team_id = bc.team_id
    WHERE bc.id = broadcast_recipients.campaign_id
    AND tm.user_id = auth.uid()
  ));

CREATE POLICY "ab_test_results_read" ON public.ab_test_results
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.broadcast_campaigns bc
    JOIN public.team_members tm ON tm.team_id = bc.team_id
    WHERE bc.id = ab_test_results.campaign_id
    AND tm.user_id = auth.uid()
  ));

CREATE POLICY "message_performance_read" ON public.message_performance
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    JOIN public.team_members tm ON tm.team_id = c.team_id
    WHERE m.id = message_performance.message_id
    AND tm.user_id = auth.uid()
  ));