'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';
import { FlowBuilder } from '../../../../components/flow-builder/flow-builder';
import { Button } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Label } from '@socialinbox/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { ArrowLeft } from 'lucide-react';
import { FlowSpec } from '@socialinbox/shared';
import { useToast } from '../../../../hooks/use-toast';

export default function NewFlowPage() {
  const [flowName, setFlowName] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');
  const supabase = createClient();
  const { toast } = useToast();
  const [initialFlow, setInitialFlow] = useState<FlowSpec | undefined>();

  useEffect(() => {
    if (templateId) {
      // Load template
      const loadTemplate = async () => {
        const { data: template } = await supabase
          .from('flow_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (template) {
          setFlowName(template.name);
          setInitialFlow(template.spec);
        }
      };

      loadTemplate();
    }
  }, [templateId, supabase]);

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

      // Create flow
      const { data: flow, error } = await supabase
        .from('flows')
        .insert({
          team_id: teamMember.team_id,
          name: flowName,
          spec: flowSpec,
          is_active: false,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Flow created successfully',
      });

      router.push(`/dashboard/flows/${flow.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create flow',
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
              <p className="text-sm text-gray-500">Create a new automation flow</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <FlowBuilder
          initialFlow={initialFlow}
          onSave={handleSave}
          onTest={handleTest}
        />
      </div>
    </div>
  );
}