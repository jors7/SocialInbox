-- Add A/B testing fields to broadcast_campaigns
ALTER TABLE public.broadcast_campaigns
ADD COLUMN IF NOT EXISTS ab_test_config JSONB DEFAULT NULL;

-- Add A/B test results table
CREATE TABLE IF NOT EXISTS public.ab_test_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  template_id UUID NOT NULL REFERENCES public.message_templates(id) ON DELETE CASCADE,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, variant, calculated_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ab_test_results_campaign_id ON public.ab_test_results(campaign_id);

-- RLS Policy
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "A/B test results belong to team" ON public.ab_test_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.broadcast_campaigns bc
      WHERE bc.id = ab_test_results.campaign_id
      AND bc.team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Note: A/B test variant assignment function and trigger will be added when broadcast_messages table is created