import { useState } from 'react';
import { Input } from '@socialinbox/ui';
import { Label } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Textarea } from '@socialinbox/ui';
import { Card } from '@socialinbox/ui';
import { 
  Plus, 
  X, 
  Image,
  Video,
  Upload,
  Link
} from 'lucide-react';
import { MediaUpload } from '../../components/media/media-upload';
import { MediaSelector } from '../../components/media/media-selector';

interface TemplateBuilderProps {
  contentType: string;
  content: any;
  onChange: (content: any) => void;
}

export function TemplateBuilder({ contentType, content, onChange }: TemplateBuilderProps) {
  const [showMediaSelector, setShowMediaSelector] = useState(false);

  const handleTextChange = (text: string) => {
    onChange({ ...content, text });
  };

  const handleMediaSelect = (media: any) => {
    switch (contentType) {
      case 'image':
        onChange({ ...content, url: media.public_url, mediaId: media.id });
        break;
      case 'video':
        onChange({ ...content, url: media.public_url, mediaId: media.id });
        break;
    }
    setShowMediaSelector(false);
  };

  const addCarouselCard = () => {
    const cards = content.cards || [];
    const newCard = {
      id: Date.now().toString(),
      title: '',
      subtitle: '',
      image_url: '',
      buttons: [],
    };
    onChange({ ...content, cards: [...cards, newCard] });
  };

  const updateCarouselCard = (index: number, updates: any) => {
    const cards = [...(content.cards || [])];
    cards[index] = { ...cards[index], ...updates };
    onChange({ ...content, cards });
  };

  const removeCarouselCard = (index: number) => {
    const cards = [...(content.cards || [])];
    cards.splice(index, 1);
    onChange({ ...content, cards });
  };

  const addCardButton = (cardIndex: number) => {
    const cards = [...(content.cards || [])];
    const buttons = cards[cardIndex].buttons || [];
    buttons.push({
      id: Date.now().toString(),
      title: '',
      type: 'postback',
      payload: '',
    });
    cards[cardIndex].buttons = buttons;
    onChange({ ...content, cards });
  };

  const updateCardButton = (cardIndex: number, buttonIndex: number, updates: any) => {
    const cards = [...(content.cards || [])];
    cards[cardIndex].buttons[buttonIndex] = {
      ...cards[cardIndex].buttons[buttonIndex],
      ...updates,
    };
    onChange({ ...content, cards });
  };

  const removeCardButton = (cardIndex: number, buttonIndex: number) => {
    const cards = [...(content.cards || [])];
    cards[cardIndex].buttons.splice(buttonIndex, 1);
    onChange({ ...content, cards });
  };

  const addQuickReply = () => {
    const quickReplies = content.quick_replies || [];
    quickReplies.push({
      id: Date.now().toString(),
      title: '',
      payload: '',
    });
    onChange({ ...content, quick_replies: quickReplies });
  };

  const updateQuickReply = (index: number, updates: any) => {
    const quickReplies = [...(content.quick_replies || [])];
    quickReplies[index] = { ...quickReplies[index], ...updates };
    onChange({ ...content, quick_replies: quickReplies });
  };

  const removeQuickReply = (index: number) => {
    const quickReplies = [...(content.quick_replies || [])];
    quickReplies.splice(index, 1);
    onChange({ ...content, quick_replies: quickReplies });
  };

  switch (contentType) {
    case 'text':
      return (
        <div>
          <Label htmlFor="message">Message Text</Label>
          <Textarea
            id="message"
            value={content.text || ''}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Enter your message here. Use {{variable}} for dynamic content."
            rows={5}
            className="mt-2"
          />
          <p className="text-sm text-gray-500 mt-2">
            Tip: Use variables like {`{{first_name}}`} to personalize your message
          </p>
        </div>
      );

    case 'image':
      return (
        <div className="space-y-4">
          <div>
            <Label>Image</Label>
            {content.url ? (
              <div className="mt-2 relative">
                <img
                  src={content.url}
                  alt="Selected"
                  className="w-full max-h-64 object-contain rounded-lg bg-gray-100"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => onChange({ ...content, url: '', mediaId: null })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="mt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMediaSelector(true)}
                  className="w-full"
                >
                  <Image className="mr-2 h-4 w-4" />
                  Select Image
                </Button>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="caption">Caption (Optional)</Label>
            <Textarea
              id="caption"
              value={content.caption || ''}
              onChange={(e) => onChange({ ...content, caption: e.target.value })}
              placeholder="Add a caption to your image..."
              rows={3}
              className="mt-2"
            />
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="space-y-4">
          <div>
            <Label>Video</Label>
            {content.url ? (
              <div className="mt-2 relative">
                <video
                  src={content.url}
                  controls
                  className="w-full max-h-64 rounded-lg bg-black"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => onChange({ ...content, url: '', mediaId: null })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="mt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMediaSelector(true)}
                  className="w-full"
                >
                  <Video className="mr-2 h-4 w-4" />
                  Select Video
                </Button>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="caption">Caption (Optional)</Label>
            <Textarea
              id="caption"
              value={content.caption || ''}
              onChange={(e) => onChange({ ...content, caption: e.target.value })}
              placeholder="Add a caption to your video..."
              rows={3}
              className="mt-2"
            />
          </div>
        </div>
      );

    case 'carousel':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Carousel Cards</Label>
            <Button
              size="sm"
              onClick={addCarouselCard}
              disabled={(content.cards?.length || 0) >= 10}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </div>

          {content.cards?.length === 0 || !content.cards ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No cards yet. Add your first carousel card.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {content.cards.map((card: any, cardIndex: number) => (
                <Card key={card.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium">Card {cardIndex + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCarouselCard(cardIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={card.title}
                        onChange={(e) => updateCarouselCard(cardIndex, { title: e.target.value })}
                        placeholder="Card title"
                      />
                    </div>

                    <div>
                      <Label>Subtitle</Label>
                      <Input
                        value={card.subtitle}
                        onChange={(e) => updateCarouselCard(cardIndex, { subtitle: e.target.value })}
                        placeholder="Card subtitle"
                      />
                    </div>

                    <div>
                      <Label>Image URL</Label>
                      <Input
                        value={card.image_url}
                        onChange={(e) => updateCarouselCard(cardIndex, { image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Buttons</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addCardButton(cardIndex)}
                          disabled={(card.buttons?.length || 0) >= 3}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add Button
                        </Button>
                      </div>

                      {card.buttons?.map((button: any, buttonIndex: number) => (
                        <div key={button.id} className="flex gap-2 mt-2">
                          <Input
                            value={button.title}
                            onChange={(e) => updateCardButton(cardIndex, buttonIndex, { title: e.target.value })}
                            placeholder="Button text"
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCardButton(cardIndex, buttonIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      );

    case 'quick_reply':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="quickMessage">Message Text</Label>
            <Textarea
              id="quickMessage"
              value={content.text || ''}
              onChange={(e) => onChange({ ...content, text: e.target.value })}
              placeholder="Enter your message here..."
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Quick Replies</Label>
              <Button
                size="sm"
                onClick={addQuickReply}
                disabled={(content.quick_replies?.length || 0) >= 13}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Reply
              </Button>
            </div>

            {content.quick_replies?.length === 0 || !content.quick_replies ? (
              <Card className="p-4 text-center">
                <p className="text-sm text-gray-500">No quick replies yet.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {content.quick_replies.map((reply: any, index: number) => (
                  <div key={reply.id} className="flex gap-2">
                    <Input
                      value={reply.title}
                      onChange={(e) => updateQuickReply(index, { title: e.target.value })}
                      placeholder="Reply option"
                      className="flex-1"
                      maxLength={20}
                    />
                    <Input
                      value={reply.payload}
                      onChange={(e) => updateQuickReply(index, { payload: e.target.value })}
                      placeholder="Payload (hidden)"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuickReply(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Quick replies provide predefined response options for users
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
}