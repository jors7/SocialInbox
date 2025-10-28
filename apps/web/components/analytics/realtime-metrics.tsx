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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flow_executions',
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
      // Need to join through ig_accounts to filter by team_id
      const conversationsQuery = supabase
        .from('conversations')
        .select('id, ig_accounts!inner(team_id)', { count: 'exact', head: true })
        .eq('ig_accounts.team_id', teamId)
        .eq('status', 'open')
        .gt('last_user_ts', oneHourAgo);

      if (accountId !== 'all') {
        conversationsQuery.eq('ig_account_id', accountId);
      }

      const { count: activeConversations } = await conversationsQuery;

      // Online users (active in last 5 minutes)
      const onlineQuery = supabase
        .from('conversations')
        .select('contact_id, ig_accounts!inner(team_id)')
        .eq('ig_accounts.team_id', teamId)
        .gt('last_user_ts', fiveMinutesAgo);

      if (accountId !== 'all') {
        onlineQuery.eq('ig_account_id', accountId);
      }

      const { data: onlineData } = await onlineQuery;
      const onlineUsers = new Set(onlineData?.map(c => c.contact_id)).size;

      // Messages in last hour - need to join through conversations to filter by account/team
      let messagesCount = 0;
      if (accountId !== 'all') {
        const { count } = await supabase
          .from('messages')
          .select('id, conversations!inner(ig_account_id)', { count: 'exact', head: true })
          .eq('conversations.ig_account_id', accountId)
          .gt('created_at', oneHourAgo);
        messagesCount = count || 0;
      } else {
        // Get all conversations for this team first
        const { data: teamConvos } = await supabase
          .from('conversations')
          .select('id, ig_accounts!inner(team_id)')
          .eq('ig_accounts.team_id', teamId);

        const convoIds = teamConvos?.map(c => c.id) || [];

        if (convoIds.length > 0) {
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', convoIds)
            .gt('created_at', oneHourAgo);
          messagesCount = count || 0;
        }
      }

      // Active flows - need to filter by team's conversations
      const { data: teamConvos } = await supabase
        .from('conversations')
        .select('id, ig_accounts!inner(team_id)')
        .eq('ig_accounts.team_id', teamId);

      const convoIds = teamConvos?.map(c => c.id) || [];

      let activeFlowsCount = 0;
      if (convoIds.length > 0) {
        const { count } = await supabase
          .from('flow_executions')
          .select('id', { count: 'exact', head: true })
          .in('status', ['active', 'waiting'])
          .in('conversation_id', convoIds);
        activeFlowsCount = count || 0;
      }

      setMetrics({
        activeConversations: activeConversations || 0,
        onlineUsers,
        messagesLastHour: messagesCount,
        activeFlows: activeFlowsCount,
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