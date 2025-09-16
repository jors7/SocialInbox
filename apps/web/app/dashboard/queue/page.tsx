'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@socialinbox/ui';
import { Progress } from '@socialinbox/ui';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Play,
  Pause,
  Zap,
  MessageSquare,
  Send,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../../../hooks/use-toast';

interface QueueStats {
  flow_executions: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
  message_queue: {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
  };
  api_queue: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

export default function QueuePage() {
  const [stats, setStats] = useState<QueueStats>({
    flow_executions: { queued: 0, processing: 0, completed: 0, failed: 0 },
    message_queue: { pending: 0, sending: 0, sent: 0, failed: 0 },
    api_queue: { pending: 0, processing: 0, completed: 0, failed: 0 },
  });
  const [recentItems, setRecentItems] = useState<any>({
    flow_executions: [],
    message_queue: [],
    api_queue: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadQueueData();
    
    // Set up real-time subscriptions
    const channel = supabase
      .channel('queue-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flow_executions' }, () => {
        loadQueueData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_queue' }, () => {
        loadQueueData();
      })
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(loadQueueData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const loadQueueData = async () => {
    try {
      // Get stats for each queue
      const [flowStats, messageStats, apiStats] = await Promise.all([
        getQueueStats('flow_executions', ['queued', 'processing', 'completed', 'failed']),
        getQueueStats('message_queue', ['pending', 'sending', 'sent', 'failed']),
        getQueueStats('api_queue', ['pending', 'processing', 'completed', 'failed']),
      ]);

      setStats({
        flow_executions: flowStats,
        message_queue: messageStats,
        api_queue: apiStats,
      });

      // Get recent items
      const [flowItems, messageItems, apiItems] = await Promise.all([
        getRecentItems('flow_executions'),
        getRecentItems('message_queue'),
        getRecentItems('api_queue'),
      ]);

      setRecentItems({
        flow_executions: flowItems,
        message_queue: messageItems,
        api_queue: apiItems,
      });
    } catch (error) {
      console.error('Error loading queue data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getQueueStats = async (table: string, statuses: string[]) => {
    const stats: any = {};
    
    for (const status of statuses) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      
      stats[status] = count || 0;
    }
    
    return stats;
  };

  const getRecentItems = async (table: string) => {
    const { data } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    return data || [];
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadQueueData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
      case 'sending':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
      case 'sent':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'queued':
      case 'pending':
        return 'secondary';
      case 'processing':
      case 'sending':
        return 'default';
      case 'completed':
      case 'sent':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalFlowExecutions = Object.values(stats.flow_executions).reduce((a, b) => a + b, 0);
  const totalMessages = Object.values(stats.message_queue).reduce((a, b) => a + b, 0);
  const totalApiCalls = Object.values(stats.api_queue).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Queue Monitor</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage background job processing
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flow Executions</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFlowExecutions}</div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Active</span>
                <span className="font-medium">
                  {stats.flow_executions.queued + stats.flow_executions.processing}
                </span>
              </div>
              <Progress 
                value={((stats.flow_executions.queued + stats.flow_executions.processing) / Math.max(totalFlowExecutions, 1)) * 100}
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Message Queue</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Pending</span>
                <span className="font-medium">
                  {stats.message_queue.pending + stats.message_queue.sending}
                </span>
              </div>
              <Progress 
                value={((stats.message_queue.pending + stats.message_queue.sending) / Math.max(totalMessages, 1)) * 100}
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApiCalls}</div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Processing</span>
                <span className="font-medium">
                  {stats.api_queue.pending + stats.api_queue.processing}
                </span>
              </div>
              <Progress 
                value={((stats.api_queue.pending + stats.api_queue.processing) / Math.max(totalApiCalls, 1)) * 100}
                className="h-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Details */}
      <Tabs defaultValue="flow_executions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flow_executions">
            Flow Executions
            {stats.flow_executions.queued + stats.flow_executions.processing > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.flow_executions.queued + stats.flow_executions.processing}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="message_queue">
            Messages
            {stats.message_queue.pending + stats.message_queue.sending > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.message_queue.pending + stats.message_queue.sending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="api_queue">
            API Calls
            {stats.api_queue.pending + stats.api_queue.processing > 0 && (
              <Badge variant="secondary" className="ml-2">
                {stats.api_queue.pending + stats.api_queue.processing}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flow_executions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Flow Executions</CardTitle>
              <CardDescription>
                Automated flow processing status and history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentItems.flow_executions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No flow executions found
                  </p>
                ) : (
                  recentItems.flow_executions.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <p className="text-sm font-medium">Flow #{item.flow_id.slice(0, 8)}</p>
                          <p className="text-xs text-gray-500">
                            Conversation #{item.conversation_id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="message_queue">
          <Card>
            <CardHeader>
              <CardTitle>Message Queue</CardTitle>
              <CardDescription>
                Outgoing messages waiting to be sent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentItems.message_queue.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No messages in queue
                  </p>
                ) : (
                  recentItems.message_queue.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{item.content}</p>
                          <p className="text-xs text-gray-500">
                            Conversation #{item.conversation_id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api_queue">
          <Card>
            <CardHeader>
              <CardTitle>API Call Queue</CardTitle>
              <CardDescription>
                Instagram API calls with rate limiting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentItems.api_queue.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No API calls in queue
                  </p>
                ) : (
                  recentItems.api_queue.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <p className="text-sm font-medium">{item.api_type}</p>
                          <p className="text-xs text-gray-500">
                            Account #{item.ig_account_id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Priority: {item.priority}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}