import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createServerComponentClient } from '../lib/supabase/server';
import { Button } from '@socialinbox/ui';
import { MessageSquare, Zap, BarChart3, Instagram } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/socialinbox.png"
                alt="SocialInbox Logo"
                width={32}
                height={32}
                className="mr-2"
              />
              <h1 className="text-xl font-bold">SocialInbox</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Sign in
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Instagram DM Automation
              <br />
              <span className="text-blue-600">Made Simple</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Turn Instagram comments into conversations. Automate your DMs, grow your audience, and
              convert followers into customers with our powerful automation platform.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/signup">
                <Button size="lg">Start Free Trial</Button>
              </Link>
              <Link href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-gray-900">Everything you need to automate Instagram</h3>
            <p className="mt-4 text-lg text-gray-600">
              Powerful features to help you engage with your audience at scale
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-white p-8 shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="mt-4 text-lg font-semibold">Smart Inbox</h4>
              <p className="mt-2 text-gray-600">
                Manage all your conversations in one place with our intelligent inbox
              </p>
            </div>
            <div className="rounded-lg bg-white p-8 shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="mt-4 text-lg font-semibold">Automated Triggers</h4>
              <p className="mt-2 text-gray-600">
                Set up triggers for comments, mentions, and story replies
              </p>
            </div>
            <div className="rounded-lg bg-white p-8 shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="mt-4 text-lg font-semibold">Analytics</h4>
              <p className="mt-2 text-gray-600">
                Track performance and optimize your automation strategies
              </p>
            </div>
            <div className="rounded-lg bg-white p-8 shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
                <Instagram className="h-6 w-6 text-pink-600" />
              </div>
              <h4 className="mt-4 text-lg font-semibold">Instagram Native</h4>
              <p className="mt-2 text-gray-600">
                Built specifically for Instagram with full API compliance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-blue-600 px-8 py-16 text-center">
            <h3 className="text-3xl font-bold text-white">Ready to automate your Instagram DMs?</h3>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
              Join thousands of businesses using SocialInbox to engage with their audience
            </p>
            <div className="mt-8">
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary">
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 SocialInbox. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}