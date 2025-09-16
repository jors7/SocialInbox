'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Label } from '@socialinbox/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socialinbox/ui';
import { X, Trash2, Plus, Minus } from 'lucide-react';

interface NodeToolbarProps {
  node: Node;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function NodeToolbar({ node, onUpdate, onDelete, onClose }: NodeToolbarProps) {
  const [nodeData, setNodeData] = useState(node.data);

  useEffect(() => {
    setNodeData(node.data);
  }, [node]);

  const handleChange = (field: string, value: any) => {
    const updatedData = { ...nodeData, [field]: value };
    setNodeData(updatedData);
    onUpdate(updatedData);
  };

  const addQuickReply = () => {
    const quickReplies = [...(nodeData.quickReplies || []), { text: 'New Option', go: 'end' }];
    handleChange('quickReplies', quickReplies);
  };

  const removeQuickReply = (index: number) => {
    const quickReplies = nodeData.quickReplies.filter((_: any, i: number) => i !== index);
    handleChange('quickReplies', quickReplies);
  };

  const updateQuickReply = (index: number, field: string, value: string) => {
    const quickReplies = [...nodeData.quickReplies];
    quickReplies[index] = { ...quickReplies[index], [field]: value };
    handleChange('quickReplies', quickReplies);
  };

  return (
    <div className="fixed right-4 top-20 z-50 w-80">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Edit {node.type.replace('_', ' ')}</CardTitle>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Node */}
          {node.type === 'message' && (
            <div className="space-y-2">
              <Label htmlFor="text">Message Text</Label>
              <textarea
                id="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                value={nodeData.text || ''}
                onChange={(e) => handleChange('text', e.target.value)}
                placeholder="Enter your message..."
              />
              <p className="text-xs text-gray-500">
                Use {'{{variable}}'} to insert dynamic content
              </p>
            </div>
          )}

          {/* Quick Reply Node */}
          {node.type === 'quick_reply' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="text">Message Text</Label>
                <textarea
                  id="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                  value={nodeData.text || ''}
                  onChange={(e) => handleChange('text', e.target.value)}
                  placeholder="Enter your message..."
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Quick Replies</Label>
                  <Button size="sm" variant="outline" onClick={addQuickReply}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                {nodeData.quickReplies?.map((qr: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={qr.text}
                      onChange={(e) => updateQuickReply(index, 'text', e.target.value)}
                      placeholder="Button text"
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeQuickReply(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Condition Node */}
          {node.type === 'condition' && (
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Input
                id="condition"
                value={nodeData.condition || ''}
                onChange={(e) => handleChange('condition', e.target.value)}
                placeholder="e.g., email exists"
              />
              <p className="text-xs text-gray-500">
                Format: variable operator value
              </p>
            </div>
          )}

          {/* Action Node */}
          {node.type === 'action' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="action">Action Type</Label>
                <Select
                  value={nodeData.action || ''}
                  onValueChange={(value) => handleChange('action', value)}
                >
                  <SelectTrigger id="action">
                    <SelectValue placeholder="Select an action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="capture_email">Capture Email</SelectItem>
                    <SelectItem value="add_tag">Add Tag</SelectItem>
                    <SelectItem value="remove_tag">Remove Tag</SelectItem>
                    <SelectItem value="set_variable">Set Variable</SelectItem>
                    <SelectItem value="http_request">HTTP Request</SelectItem>
                    <SelectItem value="notify_team">Notify Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {nodeData.action === 'add_tag' || nodeData.action === 'remove_tag' ? (
                <div className="space-y-2">
                  <Label htmlFor="tag">Tag Name</Label>
                  <Input
                    id="tag"
                    value={nodeData.params?.tag || ''}
                    onChange={(e) =>
                      handleChange('params', { ...nodeData.params, tag: e.target.value })
                    }
                    placeholder="Enter tag name"
                  />
                </div>
              ) : nodeData.action === 'set_variable' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="varName">Variable Name</Label>
                    <Input
                      id="varName"
                      value={nodeData.params?.name || ''}
                      onChange={(e) =>
                        handleChange('params', { ...nodeData.params, name: e.target.value })
                      }
                      placeholder="e.g., userName"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="varValue">Value</Label>
                    <Input
                      id="varValue"
                      value={nodeData.params?.value || ''}
                      onChange={(e) =>
                        handleChange('params', { ...nodeData.params, value: e.target.value })
                      }
                      placeholder="Enter value"
                    />
                  </div>
                </>
              ) : null}
            </>
          )}

          {/* Wait Node */}
          {node.type === 'wait' && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={nodeData.duration || ''}
                onChange={(e) => handleChange('duration', parseInt(e.target.value, 10))}
                placeholder="60"
              />
              <p className="text-xs text-gray-500">
                How long to wait before continuing
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}