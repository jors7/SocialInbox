import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@socialinbox/shared';

export function createClient() {
  // Use dummy values during build if env vars are not set
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient<Database>(url, anonKey);
}