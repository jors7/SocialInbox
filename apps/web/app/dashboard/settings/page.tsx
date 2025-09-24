'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Label } from '@socialinbox/ui';
import { Switch } from '@socialinbox/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@socialinbox/ui';
import { User, Bell, Shield, Palette, Globe, Key, Mail, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    messageReceived: true,
    flowCompleted: true,
    dailyReport: false,
  });

  const [appearance, setAppearance] = useState({
    theme: 'light',
    compactMode: false,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="your@email.com" disabled />
                <p className="text-xs text-gray-500">Contact support to change your email</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option>UTC-08:00 Pacific Time</option>
                  <option>UTC-05:00 Eastern Time</option>
                  <option>UTC+00:00 GMT</option>
                  <option>UTC+01:00 Central European Time</option>
                </select>
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Receive browser push notifications</p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, push: checked })
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Notification Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Message Received</Label>
                      <p className="text-sm text-gray-500">When you receive a new Instagram DM</p>
                    </div>
                    <Switch
                      checked={notifications.messageReceived}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, messageReceived: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Flow Completed</Label>
                      <p className="text-sm text-gray-500">When an automation flow finishes</p>
                    </div>
                    <Switch
                      checked={notifications.flowCompleted}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, flowCompleted: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Daily Report</Label>
                      <p className="text-sm text-gray-500">Receive daily analytics summary</p>
                    </div>
                    <Switch
                      checked={notifications.dailyReport}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, dailyReport: checked })
                      }
                    />
                  </div>
                </div>
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button>Update Password</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status</p>
                    <p className="text-sm text-gray-500">Two-factor authentication is not enabled</p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage your active login sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-gray-500">Chrome on MacOS · San Francisco, CA</p>
                      </div>
                    </div>
                    <span className="text-sm text-green-600">Active now</span>
                  </div>
                </div>
                <Button variant="outline" className="mt-4">Sign Out All Other Sessions</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize how SocialInbox looks for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Theme</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                      className={`rounded-lg border-2 p-4 text-center ${
                        appearance.theme === 'light'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="mb-2 mx-auto h-8 w-8 rounded bg-white border border-gray-200" />
                      <span className="text-sm">Light</span>
                    </button>
                    <button
                      onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                      className={`rounded-lg border-2 p-4 text-center ${
                        appearance.theme === 'dark'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      disabled
                    >
                      <div className="mb-2 mx-auto h-8 w-8 rounded bg-gray-800 border border-gray-700" />
                      <span className="text-sm">Dark</span>
                      <span className="block text-xs text-gray-500">Coming soon</span>
                    </button>
                    <button
                      onClick={() => setAppearance({ ...appearance, theme: 'system' })}
                      className={`rounded-lg border-2 p-4 text-center ${
                        appearance.theme === 'system'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                      disabled
                    >
                      <div className="mb-2 mx-auto h-8 w-8 rounded bg-gradient-to-br from-white to-gray-800 border border-gray-400" />
                      <span className="text-sm">System</span>
                      <span className="block text-xs text-gray-500">Coming soon</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-gray-500">Reduce spacing and make UI more compact</p>
                  </div>
                  <Switch
                    checked={appearance.compactMode}
                    onCheckedChange={(checked) =>
                      setAppearance({ ...appearance, compactMode: checked })
                    }
                    disabled
                  />
                </div>
              </div>
              <Button disabled>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API keys for external integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    API access is coming soon. You'll be able to generate keys to integrate SocialInbox with your own applications.
                  </p>
                </div>
                <Button disabled>
                  <Key className="h-4 w-4 mr-2" />
                  Generate New API Key
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}