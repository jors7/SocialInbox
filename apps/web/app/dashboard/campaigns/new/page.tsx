'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Label } from '@socialinbox/ui';
import { Textarea } from '@socialinbox/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Switch } from '@socialinbox/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@socialinbox/ui';
import { 
  ArrowLeft,
  Save,
  Send,
  Users,
  MessageSquare,
  Clock,
  Filter,
  Plus,
  X,
  Calendar,
  Info
} from 'lucide-react';
import { createClient } from '../../../../lib/supabase/client';
import { useToast } from '../../../../hooks/use-toast';
import type { Database } from '@socialinbox/shared';

type MessageTemplate = Database['public']['Tables']['message_templates']['Row'];
type Contact = Database['public']['Tables']['contacts']['Row'];
type ContactList = Database['public']['Tables']['contact_lists']['Row'] & {
  list_members?: { count: number }[];
};

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [teamId, setTeamId] = useState<string>('');
  
  // Campaign data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [recipientCount, setRecipientCount] = useState(0);
  
  // A/B Testing
  const [enableABTest, setEnableABTest] = useState(false);
  const [selectedTemplateB, setSelectedTemplateB] = useState('');
  const [abTestSplitPercentage, setABTestSplitPercentage] = useState(50);

  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedLists.length > 0) {
      calculateRecipients();
    }
  }, [selectedLists, filters]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      if (!teamMember) return;

      setTeamId(teamMember.team_id);

      // Load templates
      const { data: templatesData } = await supabase
        .from('message_templates')
        .select('*')
        .eq('team_id', teamMember.team_id)
        .order('created_at', { ascending: false });

      setTemplates(templatesData || []);

      // Load contact lists
      const { data: listsData } = await supabase
        .from('contact_lists')
        .select(`
          *,
          list_members:contact_list_members(count)
        `)
        .eq('team_id', teamMember.team_id);

      setContactLists(listsData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const calculateRecipients = async () => {
    try {
      let query = supabase
        .from('contacts')
        .select('id', { count: 'exact' })
        .eq('team_id', teamId);

      // Apply list filters
      if (selectedLists.length > 0) {
        const { data: memberData } = await supabase
          .from('contact_list_members')
          .select('contact_id')
          .in('list_id', selectedLists);

        const contactIds = memberData?.map(m => m.contact_id) || [];
        if (contactIds.length > 0) {
          query = query.in('id', contactIds);
        }
      }

      // Apply custom filters
      filters.forEach((filter) => {
        switch (filter.field) {
          case 'tags':
            if (filter.value) {
              query = query.contains('tags', [filter.value]);
            }
            break;
          case 'created_at':
            if (filter.operator === 'after') {
              query = query.gte('created_at', filter.value);
            } else if (filter.operator === 'before') {
              query = query.lte('created_at', filter.value);
            }
            break;
        }
      });

      const { count } = await query;
      setRecipientCount(count || 0);
    } catch (error) {
      console.error('Failed to calculate recipients:', error);
    }
  };

  const addFilter = () => {
    setFilters([...filters, { id: Date.now(), field: '', operator: '', value: '' }]);
  };

  const updateFilter = (id: number, updates: any) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeFilter = (id: number) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const handleCreate = async (status: 'draft' | 'scheduled' | 'running') => {
    if (!name || !selectedTemplate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
      });
      return;
    }

    if (status === 'scheduled' && !scheduledAt) {
      toast({
        title: 'Error',
        description: 'Please select a scheduled date and time',
      });
      return;
    }

    if (selectedLists.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one contact list',
      });
      return;
    }

    setLoading(true);
    try {
      // Create the campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('broadcast_campaigns')
        .insert({
          team_id: teamId,
          name,
          description,
          template_id: selectedTemplate,
          status,
          scheduled_at: status === 'scheduled' ? scheduledAt : null,
          filters: filters.length > 0 ? filters : null,
          is_ab_test: enableABTest,
          ab_test_config: enableABTest ? {
            template_a_id: selectedTemplate,
            template_b_id: selectedTemplateB,
            split_percentage: abTestSplitPercentage,
          } : null,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Link contact lists
      if (selectedLists.length > 0) {
        const listLinks = selectedLists.map(listId => ({
          campaign_id: campaign.id,
          list_id: listId,
        }));

        const { error: linkError } = await supabase
          .from('campaign_lists')
          .insert(listLinks);

        if (linkError) throw linkError;
      }

      // If starting immediately, create broadcast messages
      if (status === 'running') {
        await createBroadcastMessages(campaign.id);
      }

      toast({
        title: 'Success',
        description: `Campaign ${status === 'draft' ? 'saved as draft' : status === 'scheduled' ? 'scheduled' : 'started'} successfully`,
      });
      router.push(`/dashboard/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
      });
    } finally {
      setLoading(false);
    }
  };

  const createBroadcastMessages = async (campaignId: string) => {
    try {
      // Get all contacts based on lists and filters
      let contactIds: string[] = [];
      
      if (selectedLists.length > 0) {
        const { data: memberData } = await supabase
          .from('contact_list_members')
          .select('contact_id')
          .in('list_id', selectedLists);

        contactIds = memberData?.map(m => m.contact_id) || [];
      }

      // Create broadcast messages
      const messages = contactIds.map(contactId => ({
        campaign_id: campaignId,
        contact_id: contactId,
        status: 'pending' as const,
        scheduled_at: scheduledAt || new Date().toISOString(),
      }));

      if (messages.length > 0) {
        const { error } = await supabase
          .from('broadcast_messages')
          .insert(messages);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to create broadcast messages:', error);
      throw error;
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/campaigns')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>

        <h1 className="text-2xl font-semibold">Create Campaign</h1>
        <p className="text-gray-600 mt-1">Set up a new broadcast campaign</p>
      </div>

      {/* Campaign Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Holiday Sale Announcement"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your campaign..."
                  rows={3}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Message Template */}
          <Card>
            <CardHeader>
              <CardTitle>Message Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template">Select Template *</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="template" className="mt-2">
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-gray-500">
                            {template.content_type.replace('_', ' ')}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplateData && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Template Preview</p>
                    <Badge variant="outline">{selectedTemplateData.content_type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedTemplateData.content_type === 'text' 
                      ? selectedTemplateData.content.text?.substring(0, 100) + '...'
                      : `${selectedTemplateData.content_type.replace('_', ' ')} message`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audience */}
          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Contact Lists *</Label>
                <div className="mt-2 space-y-2">
                  {contactLists.map((list) => (
                    <label key={list.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedLists.includes(list.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLists([...selectedLists, list.id]);
                          } else {
                            setSelectedLists(selectedLists.filter(id => id !== list.id));
                          }
                        }}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{list.name}</p>
                        <p className="text-sm text-gray-500">
                          {list.list_members?.[0]?.count || 0} contacts
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Advanced Filters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Advanced Filters</Label>
                  <Button size="sm" variant="outline" onClick={addFilter}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add Filter
                  </Button>
                </div>

                {filters.length > 0 && (
                  <div className="space-y-2">
                    {filters.map((filter) => (
                      <div key={filter.id} className="flex gap-2 items-center">
                        <Select value={filter.field} onValueChange={(value) => updateFilter(filter.id, { field: value })}>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tags">Tags</SelectItem>
                            <SelectItem value="created_at">Created Date</SelectItem>
                          </SelectContent>
                        </Select>

                        {filter.field === 'tags' ? (
                          <Input
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            placeholder="Tag value"
                            className="flex-1"
                          />
                        ) : filter.field === 'created_at' ? (
                          <>
                            <Select value={filter.operator} onValueChange={(value) => updateFilter(filter.id, { operator: value })}>
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Operator" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="after">After</SelectItem>
                                <SelectItem value="before">Before</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="date"
                              value={filter.value}
                              onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                              className="flex-1"
                            />
                          </>
                        ) : null}

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFilter(filter.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={schedule}
                  onCheckedChange={setSchedule}
                />
                <Label htmlFor="schedule">Schedule for later</Label>
              </div>

              {schedule && (
                <div>
                  <Label htmlFor="scheduled-time">Date & Time</Label>
                  <Input
                    id="scheduled-time"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="mt-2"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* A/B Testing */}
          <Card>
            <CardHeader>
              <CardTitle>A/B Testing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={enableABTest}
                  onCheckedChange={setEnableABTest}
                />
                <Label>Enable A/B Testing</Label>
              </div>

              {enableABTest && (
                <>
                  <div>
                    <Label htmlFor="template-b">Template B (Variant)</Label>
                    <Select value={selectedTemplateB} onValueChange={setSelectedTemplateB}>
                      <SelectTrigger id="template-b" className="mt-2">
                        <SelectValue placeholder="Choose variant template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates
                          .filter(t => t.id !== selectedTemplate)
                          .map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-xs text-gray-500">
                                  {template.content_type.replace('_', ' ')}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="split">Traffic Split</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Template A: {100 - abTestSplitPercentage}%</span>
                        <span>Template B: {abTestSplitPercentage}%</span>
                      </div>
                      <Input
                        id="split"
                        type="range"
                        min="10"
                        max="90"
                        step="10"
                        value={abTestSplitPercentage}
                        onChange={(e) => setABTestSplitPercentage(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">A/B Test Active</p>
                        <p>{100 - abTestSplitPercentage}% of recipients will receive Template A, and {abTestSplitPercentage}% will receive Template B. Results will be tracked separately.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Recipients</p>
                <p className="text-2xl font-semibold">{recipientCount}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Campaign Name</span>
                  <span className="font-medium">{name || 'Not set'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Template</span>
                  <span className="font-medium">
                    {selectedTemplateData?.name || 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lists</span>
                  <span className="font-medium">{selectedLists.length} selected</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Schedule</span>
                  <span className="font-medium">
                    {schedule ? 'Scheduled' : 'Send immediately'}
                  </span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  className="w-full"
                  onClick={() => handleCreate(schedule ? 'scheduled' : 'running')}
                  disabled={loading || !name || !selectedTemplate || selectedLists.length === 0}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {schedule ? 'Schedule Campaign' : 'Start Campaign'}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCreate('draft')}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </Button>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-xs text-gray-500">
                    Messages will be sent to all contacts in the selected lists that match your filters.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}