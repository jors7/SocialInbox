import { createServerComponentClient } from '../../lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { MessageSquare, Users, Zap, TrendingUp, Instagram, Workflow } from 'lucide-react';

async function getStats(supabase: any, userId: string) {
  // Get user's team
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .single();

  if (!teamMember) return null;

  // Get team stats - handle cases where tables might be empty
  const [
    conversationsResult,
    contactsResult,
    triggersResult,
    accountsResult,
  ] = await Promise.all([
    supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open'),
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('triggers')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamMember.team_id)
      .eq('is_active', true),
    supabase
      .from('ig_accounts')
      .select('id, username, connected_tools_enabled')
      .eq('team_id', teamMember.team_id),
  ]);

  const conversationsCount = conversationsResult?.count || 0;
  const contactsCount = contactsResult?.count || 0;
  const triggersCount = triggersResult?.count || 0;
  const igAccounts = accountsResult?.data || [];

  return {
    conversations: conversationsCount,
    contacts: contactsCount,
    triggers: triggersCount,
    accounts: igAccounts,
  };
}

export default async function DashboardPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  const stats = await getStats(supabase, user!.id);

  const statsCards = [
    {
      title: 'Active Conversations',
      value: stats?.conversations || 0,
      description: 'Open conversations',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Contacts',
      value: stats?.contacts || 0,
      description: 'Unique contacts',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Active Triggers',
      value: stats?.triggers || 0,
      description: 'Running automations',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Conversion Rate',
      value: '24.3%',
      description: '+2.1% from last week',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's an overview of your Instagram automation.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Connected Instagram Accounts</CardTitle>
            <CardDescription>Manage your connected Instagram business accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {!stats?.accounts || stats.accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Instagram className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-600">No Instagram accounts connected yet</p>
                <a
                  href="/dashboard/connections"
                  className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Connect your first account →
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.accounts?.map((account: any) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                      <div>
                        <p className="font-medium">@{account.username}</p>
                        <p className="text-sm text-gray-500">
                          {account.connected_tools_enabled ? 'Connected' : 'Limited access'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          account.connected_tools_enabled ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                      />
                      <span className="text-sm text-gray-500">
                        {account.connected_tools_enabled ? 'Active' : 'Setup required'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a
                href="/dashboard/flows/new"
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Workflow className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Create a new flow</span>
                </div>
                <span className="text-gray-400">→</span>
              </a>
              <a
                href="/dashboard/triggers/new"
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Set up a trigger</span>
                </div>
                <span className="text-gray-400">→</span>
              </a>
              <a
                href="/dashboard/inbox"
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">View inbox</span>
                </div>
                <span className="text-gray-400">→</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}