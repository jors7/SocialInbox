import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Progress } from '@socialinbox/ui';
import { 
  Workflow, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatDuration } from 'date-fns';

interface FlowPerformanceProps {
  teamId: string;
  accountId: string;
  dateRange: { startDate: Date; endDate: Date };
}

interface FlowStats {
  id: string;
  name: string;
  executions: number;
  successRate: number;
  avgDuration: number;
  dropOffRate: number;
  trend: number;
}

export function FlowPerformance({ teamId, accountId, dateRange }: FlowPerformanceProps) {
  const [flows, setFlows] = useState<FlowStats[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadFlowPerformance();
  }, [teamId, accountId, dateRange]);

  const loadFlowPerformance = async () => {
    try {
      // Get all flows for the team
      const flowsQuery = supabase
        .from('flows')
        .select('id, name')
        .eq('team_id', teamId);

      if (accountId !== 'all') {
        // Filter by flows that have executions for this account
        flowsQuery.in('id', 
          supabase
            .from('flow_executions')
            .select('flow_id')
            .in('conversation_id',
              supabase
                .from('conversations')
                .select('id')
                .eq('ig_account_id', accountId)
            )
        );
      }

      const { data: flowsData } = await flowsQuery;

      if (!flowsData || flowsData.length === 0) {
        setFlows([]);
        setLoading(false);
        return;
      }

      // Get analytics for each flow
      const flowStats = await Promise.all(
        flowsData.map(async (flow) => {
          // Get executions for date range
          const executionsQuery = supabase
            .from('flow_executions')
            .select('*')
            .eq('flow_id', flow.id)
            .gte('created_at', dateRange.startDate.toISOString())
            .lte('created_at', dateRange.endDate.toISOString());

          const { data: executions } = await executionsQuery;

          if (!executions || executions.length === 0) {
            return null;
          }

          // Calculate stats
          const total = executions.length;
          const successful = executions.filter(e => e.status === 'completed').length;
          const failed = executions.filter(e => e.status === 'failed').length;
          const successRate = (successful / total) * 100;

          // Calculate average duration for completed executions
          const completedWithDuration = executions.filter(
            e => e.status === 'completed' && e.started_at && e.completed_at
          );
          
          const avgDuration = completedWithDuration.length > 0
            ? completedWithDuration.reduce((sum, e) => {
                const duration = new Date(e.completed_at).getTime() - new Date(e.started_at).getTime();
                return sum + duration;
              }, 0) / completedWithDuration.length / 1000 // Convert to seconds
            : 0;

          // Get node drop-off data
          const nodeData = executions
            .filter(e => e.execution_data?.node_results)
            .map(e => Object.keys(e.execution_data.node_results).length);
          
          const avgNodesExecuted = nodeData.length > 0
            ? nodeData.reduce((a, b) => a + b, 0) / nodeData.length
            : 0;

          // Calculate trend (compare with previous period)
          const midPoint = new Date(
            dateRange.startDate.getTime() + 
            (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / 2
          );
          
          const firstHalf = executions.filter(e => new Date(e.created_at) < midPoint).length;
          const secondHalf = executions.filter(e => new Date(e.created_at) >= midPoint).length;
          const trend = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

          return {
            id: flow.id,
            name: flow.name,
            executions: total,
            successRate,
            avgDuration,
            dropOffRate: 100 - successRate,
            trend,
          };
        })
      );

      setFlows(flowStats.filter(Boolean) as FlowStats[]);
    } catch (error) {
      console.error('Failed to load flow performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flow Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (flows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Flow Performance</CardTitle>
          <CardDescription>
            Track how your automation flows are performing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Workflow className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No flow executions in this period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Flow Performance</CardTitle>
          <CardDescription>
            Success rates and execution metrics for your automation flows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {flows.map((flow) => (
              <div key={flow.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{flow.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{flow.executions} executions</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {flow.avgDuration < 60 
                          ? `${Math.round(flow.avgDuration)}s avg`
                          : `${Math.round(flow.avgDuration / 60)}m avg`
                        }
                      </span>
                      {flow.trend !== 0 && (
                        <>
                          <span>•</span>
                          <span className={`flex items-center gap-1 ${flow.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {flow.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(flow.trend).toFixed(0)}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant={flow.successRate >= 90 ? 'default' : flow.successRate >= 70 ? 'secondary' : 'destructive'}>
                    {flow.successRate.toFixed(1)}% success
                  </Badge>
                </div>
                <Progress value={flow.successRate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flows
                .sort((a, b) => b.successRate - a.successRate)
                .slice(0, 3)
                .map((flow, index) => (
                  <div key={flow.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        index === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">{flow.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{flow.successRate.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flows
                .filter(f => f.successRate < 80)
                .sort((a, b) => a.successRate - b.successRate)
                .slice(0, 3)
                .map((flow) => (
                  <div key={flow.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm font-medium">{flow.name}</span>
                    </div>
                    <span className="text-sm text-red-600">{flow.successRate.toFixed(1)}%</span>
                  </div>
                ))}
              {flows.filter(f => f.successRate < 80).length === 0 && (
                <p className="text-sm text-gray-500">All flows performing well!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}