'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Button } from '@socialinbox/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@socialinbox/ui';
import { Input } from '@socialinbox/ui';
import { Badge } from '@socialinbox/ui';
import { ScrollArea } from '@socialinbox/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@socialinbox/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@socialinbox/ui';
import { Search, MessageSquare, Send, Bot, User, Filter, Archive, Star, MoreVertical } from 'lucide-react';
import { ConversationList } from '../../../components/inbox/conversation-list';
import { MessageThread } from '../../../components/inbox/message-thread';
import { QuickActions } from '../../../components/inbox/quick-actions';
import { useToast } from '../../../hooks/use-toast';
import type { Database } from '@socialinbox/shared';

type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  ig_accounts?: {
    id: string;
    username: string;
  };
  messages?: Array<{
    id: string;
    content: string;
    is_from_user: boolean;
    created_at: string;
  }>;
};
type Message = Database['public']['Tables']['messages']['Row'];

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed' | 'bot'>('all');
  const [accounts, setAccounts] = useState<any[]>([]);
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
    setupRealtimeSubscriptions();

    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadInitialData = async () => {
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

      // Load Instagram accounts
      const { data: accountsData } = await supabase
        .from('ig_accounts')
        .select('id, username')
        .eq('team_id', teamMember.team_id);

      setAccounts(accountsData || []);

      // Load conversations
      await loadConversations(teamMember.team_id);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inbox data',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async (teamId: string) => {
    const query = supabase
      .from('conversations')
      .select(`
        *,
        ig_accounts (
          id,
          username
        ),
        messages (
          id,
          content,
          is_from_user,
          created_at
        )
      `)
      .eq('team_id', teamId)
      .order('last_message_at', { ascending: false });

    // Apply filters
    if (filterAccount !== 'all') {
      query.eq('ig_account_id', filterAccount);
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'open') {
        query.eq('status', 'open');
      } else if (filterStatus === 'closed') {
        query.eq('status', 'closed');
      } else if (filterStatus === 'bot') {
        query.eq('is_bot_active', true);
      }
    }

    if (searchQuery) {
      query.or(`instagram_user_id.ilike.%${searchQuery}%,instagram_username.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to load conversations:', error);
      return;
    }

    // Get only the last message for each conversation
    const conversationsWithLastMessage = data?.map(conv => ({
      ...conv,
      last_message: conv.messages?.[0] || null,
      messages: undefined, // Remove messages array from conversation object
    })) || [];

    setConversations(conversationsWithLastMessage);
  };

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to new messages
    supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            
            // Update messages if it's for the selected conversation
            if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
              setMessages(prev => [...prev, newMessage]);
            }

            // Update conversation list
            const { data: { user } } = await supabase.auth.getUser();
            const { data: teamMember } = await supabase
              .from('team_members')
              .select('team_id')
              .eq('user_id', user!.id)
              .single();

            if (teamMember) {
              loadConversations(teamMember.team_id);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to conversation updates
    supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          const updatedConversation = payload.new as Conversation;
          
          // Update conversation in list
          setConversations(prev => 
            prev.map(conv => 
              conv.id === updatedConversation.id ? updatedConversation : conv
            )
          );

          // Update selected conversation if it's the one being updated
          if (selectedConversation && selectedConversation.id === updatedConversation.id) {
            setSelectedConversation(updatedConversation);
          }
        }
      )
      .subscribe();
  };

  const sendMessage = async (content: string) => {
    if (!selectedConversation || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          content: content.trim(),
          is_from_user: false,
          message_type: 'text',
        });

      if (error) {
        throw error;
      }

      // Message will be added via realtime subscription
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
      });
    }
  };

  const updateConversationStatus = async (conversationId: string, status: 'open' | 'closed') => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status })
        .eq('id', conversationId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to update conversation status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update conversation status',
      });
    }
  };

  const toggleBotStatus = async (conversationId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_bot_active: isActive })
        .eq('id', conversationId);

      if (error) {
        throw error;
      }

      toast({
        title: isActive ? 'Bot Activated' : 'Bot Deactivated',
        description: isActive ? 'Automation is now handling this conversation' : 'You are now handling this conversation manually',
      });
    } catch (error) {
      console.error('Failed to toggle bot status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bot status',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversation List */}
      <div className="w-96 border-r bg-gray-50">
        <div className="p-4 border-b bg-white">
          <h1 className="text-xl font-bold mb-4">Inbox</h1>
          
          {/* Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterAccount} onValueChange={setFilterAccount}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      @{account.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All conversations</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="bot">Bot active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-180px)]">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
        </ScrollArea>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedConversation.instagram_username}`} />
                  <AvatarFallback>{selectedConversation.instagram_username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedConversation.instagram_username}</h2>
                  <p className="text-sm text-gray-500">@{selectedConversation.ig_accounts?.username}</p>
                </div>
              </div>
              
              <QuickActions
                conversation={selectedConversation}
                onUpdateStatus={updateConversationStatus}
                onToggleBot={toggleBotStatus}
              />
            </div>

            {/* Messages */}
            <MessageThread
              messages={messages}
              conversation={selectedConversation}
              onSendMessage={sendMessage}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No conversation selected</h3>
              <p className="text-sm text-gray-500 mt-2">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}