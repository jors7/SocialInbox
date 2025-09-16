-- Add A/B testing fields to broadcast_campaigns
ALTER TABLE public.broadcast_campaigns
ADD COLUMN IF NOT EXISTS ab_test_config JSONB DEFAULT NULL;

-- Add template variant tracking to broadcast_messages
ALTER TABLE public.broadcast_messages
ADD COLUMN IF NOT EXISTS template_variant TEXT DEFAULT 'A' CHECK (template_variant IN ('A', 'B'));

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
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_template_variant ON public.broadcast_messages(campaign_id, template_variant);
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

-- Function to randomly assign template variants for A/B tests
CREATE OR REPLACE FUNCTION assign_ab_test_variant()
RETURNS TRIGGER AS $$
DECLARE
  campaign_config JSONB;
  split_percentage INTEGER;
  random_value NUMERIC;
BEGIN
  -- Get campaign A/B test config
  SELECT ab_test_config INTO campaign_config
  FROM broadcast_campaigns
  WHERE id = NEW.campaign_id;
  
  -- If not an A/B test, default to variant A
  IF campaign_config IS NULL THEN
    NEW.template_variant := 'A';
    RETURN NEW;
  END IF;
  
  -- Get split percentage (defaults to 50 if not specified)
  split_percentage := COALESCE((campaign_config->>'split_percentage')::INTEGER, 50);
  
  -- Generate random number between 0 and 100
  random_value := random() * 100;
  
  -- Assign variant based on split percentage
  IF random_value < split_percentage THEN
    NEW.template_variant := 'B';
  ELSE
    NEW.template_variant := 'A';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically assign A/B test variants
CREATE TRIGGER assign_variant_on_message_create
BEFORE INSERT ON public.broadcast_messages
FOR EACH ROW EXECUTE FUNCTION assign_ab_test_variant();