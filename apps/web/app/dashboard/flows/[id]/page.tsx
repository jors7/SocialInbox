'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';
import { FlowBuilder } from '../../../../components/flow-builder/flow-builder';
import { Button } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Switch } from '@socialinbox/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { ArrowLeft, Play, Pause } from 'lucide-react';
import { FlowSpec, Flow } from '@socialinbox/shared';
import { useToast } from '../../../../hooks/use-toast';

export default function EditFlowPage({ params }: { params: { id: string } }) {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [flowName, setFlowName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    const loadFlow = async () => {
      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error || !data) {
        toast({
          title: 'Error',
          description: 'Flow not found',
          variant: 'destructive',
        });
        router.push('/dashboard/flows');
        return;
      }

      setFlow(data);
      setFlowName(data.name);
      setIsActive(data.is_active);
      setLoading(false);
    };

    loadFlow();
  }, [params.id, supabase, router, toast]);

  const handleSave = async (flowSpec: FlowSpec) => {
    if (!flowName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a flow name',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('flows')
        .update({
          name: flowName,
          spec: flowSpec,
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Flow updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update flow',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = (flowSpec: FlowSpec) => {
    // TODO: Implement flow testing
    console.log('Testing flow:', flowSpec);
    toast({
      title: 'Test Started',
      description: 'Flow test has been initiated',
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this flow?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('flows')
        .delete()
        .eq('id', params.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Flow deleted successfully',
      });

      router.push('/dashboard/flows');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete flow',
        variant: 'destructive',
      });
    }
  };

  if (loading || !flow) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-white">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard/flows')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-1">
              <Input
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="Enter flow name..."
                className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0"
              />
              <p className="text-sm text-gray-500">
                Last updated: {new Date(flow.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <label htmlFor="active" className="text-sm font-medium">
                {isActive ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Play className="h-3 w-3" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500">
                    <Pause className="h-3 w-3" /> Inactive
                  </span>
                )}
              </label>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete Flow
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <FlowBuilder
          initialFlow={flow.spec}
          onSave={handleSave}
          onTest={handleTest}
        />
      </div>
    </div>
  );
}