// src/features/message/index.ts

// Types
export * from './type';

// Services
export * from './services';

// Store
export * from './store';

// Components
export * from './components';

// Re-export main services for easy access
export { messageService, socketService } from './services';

// Re-export main store
export { useMessageStore, useMessageActions } from './store';

// Re-export main hooks
export {
  useConversations,
  useMessages,
  useSendMessage,
  useSocketConnection,
  useConversation,
} from './hooks';

// Re-export main components
export {
  ConversationList,
  MessageList,
  MessageItem,
  MessageInput,
  ChatWindow,
  TypingIndicator,
} from './components';

// Re-export utilities
export {
  formatMessageTime,
  formatLastMessageTime,
  getConversationTitle,
  getConversationAvatar,
  validateMessageContent,
  validateImageFile,
} from './utils';