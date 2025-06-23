// src/features/message/types/index.ts - COMPLETE FIXED

import { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';

// ✅ User interface
export interface User {
  id: string;
  username: string;
  avatar?: string;
  email?: string;
  // Optional additional fields for flexibility
  displayName?: string;
  profile?: {
    displayName?: string;
    avatar?: string;
  };
}

// ✅ Enums
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  GIFT = 'gift',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  DELETED = 'deleted',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
}

// ✅ Core interfaces
export interface Message {
  id: string;
  sender: User;
  recipient: User;
  conversation: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  image?: string;
  metadata?: Record<string, any>;
  readAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  lastMessageContent?: string;
  lastMessageSender?: User;
  lastMessageTime?: Date | string;
  status: ConversationStatus;
  unreadCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Frontend specific
  otherUser?: User;
}

// ✅ DTOs for API calls
export interface SendMessageDto {
  conversationId?: string;
  recipientId: string;
  content: string;
  type?: MessageType;
  image?: string;
  metadata?: Record<string, any>;
}

export interface GetConversationsParams {
  page?: number;
  limit?: number;
  status?: ConversationStatus;
  search?: string;
}

export interface GetMessagesParams {
  page?: number;
  limit?: number;
  before?: string; // message ID for pagination
  after?: string; // message ID for pagination
}

// ✅ API Response Types
export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface UnreadCountResponse {
  count: number;
  lastUpdated?: Date | string;
}

// ✅ Socket Event Types
export interface SocketMessage {
  success: boolean;
  message?: Message;
  error?: string;
  data?: any;
}

export interface SocketTypingEvent {
  conversationId: string;
  userId: string;
  username?: string;
  isTyping: boolean;
  timestamp?: number;
}

export interface SocketReadEvent {
  conversationId: string;
  readBy: string;
  messageIds?: string[];
  timestamp?: number;
}

export interface NewMessageEvent {
  message: Message;
  conversation?: Conversation;
}

// ✅ Socket connection config
export interface SocketConfig {
  url: string;
  token: string;
  namespace?: string;
  options?: Record<string, any>;
}

export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onNewMessage?: (message: Message) => void;
  onMessagesRead?: (data: SocketReadEvent) => void;
  onUserTyping?: (data: SocketTypingEvent) => void;
  onError?: (error: any) => void;
  onReconnecting?: (attemptNumber: number) => void;
  onReconnected?: () => void;
}

// ✅ Store Types
export interface MessageState {
  // Conversations
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsError: string | null;
  
  // Current conversation
  currentConversationId: string | null;
  currentMessages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;
  hasMoreMessages: boolean;
  
  // Unread count
  unreadCount: number;
  
  // Typing indicators
  typingUsers: Record<string, string[]>; // conversationId -> userIds[]
  
  // Socket connection
  isConnected: boolean;
}

export interface MessageActions {
  // Conversations actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: ConversationUpdate) => void;
  removeConversation: (conversationId: string) => void;
  
  // Current conversation actions
  setCurrentConversation: (conversationId: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: MessageUpdate) => void;
  removeMessage: (messageId: string) => void;
  prependMessages: (messages: Message[]) => void;
  
  // Unread count actions
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount?: number) => void;
  
  // Typing indicators
  setTypingUsers: (conversationId: string, userIds: string[]) => void;
  addTypingUser: (conversationId: string, userId: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  clearTypingUsers: (conversationId: string) => void;
  
  // Connection status
  setConnected: (connected: boolean) => void;
  
  // Loading states
  setConversationsLoading: (loading: boolean) => void;
  setMessagesLoading: (loading: boolean) => void;
  setConversationsError: (error: string | null) => void;
  setMessagesError: (error: string | null) => void;
  setHasMoreMessages: (hasMore: boolean) => void;
  
  // Reset functions
  reset: () => void;
  resetCurrentConversation: () => void;
}

export type MessageStore = MessageState & MessageActions;

// ✅ Update types
export type ConversationUpdate = Partial<Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>>;
export type MessageUpdate = Partial<Omit<Message, 'id' | 'conversation' | 'createdAt' | 'updatedAt'>>;

