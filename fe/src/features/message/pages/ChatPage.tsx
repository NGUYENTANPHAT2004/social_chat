// src/features/message/pages/ChatPage.tsx - COMPLETE FIXED

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { MessageCircle, Users, Settings, Menu, X, Plus, Wifi, WifiOff } from 'lucide-react';

import { useAuth } from '../../auth/hooks';
import {
  ConversationList,
  ChatWindow,
  useConversations,
  useUnreadCount,
} from '../index';
import { UserSearchModal } from '../components/UserSearchModal';
import { useMessageContext } from '../providers/MessageProvider';
import type { Conversation } from '../type';

interface ChatPageProps {
  className?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({ className }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  // ✅ Use context instead of direct socket hook
  const { isConnected, unreadCount: contextUnreadCount, settings } = useMessageContext();
  
  // State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showUserSearch, setShowUserSearch] = useState(false);
  
  // Hooks
  const conversationsQuery = useConversations({
    enabled: isAuthenticated && !!user,
  });
  
  const unreadCountQuery = useUnreadCount({
    enabled: isAuthenticated && !!user,
  });
  
  const createConversationMutation = useCreateConversation();
  
  // ✅ Use unread count from context with fallback to query
  const unreadCount = contextUnreadCount || unreadCountQuery.data?.count || 0;
  
  // ✅ Get conversations with proper error handling
  const conversations: Conversation[] = conversationsQuery.data?.conversations || [];

  // ✅ Get conversation ID from URL params
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversationId !== 'undefined') {
      setSelectedConversationId(conversationId);
    }
  }, [searchParams]);

  // ✅ Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // ✅ Handle conversation selection
  const handleConversationSelect = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsMobileMenuOpen(false);
    
    // Update URL without causing re-render loop
    const url = new URL(window.location.href);
    url.searchParams.set('conversation', conversationId);
    window.history.replaceState({}, '', url.toString());
  }, []);

  // ✅ Handle creating new conversation
  const handleStartNewConversation = useCallback((userId: string) => {
    createConversationMutation.mutate(userId, {
      onSuccess: (conversation) => {
        handleConversationSelect(conversation.id);
      },
      onError: (error) => {
        console.error('Failed to create conversation:', error);
      },
    });
  }, [createConversationMutation, handleConversationSelect]);

  // ✅ Handle user search result
  const handleUserSearchResult = useCallback((conversationId: string) => {
    setShowUserSearch(false);
    handleConversationSelect(conversationId);
  }, [handleConversationSelect]);

  // ✅ Handle mobile menu close
  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // ✅ Loading state
  if (!isAuthenticated || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
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
          onClick={handleMobileMenuClose}
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
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              
              {/* ✅ Enhanced connection status indicator */}
              <div className="relative group">
                <div 
                  className={cn(
                    'w-3 h-3 rounded-full transition-colors',
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  )} 
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {isConnected ? 'Connected to chat server' : 'Disconnected from chat server'}
                </div>
              </div>
              
              {/* Mobile close button */}
              <button
                onClick={handleMobileMenuClose}
                className="lg:hidden p-1 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* New conversation button */}
          <button
            onClick={() => setShowUserSearch(true)}
            disabled={!isConnected || createConversationMutation.isPending}
            className={cn(
              'w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium',
              isConnected && !createConversationMutation.isPending
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
            aria-label="Start new conversation"
          >
            <Plus className="w-4 h-4" />
            <span>
              {createConversationMutation.isPending ? 'Creating...' : 'New Conversation'}
            </span>
          </button>
          
          {/* ✅ Connection status message */}
          {!isConnected && (
            <div className="mt-2 flex items-center justify-center space-x-2 text-xs text-red-600 bg-red-50 rounded p-2">
              <WifiOff className="w-3 h-3" />
              <span>Reconnecting to chat server...</span>
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            currentConversationId={selectedConversationId ?? undefined}
            onConversationSelect={handleConversationSelect}
            loading={conversationsQuery.isLoading}
            error={conversationsQuery.error?.message ?? null}
          />
        </div>

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
              <div className="flex items-center space-x-2">
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
                {/* ✅ Online status */}
                <div className="flex items-center space-x-1">
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-500">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-500">Offline</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button 
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Settings"
            >
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
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
            
            {/* ✅ Connection indicator in mobile header */}
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <div className={cn(
                'w-3 h-3 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )} />
            </div>
          </div>
        </div>

        {/* Chat Window */}
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            currentUserId={user.id}
          />
        ) : (
          <EmptyState 
            onStartConversation={() => setShowUserSearch(true)}
            isConnected={isConnected}
            theme={settings.theme}
          />
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
 * ✅ Enhanced Empty State Component
 */
interface EmptyStateProps {
  onStartConversation: () => void;
  isConnected: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  onStartConversation, 
  isConnected,
  theme = 'light'
}) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className={cn(
          'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6',
          theme === 'dark' ? 'bg-gray-700' : 'bg-blue-100'
        )}>
          <MessageCircle className={cn(
            'w-12 h-12',
            theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
          )} />
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
            disabled={!isConnected}
            className={cn(
              'w-full px-6 py-3 rounded-lg font-medium transition-all duration-200',
              isConnected 
                ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg transform hover:-translate-y-0.5' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            Start New Conversation
          </button>
          
          <button
            onClick={onStartConversation}
            disabled={!isConnected}
            className={cn(
              'w-full px-6 py-3 rounded-lg font-medium transition-all duration-200',
              isConnected 
                ? 'border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400' 
                : 'border border-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Find Friends
          </button>
        </div>
        
        {/* ✅ Enhanced connection status in empty state */}
        {!isConnected && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-yellow-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <p className="text-sm font-medium">Connecting to chat server...</p>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Please wait while we establish a connection
            </p>
          </div>
        )}
        
        <div className="mt-8 text-sm text-gray-500">
          <p className="font-medium mb-2">Quick Tips:</p>
          <ul className="space-y-1 text-left">
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>Press Enter to send a message</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>Click the paperclip icon to send images</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>Use @username to mention someone</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;