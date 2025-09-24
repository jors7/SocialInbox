import { useState } from 'react';
import { Card } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Label } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { 
  MessageSquare, 
  Image, 
  Video, 
  ChevronLeft, 
  ChevronRight,
  Play
} from 'lucide-react';

interface TemplatePreviewProps {
  contentType: string;
  content: any;
  variables?: string[];
}

export function TemplatePreview({ contentType, content, variables = [] }: TemplatePreviewProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Default variable values for preview
  const defaultValues: Record<string, string> = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Acme Inc',
  };

  const replaceVariables = (text: string): string => {
    if (!text) return '';
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variableValues[varName] || defaultValues[varName] || match;
    });
  };

  const renderContent = () => {
    switch (contentType) {
      case 'text':
        return (
          <div className="p-4 bg-blue-600 text-white rounded-lg max-w-[80%] ml-auto">
            <p className="text-sm whitespace-pre-wrap">
              {replaceVariables(content.text || 'No message content')}
            </p>
          </div>
        );

      case 'image':
        return (
          <div className="max-w-[80%] ml-auto">
            {content.url ? (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={content.url}
                  alt="Template"
                  className="w-full object-cover"
                />
                {content.caption && (
                  <div className="p-3 bg-blue-600 text-white">
                    <p className="text-sm">{replaceVariables(content.caption)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-200 rounded-lg p-8 text-center">
                <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No image selected</p>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="max-w-[80%] ml-auto">
            {content.url ? (
              <div className="rounded-lg overflow-hidden">
                <div className="relative bg-black">
                  <video
                    src={content.url}
                    className="w-full"
                    controls
                  />
                </div>
                {content.caption && (
                  <div className="p-3 bg-blue-600 text-white">
                    <p className="text-sm">{replaceVariables(content.caption)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-200 rounded-lg p-8 text-center">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No video selected</p>
              </div>
            )}
          </div>
        );

      case 'carousel':
        const cards = content.cards || [];
        if (cards.length === 0) {
          return (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-gray-500">No carousel cards</p>
            </div>
          );
        }

        const currentCard = cards[currentCardIndex] || cards[0];
        
        return (
          <div className="max-w-[80%] ml-auto">
            <div className="border rounded-lg overflow-hidden">
              {currentCard.image_url && (
                <img
                  src={currentCard.image_url}
                  alt={currentCard.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h4 className="font-semibold">{replaceVariables(currentCard.title || '')}</h4>
                {currentCard.subtitle && (
                  <p className="text-sm text-gray-600 mt-1">
                    {replaceVariables(currentCard.subtitle)}
                  </p>
                )}
                {currentCard.buttons && currentCard.buttons.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {currentCard.buttons.map((button: any, idx: number) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        {button.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Carousel Navigation */}
              {cards.length > 1 && (
                <div className="flex items-center justify-between p-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentCardIndex(Math.max(0, currentCardIndex - 1))}
                    disabled={currentCardIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-500">
                    {currentCardIndex + 1} / {cards.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentCardIndex(Math.min(cards.length - 1, currentCardIndex + 1))}
                    disabled={currentCardIndex === cards.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'quick_reply':
        return (
          <div className="space-y-3">
            <div className="p-4 bg-blue-600 text-white rounded-lg max-w-[80%] ml-auto">
              <p className="text-sm whitespace-pre-wrap">
                {replaceVariables(content.text || 'No message content')}
              </p>
            </div>
            
            {content.quick_replies && content.quick_replies.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end">
                {content.quick_replies.map((reply: any, idx: number) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    {reply.title}
                  </Button>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Variable Input */}
      {variables.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium text-sm mb-3">Preview Variables</h4>
          <div className="space-y-2">
            {variables.map((variable) => (
              <div key={variable}>
                <Label htmlFor={`var-${variable}`} className="text-xs">
                  {variable}
                </Label>
                <Input
                  id={`var-${variable}`}
                  value={variableValues[variable] || defaultValues[variable] || ''}
                  onChange={(e) => setVariableValues({
                    ...variableValues,
                    [variable]: e.target.value,
                  })}
                  placeholder={defaultValues[variable] || `Enter ${variable}`}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Message Preview */}
      <Card className="p-4 bg-gray-50">
        <div className="max-w-md mx-auto">
          {/* Phone Frame */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-900 text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full" />
                <span className="text-sm font-medium">Business Name</span>
              </div>
              <div className="text-xs text-gray-400">Instagram</div>
            </div>

            {/* Messages */}
            <div className="p-4 min-h-[200px] bg-gray-50">
              {renderContent()}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}