// ✅ Hook option types
export interface UseConversationsOptions extends GetConversationsParams {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export interface UseMessagesOptions extends GetMessagesParams {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export interface UseSendMessageOptions {
  onSuccess?: (message: Message) => void;
  onError?: (error: MessageError) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export interface UseCreateConversationOptions {
  onSuccess?: (conversation: Conversation) => void;
  onError?: (error: MessageError) => void;
}

// ✅ Error types
export interface MessageError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiError extends Error {
  response?: {
    status: number;
    data: {
      message: string;
      code?: string;
      details?: Record<string, any>;
    };
  };
}

// ✅ Utility types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface MessageFormData {
  content: string;
  type: MessageType;
  image?: File | string;
  metadata?: Record<string, any>;
}

export interface ConversationListItem extends Conversation {
  otherUser: User;
  unreadCount: number;
  lastActivity: Date | string;
  isOnline?: boolean;
}

// ✅ Component Props Types
export interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export interface MessageInputProps {
  onSendMessage: (data: MessageFormData) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  allowAttachments?: boolean;
  allowEmojis?: boolean;
  className?: string;
}

export interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  className?: string;
}

export interface MessageItemProps {
  message: Message;
  currentUserId: string;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  showActions?: boolean;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  className?: string;
}

export interface TypingIndicatorProps {
  typingUsers: User[];
  className?: string;
}

export interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
  className?: string;
}

// ✅ Advanced hook return types
export interface UseConversationReturn {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: MessageError | null;
  sendMessage: (data: MessageFormData & { recipientId: string }) => Promise<void>;
  isSending: boolean;
  markAsRead: () => void;
  loadMoreMessages: () => void;
  hasMoreMessages: boolean;
  typingUsers: User[];
}

export interface UseMessageManagementReturn {
  deleteMessage: (messageId: string) => void;
  deleteConversation: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  isDeleting: boolean;
  isMarkingAsRead: boolean;
}

export interface UseTypingReturn {
  isTyping: boolean;
  startTyping: () => void;
  stopTyping: () => void;
}

// ✅ File upload types
export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface ImageUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  quality?: number; // 0-1 for compression
}

// ✅ Search and filter types
export interface SearchOptions {
  query: string;
  filters?: {
    type?: MessageType[];
    status?: ConversationStatus[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  query: string;
  facets?: Record<string, number>;
}

// ✅ Settings and preferences
export interface ChatSettings {
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  showTypingIndicator: boolean;
  showReadReceipts: boolean;
  autoMarkAsRead: boolean;
  fontSize: 'small' | 'medium' | 'large';
  language: string;
}

export interface NotificationSettings {
  desktop: boolean;
  sound: boolean;
  vibration: boolean;
  preview: boolean;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
}

// ✅ Analytics and metrics
export interface MessageMetrics {
  totalMessages: number;
  totalConversations: number;
  avgResponseTime: number;
  dailyMessageCount: number;
  peakHours: number[];
  topContacts: User[];
}

export interface ConnectionMetrics {
  connectionCount: number;
  lastConnectTime: Date;
  disconnectReasons: string[];
  reconnectAttempts: number;
  avgConnectionDuration: number;
}

// ✅ Validation types
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface MessageValidation extends ValidationResult {
  trimmedContent?: string;
  wordCount?: number;
  characterCount?: number;
}

export interface FileValidation extends ValidationResult {
  fileSize?: number;
  fileType?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

// ✅ Context types
export interface MessageContextValue {
  isConnected: boolean;
  unreadCount: number;
  connect: () => void;
  disconnect: () => void;
  settings: ChatSettings;
  updateSettings: (settings: Partial<ChatSettings>) => void;
}

// ✅ Route and navigation types
export interface ChatRouteParams {
  conversationId?: string;
  userId?: string;
  action?: 'new' | 'archive' | 'search';
}

export interface NavigationOptions {
  replace?: boolean;
  preserveScroll?: boolean;
  highlight?: boolean;
}

// ✅ Export default types for convenience
export type { UseQueryOptions, UseMutationOptions };