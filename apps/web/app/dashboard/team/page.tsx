import { createServerComponentClient } from '../../../lib/supabase/server';
import { getUserTeam } from '../../../lib/utils/team';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Label } from '@socialinbox/ui';
import { Users, Mail, Shield, Calendar, UserPlus } from 'lucide-react';

async function getTeamData(supabase: any, teamId: string) {
  // Get team details
  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single();

  // Get team members
  const { data: members } = await supabase
    .from('team_members')
    .select(`
      *,
      user:auth.users(email)
    `)
    .eq('team_id', teamId);

  return { team, members: members || [] };
}

const roleColors = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  agent: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
};

const roleLabels = {
  owner: 'Owner',
  admin: 'Admin',
  agent: 'Agent',
  viewer: 'Viewer',
};

export default async function TeamPage() {
  const { error, teamId, user } = await getUserTeam();

  if (error || !teamId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500">Team configuration not found.</p>
      </div>
    );
  }

  const supabase = await createServerComponentClient();
  const { team, members } = await getTeamData(supabase, teamId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your team members and permissions
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>Basic information about your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Team Name</Label>
                <p className="mt-1 text-lg font-medium">{team?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Team ID</Label>
                <p className="mt-1 font-mono text-sm text-gray-600">{teamId}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Created</Label>
                <p className="mt-1 text-sm text-gray-600">
                  {team?.created_at ? new Date(team.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Members</Label>
                <p className="mt-1 text-lg font-medium">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Team Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Members</span>
                <span className="font-medium">{members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Admins</span>
                <span className="font-medium">
                  {members.filter((m: any) => m.role === 'admin' || m.role === 'owner').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Agents</span>
                <span className="font-medium">
                  {members.filter((m: any) => m.role === 'agent').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Viewers</span>
                <span className="font-medium">
                  {members.filter((m: any) => m.role === 'viewer').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage team members and their roles</CardDescription>
            </div>
            <Button disabled>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No team members found
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member: any) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {member.user?.email || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={roleColors[member.role as keyof typeof roleColors]}>
                      {roleLabels[member.role as keyof typeof roleLabels]}
                    </Badge>
                    {member.user_id === user?.id && (
                      <Badge variant="outline">You</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Invite Team Members</CardTitle>
          <CardDescription>
            Invite new members to join your team (Coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              type="email"
              placeholder="Enter email address"
              disabled
            />
            <Button disabled>Send Invite</Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Team invitations will be available in a future update
          </p>
        </CardContent>
      </Card>
    </div>
  );
}