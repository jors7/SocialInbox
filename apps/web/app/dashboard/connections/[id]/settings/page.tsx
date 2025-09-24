'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/client';
import { Button } from '@socialinbox/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Label } from '@socialinbox/ui';
import { Switch } from '@socialinbox/ui';
import { ArrowLeft, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '../../../../../hooks/use-toast';

export default function ConnectionSettingsPage({ params }: { params: { id: string } }) {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadAccount();
  }, [params.id]);

  const loadAccount = async () => {
    const { data, error } = await supabase
      .from('ig_accounts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      toast({
        title: 'Error',
        description: 'Account not found',
        variant: 'destructive',
      });
      router.push('/dashboard/connections');
      return;
    }

    setAccount(data);
    setLoading(false);
  };

  const handleRefreshToken = async () => {
    setRefreshing(true);

    try {
      // This would trigger a new OAuth flow to refresh the token
      // For now, we'll just show a message
      toast({
        title: 'Token Refresh',
        description: 'Please reconnect your account to refresh the access token',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to disconnect this Instagram account? All associated triggers and data will be removed.')) {
      return;
    }

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('ig_accounts')
        .delete()
        .eq('id', params.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Instagram account disconnected',
      });

      router.push('/dashboard/connections');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect account',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !account) {
    return <div>Loading...</div>;
  }

  const tokenExpiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;
  const isTokenExpired = tokenExpiresAt && tokenExpiresAt < new Date();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/connections')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your Instagram account connection
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Details about your connected Instagram account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500">Username</Label>
              <p className="font-medium">@{account.username}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Instagram User ID</Label>
              <p className="font-mono text-sm">{account.instagram_user_id}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Connected</Label>
              <p className="text-sm">{new Date(account.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Last Updated</Label>
              <p className="text-sm">{new Date(account.updated_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              Monitor and manage your connection health
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Connected Tools</Label>
                <p className="text-sm text-gray-500">
                  {account.connected_tools_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Switch
                checked={account.connected_tools_enabled}
                disabled
              />
            </div>
            
            {!account.connected_tools_enabled && (
              <div className="rounded-md bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  Enable Connected Tools in your Instagram settings to allow messaging.
                </p>
                <a
                  href="https://www.instagram.com/accounts/manage_connected_tools/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-sm font-medium text-yellow-900 hover:text-yellow-800"
                >
                  Open Instagram Settings
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            )}

            <div className="space-y-2">
              <Label>Access Token</Label>
              {tokenExpiresAt && (
                <p className="text-sm text-gray-500">
                  {isTokenExpired ? 'Expired' : `Expires ${tokenExpiresAt.toLocaleDateString()}`}
                </p>
              )}
              {isTokenExpired && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshToken}
                  disabled={refreshing}
                  className="w-full"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Token
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for this connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Disconnect Account</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Remove this Instagram account and all associated data
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}