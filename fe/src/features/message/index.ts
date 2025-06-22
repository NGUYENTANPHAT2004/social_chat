// src/features/message/index.ts

// Types
export * from './type';

// Services
export { messageService, socketService, SocketService, MessageService } from './services';

// Store
export { 
  useMessageStore, 
  useMessageActions,
  useConversations as useConversationsStore,
  useCurrentConversation,
  useCurrentConversationId,
  useCurrentMessages,
  useIsConnected,
  useUnreadCount as useUnreadCountStore,
  useTypingUsers,
  setupMessageStoreSubscriptions,
} from './store';

// Hooks
export {
  useConversations,
  useMessages,
  useSendMessage,
  useSocketConnection,
  useConversation,
  useMarkAsRead,
  useDeleteConversation,
  useDeleteMessage,
  useUnreadCount,
  useCreateConversation,
  useUploadMessageImage,
  useTyping,
  useMessageManagement,
  MESSAGE_QUERY_KEYS,
} from './hooks';

// Components
export {
  ConversationList,
  MessageList,
  MessageItem,
  MessageInput,
  ChatWindow,
  TypingIndicator,
} from './components';

// Utilities - consolidated exports
export {
  // Time formatting
  formatMessageTime,
  formatLastMessageTime,
  formatConversationTime,
  
  // Message utilities
  truncateMessage,
  getMessagePreview,
  isMessageDeleted,
  canEditMessage,
  canDeleteMessage,
  
  // Conversation utilities
  getConversationTitle,
  getConversationAvatar,
  getOtherUser,
  
  // UI utilities
  shouldGroupWithPrevious,
  scrollToBottom,
  isScrolledToBottom,
  groupMessagesByDate,
  searchConversations,
  filterConversationsByStatus,
  getMessageStatusIcon,
  getMessageStatusColor,
  getTypingText,
  
  // Validation
  validateMessageContent,
  validateImageFile,
  
  // Storage utilities
  saveDraftMessage,
  getDraftMessage,
  clearDraftMessage,
  saveLastConversation,
  getLastConversation,
  STORAGE_KEYS,
  
  // Debug utilities
  logMessage,
  logConversation,
} from './utils';

// Providers
export { MessageProvider, useMessageContext } from './providers/MessageProvider';

// Pages
export { ChatPage } from './pages/ChatPage';

// Default export
export { ChatWindow as default } from './components';