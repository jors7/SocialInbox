import { createServerComponentClient } from '../../../lib/supabase/server';
import { getUserTeam } from '../../../lib/utils/team';
import { Button } from '@socialinbox/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import Link from 'next/link';
import { Instagram, CheckCircle, AlertCircle, ExternalLink, Settings } from 'lucide-react';
import { ConnectInstagramButton } from '../../../components/connections/connect-instagram-button';
import { ConnectionStatus } from '../../../components/connections/connection-status';
import { ConnectionAlerts } from '../../../components/connections/connection-alerts';

async function getConnections(supabase: any, teamId: string) {
  const { data: accounts } = await supabase
    .from('ig_accounts')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  return accounts || [];
}

export default async function ConnectionsPage() {
  const { error, teamId } = await getUserTeam();

  if (error || !teamId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500">Team configuration not found. Please contact support.</p>
      </div>
    );
  }

  const supabase = await createServerComponentClient();
  const connections = await getConnections(supabase, teamId);

  return (
    <div>
      <ConnectionAlerts />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your Instagram Business accounts to start automating
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Instagram Business Accounts</CardTitle>
            <CardDescription>
              Connect your Instagram Business or Creator accounts to enable DM automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connections.length === 0 ? (
              <div className="text-center py-8">
                <Instagram className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No accounts connected</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Connect your first Instagram Business account to get started
                </p>
                <ConnectInstagramButton />
              </div>
            ) : (
              <div className="space-y-4">
                {connections.map((account) => (
                  <div
                    key={account.id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Instagram className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium">@{account.username}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            ID: {account.instagram_user_id}
                          </p>
                          <ConnectionStatus account={account} />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={account.connected_tools_enabled ? 'default' : 'secondary'}>
                          {account.connected_tools_enabled ? 'Active' : 'Limited'}
                        </Badge>
                        <Link href={`/dashboard/connections/${account.id}/settings`}>
                          <Button size="sm" variant="outline">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    {!account.connected_tools_enabled && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex">
                          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-yellow-800">Action Required</p>
                            <p className="text-yellow-700 mt-1">
                              Enable "Connected Tools" in your Instagram settings to allow message automation.
                            </p>
                            <a
                              href="https://www.instagram.com/accounts/manage_connected_tools/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center mt-2 text-yellow-800 font-medium hover:text-yellow-900"
                            >
                              Go to Instagram Settings
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div className="pt-4">
                  <ConnectInstagramButton variant="outline" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection Requirements</CardTitle>
            <CardDescription>
              Make sure your account meets these requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium">Business or Creator Account</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Your Instagram account must be a Business or Creator account, not personal
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium">Facebook Page Connected</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Your Instagram account must be linked to a Facebook Page
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium">Connected Tools Enabled</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Enable "Connected Tools" in Instagram Settings → Privacy → Messages
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium">Admin Access</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    You must be an admin of both the Facebook Page and Instagram account
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Pro Tip</h4>
              <p className="text-sm text-blue-800">
                After connecting, send a test message to yourself to verify everything is working correctly.
                This helps ensure your account has the proper permissions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}