import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { Bot, MessageSquare } from 'lucide-react';
import type { Database } from '@socialinbox/shared';

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  ig_accounts?: {
    id: string;
    username: string;
  };
  last_message?: {
    id: string;
    content: string;
    is_from_user: boolean;
    created_at: string;
  } | null;
};

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No conversations</h3>
        <p className="text-sm text-gray-500 mt-2">Messages from Instagram will appear here</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        const isSelected = selectedConversation?.id === conversation.id;
        const hasUnread = false; // TODO: Add unread tracking

        return (
          <div
            key={conversation.id}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50 hover:bg-blue-50' : ''
            }`}
            onClick={() => onSelectConversation(conversation)}
          >
            <div className="flex items-start gap-3">
              <Avatar className="flex-shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.instagram_username}`} />
                <AvatarFallback>{conversation.instagram_username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`text-sm font-medium truncate ${hasUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                    {conversation.instagram_username}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {conversation.last_message?.created_at ? formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true }) : 'No messages'}
                  </span>
                </div>
                
                {conversation.last_message && (
                  <p className={`text-sm truncate ${hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {conversation.last_message.is_from_user ? '' : 'You: '}
                    {conversation.last_message.content}
                  </p>
                )}
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    @{conversation.ig_accounts?.username}
                  </Badge>
                  
                  {conversation.status === 'closed' && (
                    <Badge variant="secondary" className="text-xs">
                      Closed
                    </Badge>
                  )}
                  
                  {conversation.status === 'bot' && (
                    <Badge variant="default" className="text-xs">
                      <Bot className="h-3 w-3 mr-1" />
                      Bot
                    </Badge>
                  )}
                  
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}