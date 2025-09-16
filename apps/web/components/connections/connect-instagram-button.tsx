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
      // First, sign in with Facebook to get the necessary permissions
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/instagram-callback`,
          scopes: [
            'email',
            'public_profile',
            'instagram_basic',
            'instagram_manage_messages',
            'instagram_manage_comments',
            'instagram_content_publish',
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_metadata',
            'business_management',
          ].join(','),
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        setLoading(false);
      }
      // User will be redirected to Facebook for authorization
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