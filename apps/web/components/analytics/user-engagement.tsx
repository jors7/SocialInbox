import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@socialinbox/ui';
import { 
  Users, 
  MessageSquare, 
  Clock, 
  Star,
  TrendingUp,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface UserEngagementProps {
  teamId: string;
  accountId: string;
  dateRange: { startDate: Date; endDate: Date };
}

interface TopUser {
  instagram_user_id: string;
  instagram_username?: string;
  total_messages: number;
  conversations: number;
  engagement_score: number;
  last_interaction: string;
}

export function UserEngagement({ teamId, accountId, dateRange }: UserEngagementProps) {
  const [userStats, setUserStats] = useState({
    newUsers: 0,
    returningUsers: 0,
    avgEngagementScore: 0,
    avgResponseRate: 0,
  });
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [segmentData, setSegmentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadUserEngagement();
  }, [teamId, accountId, dateRange]);

  const loadUserEngagement = async () => {
    try {
      // Load user engagement data
      const engagementQuery = supabase
        .from('user_engagement')
        .select('*')
        .eq('team_id', teamId)
        .gte('last_interaction_at', dateRange.startDate.toISOString())
        .lte('last_interaction_at', dateRange.endDate.toISOString());

      if (accountId !== 'all') {
        engagementQuery.eq('ig_account_id', accountId);
      }

      const { data: engagementData } = await engagementQuery;

      if (!engagementData || engagementData.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate user stats
      const newUsers = engagementData.filter(
        u => new Date(u.first_interaction_at) >= dateRange.startDate
      ).length;
      
      const returningUsers = engagementData.length - newUsers;
      
      const avgEngagementScore = engagementData.reduce((sum, u) => sum + (u.engagement_score || 0), 0) / engagementData.length;
      const avgResponseRate = engagementData.reduce((sum, u) => sum + (u.response_rate || 0), 0) / engagementData.length;

      setUserStats({
        newUsers,
        returningUsers,
        avgEngagementScore,
        avgResponseRate,
      });

      // Get top engaged users
      const sortedUsers = engagementData
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, 10)
        .map(user => ({
          instagram_user_id: user.instagram_user_id,
          instagram_username: user.instagram_username,
          total_messages: user.total_messages_sent + user.total_messages_received,
          conversations: user.total_conversations,
          engagement_score: user.engagement_score,
          last_interaction: user.last_interaction_at,
        }));

      setTopUsers(sortedUsers);

      // Calculate segment data
      const segments = [
        {
          name: 'Highly Engaged',
          value: engagementData.filter(u => u.engagement_score >= 80).length,
          color: '#10B981',
        },
        {
          name: 'Moderately Engaged',
          value: engagementData.filter(u => u.engagement_score >= 50 && u.engagement_score < 80).length,
          color: '#3B82F6',
        },
        {
          name: 'Low Engagement',
          value: engagementData.filter(u => u.engagement_score < 50).length,
          color: '#F59E0B',
        },
      ];

      setSegmentData(segments.filter(s => s.value > 0));

    } catch (error) {
      console.error('Failed to load user engagement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const getEngagementBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, label: 'High' };
    if (score >= 50) return { variant: 'secondary' as const, label: 'Medium' };
    return { variant: 'outline' as const, label: 'Low' };
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.newUsers}</div>
            <p className="text-xs text-muted-foreground">
              First interaction in period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.returningUsers}</div>
            <p className="text-xs text-muted-foreground">
              Continued conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.avgEngagementScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.avgResponseRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average across users
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* User Segments */}
        <Card>
          <CardHeader>
            <CardTitle>User Segments</CardTitle>
            <CardDescription>
              Distribution by engagement level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {segmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px]">
                <p className="text-gray-500">No user data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Engaged Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top Engaged Users</CardTitle>
            <CardDescription>
              Most active users by engagement score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.slice(0, 5).map((user) => (
                <div key={user.instagram_user_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.instagram_username || user.instagram_user_id}`} />
                      <AvatarFallback>{(user.instagram_username || 'U')[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {user.instagram_username || `User ${user.instagram_user_id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.total_messages} messages • {user.conversations} conversations
                      </p>
                    </div>
                  </div>
                  <Badge {...getEngagementBadge(user.engagement_score)}>
                    {user.engagement_score.toFixed(0)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed User Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Comprehensive engagement metrics for all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium p-2">User</th>
                  <th className="text-center font-medium p-2">Messages</th>
                  <th className="text-center font-medium p-2">Conversations</th>
                  <th className="text-center font-medium p-2">Score</th>
                  <th className="text-right font-medium p-2">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((user) => (
                  <tr key={user.instagram_user_id} className="border-b">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.instagram_username || user.instagram_user_id}`} />
                          <AvatarFallback>{(user.instagram_username || 'U')[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {user.instagram_username || `User ${user.instagram_user_id.slice(0, 8)}`}
                        </span>
                      </div>
                    </td>
                    <td className="text-center p-2">{user.total_messages}</td>
                    <td className="text-center p-2">{user.conversations}</td>
                    <td className="text-center p-2">
                      <span className={`font-medium ${getEngagementColor(user.engagement_score)}`}>
                        {user.engagement_score.toFixed(0)}
                      </span>
                    </td>
                    <td className="text-right p-2 text-gray-500">
                      {formatDistanceToNow(new Date(user.last_interaction), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}