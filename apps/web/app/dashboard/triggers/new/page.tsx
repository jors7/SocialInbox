'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';
import { Button } from '@socialinbox/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Label } from '@socialinbox/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socialinbox/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { ArrowLeft, Plus, X, MessageSquare, Instagram, AtSign } from 'lucide-react';
import { useToast } from '../../../../hooks/use-toast';
import { CreateTriggerRequestSchema } from '@socialinbox/shared';

export default function NewTriggerPage() {
  const [triggerType, setTriggerType] = useState<'comment' | 'story_reply' | 'mention'>('comment');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedFlow, setSelectedFlow] = useState('');
  const [postScope, setPostScope] = useState<'all' | 'specific' | 'next'>('all');
  const [specificPostIds, setSpecificPostIds] = useState<string[]>([]);
  const [currentPostId, setCurrentPostId] = useState('');
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [currentIncludeKeyword, setCurrentIncludeKeyword] = useState('');
  const [currentExcludeKeyword, setCurrentExcludeKeyword] = useState('');
  const [publicReplies, setPublicReplies] = useState<string[]>(['']);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get user's team
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      if (!teamMember) {
        throw new Error('No team found');
      }

      // Load accounts and flows
      const [accountsRes, flowsRes] = await Promise.all([
        supabase
          .from('ig_accounts')
          .select('id, username')
          .eq('team_id', teamMember.team_id)
          .eq('connected_tools_enabled', true),
        supabase
          .from('flows')
          .select('id, name')
          .eq('team_id', teamMember.team_id)
          .eq('is_active', true),
      ]);

      setAccounts(accountsRes.data || []);
      setFlows(flowsRes.data || []);
      
      // Pre-select first options
      if (accountsRes.data?.length > 0) {
        setSelectedAccount(accountsRes.data[0].id);
      }
      if (flowsRes.data?.length > 0) {
        setSelectedFlow(flowsRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts and flows',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addPostId = () => {
    if (currentPostId && !specificPostIds.includes(currentPostId)) {
      setSpecificPostIds([...specificPostIds, currentPostId]);
      setCurrentPostId('');
    }
  };

  const removePostId = (id: string) => {
    setSpecificPostIds(specificPostIds.filter(pid => pid !== id));
  };

  const addIncludeKeyword = () => {
    if (currentIncludeKeyword && !includeKeywords.includes(currentIncludeKeyword)) {
      setIncludeKeywords([...includeKeywords, currentIncludeKeyword]);
      setCurrentIncludeKeyword('');
    }
  };

  const removeIncludeKeyword = (keyword: string) => {
    setIncludeKeywords(includeKeywords.filter(k => k !== keyword));
  };

  const addExcludeKeyword = () => {
    if (currentExcludeKeyword && !excludeKeywords.includes(currentExcludeKeyword)) {
      setExcludeKeywords([...excludeKeywords, currentExcludeKeyword]);
      setCurrentExcludeKeyword('');
    }
  };

  const removeExcludeKeyword = (keyword: string) => {
    setExcludeKeywords(excludeKeywords.filter(k => k !== keyword));
  };

  const updatePublicReply = (index: number, value: string) => {
    const updated = [...publicReplies];
    updated[index] = value;
    setPublicReplies(updated);
  };

  const addPublicReply = () => {
    setPublicReplies([...publicReplies, '']);
  };

  const removePublicReply = (index: number) => {
    if (publicReplies.length > 1) {
      setPublicReplies(publicReplies.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      // Filter out empty public replies
      const filteredPublicReplies = publicReplies.filter(reply => reply.trim() !== '');

      if (triggerType === 'comment' && filteredPublicReplies.length === 0) {
        toast({
          title: 'Error',
          description: 'At least one public reply is required for comment triggers',
          variant: 'destructive',
        });
        return;
      }

      const triggerData = {
        igAccountId: selectedAccount,
        triggerType,
        postScope: postScope === 'all' ? undefined : {
          mode: postScope,
          postIds: postScope === 'specific' ? specificPostIds : undefined,
        },
        filters: (includeKeywords.length > 0 || excludeKeywords.length > 0) ? {
          includeKeywords: includeKeywords.length > 0 ? includeKeywords : undefined,
          excludeKeywords: excludeKeywords.length > 0 ? excludeKeywords : undefined,
        } : undefined,
        publicReplies: triggerType === 'comment' ? filteredPublicReplies : [],
        flowId: selectedFlow,
      };

      // Validate with schema
      const validatedData = CreateTriggerRequestSchema.parse(triggerData);

      // Create trigger
      const { error } = await supabase
        .from('triggers')
        .insert({
          team_id: teamMember.team_id,
          ig_account_id: validatedData.igAccountId,
          trigger_type: validatedData.triggerType,
          post_scope: validatedData.postScope,
          filters: validatedData.filters,
          public_replies: validatedData.publicReplies,
          flow_id: validatedData.flowId,
          is_active: true,
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Trigger created successfully',
      });

      router.push('/dashboard/triggers');
    } catch (error: any) {
      console.error('Error creating trigger:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create trigger',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (accounts.length === 0 || flows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Setup Required</CardTitle>
            <CardDescription>
              You need connected Instagram accounts and active flows to create triggers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/triggers')}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/triggers')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Trigger</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up automated responses for Instagram interactions
          </p>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Trigger Type</CardTitle>
            <CardDescription>
              Choose what type of Instagram interaction will trigger this automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={triggerType} onValueChange={(v) => setTriggerType(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="comment" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comment
                </TabsTrigger>
                <TabsTrigger value="story_reply" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Story Reply
                </TabsTrigger>
                <TabsTrigger value="mention" className="flex items-center gap-2">
                  <AtSign className="h-4 w-4" />
                  Mention
                </TabsTrigger>
              </TabsList>
              <TabsContent value="comment" className="mt-4">
                <p className="text-sm text-gray-600">
                  Trigger when someone comments on your posts. Send a public reply and start a DM conversation.
                </p>
              </TabsContent>
              <TabsContent value="story_reply" className="mt-4">
                <p className="text-sm text-gray-600">
                  Trigger when someone replies to your Instagram stories. Automatically start a DM flow.
                </p>
              </TabsContent>
              <TabsContent value="mention" className="mt-4">
                <p className="text-sm text-gray-600">
                  Trigger when someone mentions your account in their posts or stories.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Basic Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="account">Instagram Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger id="account">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      @{account.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="flow">Flow to Run</Label>
              <Select value={selectedFlow} onValueChange={setSelectedFlow}>
                <SelectTrigger id="flow">
                  <SelectValue placeholder="Select a flow" />
                </SelectTrigger>
                <SelectContent>
                  {flows.map((flow) => (
                    <SelectItem key={flow.id} value={flow.id}>
                      {flow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {triggerType === 'comment' && (
          <Card>
            <CardHeader>
              <CardTitle>Post Scope</CardTitle>
              <CardDescription>
                Choose which posts this trigger applies to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={postScope} onValueChange={(v) => setPostScope(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Posts</TabsTrigger>
                  <TabsTrigger value="specific">Specific Posts</TabsTrigger>
                  <TabsTrigger value="next">Next Post Only</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <p className="text-sm text-gray-600">
                    This trigger will apply to all your existing and future posts.
                  </p>
                </TabsContent>
                <TabsContent value="specific" className="mt-4 space-y-4">
                  <p className="text-sm text-gray-600">
                    This trigger will only apply to specific posts you choose.
                  </p>
                  <div>
                    <Label htmlFor="postId">Post IDs</Label>
                    <div className="flex gap-2">
                      <Input
                        id="postId"
                        value={currentPostId}
                        onChange={(e) => setCurrentPostId(e.target.value)}
                        placeholder="Enter Instagram post ID"
                        onKeyPress={(e) => e.key === 'Enter' && addPostId()}
                      />
                      <Button type="button" onClick={addPostId}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {specificPostIds.map((id) => (
                        <Badge key={id} variant="secondary">
                          {id}
                          <button
                            onClick={() => removePostId(id)}
                            className="ml-2 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="next" className="mt-4">
                  <p className="text-sm text-gray-600">
                    This trigger will only apply to the next post you publish after activation.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Keyword Filters</CardTitle>
            <CardDescription>
              Filter triggers based on keywords in the message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="includeKeyword">Include Keywords</Label>
              <p className="text-sm text-gray-500 mb-2">
                Only trigger if the message contains one of these keywords
              </p>
              <div className="flex gap-2">
                <Input
                  id="includeKeyword"
                  value={currentIncludeKeyword}
                  onChange={(e) => setCurrentIncludeKeyword(e.target.value)}
                  placeholder="Enter keyword"
                  onKeyPress={(e) => e.key === 'Enter' && addIncludeKeyword()}
                />
                <Button type="button" onClick={addIncludeKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {includeKeywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary">
                    {keyword}
                    <button
                      onClick={() => removeIncludeKeyword(keyword)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="excludeKeyword">Exclude Keywords</Label>
              <p className="text-sm text-gray-500 mb-2">
                Don't trigger if the message contains any of these keywords
              </p>
              <div className="flex gap-2">
                <Input
                  id="excludeKeyword"
                  value={currentExcludeKeyword}
                  onChange={(e) => setCurrentExcludeKeyword(e.target.value)}
                  placeholder="Enter keyword"
                  onKeyPress={(e) => e.key === 'Enter' && addExcludeKeyword()}
                />
                <Button type="button" onClick={addExcludeKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {excludeKeywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary">
                    {keyword}
                    <button
                      onClick={() => removeExcludeKeyword(keyword)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {triggerType === 'comment' && (
          <Card>
            <CardHeader>
              <CardTitle>Public Reply Messages</CardTitle>
              <CardDescription>
                Messages to post as public replies to comments. One will be randomly selected for each trigger.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {publicReplies.map((reply, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={reply}
                    onChange={(e) => updatePublicReply(index, e.target.value)}
                    placeholder="Enter public reply message"
                  />
                  {publicReplies.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePublicReply(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPublicReply}
                className="mt-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Reply Variant
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/triggers')}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Creating...' : 'Create Trigger'}
          </Button>
        </div>
      </div>
    </div>
  );
}