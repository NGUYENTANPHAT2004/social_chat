// src/features/message/index.ts

// Types
export * from './type';

// Services
export * from './services';
export { messageService, socketService } from './services';

// Store
export * from './store';
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

// Additional exports from services for backward compatibility
export {
  formatMessageTime,
  formatLastMessageTime,
  getConversationTitle,
  getConversationAvatar,
  getOtherUser,
  validateMessageContent,
  validateImageFile,
  truncateMessage,
  isMessageFromCurrentUser,
  canDeleteMessage,
  handleMessageError,
} from './services';

// Utilities
export {
  shouldGroupWithPrevious,
  scrollToBottom,
  isScrolledToBottom,
  formatConversationTime,
  getMessagePreview,
  isMessageDeleted,
  canEditMessage,
  groupMessagesByDate,
  searchConversations,
  filterConversationsByStatus,
  getMessageStatusIcon,
  getMessageStatusColor,
  getTypingText,
  saveDraftMessage,
  getDraftMessage,
  clearDraftMessage,
  saveLastConversation,
  getLastConversation,
  logMessage,
  logConversation,
  STORAGE_KEYS,
} from './utils';

// Re-export providers
export { MessageProvider, useMessageContext } from './providers/MessageProvider';

// Re-export store setup function
export { setupMessageStoreSubscriptions } from './store';

// Default export for convenience
export { ChatWindow as default } from './components';