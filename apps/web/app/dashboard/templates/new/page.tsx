'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';
import { Button } from '@socialinbox/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Label } from '@socialinbox/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socialinbox/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Switch } from '@socialinbox/ui';
import { Textarea } from '@socialinbox/ui';
import { 
  ArrowLeft, 
  MessageSquare,
  Image,
  Video,
  Grid3x3,
  Zap,
  Plus,
  X,
  Variable,
  Eye
} from 'lucide-react';
import { useToast } from '../../../../hooks/use-toast';
import { TemplateBuilder } from '../../../../components/templates/template-builder';
import { TemplatePreview } from '../../../../components/templates/template-preview';

export default function NewTemplatePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [contentType, setContentType] = useState('text');
  const [isActive, setIsActive] = useState(true);
  const [content, setContent] = useState<any>({ text: '' });
  const [variables, setVariables] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = text.matchAll(regex);
    const vars = new Set<string>();
    
    for (const match of matches) {
      vars.add(match[1]);
    }
    
    return Array.from(vars);
  };

  const updateVariables = () => {
    let allText = '';
    
    switch (contentType) {
      case 'text':
        allText = content.text || '';
        break;
      case 'image':
      case 'video':
        allText = content.caption || '';
        break;
      case 'carousel':
        allText = content.cards?.map((c: any) => 
          `${c.title} ${c.subtitle} ${c.buttons?.map((b: any) => b.title).join(' ')}`
        ).join(' ') || '';
        break;
      case 'quick_reply':
        allText = content.text || '';
        break;
    }
    
    setVariables(extractVariables(allText));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Template name is required',
      });
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      if (!teamMember) {
        throw new Error('No team found');
      }

      const { error } = await supabase
        .from('message_templates')
        .insert({
          team_id: teamMember.team_id,
          name,
          description,
          category,
          content_type: contentType,
          content,
          variables,
          is_active: isActive,
          created_by: user!.id,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Template created successfully',
      });

      router.push('/dashboard/templates');
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create template',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/templates')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
          <p className="mt-1 text-sm text-gray-500">
            Design a reusable message template with variables
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Welcome Message"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe when to use this template..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active</Label>
                  <p className="text-sm text-gray-500">Template can be used in flows and messages</p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Message Content</CardTitle>
              <CardDescription>
                Choose the type of message and customize its content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={contentType} onValueChange={setContentType}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="text">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="image">
                    <Image className="h-4 w-4 mr-1" />
                    Image
                  </TabsTrigger>
                  <TabsTrigger value="video">
                    <Video className="h-4 w-4 mr-1" />
                    Video
                  </TabsTrigger>
                  <TabsTrigger value="carousel">
                    <Grid3x3 className="h-4 w-4 mr-1" />
                    Carousel
                  </TabsTrigger>
                  <TabsTrigger value="quick_reply">
                    <Zap className="h-4 w-4 mr-1" />
                    Quick Reply
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TemplateBuilder
                    contentType={contentType}
                    content={content}
                    onChange={(newContent) => {
                      setContent(newContent);
                      // Extract variables after content change
                      setTimeout(updateVariables, 100);
                    }}
                  />
                </div>
              </Tabs>
            </CardContent>
          </Card>

          {/* Variables */}
          {variables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Variable className="h-5 w-5" />
                  Detected Variables
                </CardTitle>
                <CardDescription>
                  These variables will be replaced with actual values when the template is used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {variables.map((variable) => (
                    <Badge key={variable} variant="secondary">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Common variables: first_name, last_name, email, phone, company
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Preview</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </div>
            </CardHeader>
            {showPreview && (
              <CardContent>
                <TemplatePreview
                  contentType={contentType}
                  content={content}
                  variables={variables}
                />
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div>
                <p className="font-medium mb-1">Using Variables</p>
                <p>Add variables using double curly braces: {`{{variable_name}}`}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Best Practices</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Keep messages concise and clear</li>
                  <li>Use personalization to increase engagement</li>
                  <li>Test templates before using in campaigns</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/dashboard/templates')}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}