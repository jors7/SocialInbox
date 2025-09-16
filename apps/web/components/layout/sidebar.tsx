'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { cn } from '@socialinbox/ui/lib/utils';
import {
  Home,
  MessageSquare,
  Workflow,
  Zap,
  BarChart3,
  Settings,
  Instagram,
  LogOut,
  Users,
  Activity,
  Image,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
  { name: 'Flows', href: '/dashboard/flows', icon: Workflow },
  { name: 'Triggers', href: '/dashboard/triggers', icon: Zap },
  { name: 'Media', href: '/dashboard/media', icon: Image },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Queue', href: '/dashboard/queue', icon: Activity },
  { name: 'Connections', href: '/dashboard/connections', icon: Instagram },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 shrink-0 items-center px-6">
        <h1 className="text-xl font-bold text-white">SocialInbox</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 shrink-0',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 p-3">
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-white" />
          Sign out
        </button>
      </div>
    </div>
  );
}