'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Progress } from '@socialinbox/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@socialinbox/ui';
import { 
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Download,
  Users,
  Send,
  Eye,
  MousePointer,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  RefreshCw,
  Edit
} from 'lucide-react';
import { createClient } from '../../../../lib/supabase/client';
import { toast } from '@socialinbox/ui';
import type { Database } from '@socialinbox/shared';

type BroadcastCampaign = Database['public']['Tables']['broadcast_campaigns']['Row'] & {
  template?: Database['public']['Tables']['message_templates']['Row'];
  campaign_lists?: {
    list_id: string;
    contact_lists: Database['public']['Tables']['contact_lists']['Row'];
  }[];
};

type BroadcastMessage = Database['public']['Tables']['broadcast_messages']['Row'] & {
  contacts: Database['public']['Tables']['contacts']['Row'];
};

interface CampaignStats {
  totalRecipients: number;
  pending: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
}

interface ABTestStats {
  templateA: CampaignStats & { templateId: string; templateName: string };
  templateB: CampaignStats & { templateId: string; templateName: string };
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  running: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-purple-100 text-purple-800',
  failed: 'bg-red-100 text-red-800',
};

const statusIcons = {
  draft: AlertCircle,
  scheduled: Clock,
  running: Play,
  paused: Pause,
  completed: CheckCircle,
  failed: XCircle,
};

