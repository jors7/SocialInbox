'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@socialinbox/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Clock,
  Zap,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { OverviewMetrics } from '../../../components/analytics/overview-metrics';
import { MessageChart } from '../../../components/analytics/message-chart';
import { FlowPerformance } from '../../../components/analytics/flow-performance';
import { UserEngagement } from '../../../components/analytics/user-engagement';
import { FunnelAnalysis } from '../../../components/analytics/funnel-analysis';
import { RealtimeMetrics } from '../../../components/analytics/realtime-metrics';
import { useToast } from '../../../hooks/use-toast';

type DateRange = '7d' | '30d' | '90d' | 'custom';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamId, setTeamId] = useState<string>('');
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
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

      setTeamId(teamMember.team_id);

      // Load Instagram accounts
      const { data: accountsData } = await supabase
        .from('ig_accounts')
        .select('id, username')
        .eq('team_id', teamMember.team_id);

      setAccounts(accountsData || []);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger refresh in child components
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      // Calculate date range
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');

      // Fetch analytics data
      const query = supabase
        .from('analytics_daily')
        .select('*')
        .eq('team_id', teamId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (selectedAccount !== 'all') {
        query.eq('ig_account_id', selectedAccount);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Convert to CSV
      const csv = convertToCSV(data || []);
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Analytics data exported successfully',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to export analytics data',
        variant: 'destructive',
      });
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  };

  const getDateRangeParams = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    switch (dateRange) {
      case '7d':
        startDate = startOfDay(subDays(now, 7));
        break;
      case '30d':
        startDate = startOfDay(subDays(now, 30));
        break;
      case '90d':
        startDate = startOfDay(subDays(now, 90));
        break;
      default:
        startDate = startOfDay(subDays(now, 7));
    }

    return { startDate, endDate };
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track performance and optimize your automation
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          {/* Account Filter */}
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  @{account.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <RealtimeMetrics teamId={teamId} accountId={selectedAccount} />

      {/* Overview Metrics */}
      <OverviewMetrics 
        teamId={teamId}
        accountId={selectedAccount}
        dateRange={getDateRangeParams()}
        refresh={refreshing}
      />

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="flows">Flows</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="funnels">Funnels</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <MessageChart
            teamId={teamId}
            accountId={selectedAccount}
            dateRange={getDateRangeParams()}
          />
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <FlowPerformance
            teamId={teamId}
            accountId={selectedAccount}
            dateRange={getDateRangeParams()}
          />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <UserEngagement
            teamId={teamId}
            accountId={selectedAccount}
            dateRange={getDateRangeParams()}
          />
        </TabsContent>

        <TabsContent value="funnels" className="space-y-4">
          <FunnelAnalysis
            teamId={teamId}
            accountId={selectedAccount}
            dateRange={getDateRangeParams()}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}