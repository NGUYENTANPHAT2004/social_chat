// src/features/message/utils/index.ts

import type { Message, Conversation, User } from '../type';
import { MessageType, MessageStatus } from '../type';
/**
 * Date and time formatting utilities
 */
export const formatMessageTime = (date: Date | string): string => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - messageDate.getTime();
  
  // Less than 1 minute
  if (diffInMs < 60 * 1000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diffInMs < 60 * 60 * 1000) {
    const minutes = Math.floor(diffInMs / (60 * 1000));
    return `${minutes}m ago`;
  }
  
  // Less than 24 hours
  if (diffInMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diffInMs / (60 * 60 * 1000));
    return `${hours}h ago`;
  }
  
  // Less than 7 days
  if (diffInMs < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diffInMs / (24 * 60 * 60 * 1000));
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }
  
  // More than 7 days
  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const formatLastMessageTime = (date: Date | string): string => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - messageDate.getTime();
  
  // Today
  if (diffInMs < 24 * 60 * 60 * 1000) {
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  
  // This week
  if (diffInMs < 7 * 24 * 60 * 60 * 1000) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  // Older
  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const formatConversationTime = (date: Date | string): string => {
  const messageDate = new Date(date);
  const now = new Date();
  const isToday = messageDate.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === messageDate.toDateString();
  
  if (isToday) {
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  
  if (isYesterday) {
    return 'Yesterday';
  }
  
  // This year
  if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
  
  // Other years
  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Message content utilities
 */
export const truncateMessage = (content: string, maxLength: number = 50): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

export const getMessagePreview = (message: Message): string => {
  switch (message.type) {
    case MessageType.TEXT:
      return truncateMessage(message.content, 60);
    case MessageType.IMAGE:
      return '📷 Photo';
    case MessageType.GIFT:
      return '🎁 Gift';
    case MessageType.SYSTEM:
      return message.content;
    default:
      return 'Message';
  }
};

export const isMessageDeleted = (message: Message): boolean => {
  return message.status === MessageStatus.DELETED;
};

export const canEditMessage = (message: Message, currentUserId: string): boolean => {
  return (
    message.sender.id === currentUserId &&
    message.status !== MessageStatus.DELETED &&
    message.type === MessageType.TEXT
  );
};

export const canDeleteMessage = (message: Message, currentUserId: string): boolean => {
  return (
    message.sender.id === currentUserId &&
    message.status !== MessageStatus.DELETED
  );
};

/**
 * Conversation utilities
 */
export const getConversationTitle = (conversation: Conversation, currentUserId: string): string => {
  const otherUser = conversation.participants.find(p => p.id !== currentUserId);
  return otherUser?.username || 'Unknown User';
};

export const getConversationAvatar = (conversation: Conversation, currentUserId: string): string => {
  const otherUser = conversation.participants.find(p => p.id !== currentUserId);
  return otherUser?.avatar || '/images/default-avatar.png';
};

export const getOtherUser = (conversation: Conversation, currentUserId: string): User | undefined => {
  return conversation.participants.find(p => p.id !== currentUserId);
};

export const isConversationUnread = (conversation: Conversation): boolean => {
  return conversation.unreadCount > 0;
};

export const getConversationLastActivity = (conversation: Conversation): Date => {
  return conversation.lastMessageTime ? new Date(conversation.lastMessageTime) : new Date(conversation.createdAt);
};

/**
 * Message grouping utilities
 */
export interface MessageGroup {
  date: string;
  messages: Message[];
}

export const groupMessagesByDate = (messages: Message[]): MessageGroup[] => {
  const groups: { [key: string]: Message[] } = {};
  
  messages.forEach(message => {
    const date = new Date(message.createdAt);
    const dateKey = date.toDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });
  
  return Object.entries(groups).map(([date, messages]) => ({
    date,
    messages: messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const shouldGroupWithPrevious = (currentMessage: Message, previousMessage?: Message): boolean => {
  if (!previousMessage) return false;
  
  // Same sender
  if (currentMessage.sender.id !== previousMessage.sender.id) return false;
  
  // Within 5 minutes
  const timeDiff = new Date(currentMessage.createdAt).getTime() - new Date(previousMessage.createdAt).getTime();
  if (timeDiff > 5 * 60 * 1000) return false; // 5 minutes
  
  return true;
};

/**
 * Search and filter utilities
 */
export const searchConversations = (conversations: Conversation[], query: string, currentUserId: string): Conversation[] => {
  if (!query.trim()) return conversations;
  
  const lowerQuery = query.toLowerCase();
  
  return conversations.filter(conversation => {
    const otherUser = getOtherUser(conversation, currentUserId);
    const username = otherUser?.username?.toLowerCase() || '';
    const lastMessage = conversation.lastMessageContent?.toLowerCase() || '';
    
    return username.includes(lowerQuery) || lastMessage.includes(lowerQuery);
  });
};

export const filterConversationsByStatus = (conversations: Conversation[], status?: string): Conversation[] => {
  if (!status) return conversations;
  
  switch (status) {
    case 'unread':
      return conversations.filter(c => c.unreadCount > 0);
    case 'read':
      return conversations.filter(c => c.unreadCount === 0);
    default:
      return conversations;
  }
};

/**
 * Validation utilities
 */
export const validateMessageContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content || !content.trim()) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 1000) {
    return { isValid: false, error: 'Message is too long (max 1000 characters)' };
  }
  
  return { isValid: true };
};

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
  }
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image size must be less than 5MB' };
  }
  
  return { isValid: true };
};

/**
 * UI state utilities
 */
export const getMessageStatusIcon = (status: MessageStatus): string => {
  switch (status) {
    case MessageStatus.SENT:
      return '✓';
    case MessageStatus.DELIVERED:
      return '✓✓';
    case MessageStatus.READ:
      return '✓✓';
    case MessageStatus.DELETED:
      return '';
    default:
      return '';
  }
};

export const getMessageStatusColor = (status: MessageStatus): string => {
  switch (status) {
    case MessageStatus.SENT:
      return 'text-gray-400';
    case MessageStatus.DELIVERED:
      return 'text-gray-400';
    case MessageStatus.READ:
      return 'text-blue-500';
    case MessageStatus.DELETED:
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
};

export const getTypingText = (typingUsers: string[]): string => {
  if (typingUsers.length === 0) return '';
  if (typingUsers.length === 1) return 'is typing...';
  if (typingUsers.length === 2) return 'are typing...';
  return `${typingUsers.length} people are typing...`;
};

/**
 * Local storage utilities
 */
export const STORAGE_KEYS = {
  DRAFT_MESSAGES: 'chat_draft_messages',
  LAST_CONVERSATION: 'chat_last_conversation',
  CHAT_SETTINGS: 'chat_settings',
} as const;

export const saveDraftMessage = (conversationId: string, content: string): void => {
  try {
    const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFT_MESSAGES) || '{}');
    if (content.trim()) {
      drafts[conversationId] = content;
    } else {
      delete drafts[conversationId];
    }
    localStorage.setItem(STORAGE_KEYS.DRAFT_MESSAGES, JSON.stringify(drafts));
  } catch (error) {
    console.error('Failed to save draft message:', error);
  }
};

