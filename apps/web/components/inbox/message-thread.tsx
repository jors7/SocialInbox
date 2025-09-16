'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ScrollArea } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Button } from '@socialinbox/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@socialinbox/ui';
import { Send, Bot } from 'lucide-react';
import type { Database } from '@socialinbox/shared';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface MessageThreadProps {
  messages: Message[];
  conversation: Conversation;
  onSendMessage: (content: string) => void;
}

export function MessageThread({ messages, conversation, onSendMessage }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    await onSendMessage(newMessage);
    setNewMessage('');
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isFromUser
                                  ? 'bg-gray-100 text-gray-900'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            
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
      <div className="p-4 border-t bg-white">
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
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}