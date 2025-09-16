import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Activity, Users, MessageSquare, Zap } from 'lucide-react';

interface RealtimeMetricsProps {
  teamId: string;
  accountId: string;
}

interface LiveMetrics {
  activeConversations: number;
  onlineUsers: number;
  messagesLastHour: number;
  activeFlows: number;
}

export function RealtimeMetrics({ teamId, accountId }: RealtimeMetricsProps) {
  const [metrics, setMetrics] = useState<LiveMetrics>({
    activeConversations: 0,
    onlineUsers: 0,
    messagesLastHour: 0,
    activeFlows: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    loadRealtimeMetrics();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('realtime-metrics')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          loadRealtimeMetrics();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadRealtimeMetrics();
        }
      )
      .subscribe();

    // Refresh every minute
    const interval = setInterval(loadRealtimeMetrics, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [teamId, accountId]);

  const loadRealtimeMetrics = async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      // Active conversations (open + had activity in last hour)
      const conversationsQuery = supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'open')
        .gt('last_message_at', oneHourAgo);

      if (accountId !== 'all') {
        conversationsQuery.eq('ig_account_id', accountId);
      }

      const { count: activeConversations } = await conversationsQuery;

      // Online users (active in last 5 minutes)
      const onlineQuery = supabase
        .from('conversations')
        .select('instagram_user_id')
        .eq('team_id', teamId)
        .gt('last_message_at', fiveMinutesAgo);

      if (accountId !== 'all') {
        onlineQuery.eq('ig_account_id', accountId);
      }

      const { data: onlineData } = await onlineQuery;
      const onlineUsers = new Set(onlineData?.map(c => c.instagram_user_id)).size;

      // Messages in last hour
      const messagesQuery = supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', oneHourAgo);

      if (accountId !== 'all') {
        messagesQuery.in('conversation_id', 
          supabase
            .from('conversations')
            .select('id')
            .eq('ig_account_id', accountId)
        );
      }

      const { count: messagesLastHour } = await messagesQuery;

      // Active flows
      const { count: activeFlows } = await supabase
        .from('flow_executions')
        .select('id', { count: 'exact', head: true })
        .in('status', ['queued', 'processing']);

      setMetrics({
        activeConversations: activeConversations || 0,
        onlineUsers,
        messagesLastHour: messagesLastHour || 0,
        activeFlows: activeFlows || 0,
      });
    } catch (error) {
      console.error('Failed to load realtime metrics:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity
          <Badge variant="outline" className="ml-2 animate-pulse">
            LIVE
          </Badge>
        </CardTitle>
        <CardDescription>
          Real-time platform activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <MessageSquare className="mr-2 h-4 w-4" />
              Active Chats
            </div>
            <div className="text-2xl font-bold">{metrics.activeConversations}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <Users className="mr-2 h-4 w-4" />
              Online Now
            </div>
            <div className="text-2xl font-bold">{metrics.onlineUsers}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <MessageSquare className="mr-2 h-4 w-4" />
              Messages/Hour
            </div>
            <div className="text-2xl font-bold">{metrics.messagesLastHour}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-500">
              <Zap className="mr-2 h-4 w-4" />
              Active Flows
            </div>
            <div className="text-2xl font-bold">{metrics.activeFlows}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}