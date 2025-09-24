'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Progress } from '@socialinbox/ui';
import { Tabs, TabsList, TabsTrigger } from '@socialinbox/ui';
import { 
  Plus, 
  Search,
  Play,
  Pause,
  BarChart3,
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter
} from 'lucide-react';
import { createClient } from '../../../lib/supabase/client';
import type { Database } from '@socialinbox/shared';

type BroadcastCampaign = Database['public']['Tables']['broadcast_campaigns']['Row'] & {
  template?: Database['public']['Tables']['message_templates']['Row'];
  stats?: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
};

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

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<BroadcastCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const supabase = createClient();

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchQuery, selectedStatus]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      if (!teamMember) {
        throw new Error('No team found');
      }

      const { data, error } = await supabase
        .from('broadcast_campaigns')
        .select(`
          *,
          template:message_templates(*)
        `)
        .eq('team_id', teamMember.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load campaign stats
      const campaignsWithStats = await Promise.all(
        (data || []).map(async (campaign) => {
          // Get broadcast messages for this campaign
          const { data: messages } = await supabase
            .from('broadcast_messages')
            .select('status')
            .eq('campaign_id', campaign.id);

          const stats = {
            totalRecipients: messages?.length || 0,
            sent: messages?.filter(m => ['sent', 'delivered', 'opened', 'clicked'].includes(m.status)).length || 0,
            delivered: messages?.filter(m => ['delivered', 'opened', 'clicked'].includes(m.status)).length || 0,
            opened: messages?.filter(m => ['opened', 'clicked'].includes(m.status)).length || 0,
            clicked: messages?.filter(m => m.status === 'clicked').length || 0,
            failed: messages?.filter(m => m.status === 'failed').length || 0,
          };

          return { ...campaign, stats };
        })
      );

      setCampaigns(campaignsWithStats);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    let filtered = campaigns;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(campaign => 
        campaign.name.toLowerCase().includes(query)
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === selectedStatus);
    }

    setFilteredCampaigns(filtered);
  };

  const getProgress = (campaign: BroadcastCampaign): number => {
    if (!campaign.stats || campaign.stats.totalRecipients === 0) return 0;
    return Math.round((campaign.stats.sent / campaign.stats.totalRecipients) * 100);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCampaignAction = async (campaign: BroadcastCampaign, action: 'start' | 'pause' | 'resume') => {
    try {
      let newStatus: string;
      switch (action) {
        case 'start':
          newStatus = 'running';
          break;
        case 'pause':
          newStatus = 'paused';
          break;
        case 'resume':
          newStatus = 'running';
          break;
      }

      const { error } = await supabase
        .from('broadcast_campaigns')
        .update({ 
          status: newStatus,
          started_at: action === 'start' ? new Date().toISOString() : campaign.started_at
        })
        .eq('id', campaign.id);

      if (error) throw error;

      await loadCampaigns();
    } catch (error) {
      console.error('Failed to update campaign:', error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-gray-600 mt-1">Broadcast messages to your audience</p>
        </div>
        <Button onClick={() => router.push('/dashboard/campaigns/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="running">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Campaign List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading campaigns...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg font-medium">No campaigns found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Create your first broadcast campaign'}
            </p>
            {!searchQuery && selectedStatus === 'all' && (
              <Button 
                onClick={() => router.push('/dashboard/campaigns/new')}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign) => {
            const StatusIcon = statusIcons[campaign.status as keyof typeof statusIcons] || AlertCircle;
            const progress = getProgress(campaign);

            return (
              <Card 
                key={campaign.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        {campaign.template && (
                          <span>Template: {campaign.template.name}</span>
                        )}
                        {campaign.scheduled_at && campaign.status === 'scheduled' && (
                          <span>Scheduled: {formatDate(campaign.scheduled_at)}</span>
                        )}
                        {campaign.started_at && (
                          <span>Started: {formatDate(campaign.started_at)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {campaign.status}
                      </Badge>
                      
                      {campaign.status === 'scheduled' && (
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCampaignAction(campaign, 'start');
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {campaign.status === 'running' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCampaignAction(campaign, 'pause');
                          }}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {campaign.status === 'paused' && (
                        <Button 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCampaignAction(campaign, 'resume');
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {campaign.status !== 'draft' && campaign.stats && (
                    <>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-5 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-semibold">{campaign.stats.totalRecipients}</p>
                          <p className="text-xs text-gray-500">Recipients</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{campaign.stats.sent}</p>
                          <p className="text-xs text-gray-500">Sent</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{campaign.stats.delivered}</p>
                          <p className="text-xs text-gray-500">Delivered</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{campaign.stats.opened}</p>
                          <p className="text-xs text-gray-500">Opened</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold">{campaign.stats.clicked}</p>
                          <p className="text-xs text-gray-500">Clicked</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* A/B Test Indicator */}
                  {campaign.is_ab_test && (
                    <div className="mt-3 pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        <BarChart3 className="mr-1 h-3 w-3" />
                        A/B Test
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}