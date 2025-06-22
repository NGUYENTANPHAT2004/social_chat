// src/features/message/components/UserSearchModal.tsx

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { X, Search, User, MessageCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useUserSearch } from '../../user/hooks';
import { useCreateConversation } from '../hooks';
import type { User as UserType } from '../type';

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onConversationCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  
  // Search users hook
  const userSearchQuery = useUserSearch(
    { q: searchQuery, limit: 10 },
    { enabled: searchQuery.length >= 2 }
  );
  
  // Create conversation hook
  const createConversationMutation = useCreateConversation();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedUser(null);
    }
  }, [isOpen]);

  const handleStartConversation = useCallback((user: UserType) => {
    createConversationMutation.mutate(user.id, {
      onSuccess: (conversation) => {
        onConversationCreated(conversation.id);
        onClose();
      },
    });
  }, [createConversationMutation, onConversationCreated, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Start New Conversation
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <div className="p-8 text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Type at least 2 characters to search for users</p>
              </div>
            ) : userSearchQuery.isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Searching users...</p>
              </div>
            ) : userSearchQuery.error ? (
              <div className="p-8 text-center text-red-500">
                <p>Failed to search users</p>
                <p className="text-sm text-gray-500 mt-1">
                  {userSearchQuery.error.message}
                </p>
              </div>
            ) : (userSearchQuery.data?.length || 0) === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No users found for "{searchQuery}"</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="py-2">
                {userSearchQuery.data?.map((user) => (
                  <UserSearchItem
                    key={user.id}
                    user={user}
                    onSelect={() => handleStartConversation(user)}
                    isLoading={createConversationMutation.isPending}
                    isSelected={selectedUser?.id === user.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
 * User Search Item Component
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
  return (
    <button
      onClick={onSelect}
      disabled={isLoading}
      className={cn(
        'w-full p-4 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        isSelected && 'bg-blue-50'
      )}
    >
      <div className="flex items-center space-x-3">
        <img
          src={user.avatar || '/images/default-avatar.png'}
          alt={user.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.username}
          </p>
          {user.email && (
            <p className="text-sm text-gray-500 truncate">
              {user.email}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && isSelected ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          ) : (
            <MessageCircle className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
    </button>
  );
};

export default UserSearchModal;