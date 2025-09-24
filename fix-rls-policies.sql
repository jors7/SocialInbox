-- Ensure RLS is enabled
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view their team" ON public.teams;
DROP POLICY IF EXISTS "Team members can view team memberships" ON public.team_members;

-- Create policies for teams table
CREATE POLICY "Users can view their teams"
  ON public.teams
  FOR SELECT
  USING (
    owner = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

-- Create policies for team_members table
CREATE POLICY "Users can view their team memberships"
  ON public.team_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view team members of their teams"
  ON public.team_members
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid()
    )
  );

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role has full access to teams"
  ON public.teams
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to team_members"
  ON public.team_members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');