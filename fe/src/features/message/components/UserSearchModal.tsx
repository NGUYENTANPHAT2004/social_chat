// src/features/message/components/UserSearchModal.tsx - COMPLETE FIXED

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, Search, User, MessageCircle, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useUserSearch } from '../../user/hooks'; // Assuming this hook exists
import { useCreateConversation } from '../hooks';
import type { User as UserType } from '../../user/type'; // Import from user types
import type { UserSearchModalProps } from '../type';

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  
  // ✅ User search hook with proper error handling
  const userSearchQuery = useUserSearch(
    { q: searchQuery, limit: 10 },
    { 
      enabled: searchQuery.length >= 2,
      staleTime: 30000, // Cache results for 30 seconds
    }
  );
  
  // ✅ Create conversation hook
  const createConversationMutation = useCreateConversation();

  // ✅ Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedUser(null);
    }
  }, [isOpen]);

  // ✅ Handle starting conversation with proper error handling
  const handleStartConversation = useCallback((user: UserType) => {
    if (!user?.id) {
      console.error('Invalid user data:', user);
      return;
    }

    setSelectedUser(user);
    createConversationMutation.mutate(user.id, {
      onSuccess: (conversation) => {
        console.log('✅ Conversation created:', conversation.id);
        onConversationCreated(conversation.id);
        onClose();
      },
      onError: (error) => {
        console.error('❌ Failed to create conversation:', error);
        setSelectedUser(null);
        // Could show toast notification here
      },
    });
  }, [createConversationMutation, onConversationCreated, onClose]);

  // ✅ Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedUser(null); // Clear selection when search changes
  }, []);

  // ✅ Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // ✅ Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // ✅ Get users array from response with proper error handling
  const users: UserType[] = userSearchQuery.data || [];
  const isSearching = userSearchQuery.isLoading;
  const searchError = userSearchQuery.error;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={handleBackdropClick}
        aria-label="Close modal"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className={cn(
          'bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col',
          'transform transition-all duration-200 scale-100',
          className
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Start New Conversation
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-6 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by username or email..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                autoFocus
                disabled={createConversationMutation.isPending}
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <SearchPlaceholder />
            ) : searchError ? (
              <SearchError 
                error={searchError}
                onRetry={() => userSearchQuery.refetch()}
              />
            ) : isSearching ? (
              <SearchLoading />
            ) : users.length === 0 ? (
              <NoResults searchQuery={searchQuery} />
            ) : (
              <UserResultsList
                users={users}
                onUserSelect={handleStartConversation}
                selectedUserId={selectedUser?.id}
                isCreatingConversation={createConversationMutation.isPending}
              />
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                disabled={createConversationMutation.isPending}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * ✅ Search placeholder component
 */
const SearchPlaceholder: React.FC = () => (
  <div className="p-8 text-center text-gray-500">
    <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
    <p className="font-medium mb-2">Search for users to start chatting</p>
    <p className="text-sm">Type at least 2 characters to search</p>
    <div className="mt-4 text-sm text-gray-400">
      <p className="font-medium mb-2">You can search by:</p>
      <ul className="space-y-1">
        <li>• Username</li>
        <li>• Email address</li>
        <li>• Display name</li>
      </ul>
    </div>
  </div>
);

/**
 * ✅ Search loading component
 */
const SearchLoading: React.FC = () => (
  <div className="p-8 text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
    <p className="text-gray-500">Searching users...</p>
  </div>
);

/**
 * ✅ Search error component
 */
interface SearchErrorProps {
  error: any;
  onRetry: () => void;
}

const SearchError: React.FC<SearchErrorProps> = ({ error, onRetry }) => (
  <div className="p-8 text-center text-red-500">
    <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
      <X className="w-6 h-6 text-red-500" />
    </div>
    <p className="font-medium mb-1">Failed to search users</p>
    <p className="text-sm text-gray-500 mb-4">
      {error?.message || 'Unknown error occurred'}
    </p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
    >
      Try again
    </button>
  </div>
);

/**
 * ✅ No results component
 */
interface NoResultsProps {
  searchQuery: string;
}

const NoResults: React.FC<NoResultsProps> = ({ searchQuery }) => (
  <div className="p-8 text-center text-gray-500">
    <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
    <p className="font-medium mb-1">No users found</p>
    <p className="text-sm">
      No users found for <span className="font-medium">"{searchQuery}"</span>
    </p>
    <p className="text-sm mt-2">Try a different search term</p>
  </div>
);

/**
 * ✅ User results list component
 */
interface UserResultsListProps {
  users: UserType[];
  onUserSelect: (user: UserType) => void;
  selectedUserId?: string;
  isCreatingConversation: boolean;
}

const UserResultsList: React.FC<UserResultsListProps> = ({
  users,
  onUserSelect,
  selectedUserId,
  isCreatingConversation,
}) => (
  <div className="py-2">
    {users.map((user) => (
      <UserSearchItem
        key={user.id}
        user={user}
        onSelect={() => onUserSelect(user)}
        isLoading={isCreatingConversation}
        isSelected={selectedUserId === user.id}
      />
    ))}
  </div>
);

/**
 * ✅ User Search Item Component
 */
interface UserSearchItemProps {
  user: UserType;
  onSelect: () => void;
  isLoading: boolean;
  isSelected: boolean;
}

const UserSearchItem: React.FC<UserSearchItemProps> = ({
  user,
  onSelect,
  isLoading,
  isSelected,
}) => {
  // ✅ Handle user avatar - check different possible fields with proper fallbacks
  const avatar = user.avatar || 
                 (user as any).profile?.avatar || 
                 '/images/default-avatar.png';
  
  // ✅ Handle display name - check different possible fields with proper fallbacks
  const displayName = (user as any).profile?.displayName || 
                     (user as any).displayName || 
                     user.username ||
                     'Unknown User';

  return (
    <button
      onClick={onSelect}
      disabled={isLoading}
      className={cn(
        'w-full p-4 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
        isSelected && 'bg-blue-50 hover:bg-blue-100'
      )}
    >
      <div className="flex items-center space-x-3">
        {/* User Avatar */}
        <div className="relative">
          <img
            src={avatar}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              // ✅ Fallback to default avatar if image fails to load
              e.currentTarget.src = '/images/default-avatar.png';
            }}
          />
          {/* Online indicator (could be implemented later) */}
          {/* <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div> */}
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 truncate">
            @{user.username || 'unknown'}
          </p>
          {user.email && (
            <p className="text-xs text-gray-400 truncate">
              {user.email}
            </p>
          )}
        </div>
        
        {/* Action indicator */}
        <div className="flex items-center space-x-2">
          {isLoading && isSelected ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          ) : (
            <MessageCircle className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
    </button>
  );
};

export default UserSearchModal;