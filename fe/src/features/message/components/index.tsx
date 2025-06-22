// src/features/message/components/index.tsx

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { 
  MessageCircle, 
  Send, 
  MoreVertical,
  Search,
  Phone,
  Video,
  Info,
  Paperclip,
  ArrowDown,
} from 'lucide-react';

import { useAuth } from '../../auth/hooks';
import { 
  useConversation,
  useUploadMessageImage,
  useTyping,
} from '../hooks';
import {
  formatMessageTime,
  formatLastMessageTime,
  getConversationTitle,
  getConversationAvatar,
  getOtherUser,
  validateMessageContent,
  validateImageFile,
  shouldGroupWithPrevious,
  scrollToBottom,
  isScrolledToBottom,
} from '../utils';
import type {
  Conversation,
  ConversationListProps,
  MessageListProps,
  MessageInputProps,
  MessageItemProps,
  ChatWindowProps,
  TypingIndicatorProps,
  MessageFormData,
} from '../type';
import { MessageType } from '../type';

/**
 * Conversation List Component
 */
export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onConversationSelect,
  loading = false,
  error = null,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    const otherUser = getOtherUser(conversation, user?.id || '');
    return otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center space-x-3 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Failed to load conversations</p>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No conversations found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map(conversation => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={user?.id || ''}
                isSelected={conversation.id === currentConversationId}
                onClick={() => onConversationSelect(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Conversation Item Component
 */
interface ConversationItemProps {
  conversation: Conversation;
  currentUserId: string;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUserId,
  isSelected,
  onClick,
}) => {
  const avatar = getConversationAvatar(conversation, currentUserId);
  const title = getConversationTitle(conversation, currentUserId);
  const isUnread = conversation.unreadCount > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors',
        isSelected && 'bg-blue-50 border-r-2 border-blue-500',
        isUnread && 'bg-blue-50/30'
      )}
    >
      <div className="relative">
        <img
          src={avatar}
          alt={title}
          className="w-12 h-12 rounded-full object-cover"
        />
        {/* Online status indicator could go here */}
      </div>
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={cn(
            'text-sm font-medium truncate',
            isUnread ? 'text-gray-900' : 'text-gray-700'
          )}>
            {title}
          </h3>
          {conversation.lastMessageTime && (
            <span className="text-xs text-gray-500 ml-2">
              {formatLastMessageTime(conversation.lastMessageTime)}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className={cn(
            'text-sm truncate',
            isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
          )}>
            {conversation.lastMessageContent || 'No messages yet'}
          </p>
          {isUnread && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2 min-w-[20px] text-center">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Message List Component
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  loading = false,
  error = null,
  onLoadMore,
  hasMore = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      const isAtBottom = isScrolledToBottom(messagesContainerRef.current);
      if (isAtBottom) {
        scrollToBottom(messagesContainerRef.current);
      } else {
        setShowScrollButton(true);
      }
    }
  }, [messages]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const isAtBottom = isScrolledToBottom(container);
    setShowScrollButton(!isAtBottom);

    // Load more messages when scrolled to top
    if (container.scrollTop === 0 && hasMore && onLoadMore) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore]);

  const scrollToBottomHandler = useCallback(() => {
    if (messagesContainerRef.current) {
      scrollToBottom(messagesContainerRef.current);
      setShowScrollButton(false);
    }
  }, []);

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p>Failed to load messages</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto p-4 space-y-4"
      >
        {/* Load more indicator */}
        {hasMore && (
          <div className="text-center py-2">
            <button
              onClick={onLoadMore}
              className="text-blue-500 hover:text-blue-600 text-sm"
            >
              Load more messages
            </button>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => {
          const previousMessage = messages[index - 1];
          const shouldGroup = shouldGroupWithPrevious(message, previousMessage);
          
          return (
            <MessageItem
              key={message.id}
              message={message}
              currentUserId={currentUserId}
              showAvatar={!shouldGroup}
              showTimestamp={!shouldGroup}
            />
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottomHandler}
          className="absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/**
 * Message Item Component
 */
export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  showAvatar = true,
  showTimestamp = true,
}) => {
  const isOwnMessage = message.sender.id === currentUserId;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={cn(
      'flex items-end space-x-2',
      isOwnMessage ? 'justify-end' : 'justify-start'
    )}>
      {/* Avatar for other users */}
      {!isOwnMessage && (
        <div className="w-8 h-8">
          {showAvatar ? (
            <img
              src={message.sender.avatar || '/images/default-avatar.png'}
              alt={message.sender.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      )}

      {/* Message content */}
      <div className={cn(
        'max-w-xs lg:max-w-md',
        isOwnMessage ? 'order-1' : 'order-2'
      )}>
        {/* Sender name for group messages */}
        {!isOwnMessage && showTimestamp && (
          <p className="text-xs text-gray-500 mb-1 px-3">
            {message.sender.username}
          </p>
        )}

        <div
          className={cn(
            'px-4 py-2 rounded-lg relative group',
            isOwnMessage
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          )}
          onMouseEnter={() => setShowMenu(true)}
          onMouseLeave={() => setShowMenu(false)}
        >
          {/* Message content based on type */}
          {message.type === MessageType.TEXT && (
            <p className="text-sm">{message.content}</p>
          )}
          
          {message.type === MessageType.IMAGE && (
            <div>
              {message.image && (
                <img
                  src={message.image}
                  alt="Shared image"
                  className="rounded-lg max-w-full h-auto mb-2"
                />
              )}
              {message.content && (
                <p className="text-sm">{message.content}</p>
              )}
            </div>
          )}

          {message.type === MessageType.GIFT && (
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🎁</span>
              <p className="text-sm">{message.content}</p>
            </div>
          )}

          {/* Message menu */}
          {showMenu && (
            <button
              className={cn(
                'absolute top-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity',
                isOwnMessage
                  ? '-left-8 bg-gray-100 text-gray-600'
                  : '-right-8 bg-gray-100 text-gray-600'
              )}
            >
              <MoreVertical className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Timestamp and status */}
        {showTimestamp && (
          <div className={cn(
            'flex items-center mt-1 space-x-1 text-xs text-gray-500',
            isOwnMessage ? 'justify-end' : 'justify-start'
          )}>
            <span>{formatMessageTime(message.createdAt)}</span>
            {isOwnMessage && (
              <span className="text-xs">
                {message.status === 'read' && '✓✓'}
                {message.status === 'delivered' && '✓'}
                {message.status === 'sent' && '○'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Spacer for own messages */}
      {isOwnMessage && <div className="w-8 h-8" />}
    </div>
  );
};

/**
 * Typing Indicator Component
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
}) => {
  if (typingUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 p-4 text-gray-500">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-sm">
        {typingUsers.length === 1
          ? `${typingUsers[0].username} is typing...`
          : `${typingUsers.length} people are typing...`
        }
      </span>
    </div>
  );
};

/**
 * Message Input Component
 */
export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadMessageImage();

  const handleSend = useCallback(() => {
    const validation = validateMessageContent(content);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    onSendMessage({
      content: content.trim(),
      type: MessageType.TEXT,
    });

    setContent('');
  }, [content, onSendMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleImageUpload = useCallback(async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadMutation.mutateAsync(file);
      onSendMessage({
        content: content.trim() || 'Sent an image',
        type: MessageType.IMAGE,
        image: result.url,
      });
      setContent('');
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setIsUploading(false);
    }
  }, [content, onSendMessage, uploadMutation]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImageUpload]);

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end space-x-2">
        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Message input */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            style={{ 
              minHeight: '40px',
              maxHeight: '120px',
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || !content.trim() || isUploading}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

/**
 * Chat Window Component
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  currentUserId,
}) => {
  const conversation = useConversation(conversationId);
  const typing = useTyping(conversationId);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-500">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  if (!conversation.conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const otherUser = getOtherUser(conversation.conversation, currentUserId);

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat header */}
      <div className="border-b bg-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={otherUser?.avatar || '/images/default-avatar.png'}
            alt={otherUser?.username}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="font-medium text-gray-900">
              {otherUser?.username}
            </h2>
            <p className="text-sm text-gray-500">Online</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={conversation.messages}
        currentUserId={currentUserId}
        loading={conversation.isLoading}
        onLoadMore={conversation.loadMoreMessages}
        hasMore={conversation.hasMoreMessages}
      />

      {/* Typing indicator */}
      <TypingIndicator typingUsers={[]} />

      {/* Message input */}
      <MessageInput
        onSendMessage={(data: MessageFormData) => {
          typing.stopTyping();
          conversation.sendMessage({
            recipientId: otherUser?.id || '',
            content: data.content,
            type: data.type,
            image: data.image as string,
          });
        }}
        disabled={conversation.isSending}
        placeholder={`Message ${otherUser?.username}...`}
      />
    </div>
  );
};