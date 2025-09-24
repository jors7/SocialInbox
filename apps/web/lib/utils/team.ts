import { createServerComponentClient } from '../supabase/server';

export async function getUserTeam() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated', user: null, teamId: null };
  }

  // Get user's team
  const { data: teamMember, error } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching team member for user', user.id, ':', error);
    return { error: `Database error: ${error.message}`, user, teamId: null };
  }

  if (!teamMember) {
    console.error('No team member found for user:', user.id);
    return { error: 'Team not found', user, teamId: null };
  }

  return { error: null, user, teamId: teamMember.team_id };
}