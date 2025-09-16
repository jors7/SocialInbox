'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Button } from '@socialinbox/ui';
import { Bell, Search } from 'lucide-react';

export function Header() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex flex-1 items-center">
        <div className="w-full max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search flows, triggers, contacts..."
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-gray-300" />
        </div>
      </div>
    </header>
  );
}