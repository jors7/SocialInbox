'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@socialinbox/ui';
import { 
  Plus, 
  Search, 
  MessageSquare,
  Image,
  Grid3x3,
  Zap,
  Edit,
  Copy,
  Trash2,
  Clock,
  Filter,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../../../hooks/use-toast';
import type { Database } from '@socialinbox/shared';

type MessageTemplate = Database['public']['Tables']['message_templates']['Row'];

const categoryIcons = {
  general: MessageSquare,
  marketing: Zap,
  support: MessageSquare,
  notification: Clock,
  custom: FileText,
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery]);

  const loadTemplates = async () => {
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

      // Load templates
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('team_id', teamMember.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.variables?.some(v => v.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleDuplicate = async (template: MessageTemplate) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      const { error } = await supabase
        .from('message_templates')
        .insert({
          team_id: teamMember.team_id,
          name: `${template.name} (Copy)`,
          description: template.description,
          category: template.category,
          content_type: template.content_type,
          content: template.content,
          variables: template.variables,
          created_by: user!.id,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Template duplicated successfully',
      });

      loadTemplates();
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate template',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (template: MessageTemplate) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== template.id));
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const getPreviewText = (template: MessageTemplate): string => {
    switch (template.content_type) {
      case 'text':
        return template.content.text || '';
      case 'image':
        return template.content.caption || 'Image message';
      case 'video':
        return template.content.caption || 'Video message';
      case 'carousel':
        return `Carousel with ${template.content.cards?.length || 0} cards`;
      case 'quick_reply':
        return template.content.text || 'Quick reply message';
      default:
        return 'Message template';
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <MessageSquare className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Image className="h-4 w-4" />;
      case 'carousel':
        return <Grid3x3 className="h-4 w-4" />;
      case 'quick_reply':
        return <Zap className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const categories = [
    { value: 'all', label: 'All Templates', count: templates.length },
    { value: 'general', label: 'General', count: templates.filter(t => t.category === 'general').length },
    { value: 'marketing', label: 'Marketing', count: templates.filter(t => t.category === 'marketing').length },
    { value: 'support', label: 'Support', count: templates.filter(t => t.category === 'support').length },
    { value: 'notification', label: 'Notification', count: templates.filter(t => t.category === 'notification').length },
    { value: 'custom', label: 'Custom', count: templates.filter(t => t.category === 'custom').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create reusable message templates with variables
          </p>
        </div>
        
        <Button onClick={() => router.push('/dashboard/templates/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.reduce((sum, t) => sum + (t.usage_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Times used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Variables</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.variables && t.variables.length > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Dynamic templates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList>
                {categories.map(cat => (
                  <TabsTrigger key={cat.value} value={cat.value}>
                    {cat.label}
                    {cat.count > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1">
                        {cat.count}
                      </Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[300px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-gray-500 text-center mb-6">
              {searchQuery ? 'Try adjusting your search' : 'Create your first template to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push('/dashboard/templates/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const CategoryIcon = categoryIcons[template.category as keyof typeof categoryIcons] || MessageSquare;
            
            return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded">
                        <CategoryIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1 text-sm">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Preview */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      {getContentIcon(template.content_type)}
                      <p className="text-sm text-gray-700 flex-1 line-clamp-3">
                        {getPreviewText(template)}
                      </p>
                    </div>
                  </div>

                  {/* Variables */}
                  {template.variables && template.variables.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Variables</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Used {template.usage_count || 0} times</span>
                    <span>
                      {template.last_used_at
                        ? `Last used ${formatDistanceToNow(new Date(template.last_used_at), { addSuffix: true })}`
                        : 'Never used'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/templates/${template.id}`)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}