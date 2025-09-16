'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ScrollArea } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { 
  Send, 
  Bot, 
  Image, 
  Paperclip,
  X,
  Play,
  FileText,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { MediaUpload } from '../../components/media/media-upload';
import type { Database } from '@socialinbox/shared';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'] & {
  metadata?: any;
};

interface RichMessageThreadProps {
  messages: Message[];
  conversation: Conversation;
  onSendMessage: (content: string, attachments?: any[]) => void;
}

export function RichMessageThread({ messages, conversation, onSendMessage }: RichMessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string } | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || sending) return;

    setSending(true);
    await onSendMessage(newMessage, attachments);
    setNewMessage('');
    setAttachments([]);
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMediaUpload = async (files: FileList) => {
    // Process files and add to attachments
    const newAttachments = Array.from(files).map(file => ({
      type: file.type.startsWith('image/') ? 'image' : 'file',
      file,
      name: file.name,
      size: file.size,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    
    setAttachments([...attachments, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    const updated = [...attachments];
    if (updated[index].preview) {
      URL.revokeObjectURL(updated[index].preview);
    }
    updated.splice(index, 1);
    setAttachments(updated);
  };

  const renderMessage = (message: Message) => {
    const isFromUser = message.is_from_user;
    
    // Check for rich content
    const hasMedia = message.metadata?.attachments && message.metadata.attachments.length > 0;
    const quickReply = message.metadata?.quick_reply;
    
    return (
      <div className="space-y-1">
        {/* Text content */}
        {message.content && (
          <div
            className={`rounded-lg px-4 py-2 ${
              isFromUser
                ? 'bg-gray-100 text-gray-900'
                : 'bg-blue-600 text-white'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
        
        {/* Media attachments */}
        {hasMedia && (
          <div className="space-y-2">
            {message.metadata.attachments.map((attachment: any, idx: number) => (
              <div key={idx} className="rounded-lg overflow-hidden">
                {attachment.type === 'image' && (
                  <img
                    src={attachment.url}
                    alt="Attachment"
                    className="max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedMedia({ url: attachment.url, type: 'image' })}
                  />
                )}
                {attachment.type === 'video' && (
                  <div className="relative group">
                    <video
                      src={attachment.url}
                      className="max-w-full"
                      controls
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:bg-black group-hover:bg-opacity-10 transition-colors">
                      <Play className="h-12 w-12 text-white drop-shadow-lg" />
                    </div>
                  </div>
                )}
                {attachment.type === 'file' && (
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      isFromUser ? 'bg-gray-50' : 'bg-blue-700'
                    } hover:opacity-90 transition-opacity`}
                  >
                    <FileText className={`h-5 w-5 ${isFromUser ? 'text-gray-600' : 'text-white'}`} />
                    <span className={`text-sm ${isFromUser ? 'text-gray-900' : 'text-white'}`}>
                      {attachment.filename || 'Document'}
                    </span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Quick reply */}
        {quickReply && (
          <Badge variant="secondary" className="text-xs">
            Quick Reply: {quickReply}
          </Badge>
        )}
        
        {/* Carousel */}
        {message.metadata?.carousel && (
          <div className="flex gap-2 overflow-x-auto py-2">
            {message.metadata.carousel.cards.map((card: any, idx: number) => (
              <div
                key={idx}
                className="flex-shrink-0 w-48 border rounded-lg overflow-hidden"
              >
                {card.image_url && (
                  <img
                    src={card.image_url}
                    alt={card.title}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-3">
                  <h4 className="font-medium text-sm">{card.title}</h4>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                  )}
                  {card.buttons && (
                    <div className="mt-2 space-y-1">
                      {card.buttons.map((button: any, btnIdx: number) => (
                        <Button
                          key={btnIdx}
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                        >
                          {button.title}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach((message) => {
      const date = format(new Date(message.created_at), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups);
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {messageGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messageGroups.map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600">
                    {format(new Date(date), 'MMMM d, yyyy')}
                  </div>
                </div>

                {/* Messages for this date */}
                <div className="space-y-4">
                  {dateMessages.map((message, index) => {
                    const isFromUser = message.is_from_user;
                    const isLastMessage = index === messages.length - 1;

                    return (
                      <div
                        key={message.id}
                        ref={isLastMessage ? lastMessageRef : null}
                        className={`flex ${isFromUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`flex gap-3 max-w-[70%] ${isFromUser ? '' : 'flex-row-reverse'}`}>
                          {isFromUser && (
                            <Avatar className="flex-shrink-0">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.instagram_username}`} />
                              <AvatarFallback>{conversation.instagram_username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div className="space-y-1">
                            {renderMessage(message)}
                            
                            <div className={`flex items-center gap-2 text-xs text-gray-500 ${isFromUser ? '' : 'justify-end'}`}>
                              <span>{format(new Date(message.created_at), 'h:mm a')}</span>
                              {message.flow_id && (
                                <span className="flex items-center gap-1">
                                  <Bot className="h-3 w-3" />
                                  Automated
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t bg-white">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="p-3 border-b">
            <div className="flex gap-2 overflow-x-auto">
              {attachments.map((attachment, index) => (
                <div key={index} className="relative flex-shrink-0">
                  {attachment.type === 'image' && attachment.preview ? (
                    <div className="relative">
                      <img
                        src={attachment.preview}
                        alt={attachment.name}
                        className="h-20 w-20 object-cover rounded"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative flex items-center gap-2 bg-gray-100 px-3 py-2 rounded">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{attachment.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4">
          {conversation.status === 'closed' ? (
            <div className="text-center py-2 text-sm text-gray-500">
              This conversation is closed
            </div>
          ) : conversation.is_bot_active ? (
            <div className="text-center py-2 text-sm text-gray-500 flex items-center justify-center gap-2">
              <Bot className="h-4 w-4" />
              Bot is handling this conversation
            </div>
          ) : (
            <div className="flex gap-2">
              <MediaUpload onUpload={handleMediaUpload} multiple>
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </MediaUpload>
              
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                disabled={sending}
                className="flex-1"
              />
              
              <Button onClick={handleSend} disabled={sending || (!newMessage.trim() && attachments.length === 0)}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Media Preview Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <img
            src={selectedMedia.url}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20"
            onClick={() => setSelectedMedia(null)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}
    </>
  );
}