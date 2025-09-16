-- Contact Lists table
CREATE TABLE IF NOT EXISTS public.contact_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact list members junction table
CREATE TABLE IF NOT EXISTS public.contact_list_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.contact_lists(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, contact_id)
);

-- Campaign lists junction table
CREATE TABLE IF NOT EXISTS public.campaign_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.contact_lists(id) ON DELETE CASCADE,
  UNIQUE(campaign_id, list_id)
);

-- Add missing fields to broadcast_campaigns if they don't exist
ALTER TABLE public.broadcast_campaigns
ADD COLUMN IF NOT EXISTS filters JSONB DEFAULT NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_lists_team_id ON public.contact_lists(team_id);
CREATE INDEX IF NOT EXISTS idx_contact_list_members_list_id ON public.contact_list_members(list_id);
CREATE INDEX IF NOT EXISTS idx_contact_list_members_contact_id ON public.contact_list_members(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_lists_campaign_id ON public.campaign_lists(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_lists_list_id ON public.campaign_lists(list_id);

-- RLS Policies
ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_lists ENABLE ROW LEVEL SECURITY;

-- Contact lists policies
CREATE POLICY "Contact lists belong to team" ON public.contact_lists
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Contact list members policies
CREATE POLICY "Contact list members belong to team" ON public.contact_list_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.contact_lists cl
      WHERE cl.id = contact_list_members.list_id
      AND cl.team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Campaign lists policies
CREATE POLICY "Campaign lists belong to team" ON public.campaign_lists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.broadcast_campaigns bc
      WHERE bc.id = campaign_lists.campaign_id
      AND bc.team_id IN (
        SELECT team_id FROM public.team_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to update contact list member count
CREATE OR REPLACE FUNCTION update_contact_list_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contact_lists 
    SET member_count = member_count + 1 
    WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contact_lists 
    SET member_count = GREATEST(0, member_count - 1) 
    WHERE id = OLD.list_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update member count
CREATE TRIGGER update_list_member_count_trigger
AFTER INSERT OR DELETE ON public.contact_list_members
FOR EACH ROW EXECUTE FUNCTION update_contact_list_member_count();

-- Add tags to contacts if it doesn't exist
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];