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
import { Switch } from '@socialinbox/ui';
import { ArrowLeft, Plus, X, MessageSquare, Instagram, AtSign, Trash2 } from 'lucide-react';
import { useToast } from '../../../../hooks/use-toast';
import { UpdateTriggerRequestSchema } from '@socialinbox/shared';

export default function EditTriggerPage({ params }: { params: { id: string } }) {
  const [trigger, setTrigger] = useState<any>(null);
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
  const [isActive, setIsActive] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [params.id]);

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

      // Load trigger data
      const { data: triggerData, error: triggerError } = await supabase
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
        .eq('id', params.id)
        .eq('team_id', teamMember.team_id)
        .single();

      if (triggerError || !triggerData) {
        throw new Error('Trigger not found');
      }

      setTrigger(triggerData);
      setTriggerType(triggerData.trigger_type);
      setSelectedAccount(triggerData.ig_account_id);
      setSelectedFlow(triggerData.flow_id);
      setIsActive(triggerData.is_active);

      // Set post scope
      if (triggerData.post_scope) {
        setPostScope(triggerData.post_scope.mode);
        if (triggerData.post_scope.postIds) {
          setSpecificPostIds(triggerData.post_scope.postIds);
        }
      }

      // Set filters
      if (triggerData.filters) {
        if (triggerData.filters.include_keywords) {
          setIncludeKeywords(triggerData.filters.include_keywords);
        }
        if (triggerData.filters.exclude_keywords) {
          setExcludeKeywords(triggerData.filters.exclude_keywords);
        }
      }

      // Set public replies
      if (triggerData.public_replies && triggerData.public_replies.length > 0) {
        setPublicReplies(triggerData.public_replies);
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
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load trigger',
        variant: 'destructive',
      });
      router.push('/dashboard/triggers');
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

      const updateData = {
        igAccountId: selectedAccount,
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
        isActive,
      };

      // Validate with schema
      const validatedData = UpdateTriggerRequestSchema.parse(updateData);

      // Update trigger
      const { error } = await supabase
        .from('triggers')
        .update({
          ig_account_id: validatedData.igAccountId,
          post_scope: validatedData.postScope,
          filters: validatedData.filters,
          public_replies: validatedData.publicReplies,
          flow_id: validatedData.flowId,
          is_active: validatedData.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Trigger updated successfully',
      });

      router.push('/dashboard/triggers');
    } catch (error: any) {
      console.error('Error updating trigger:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update trigger',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this trigger? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);

      const { error } = await supabase
        .from('triggers')
        .delete()
        .eq('id', params.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Trigger deleted successfully',
      });

      router.push('/dashboard/triggers');
    } catch (error: any) {
      console.error('Error deleting trigger:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete trigger',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !trigger) {
    return <div>Loading...</div>;
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Edit Trigger</h1>
          <p className="mt-1 text-sm text-gray-500">
            Modify your automation trigger settings
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {deleting ? 'Deleting...' : 'Delete Trigger'}
        </Button>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Trigger Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="active">Active</Label>
                <p className="text-sm text-gray-500">
                  Enable or disable this trigger
                </p>
              </div>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trigger Type</CardTitle>
            <CardDescription>
              The type of Instagram interaction that triggers this automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                {triggerType === 'comment' && <MessageSquare className="h-5 w-5 text-gray-600" />}
                {triggerType === 'story_reply' && <Instagram className="h-5 w-5 text-gray-600" />}
                {triggerType === 'mention' && <AtSign className="h-5 w-5 text-gray-600" />}
                <div>
                  <p className="font-medium">
                    {triggerType === 'comment' && 'Comment Trigger'}
                    {triggerType === 'story_reply' && 'Story Reply Trigger'}
                    {triggerType === 'mention' && 'Mention Trigger'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {triggerType === 'comment' && 'Triggers when someone comments on your posts'}
                    {triggerType === 'story_reply' && 'Triggers when someone replies to your stories'}
                    {triggerType === 'mention' && 'Triggers when someone mentions your account'}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Trigger type cannot be changed after creation
            </p>
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
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}