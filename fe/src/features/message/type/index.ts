// src/features/message/types/index.ts

export interface User {
  id: string;
  username: string;
  avatar?: string;
  email?: string;
}

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
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  lastMessageContent: string;
  lastMessageSender?: User;
  lastMessageTime?: Date;
  status: ConversationStatus;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Frontend specific
  otherUser?: User;
}

// DTOs
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
}

export interface GetMessagesParams {
  page?: number;
  limit?: number;
}

// API Response Types
export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponse {
  count: number;
}

// Socket Event Types
export interface SocketMessage {
  success: boolean;
  message?: Message;
  error?: string;
}

export interface SocketTypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface SocketReadEvent {
  conversationId: string;
  readBy: string;
}

export interface NewMessageEvent {
  message: Message;
}

// Store Types
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
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: ConversationUpdate) => void;
  
  setCurrentConversation: (conversationId: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: MessageUpdate) => void;
  prependMessages: (messages: Message[]) => void;
  
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount: number) => void;
  
  setTypingUsers: (conversationId: string, userIds: string[]) => void;
  addTypingUser: (conversationId: string, userId: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  
  setConnected: (connected: boolean) => void;
  
  // Loading states
  setConversationsLoading: (loading: boolean) => void;
  setMessagesLoading: (loading: boolean) => void;
  setConversationsError: (error: string | null) => void;
  setMessagesError: (error: string | null) => void;
  setHasMoreMessages: (hasMore: boolean) => void;
  
  // Reset
  reset: () => void;
  resetCurrentConversation: () => void;
}

export interface MessageActions {
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: ConversationUpdate) => void;
  setCurrentConversation: (conversationId: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: MessageUpdate) => void;
  prependMessages: (messages: Message[]) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount: number) => void;
  setTypingUsers: (conversationId: string, userIds: string[]) => void;
  addTypingUser: (conversationId: string, userId: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  setConnected: (connected: boolean) => void;
  setConversationsLoading: (loading: boolean) => void;
  setMessagesLoading: (loading: boolean) => void;
  setConversationsError: (error: string | null) => void;
  setMessagesError: (error: string | null) => void;
  setHasMoreMessages: (hasMore: boolean) => void;
  reset: () => void;
  resetCurrentConversation: () => void;
}

export type MessageStore = MessageState & MessageActions;

export type ConversationUpdate = Partial<Omit<Conversation, 'id'>>;
export type MessageUpdate = Partial<Omit<Message, 'id' | 'conversation'>>;

// Hook types
export interface UseConversationsOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export interface UseMessagesOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

export interface UseSendMessageOptions {
  onSuccess?: (message: Message) => void;
  onError?: (error: Error) => void;
}

// Error types
export interface MessageError {
  message: string;
  status?: number;
  code?: string;
}

// Utility types
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
}

export interface ConversationListItem extends Conversation {
  otherUser: User;
  unreadCount: number;
  lastActivity: Date;
}

// Component Props Types
export interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  loading?: boolean;
  error?: string | null;
}

export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loading?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface MessageInputProps {
  onSendMessage: (data: MessageFormData) => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
}

export interface MessageItemProps {
  message: Message;
  currentUserId: string;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export interface TypingIndicatorProps {
  typingUsers: User[];
}

// Socket connection config
export interface SocketConfig {
  url: string;
  token: string;
  namespace?: string;
}

export interface SocketEventHandlers {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onNewMessage?: (message: Message) => void;
  onMessagesRead?: (data: SocketReadEvent) => void;
  onUserTyping?: (data: SocketTypingEvent) => void;
  onError?: (error: any) => void;
}