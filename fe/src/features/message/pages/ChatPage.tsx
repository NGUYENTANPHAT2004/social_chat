// src/features/message/pages/ChatPage.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { MessageCircle, Users, Settings, Menu, X, Plus } from 'lucide-react';

import { useAuth } from '../../auth/hooks';
import {
  ConversationList,
  ChatWindow,
  useConversations,
  useSocketConnection,
  useUnreadCount,
} from '../index';
import { useCreateConversation } from '../hooks';
import { UserSearchModal } from '../components/UserSearchModal';

interface ChatPageProps {
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({ className }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  // Hooks
  const conversationsQuery = useConversations();
  const { connect, disconnect, isConnected } = useSocketConnection();
  const unreadCount = useUnreadCount();
  const createConversationMutation = useCreateConversation();
  
  // Get conversation ID from URL params
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId) {
      setSelectedConversationId(conversationId);
    }
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Auto-connect socket
  useEffect(() => {
    if (user && !isConnected) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [user, isConnected, connect, disconnect]);

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMobileMenuOpen(false);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('conversation', conversationId);
    window.history.replaceState({}, '', url.toString());
  };

  const handleStartNewConversation = (userId: string) => {
    createConversationMutation.mutate(userId, {
      onSuccess: (conversation) => {
        handleConversationSelect(conversation.id);
      },
    });
  };

  const handleUserSearchResult = (conversationId: string) => {
    setShowUserSearch(false);
    handleConversationSelect(conversationId);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-screen bg-gray-50 flex', className)}>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Conversations List */}
      <div className={cn(
        'w-80 bg-white border-r flex flex-col',
        'fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-8 h-8 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Unread count indicator */}
              {(unreadCount || 0) > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {unreadCount}
                </span>
              )}
              
              {/* Connection status */}
              <div className={cn(
                'w-3 h-3 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )} title={isConnected ? 'Connected' : 'Disconnected'} />
              
              {/* Mobile close button */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* New conversation button */}
          <button
            onClick={() => setShowUserSearch(true)}
            className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Conversations List */}
        <ConversationList
          conversations={conversationsQuery.conversations}
          currentConversationId={selectedConversationId ?? undefined}
          onConversationSelect={handleConversationSelect}
          loading={conversationsQuery.isLoading}
          error={conversationsQuery.error?.message}
        />

        {/* Sidebar Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-3">
            <img
              src={user.avatar || '/images/default-avatar.png'}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/default-avatar.png';
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
            <button className="p-1 text-gray-500 hover:text-gray-700">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Chat Window */}
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            currentUserId={user.id}
          />
        ) : (
          <EmptyState onStartConversation={() => setShowUserSearch(true)} />
        )}
      </div>

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onConversationCreated={handleUserSearchResult}
      />
    </div>
  );
};

/**
 * Empty State Component
 */
interface EmptyStateProps {
  onStartConversation: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onStartConversation }) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-12 h-12 text-blue-500" />
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Welcome to Messages
        </h2>
        
        <p className="text-gray-600 mb-8">
          Start a conversation with your friends and stay connected. 
          Select a conversation from the sidebar or search for someone to message.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={onStartConversation}
            className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Start New Conversation
          </button>
          
          <button
            onClick={onStartConversation}
            className="w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <Users className="w-5 h-5 inline mr-2" />
            Find Friends
          </button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Tips:</p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• Press Enter to send a message</li>
            <li>• Click the paperclip icon to send images</li>
            <li>• Use @username to mention someone</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;