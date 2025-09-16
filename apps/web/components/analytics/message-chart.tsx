import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socialinbox/ui';
import { format, eachDayOfInterval } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface MessageChartProps {
  teamId: string;
  accountId: string;
  dateRange: { startDate: Date; endDate: Date };
}

type ChartType = 'line' | 'bar' | 'area';

export function MessageChart({ teamId, accountId, dateRange }: MessageChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadChartData();
  }, [teamId, accountId, dateRange]);

  const loadChartData = async () => {
    try {
      const query = supabase
        .from('analytics_daily')
        .select('date, messages_sent, messages_received, messages_failed')
        .eq('team_id', teamId)
        .gte('date', dateRange.startDate.toISOString().split('T')[0])
        .lte('date', dateRange.endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (accountId !== 'all') {
        query.eq('ig_account_id', accountId);
      }

      const { data: analyticsData } = await query;

      // Fill in missing dates with zeros
      const allDates = eachDayOfInterval({
        start: dateRange.startDate,
        end: dateRange.endDate,
      });

      const dataMap = new Map(
        analyticsData?.map(item => [item.date, item]) || []
      );

      const chartData = allDates.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayData = dataMap.get(dateStr) || {
          messages_sent: 0,
          messages_received: 0,
          messages_failed: 0,
        };

        return {
          date: format(date, 'MMM dd'),
          sent: dayData.messages_sent,
          received: dayData.messages_received,
          failed: dayData.messages_failed,
          total: dayData.messages_sent + dayData.messages_received,
        };
      });

      setData(chartData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sent" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Sent"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="received" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Received"
                dot={false}
              />
              {data.some(d => d.failed > 0) && (
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Failed"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sent" stackId="a" fill="#3B82F6" name="Sent" />
              <Bar dataKey="received" stackId="a" fill="#10B981" name="Received" />
              {data.some(d => d.failed > 0) && (
                <Bar dataKey="failed" stackId="a" fill="#EF4444" name="Failed" />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'area':
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="sent" 
                stackId="1"
                stroke="#3B82F6" 
                fillOpacity={1}
                fill="url(#colorSent)"
                name="Sent"
              />
              <Area 
                type="monotone" 
                dataKey="received" 
                stackId="1"
                stroke="#10B981" 
                fillOpacity={1}
                fill="url(#colorReceived)"
                name="Received"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Message Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  const totalMessages = data.reduce((sum, day) => sum + day.total, 0);
  const avgMessagesPerDay = Math.round(totalMessages / data.length);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Message Volume</CardTitle>
            <CardDescription>
              Total: {totalMessages.toLocaleString()} messages • 
              Average: {avgMessagesPerDay.toLocaleString()}/day
            </CardDescription>
          </div>
          <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}