export const getDraftMessage = (conversationId: string): string => {
  try {
    const drafts = JSON.parse(localStorage.getItem(STORAGE_KEYS.DRAFT_MESSAGES) || '{}');
    return drafts[conversationId] || '';
  } catch (error) {
    console.error('Failed to get draft message:', error);
    return '';
  }
};

export const clearDraftMessage = (conversationId: string): void => {
  saveDraftMessage(conversationId, '');
};

export const saveLastConversation = (conversationId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_CONVERSATION, conversationId);
  } catch (error) {
    console.error('Failed to save last conversation:', error);
  }
};

export const getLastConversation = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.LAST_CONVERSATION);
  } catch (error) {
    console.error('Failed to get last conversation:', error);
    return null;
  }
};

/**
 * Animation and UI helpers
 */
export const scrollToBottom = (element: HTMLElement, smooth: boolean = true): void => {
  element.scrollTo({
    top: element.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  });
};

export const isScrolledToBottom = (element: HTMLElement, threshold: number = 100): boolean => {
  return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
};

/**
 * Debug utilities
 */
export const logMessage = (message: Message, action: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Message ${action}]`, {
      id: message.id,
      sender: message.sender.username,
      content: message.content.substring(0, 50),
      type: message.type,
      status: message.status,
      timestamp: message.createdAt,
    });
  }
};

export const logConversation = (conversation: Conversation, action: string): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Conversation ${action}]`, {
      id: conversation.id,
      participants: conversation.participants.map(p => p.username),
      lastMessage: conversation.lastMessageContent?.substring(0, 30),
      unreadCount: conversation.unreadCount,
      timestamp: conversation.lastMessageTime,
    });
  }
};