import Link from 'next/link';
import { createServerComponentClient } from '../../../lib/supabase/server';
import { getUserTeam } from '../../../lib/utils/team';
import { Button } from '@socialinbox/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Plus, MessageSquare, Instagram, AtSign, PlayCircle, PauseCircle, Edit } from 'lucide-react';

async function getTriggers(supabase: any, teamId: string) {
  const { data: triggers } = await supabase
    .from('triggers')
    .select(`
      *,
      flows (
        id,
        name
      ),
      ig_accounts (
        id,
        username
      )
    `)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  return triggers || [];
}

async function getConnectedAccounts(supabase: any, teamId: string) {
  const { data: accounts } = await supabase
    .from('ig_accounts')
    .select('id, username')
    .eq('team_id', teamId)
    .eq('connected_tools_enabled', true);

  return accounts || [];
}

async function getFlows(supabase: any, teamId: string) {
  const { data: flows } = await supabase
    .from('flows')
    .select('id, name')
    .eq('team_id', teamId)
    .eq('is_active', true);

  return flows || [];
}

const triggerTypeIcons = {
  comment: MessageSquare,
  story_reply: Instagram,
  mention: AtSign,
};

const triggerTypeLabels = {
  comment: 'Comment Trigger',
  story_reply: 'Story Reply',
  mention: 'Mention Trigger',
};

export default async function TriggersPage() {
  const { error, teamId } = await getUserTeam();

  if (error || !teamId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500">Team configuration not found. Please contact support.</p>
      </div>
    );
  }

  const supabase = await createServerComponentClient();
  const [triggers, connectedAccounts, flows] = await Promise.all([
    getTriggers(supabase, teamId),
    getConnectedAccounts(supabase, teamId),
    getFlows(supabase, teamId),
  ]);

  const canCreateTriggers = connectedAccounts.length > 0 && flows.length > 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Triggers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Automate responses to comments, story replies, and mentions
          </p>
        </div>
        {canCreateTriggers ? (
          <Link href="/dashboard/triggers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Trigger
            </Button>
          </Link>
        ) : (
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create Trigger
          </Button>
        )}
      </div>

      {!canCreateTriggers && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Setup Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800 mb-4">
              Before creating triggers, you need to:
            </p>
            <ul className="space-y-2 text-sm text-yellow-800">
              {connectedAccounts.length === 0 && (
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Connect an Instagram account with Connected Tools enabled.{' '}
                    <Link href="/dashboard/connections" className="font-medium underline">
                      Connect now →
                    </Link>
                  </span>
                </li>
              )}
              {flows.length === 0 && (
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    Create and activate at least one flow.{' '}
                    <Link href="/dashboard/flows" className="font-medium underline">
                      Create flow →
                    </Link>
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {triggers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium">No triggers yet</h3>
            <p className="mb-6 text-center text-sm text-gray-500">
              Create your first trigger to start automating Instagram interactions
            </p>
            {canCreateTriggers && (
              <Link href="/dashboard/triggers/new">
                <Button>Create Your First Trigger</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {triggers.map((trigger: any) => {
            const Icon = triggerTypeIcons[trigger.trigger_type as keyof typeof triggerTypeIcons];
            const label = triggerTypeLabels[trigger.trigger_type as keyof typeof triggerTypeLabels];
            
            return (
              <Card key={trigger.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
                        <Icon className="h-4 w-4 text-gray-600" />
                      </div>
                      <CardTitle className="text-base">{label}</CardTitle>
                    </div>
                    <Badge variant={trigger.is_active ? 'default' : 'secondary'}>
                      {trigger.is_active ? (
                        <><PlayCircle className="mr-1 h-3 w-3" /> Active</>
                      ) : (
                        <><PauseCircle className="mr-1 h-3 w-3" /> Paused</>
                      )}
                    </Badge>
                  </div>
                  <CardDescription className="mt-2">
                    @{trigger.ig_accounts.username}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Flow:</span>{' '}
                      <span className="text-gray-600">{trigger.flows.name}</span>
                    </div>
                    
                    {trigger.post_scope && (
                      <div>
                        <span className="font-medium">Scope:</span>{' '}
                        <span className="text-gray-600">
                          {trigger.post_scope.mode === 'all' && 'All posts'}
                          {trigger.post_scope.mode === 'specific' && 
                            `${trigger.post_scope.post_ids?.length || 0} specific posts`}
                          {trigger.post_scope.mode === 'next' && 'Next post only'}
                        </span>
                      </div>
                    )}
                    
                    {trigger.filters && (
                      <>
                        {trigger.filters.include_keywords?.length > 0 && (
                          <div>
                            <span className="font-medium">Include:</span>{' '}
                            <span className="text-gray-600">
                              {trigger.filters.include_keywords.join(', ')}
                            </span>
                          </div>
                        )}
                        {trigger.filters.exclude_keywords?.length > 0 && (
                          <div>
                            <span className="font-medium">Exclude:</span>{' '}
                            <span className="text-gray-600">
                              {trigger.filters.exclude_keywords.join(', ')}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {trigger.public_replies?.length > 0 && (
                      <div>
                        <span className="font-medium">Public replies:</span>{' '}
                        <span className="text-gray-600">{trigger.public_replies.length} variants</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Link href={`/dashboard/triggers/${trigger.id}`}>
                      <Button size="sm" variant="outline">
                        <Edit className="mr-2 h-3 w-3" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}