-- Drop the problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;

-- Create simple, non-recursive policies for team_members
DROP POLICY IF EXISTS "Users can view their own team memberships" ON public.team_members;
CREATE POLICY "Users can view their own team memberships"
  ON public.team_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Create simple policies for teams
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;
CREATE POLICY "Users can view teams they belong to"
  ON public.teams
  FOR SELECT
  USING (
    owner = auth.uid() OR
    id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid()
    )
  );

-- Allow team owners to update their teams
CREATE POLICY "Team owners can update their teams"
  ON public.teams
  FOR UPDATE
  USING (owner = auth.uid())
  WITH CHECK (owner = auth.uid());

-- Service role bypass (if needed)
DROP POLICY IF EXISTS "Service role bypass for teams" ON public.teams;
CREATE POLICY "Service role bypass for teams"
  ON public.teams
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role bypass for team_members" ON public.team_members;
CREATE POLICY "Service role bypass for team_members"
  ON public.team_members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');