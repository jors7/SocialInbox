'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Badge } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ConnectionStatusProps {
  account: {
    id: string;
    instagram_user_id: string;
    connected_tools_enabled: boolean;
    token_expires_at?: string;
  };
}

export function ConnectionStatus({ account }: ConnectionStatusProps) {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(account.connected_tools_enabled);
  const supabase = createClient();

  const checkConnectionStatus = async () => {
    setChecking(true);

    try {
      // Call Edge Function to test connection
      const { data, error } = await supabase.functions.invoke('test-instagram-connection', {
        body: { accountId: account.id },
      });

      if (!error && data) {
        setStatus(data.connected);
        
        // Update in database if status changed
        if (data.connected !== account.connected_tools_enabled) {
          await supabase
            .from('ig_accounts')
            .update({ connected_tools_enabled: data.connected })
            .eq('id', account.id);
        }
      }
    } catch (err) {
      console.error('Failed to check connection:', err);
    } finally {
      setChecking(false);
    }
  };

  const tokenExpiresIn = () => {
    if (!account.token_expires_at) return null;

    const expiresAt = new Date(account.token_expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return { text: 'Expired', show: true, warning: true };
    if (daysUntilExpiry === 0) return { text: 'Expires today', show: true, warning: true };
    if (daysUntilExpiry === 1) return { text: 'Expires tomorrow', show: true, warning: true };
    if (daysUntilExpiry < 7) return { text: `Expires in ${daysUntilExpiry} days`, show: true, warning: true };

    // Don't show expiry badge if > 7 days (normal 60-day token lifecycle)
    return { text: `Valid for ${daysUntilExpiry} days`, show: false, warning: false };
  };

  const expiryInfo = tokenExpiresIn();
  const isExpired = expiryInfo?.text === 'Expired';

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center space-x-2">
        {checking ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : status ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        )}
        <span className="text-sm text-gray-600">
          {checking ? 'Checking...' : status ? 'Connected' : 'Connected Tools disabled'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={checkConnectionStatus}
          disabled={checking}
          className="h-6 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {expiryInfo?.show && (
        <div className="flex items-center space-x-2">
          <Badge variant={expiryInfo.warning ? 'destructive' : 'secondary'} className="text-xs">
            {expiryInfo.text}
          </Badge>
          {expiryInfo.warning && (
            <Button
              size="sm"
              variant="link"
              className="h-auto p-0 text-xs"
              onClick={() => window.location.href = '/dashboard/connections'}
            >
              Reconnect
            </Button>
          )}
        </div>
      )}
    </div>
  );
}