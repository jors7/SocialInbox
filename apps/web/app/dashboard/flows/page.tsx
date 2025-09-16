import Link from 'next/link';
import { createServerComponentClient } from '../../../lib/supabase/server';
import { Button } from '@socialinbox/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Plus, Workflow, Clock, CheckCircle } from 'lucide-react';

async function getFlows(supabase: any, teamId: string) {
  const { data: flows } = await supabase
    .from('flows')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  return flows || [];
}

async function getFlowTemplates(supabase: any) {
  const { data: templates } = await supabase
    .from('flow_templates')
    .select('*')
    .eq('is_public', true)
    .order('usage_count', { ascending: false })
    .limit(6);

  return templates || [];
}

export default async function FlowsPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get user's team
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user!.id)
    .single();

  const flows = await getFlows(supabase, teamMember.team_id);
  const templates = await getFlowTemplates(supabase);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flows</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage your automation flows
          </p>
        </div>
        <Link href="/dashboard/flows/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Flow
          </Button>
        </Link>
      </div>

      {flows.length === 0 ? (
        <div>
          <Card className="mb-8">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Workflow className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium">No flows yet</h3>
              <p className="mb-6 text-center text-sm text-gray-500">
                Get started by creating your first flow or using a template
              </p>
              <Link href="/dashboard/flows/new">
                <Button>Create Your First Flow</Button>
              </Link>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-4 text-lg font-semibold">Start with a template</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription className="mt-1 text-sm">
                          {template.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{template.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href={`/dashboard/flows/new?template=${template.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Use this template →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <Card key={flow.id} className="cursor-pointer transition-shadow hover:shadow-lg">
              <Link href={`/dashboard/flows/${flow.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{flow.name}</CardTitle>
                    {flow.is_active ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1 flex items-center text-sm">
                    <Clock className="mr-1 h-3 w-3" />
                    Updated {new Date(flow.updated_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {Object.keys(flow.spec.nodes).length} nodes
                    </span>
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                      Edit →
                    </span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}