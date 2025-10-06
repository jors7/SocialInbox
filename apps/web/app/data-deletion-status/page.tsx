'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { createClient } from '../../lib/supabase/client';

interface DeletionStatus {
  status: string;
  requested_at: string;
  completed_at?: string;
  error_message?: string;
}

function DataDeletionStatusContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      if (!code) {
        setError('No confirmation code provided');
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from('data_deletion_requests')
          .select('status, requested_at, completed_at, error_message')
          .eq('confirmation_code', code)
          .single();

        if (fetchError) {
          setError('Deletion request not found');
        } else {
          setStatus(data);
        }
      } catch (err) {
        setError('Failed to fetch deletion status');
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading deletion status...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Request Not Found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {error || 'We could not find a deletion request with this confirmation code.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const statusIcons = {
    pending: '⏳',
    in_progress: '🔄',
    completed: '✅',
    failed: '❌',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Data Deletion Request Status
          </h1>

          <div className="mb-6">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                statusColors[status.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
              }`}
            >
              <span className="mr-2">
                {statusIcons[status.status as keyof typeof statusIcons] || '📋'}
              </span>
              {status.status.charAt(0).toUpperCase() + status.status.slice(1).replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <p className="text-sm font-medium text-gray-500">Requested At</p>
              <p className="text-sm text-gray-900">
                {new Date(status.requested_at).toLocaleString()}
              </p>
            </div>

            {status.completed_at && (
              <div>
                <p className="text-sm font-medium text-gray-500">Completed At</p>
                <p className="text-sm text-gray-900">
                  {new Date(status.completed_at).toLocaleString()}
                </p>
              </div>
            )}

            {status.error_message && (
              <div>
                <p className="text-sm font-medium text-gray-500">Error</p>
                <p className="text-sm text-red-600">{status.error_message}</p>
              </div>
            )}

            {status.status === 'pending' && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  Your data deletion request has been received and is pending processing.
                  We will delete all your data within 30 days as required by data protection regulations.
                </p>
              </div>
            )}

            {status.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800">
                  Your data has been successfully deleted from our systems.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <p className="text-xs text-gray-500">
              Confirmation Code: <span className="font-mono">{code}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DataDeletionStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <DataDeletionStatusContent />
    </Suspense>
  );
}
