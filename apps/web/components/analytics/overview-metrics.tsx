import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@socialinbox/ui';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OverviewMetricsProps {
  teamId: string;
  accountId: string;
  dateRange: { startDate: Date; endDate: Date };
  refresh?: boolean;
}

interface Metrics {
  totalMessages: number;
  messageChange: number;
  activeUsers: number;
  userChange: number;
  avgResponseTime: number;
  responseTimeChange: number;
  conversionRate: number;
  conversionChange: number;
}

export function OverviewMetrics({ teamId, accountId, dateRange, refresh }: OverviewMetricsProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    totalMessages: 0,
    messageChange: 0,
    activeUsers: 0,
    userChange: 0,
    avgResponseTime: 0,
    responseTimeChange: 0,
    conversionRate: 0,
    conversionChange: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadMetrics();
  }, [teamId, accountId, dateRange, refresh]);

  const loadMetrics = async () => {
    try {
      // Get current period data
      const currentQuery = supabase
        .from('analytics_daily')
        .select('*')
        .eq('team_id', teamId)
        .gte('date', dateRange.startDate.toISOString().split('T')[0])
        .lte('date', dateRange.endDate.toISOString().split('T')[0]);

      if (accountId !== 'all') {
        currentQuery.eq('ig_account_id', accountId);
      }

      const { data: currentData } = await currentQuery;

      // Calculate previous period for comparison
      const periodDays = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const previousStart = new Date(dateRange.startDate);
      previousStart.setDate(previousStart.getDate() - periodDays);
      const previousEnd = new Date(dateRange.startDate);
      previousEnd.setDate(previousEnd.getDate() - 1);

      const previousQuery = supabase
        .from('analytics_daily')
        .select('*')
        .eq('team_id', teamId)
        .gte('date', previousStart.toISOString().split('T')[0])
        .lte('date', previousEnd.toISOString().split('T')[0]);

      if (accountId !== 'all') {
        previousQuery.eq('ig_account_id', accountId);
      }

      const { data: previousData } = await previousQuery;

      // Calculate metrics
      const currentMetrics = calculatePeriodMetrics(currentData || []);
      const previousMetrics = calculatePeriodMetrics(previousData || []);

      setMetrics({
        totalMessages: currentMetrics.totalMessages,
        messageChange: calculatePercentageChange(currentMetrics.totalMessages, previousMetrics.totalMessages),
        activeUsers: currentMetrics.uniqueUsers,
        userChange: calculatePercentageChange(currentMetrics.uniqueUsers, previousMetrics.uniqueUsers),
        avgResponseTime: currentMetrics.avgResponseTime,
        responseTimeChange: calculatePercentageChange(currentMetrics.avgResponseTime, previousMetrics.avgResponseTime, true),
        conversionRate: currentMetrics.conversionRate,
        conversionChange: currentMetrics.conversionRate - previousMetrics.conversionRate,
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePeriodMetrics = (data: any[]) => {
    if (data.length === 0) {
      return {
        totalMessages: 0,
        uniqueUsers: 0,
        avgResponseTime: 0,
        conversionRate: 0,
      };
    }

    const totalMessages = data.reduce((sum, day) => sum + day.messages_sent + day.messages_received, 0);
    const uniqueUsers = Math.max(...data.map(day => day.unique_users || 0));
    const avgResponseTime = data.reduce((sum, day) => sum + (day.avg_response_time_seconds || 0), 0) / data.length;
    
    const totalConversations = data.reduce((sum, day) => sum + day.conversations_started, 0);
    const completedConversations = data.reduce((sum, day) => sum + day.conversations_completed, 0);
    const conversionRate = totalConversations > 0 ? (completedConversations / totalConversations) * 100 : 0;

    return {
      totalMessages,
      uniqueUsers,
      avgResponseTime,
      conversionRate,
    };
  };

  const calculatePercentageChange = (current: number, previous: number, inverse = false) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return inverse ? -change : change;
  };

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getChangeIcon = (change: number) => {
    if (Math.abs(change) < 0.5) return <Minus className="h-4 w-4 text-gray-400" />;
    return change > 0 
      ? <ArrowUp className="h-4 w-4 text-green-600" />
      : <ArrowDown className="h-4 w-4 text-red-600" />;
  };

  const getChangeColor = (change: number, inverse = false) => {
    if (Math.abs(change) < 0.5) return 'text-gray-600';
    const isPositive = inverse ? change < 0 : change > 0;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-7 bg-gray-200 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalMessages.toLocaleString()}</div>
          <div className={`flex items-center text-xs ${getChangeColor(metrics.messageChange)}`}>
            {getChangeIcon(metrics.messageChange)}
            <span className="ml-1">
              {Math.abs(metrics.messageChange).toFixed(1)}% from previous period
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeUsers.toLocaleString()}</div>
          <div className={`flex items-center text-xs ${getChangeColor(metrics.userChange)}`}>
            {getChangeIcon(metrics.userChange)}
            <span className="ml-1">
              {Math.abs(metrics.userChange).toFixed(1)}% from previous period
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatResponseTime(metrics.avgResponseTime)}</div>
          <div className={`flex items-center text-xs ${getChangeColor(metrics.responseTimeChange, true)}`}>
            {getChangeIcon(metrics.responseTimeChange)}
            <span className="ml-1">
              {Math.abs(metrics.responseTimeChange).toFixed(1)}% from previous period
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
          <div className={`flex items-center text-xs ${getChangeColor(metrics.conversionChange)}`}>
            {getChangeIcon(metrics.conversionChange)}
            <span className="ml-1">
              {Math.abs(metrics.conversionChange).toFixed(1)} points from previous
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}