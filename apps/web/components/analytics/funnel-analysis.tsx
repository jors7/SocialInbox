import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Progress } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { 
  TrendingDown, 
  Filter,
  Plus,
  ChevronRight,
  Users
} from 'lucide-react';

interface FunnelAnalysisProps {
  teamId: string;
  accountId: string;
  dateRange: { startDate: Date; endDate: Date };
}

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropOff: number;
}

interface Funnel {
  id: string;
  name: string;
  flowId?: string;
  flowName?: string;
  steps: FunnelStep[];
  totalEntered: number;
  totalCompleted: number;
  conversionRate: number;
}

export function FunnelAnalysis({ teamId, accountId, dateRange }: FunnelAnalysisProps) {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadFunnels();
  }, [teamId, accountId, dateRange]);

  const loadFunnels = async () => {
    try {
      // Get funnel data
      const funnelQuery = supabase
        .from('funnel_analytics')
        .select(`
          *,
          flows (
            id,
            name
          )
        `)
        .eq('team_id', teamId)
        .gte('date', dateRange.startDate.toISOString().split('T')[0])
        .lte('date', dateRange.endDate.toISOString().split('T')[0]);

      const { data: funnelData } = await funnelQuery;

      if (!funnelData || funnelData.length === 0) {
        // If no funnel data exists, create from flow executions
        await generateFunnelsFromFlows();
        return;
      }

      // Group by funnel name and aggregate
      const funnelMap = new Map<string, Funnel>();
      
      funnelData.forEach(item => {
        if (!funnelMap.has(item.funnel_name)) {
          funnelMap.set(item.funnel_name, {
            id: item.id,
            name: item.funnel_name,
            flowId: item.flow_id,
            flowName: item.flows?.name,
            steps: [],
            totalEntered: 0,
            totalCompleted: 0,
            conversionRate: 0,
          });
        }

        const funnel = funnelMap.get(item.funnel_name)!;
        funnel.totalEntered += item.total_entered;
        funnel.totalCompleted += item.total_completed;
        
        // Merge steps
        if (item.steps && Array.isArray(item.steps)) {
          if (funnel.steps.length === 0) {
            funnel.steps = item.steps.map((step: any) => ({
              name: step.name,
              count: step.count,
              percentage: 100,
              dropOff: 0,
            }));
          } else {
            // Aggregate step counts
            item.steps.forEach((step: any, index: number) => {
              if (funnel.steps[index]) {
                funnel.steps[index].count += step.count;
              }
            });
          }
        }
      });

      // Calculate percentages and drop-offs
      funnelMap.forEach(funnel => {
        if (funnel.steps.length > 0 && funnel.totalEntered > 0) {
          funnel.steps.forEach((step, index) => {
            step.percentage = (step.count / funnel.totalEntered) * 100;
            
            if (index > 0) {
              const prevCount = funnel.steps[index - 1].count;
              step.dropOff = prevCount > 0 
                ? ((prevCount - step.count) / prevCount) * 100 
                : 0;
            }
          });
          
          funnel.conversionRate = (funnel.totalCompleted / funnel.totalEntered) * 100;
        }
      });

      setFunnels(Array.from(funnelMap.values()));
      if (funnelMap.size > 0 && !selectedFunnel) {
        setSelectedFunnel(Array.from(funnelMap.keys())[0]);
      }
    } catch (error) {
      console.error('Failed to load funnels:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateFunnelsFromFlows = async () => {
    try {
      // Get flow executions
      const executionsQuery = supabase
        .from('flow_executions')
        .select(`
          *,
          flows (
            id,
            name,
            nodes
          ),
          conversations (
            ig_account_id
          )
        `)
        .gte('created_at', dateRange.startDate.toISOString())
        .lte('created_at', dateRange.endDate.toISOString());

      if (accountId !== 'all') {
        executionsQuery.eq('conversations.ig_account_id', accountId);
      }

      const { data: executions } = await executionsQuery;

      if (!executions || executions.length === 0) {
        setLoading(false);
        return;
      }

      // Group by flow and generate funnel data
      const flowMap = new Map<string, any[]>();
      
      executions.forEach(exec => {
        if (exec.flows) {
          if (!flowMap.has(exec.flow_id)) {
            flowMap.set(exec.flow_id, []);
          }
          flowMap.get(exec.flow_id)!.push(exec);
        }
      });

      const generatedFunnels: Funnel[] = [];

      flowMap.forEach((flowExecutions, flowId) => {
        const flow = flowExecutions[0].flows;
        const nodes = flow.nodes || [];
        
        // Find key nodes for funnel
        const startNode = nodes.find((n: any) => n.type === 'start');
        const endNode = nodes.find((n: any) => n.type === 'end');
        const inputNodes = nodes.filter((n: any) => n.type === 'collectInput');
        
        // Build funnel steps
        const steps: FunnelStep[] = [
          {
            name: 'Started',
            count: flowExecutions.length,
            percentage: 100,
            dropOff: 0,
          }
        ];

        // Add intermediate steps
        inputNodes.forEach((node: any) => {
          const completedThisStep = flowExecutions.filter(exec => 
            exec.execution_data?.node_results?.[node.id]
          ).length;
          
          steps.push({
            name: node.data?.label || `Step ${steps.length}`,
            count: completedThisStep,
            percentage: 0,
            dropOff: 0,
          });
        });

        // Add completion step
        const completed = flowExecutions.filter(exec => 
          exec.status === 'completed'
        ).length;
        
        steps.push({
          name: 'Completed',
          count: completed,
          percentage: 0,
          dropOff: 0,
        });

        // Calculate percentages
        steps.forEach((step, index) => {
          step.percentage = (step.count / flowExecutions.length) * 100;
          
          if (index > 0) {
            const prevCount = steps[index - 1].count;
            step.dropOff = prevCount > 0 
              ? ((prevCount - step.count) / prevCount) * 100 
              : 0;
          }
        });

        generatedFunnels.push({
          id: flowId,
          name: `${flow.name} Funnel`,
          flowId: flowId,
          flowName: flow.name,
          steps,
          totalEntered: flowExecutions.length,
          totalCompleted: completed,
          conversionRate: (completed / flowExecutions.length) * 100,
        });
      });

      setFunnels(generatedFunnels);
      if (generatedFunnels.length > 0) {
        setSelectedFunnel(generatedFunnels[0].name);
      }
    } catch (error) {
      console.error('Failed to generate funnels:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentFunnel = funnels.find(f => f.name === selectedFunnel);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnel Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (funnels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funnel Analysis</CardTitle>
          <CardDescription>
            Visualize user journey and identify drop-off points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No funnel data available</h3>
            <p className="text-gray-500 mb-6">
              Create flows with multiple steps to see funnel analytics
            </p>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Create Flow
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Funnel Analysis</CardTitle>
              <CardDescription>
                Conversion rates and drop-off points in user journeys
              </CardDescription>
            </div>
            {funnels.length > 1 && (
              <select
                value={selectedFunnel}
                onChange={(e) => setSelectedFunnel(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {funnels.map(funnel => (
                  <option key={funnel.id} value={funnel.name}>
                    {funnel.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentFunnel && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{currentFunnel.totalEntered}</p>
                  <p className="text-sm text-gray-500">Total Entered</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{currentFunnel.totalCompleted}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{currentFunnel.conversionRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">Conversion Rate</p>
                </div>
              </div>

              {/* Funnel Visualization */}
              <div className="space-y-4">
                {currentFunnel.steps.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{step.name}</span>
                            <Badge variant="outline">
                              <Users className="mr-1 h-3 w-3" />
                              {step.count}
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {step.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress value={step.percentage} className="h-8" />
                      </div>
                      {index < currentFunnel.steps.length - 1 && (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    {step.dropOff > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                        <TrendingDown className="h-4 w-4" />
                        <span>{step.dropOff.toFixed(1)}% drop-off</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Insights */}
              {currentFunnel.steps.length > 2 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {(() => {
                        const biggestDropOff = currentFunnel.steps
                          .map((step, index) => ({ step, index, dropOff: step.dropOff }))
                          .sort((a, b) => b.dropOff - a.dropOff)[0];
                        
                        return (
                          <>
                            {biggestDropOff && biggestDropOff.dropOff > 10 && (
                              <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>
                                  Biggest drop-off ({biggestDropOff.dropOff.toFixed(1)}%) occurs at{' '}
                                  <strong>{biggestDropOff.step.name}</strong>. Consider optimizing this step.
                                </span>
                              </li>
                            )}
                            {currentFunnel.conversionRate < 20 && (
                              <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>
                                  Low overall conversion rate. Review the flow complexity and user experience.
                                </span>
                              </li>
                            )}
                            {currentFunnel.conversionRate > 60 && (
                              <li className="flex items-start">
                                <span className="text-blue-600 mr-2">•</span>
                                <span>
                                  Excellent conversion rate! This flow is performing well.
                                </span>
                              </li>
                            )}
                          </>
                        );
                      })()}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}