export default function CampaignDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<BroadcastCampaign | null>(null);
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [stats, setStats] = useState<CampaignStats>({
    totalRecipients: 0,
    pending: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [abTestStats, setABTestStats] = useState<ABTestStats | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadCampaign();
  }, [params.id]);

  const loadCampaign = async () => {
    setLoading(true);
    try {
      // Load campaign details
      const { data: campaignData, error: campaignError } = await supabase
        .from('broadcast_campaigns')
        .select(`
          *,
          template:message_templates(*),
          campaign_lists(
            list_id,
            contact_lists(*)
          )
        `)
        .eq('id', params.id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Load broadcast messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('broadcast_messages')
        .select(`
          *,
          contacts(*)
        `)
        .eq('campaign_id', params.id)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);

      // Calculate stats
      const newStats: CampaignStats = {
        totalRecipients: messagesData?.length || 0,
        pending: messagesData?.filter(m => m.status === 'pending').length || 0,
        sent: messagesData?.filter(m => ['sent', 'delivered', 'opened', 'clicked'].includes(m.status)).length || 0,
        delivered: messagesData?.filter(m => ['delivered', 'opened', 'clicked'].includes(m.status)).length || 0,
        opened: messagesData?.filter(m => ['opened', 'clicked'].includes(m.status)).length || 0,
        clicked: messagesData?.filter(m => m.status === 'clicked').length || 0,
        failed: messagesData?.filter(m => m.status === 'failed').length || 0,
      };
      setStats(newStats);

      // Calculate A/B test stats if applicable
      if (campaignData.is_ab_test && campaignData.ab_test_config) {
        const templateAMessages = messagesData?.filter(m => 
          m.template_variant === 'A' || !m.template_variant
        ) || [];
        const templateBMessages = messagesData?.filter(m => 
          m.template_variant === 'B'
        ) || [];

        const calculateVariantStats = (messages: any[]): CampaignStats => ({
          totalRecipients: messages.length,
          pending: messages.filter(m => m.status === 'pending').length,
          sent: messages.filter(m => ['sent', 'delivered', 'opened', 'clicked'].includes(m.status)).length,
          delivered: messages.filter(m => ['delivered', 'opened', 'clicked'].includes(m.status)).length,
          opened: messages.filter(m => ['opened', 'clicked'].includes(m.status)).length,
          clicked: messages.filter(m => m.status === 'clicked').length,
          failed: messages.filter(m => m.status === 'failed').length,
        });

        // Get template names
        const { data: templateA } = await supabase
          .from('message_templates')
          .select('name')
          .eq('id', campaignData.ab_test_config.template_a_id)
          .single();

        const { data: templateB } = await supabase
          .from('message_templates')
          .select('name')
          .eq('id', campaignData.ab_test_config.template_b_id)
          .single();

        setABTestStats({
          templateA: {
            ...calculateVariantStats(templateAMessages),
            templateId: campaignData.ab_test_config.template_a_id,
            templateName: templateA?.name || 'Template A',
          },
          templateB: {
            ...calculateVariantStats(templateBMessages),
            templateId: campaignData.ab_test_config.template_b_id,
            templateName: templateB?.name || 'Template B',
          },
        });
      }
    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast.error('Failed to load campaign');
      router.push('/dashboard/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCampaign();
    setRefreshing(false);
    toast.success('Campaign data refreshed');
  };

  const handleCampaignAction = async (action: 'start' | 'pause' | 'resume' | 'delete') => {
    if (!campaign) return;

    try {
      switch (action) {
        case 'start':
          await updateCampaignStatus('running');
          await createBroadcastMessages();
          break;
        case 'pause':
          await updateCampaignStatus('paused');
          break;
        case 'resume':
          await updateCampaignStatus('running');
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this campaign?')) {
            const { error } = await supabase
              .from('broadcast_campaigns')
              .delete()
              .eq('id', campaign.id);

            if (error) throw error;
            toast.success('Campaign deleted');
            router.push('/dashboard/campaigns');
            return;
          }
          break;
      }
      await loadCampaign();
    } catch (error) {
      console.error(`Failed to ${action} campaign:`, error);
      toast.error(`Failed to ${action} campaign`);
    }
  };

  const updateCampaignStatus = async (status: string) => {
    if (!campaign) return;

    const updates: any = { status };
    if (status === 'running' && !campaign.started_at) {
      updates.started_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('broadcast_campaigns')
      .update(updates)
      .eq('id', campaign.id);

    if (error) throw error;
  };

  const createBroadcastMessages = async () => {
    if (!campaign || !campaign.campaign_lists) return;

    try {
      // Get all contacts from selected lists
      const listIds = campaign.campaign_lists.map(cl => cl.list_id);
      const { data: memberData } = await supabase
        .from('contact_list_members')
        .select('contact_id')
        .in('list_id', listIds);

      const contactIds = [...new Set(memberData?.map(m => m.contact_id) || [])];

      // Create broadcast messages for contacts that don\'t have one yet
      const existingContactIds = messages.map(m => m.contact_id);
      const newContactIds = contactIds.filter(id => !existingContactIds.includes(id));

      if (newContactIds.length > 0) {
        const newMessages = newContactIds.map(contactId => ({
          campaign_id: campaign.id,
          contact_id: contactId,
          status: 'pending' as const,
          scheduled_at: campaign.scheduled_at || new Date().toISOString(),
        }));

        const { error } = await supabase
          .from('broadcast_messages')
          .insert(newMessages);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to create broadcast messages:', error);
      throw error;
    }
  };

  const exportCampaignData = async () => {
    // Implement CSV export of campaign data
    const csvContent = [
      ['Contact Name', 'Email', 'Phone', 'Status', 'Sent At', 'Delivered At', 'Opened At', 'Clicked At'],
      ...messages.map(msg => [
        `${msg.contacts.first_name} ${msg.contacts.last_name}`,
        msg.contacts.email || '',
        msg.contacts.phone || '',
        msg.status,
        msg.sent_at || '',
        msg.delivered_at || '',
        msg.opened_at || '',
        msg.clicked_at || '',
      ])
    ];

    const csv = csvContent.map(row => row.join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${campaign?.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-export.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Campaign not found</p>
      </div>
    );
  }

  const StatusIcon = statusIcons[campaign.status as keyof typeof statusIcons] || AlertCircle;
  const progress = stats.totalRecipients > 0 ? Math.round((stats.sent / stats.totalRecipients) * 100) : 0;

  return (
    <div className="container mx-auto py-6">
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Send className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{campaign.name}</h1>
              <p className="text-gray-600 mt-1">{campaign.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {campaign.status}
                </Badge>
                {campaign.is_ab_test && (
                  <Badge variant="outline">
                    <BarChart3 className="mr-1 h-3 w-3" />
                    A/B Test
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {campaign.status === 'draft' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/campaigns/${campaign.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={() => handleCampaignAction('start')}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Campaign
                </Button>
              </>
            )}

            {campaign.status === 'scheduled' && (
              <Button onClick={() => handleCampaignAction('start')}>
                <Play className="mr-2 h-4 w-4" />
                Start Now
              </Button>
            )}

            {campaign.status === 'running' && (
              <Button variant="outline" onClick={() => handleCampaignAction('pause')}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}

            {campaign.status === 'paused' && (
              <Button onClick={() => handleCampaignAction('resume')}>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleCampaignAction('delete')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Progress */}
          {campaign.status !== 'draft' && (
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Campaign Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-semibold">{stats.totalRecipients}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-blue-600">{stats.sent}</p>
                    <p className="text-xs text-gray-500">Sent</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-green-600">{stats.delivered}</p>
                    <p className="text-xs text-gray-500">Delivered</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-purple-600">{stats.opened}</p>
                    <p className="text-xs text-gray-500">Opened</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
                    <p className="text-xs text-gray-500">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Template */}
            <Card>
              <CardHeader>
                <CardTitle>Message Template</CardTitle>
              </CardHeader>
              <CardContent>
                {campaign.template ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{campaign.template.name}</p>
                      <Badge variant="outline">{campaign.template.content_type}</Badge>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {campaign.template.content_type === 'text' 
                          ? campaign.template.content.text
                          : `${campaign.template.content_type} message`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No template selected</p>
                )}
              </CardContent>
            </Card>

            {/* Audience */}
            <Card>
              <CardHeader>
                <CardTitle>Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Contact Lists</p>
                    <p className="font-medium">{campaign.campaign_lists?.length || 0}</p>
                  </div>
                  {campaign.campaign_lists && campaign.campaign_lists.length > 0 && (
                    <div className="space-y-2">
                      {campaign.campaign_lists.map((cl) => (
                        <div key={cl.list_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <p className="text-sm font-medium">{cl.contact_lists.name}</p>
                          <Badge variant="outline" className="text-xs">
                            <Users className="mr-1 h-3 w-3" />
                            {cl.contact_lists.member_count || 0}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Info */}
          {campaign.scheduled_at && (
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">
                    Scheduled for: {new Date(campaign.scheduled_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recipients">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recipients</CardTitle>
                <Button variant="outline" size="sm" onClick={exportCampaignData}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-2">Contact</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Sent</th>
                      <th className="text-left p-2">Delivered</th>
                      <th className="text-left p-2">Opened</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.slice(0, 20).map((message) => (
                      <tr key={message.id} className="border-b">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">
                              {message.contacts.first_name} {message.contacts.last_name}
                            </p>
                            <p className="text-xs text-gray-500">{message.contacts.email}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge variant={message.status === 'failed' ? 'destructive' : 'outline'}>
                            {message.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-gray-500">
                          {message.sent_at ? new Date(message.sent_at).toLocaleString() : '-'}
                        </td>
                        <td className="p-2 text-gray-500">
                          {message.delivered_at ? new Date(message.delivered_at).toLocaleString() : '-'}
                        </td>
                        <td className="p-2 text-gray-500">
                          {message.opened_at ? new Date(message.opened_at).toLocaleString() : '-'}
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/inbox?contact=${message.contact_id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {messages.length > 20 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Showing 20 of {messages.length} recipients
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Sent Rate</span>
                    </div>
                    <p className="font-semibold">
                      {stats.totalRecipients > 0 
                        ? Math.round((stats.sent / stats.totalRecipients) * 100) 
                        : 0}%
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Delivery Rate</span>
                    </div>
                    <p className="font-semibold">
                      {stats.sent > 0 
                        ? Math.round((stats.delivered / stats.sent) * 100) 
                        : 0}%
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Failure Rate</span>
                    </div>
                    <p className="font-semibold">
                      {stats.totalRecipients > 0 
                        ? Math.round((stats.failed / stats.totalRecipients) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Open Rate</span>
                    </div>
                    <p className="font-semibold">
                      {stats.delivered > 0 
                        ? Math.round((stats.opened / stats.delivered) * 100) 
                        : 0}%
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Click Rate</span>
                    </div>
                    <p className="font-semibold">
                      {stats.opened > 0 
                        ? Math.round((stats.clicked / stats.opened) * 100) 
                        : 0}%
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm">Engagement Rate</span>
                    </div>
                    <p className="font-semibold">
                      {stats.delivered > 0 
                        ? Math.round(((stats.opened + stats.clicked) / (stats.delivered * 2)) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* A/B Test Results */}
          {campaign.is_ab_test && abTestStats && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>A/B Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Template A Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b">
                      <h4 className="font-medium">{abTestStats.templateA.templateName}</h4>
                      <Badge variant="outline">Variant A</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Recipients</span>
                        <span className="font-medium">{abTestStats.templateA.totalRecipients}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Open Rate</span>
                        <span className="font-medium">
                          {abTestStats.templateA.delivered > 0 
                            ? Math.round((abTestStats.templateA.opened / abTestStats.templateA.delivered) * 100) 
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Click Rate</span>
                        <span className="font-medium">
                          {abTestStats.templateA.opened > 0 
                            ? Math.round((abTestStats.templateA.clicked / abTestStats.templateA.opened) * 100) 
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Template B Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b">
                      <h4 className="font-medium">{abTestStats.templateB.templateName}</h4>
                      <Badge variant="outline">Variant B</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Recipients</span>
                        <span className="font-medium">{abTestStats.templateB.totalRecipients}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Open Rate</span>
                        <span className="font-medium">
                          {abTestStats.templateB.delivered > 0 
                            ? Math.round((abTestStats.templateB.opened / abTestStats.templateB.delivered) * 100) 
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Click Rate</span>
                        <span className="font-medium">
                          {abTestStats.templateB.opened > 0 
                            ? Math.round((abTestStats.templateB.clicked / abTestStats.templateB.opened) * 100) 
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Winner Determination */}
                {(abTestStats.templateA.delivered > 10 && abTestStats.templateB.delivered > 10) && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-gray-600" />
                      <h5 className="font-medium">Test Results</h5>
                    </div>
                    <p className="text-sm text-gray-600">
                      {(() => {
                        const openRateA = abTestStats.templateA.delivered > 0 
                          ? (abTestStats.templateA.opened / abTestStats.templateA.delivered) * 100 
                          : 0;
                        const openRateB = abTestStats.templateB.delivered > 0 
                          ? (abTestStats.templateB.opened / abTestStats.templateB.delivered) * 100 
                          : 0;
                        
                        const difference = Math.abs(openRateA - openRateB);
                        const winner = openRateA > openRateB ? 'A' : 'B';
                        const winnerName = winner === 'A' ? abTestStats.templateA.templateName : abTestStats.templateB.templateName;
                        
                        if (difference < 5) {
                          return "The test shows no significant difference between variants. Both templates are performing similarly.";
                        } else {
                          return `Template ${winnerName} (Variant ${winner}) is performing ${Math.round(difference)}% better in open rates.`;
                        }
                      })()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}