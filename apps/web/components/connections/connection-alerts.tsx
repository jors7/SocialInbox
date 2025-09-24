'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '../../hooks/use-toast';

export function ConnectionAlerts() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      toast({
        title: 'Success!',
        description: 'Instagram account connected successfully. Check if Connected Tools is enabled.',
      });
    } else if (error) {
      let message = 'Failed to connect Instagram account';
      
      switch (error) {
        case 'access_denied':
          message = 'You denied the permission request';
          break;
        case 'no_pages':
          message = 'No Facebook Pages found. Make sure you have admin access to a Facebook Page.';
          break;
        case 'no_instagram':
          message = 'No Instagram Business account found. Connect your Instagram to a Facebook Page first.';
          break;
        case 'auth_failed':
          message = 'Authentication failed. Please try again.';
          break;
        case 'connection_failed':
          message = 'Failed to establish connection. Please try again.';
          break;
      }

      toast({
        title: 'Connection Error',
        description: message,
      });
    }
  }, [searchParams, toast]);

  return null;
}