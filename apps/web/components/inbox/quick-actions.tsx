import { useState } from 'react';
import { Button } from '@socialinbox/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@socialinbox/ui';
import { Bot, BotIcon, Archive, Star, Tag, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import type { Database } from '@socialinbox/shared';

type Conversation = Database['public']['Tables']['conversations']['Row'];

interface QuickActionsProps {
  conversation: Conversation;
  onUpdateStatus: (conversationId: string, status: 'open' | 'closed') => void;
  onToggleBot: (conversationId: string, isActive: boolean) => void;
}

export function QuickActions({ conversation, onUpdateStatus, onToggleBot }: QuickActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: () => Promise<void> | void) => {
    setIsProcessing(true);
    try {
      await action();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Bot Toggle */}
      <Button
        variant={conversation.status === 'bot' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleAction(() => onToggleBot(conversation.id, conversation.status !== 'bot'))}
        disabled={isProcessing}
        title={conversation.status === 'bot' ? 'Deactivate bot' : 'Activate bot'}
      >
        {conversation.status === 'bot' ? (
          <>
            <BotIcon className="h-4 w-4 mr-2" />
            Bot Active
          </>
        ) : (
          <>
            <Bot className="h-4 w-4 mr-2" />
            Activate Bot
          </>
        )}
      </Button>

      {/* Status Toggle */}
      {conversation.status === 'open' ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction(() => onUpdateStatus(conversation.id, 'closed'))}
          disabled={isProcessing}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Close
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAction(() => onUpdateStatus(conversation.id, 'open'))}
          disabled={isProcessing}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Reopen
        </Button>
      )}

      {/* More Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Star className="h-4 w-4 mr-2" />
            Star Conversation
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Tag className="h-4 w-4 mr-2" />
            Add Tags
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}