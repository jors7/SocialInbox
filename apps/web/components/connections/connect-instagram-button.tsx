'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Button } from '@socialinbox/ui';
import { Instagram, Loader2 } from 'lucide-react';

interface ConnectInstagramButtonProps {
  variant?: 'default' | 'outline';
}

export function ConnectInstagramButton({ variant = 'default' }: ConnectInstagramButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleConnect = async () => {
    setLoading(true);

    try {
      // Use Facebook Login to get permissions for Instagram Messaging
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/facebook-callback`;

      // Required permissions for Instagram Messaging
      const scopes = [
        'instagram_basic',
        'instagram_manage_messages',
        'pages_show_list',
        'pages_manage_metadata',
        'business_management',
      ].join(',');

      // Generate state for CSRF protection
      const state = Math.random().toString(36).substring(7);

      // Store state in session storage for verification
      sessionStorage.setItem('fb_oauth_state', state);

      // Redirect to Facebook OAuth
      const facebookOAuthUrl = `https://www.facebook.com/v20.0/dialog/oauth?` +
        `client_id=${appId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=${state}&` +
        `response_type=code`;

      window.location.href = facebookOAuthUrl;
    } catch (err) {
      console.error('Connection error:', err);
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={loading}
      variant={variant}
      className={variant === 'outline' ? 'w-full' : ''}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Instagram className="mr-2 h-4 w-4" />
      )}
      {loading ? 'Connecting...' : 'Connect Instagram Account'}
    </Button>
  );
}