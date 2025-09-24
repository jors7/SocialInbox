'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Label } from '@socialinbox/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@socialinbox/ui';
import { 
  ArrowLeft, 
  Save, 
  Trash2,
  Eye,
  MessageSquare,
  Image,
  Video,
  Layers,
  Zap
} from 'lucide-react';
import { createClient } from '../../../../lib/supabase/client';
import { TemplateBuilder } from '../../../../components/templates/template-builder';
import { TemplatePreview } from '../../../../components/templates/template-preview';
import { MediaSelector } from '../../../../components/media/media-selector';
import { useToast } from '../../../../hooks/use-toast';
import type { Database } from '@socialinbox/shared';

type MessageTemplate = Database['public']['Tables']['message_templates']['Row'];

const contentTypeIcons: Record<string, React.ElementType> = {
  text: MessageSquare,
  image: Image,
  video: Video,
  carousel: Layers,
  quick_reply: Zap,
};

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [template, setTemplate] = useState<MessageTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadTemplate();
  }, [params.id]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setTemplate(data);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template',
      });
      router.push('/dashboard/templates');
    } finally {
      setLoading(false);
    }
  };

  const extractVariables = (content: any): string[] => {
    const variables = new Set<string>();
    
    const extractFromText = (text: string) => {
      const regex = /\{\{(\w+)\}\}/g;
      const matches = text.matchAll(regex);
      for (const match of matches) {
        variables.add(match[1]);
      }
    };

    // Extract from different content types
    switch (template?.content_type) {
      case 'text':
      case 'quick_reply':
        if (content.text) extractFromText(content.text);
        break;
      case 'image':
      case 'video':
        if (content.caption) extractFromText(content.caption);
        break;
      case 'carousel':
        content.cards?.forEach((card: any) => {
          if (card.title) extractFromText(card.title);
          if (card.subtitle) extractFromText(card.subtitle);
        });
        break;
    }

    return Array.from(variables);
  };

  const handleSave = async () => {
    if (!template) return;
    
    setSaving(true);
    try {
      const variables = extractVariables(template.content);
      
      const { error } = await supabase
        .from('message_templates')
        .update({
          name: template.name,
          content_type: template.content_type,
          content: template.content,
          variables,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Template updated successfully',
      });
      router.push('/dashboard/templates');
    } catch (error) {
      console.error('Failed to update template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!template || !window.confirm('Are you sure you want to delete this template?')) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
      router.push('/dashboard/templates');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Template not found</p>
      </div>
    );
  }

  const Icon = contentTypeIcons[template.content_type] || MessageSquare;

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/templates')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Templates
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Icon className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Edit Template</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {template.content_type.replace('_', ' ')}
                </Badge>
                {template.variables && template.variables.length > 0 && (
                  <Badge variant="secondary">
                    {template.variables.length} variables
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="builder">Template Builder</TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template Settings */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Template Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={template.name}
                      onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                      placeholder="Enter template name"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Content Type</Label>
                    <Select 
                      value={template.content_type} 
                      disabled
                    >
                      <SelectTrigger id="type" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Message</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                        <SelectItem value="quick_reply">Quick Reply</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-2">
                      Content type cannot be changed
                    </p>
                  </div>

                  {template.variables && template.variables.length > 0 && (
                    <div>
                      <Label>Variables Used</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Template Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Template Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <TemplateBuilder
                    contentType={template.content_type}
                    content={template.content}
                    onChange={(content) => setTemplate({ ...template, content })}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <TemplatePreview
            contentType={template.content_type}
            content={template.content}
            variables={template.variables || []}
          />
        </TabsContent>
      </Tabs>

      {/* Media Selector */}
      <MediaSelector
        open={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={(media) => {
          // Handle media selection if needed
          setShowMediaSelector(false);
        }}
        mediaType={template.content_type === 'image' ? 'image' : template.content_type === 'video' ? 'video' : 'all'}
      />
    </div>
  );
}