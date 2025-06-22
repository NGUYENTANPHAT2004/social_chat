// src/features/message/store/index.ts

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Message, Conversation, ConversationUpdate, MessageUpdate, MessageStore, MessageActions, MessageState } from '../type';
import { StoreApi, UseBoundStore } from 'zustand';
import { useMemo } from 'react';

const initialState: MessageState = {
  // Conversations
  conversations: [],
  conversationsLoading: false,
  conversationsError: null,
  
  // Current conversation
  currentConversationId: null,
  currentMessages: [],
  messagesLoading: false,
  messagesError: null,
  hasMoreMessages: true,
  
  // Unread count
  unreadCount: 0,
  
  // Typing indicators
  typingUsers: {},
  
  // Socket connection
  isConnected: false,
};

type MessageStoreType = UseBoundStore<StoreApi<MessageStore>>;

const createMessageActions = (set: (fn: (state: MessageState) => void) => void): MessageActions => ({
  setConversations: (conversations) =>
    set((state) => {
      state.conversations = conversations;
    }),

  addConversation: (conversation) =>
    set((state) => {
      const existingIndex = state.conversations.findIndex(c => c.id === conversation.id);
      if (existingIndex >= 0) {
        state.conversations[existingIndex] = conversation;
      } else {
        state.conversations.unshift(conversation);
      }
    }),

  updateConversation: (conversationId, updates) =>
    set((state) => {
      const index = state.conversations.findIndex(c => c.id === conversationId);
      if (index >= 0) {
        Object.assign(state.conversations[index], updates);
      }
    }),

  // Current conversation actions
  setCurrentConversation: (conversationId) =>
    set((state) => {
      state.currentConversationId = conversationId;
      state.currentMessages = [];
      state.hasMoreMessages = true;
      state.messagesError = null;
    }),

  setMessages: (messages) =>
    set((state) => {
      state.currentMessages = messages;
    }),

  addMessage: (message) =>
    set((state) => {
      // Add to current messages if it's for the current conversation
      if (message.conversation === state.currentConversationId) {
        state.currentMessages.push(message);
      }

      // Update conversation
      const conversationIndex = state.conversations.findIndex(
        c => c.id === message.conversation
      );
      
      if (conversationIndex >= 0) {
        const conversation = state.conversations[conversationIndex];
        conversation.lastMessage = message;
        conversation.lastMessageContent = message.content;
        conversation.lastMessageSender = message.sender;
        conversation.lastMessageTime = message.createdAt;
        
        // Move conversation to top
        const [updatedConversation] = state.conversations.splice(conversationIndex, 1);
        state.conversations.unshift(updatedConversation);
        
        // Update unread count if message is not from current user
        // This would need current user ID - will handle in hooks
      }
    }),

  updateMessage: (messageId, updates) =>
    set((state) => {
      const index = state.currentMessages.findIndex(m => m.id === messageId);
      if (index >= 0) {
        Object.assign(state.currentMessages[index], updates);
      }
    }),

  prependMessages: (messages) =>
    set((state) => {
      state.currentMessages = [...messages, ...state.currentMessages];
    }),

  // Unread count actions
  setUnreadCount: (count) =>
    set((state) => {
      state.unreadCount = count;
    }),

  incrementUnreadCount: () =>
    set((state) => {
      state.unreadCount += 1;
    }),

  decrementUnreadCount: (amount) =>
    set((state) => {
      state.unreadCount = Math.max(0, state.unreadCount - amount);
    }),

  // Typing indicators
  setTypingUsers: (conversationId, userIds) =>
    set((state) => {
      state.typingUsers[conversationId] = userIds;
    }),

  addTypingUser: (conversationId, userId) =>
    set((state) => {
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      if (!state.typingUsers[conversationId].includes(userId)) {
        state.typingUsers[conversationId].push(userId);
      }
    }),

  removeTypingUser: (conversationId, userId) =>
    set((state) => {
      if (state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          id => id !== userId
        );
        if (state.typingUsers[conversationId].length === 0) {
          delete state.typingUsers[conversationId];
        }
      }
    }),

  // Connection status
  setConnected: (connected) =>
    set((state) => {
      state.isConnected = connected;
    }),

  // Loading states
  setConversationsLoading: (loading) =>
    set((state) => {
      state.conversationsLoading = loading;
    }),

  setMessagesLoading: (loading) =>
    set((state) => {
      state.messagesLoading = loading;
    }),

  setConversationsError: (error) =>
    set((state) => {
      state.conversationsError = error;
    }),

  setMessagesError: (error) =>
    set((state) => {
      state.messagesError = error;
    }),

  setHasMoreMessages: (hasMore) =>
    set((state) => {
      state.hasMoreMessages = hasMore;
    }),

  // Reset functions
  reset: () => set(() => ({ ...initialState })),

  resetCurrentConversation: () =>
    set((state) => {
      state.currentConversationId = null;
      state.currentMessages = [];
      state.messagesLoading = false;
      state.messagesError = null;
      state.hasMoreMessages = true;
    }),
});


export const useMessageStore = create<MessageStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,
        ...createMessageActions(set as any),
      }))
    ),
    {
      name: 'message-store',
    }
  )
);

// Selectors
export const useConversations = () => useMessageStore(state => state.conversations);
export const useConversationsLoading = () => useMessageStore(state => state.conversationsLoading);
export const useConversationsError = () => useMessageStore(state => state.conversationsError);

export const useCurrentConversationId = () => useMessageStore(state => state.currentConversationId);
export const useCurrentMessages = () => useMessageStore(state => state.currentMessages);
export const useMessagesLoading = () => useMessageStore(state => state.messagesLoading);
export const useMessagesError = () => useMessageStore(state => state.messagesError);
export const useHasMoreMessages = () => useMessageStore(state => state.hasMoreMessages);

export const useUnreadCount = () => useMessageStore(state => state.unreadCount);
export const useTypingUsers = () => useMessageStore(state => state.typingUsers);
export const useIsConnected = () => useMessageStore(state => state.isConnected);

// Computed selectors
export const useCurrentConversation = () => 
  useMessageStore(state => {
    if (!state.currentConversationId) return null;
    return state.conversations.find(c => c.id === state.currentConversationId) || null;
  });

export const useConversationTypingUsers = (conversationId: string) =>
  useMessageStore(state => state.typingUsers[conversationId] || []);

export const useConversationUnreadCount = (conversationId: string) =>
  useMessageStore(state => {
    const conversation = state.conversations.find(c => c.id === conversationId);
    return conversation?.unreadCount || 0;
  });

// Actions selectors (for components that need them)
const actionsSelector = (state: MessageStore): MessageActions => ({
  setConversations: state.setConversations,
  addConversation: state.addConversation,
  updateConversation: state.updateConversation,
  setCurrentConversation: state.setCurrentConversation,
  setMessages: state.setMessages,
  addMessage: state.addMessage,
  updateMessage: state.updateMessage,
  prependMessages: state.prependMessages,
  setUnreadCount: state.setUnreadCount,
  incrementUnreadCount: state.incrementUnreadCount,
  decrementUnreadCount: state.decrementUnreadCount,
  setTypingUsers: state.setTypingUsers,
  addTypingUser: state.addTypingUser,
  removeTypingUser: state.removeTypingUser,
  setConnected: state.setConnected,
  setConversationsLoading: state.setConversationsLoading,
  setMessagesLoading: state.setMessagesLoading,
  setConversationsError: state.setConversationsError,
  setMessagesError: state.setMessagesError,
  setHasMoreMessages: state.setHasMoreMessages,
  reset: state.reset,
  resetCurrentConversation: state.resetCurrentConversation,
});

let actions: MessageActions | null = null;
useMessageStore.subscribe(state => {
  actions = actionsSelector(state);
});

export const useMessageActions = (): MessageActions => {
  if (actions === null) {
    actions = actionsSelector(useMessageStore.getState());
  }
  return actions;
};

// Persistent store setup (optional)
import { persist } from 'zustand/middleware';

interface PersistedMessageState {
  unreadCount: number;
  currentConversationId: string | null;
  setPersistedUnreadCount: (count: number) => void;
  setPersistedCurrentConversationId: (id: string | null) => void;
}

export const usePersistedMessageStore = create<PersistedMessageState>()(
  persist(
    (set) => ({
      unreadCount: 0,
      currentConversationId: null,
      
      setPersistedUnreadCount: (count: number) => set({ unreadCount: count }),
      setPersistedCurrentConversationId: (id: string | null) => set({ currentConversationId: id }),
    }),
    {
      name: 'message-persisted-store',
      partialize: (state) => ({
        unreadCount: state.unreadCount,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
);

// Store subscriptions and effects
export const setupMessageStoreSubscriptions = () => {
  // Sync with persisted store
  useMessageStore.subscribe(
    (state) => state.unreadCount,
    (unreadCount) => {
      usePersistedMessageStore.getState().setPersistedUnreadCount(unreadCount);
    }
  );

  useMessageStore.subscribe(
    (state) => state.currentConversationId,
    (currentConversationId) => {
      usePersistedMessageStore.getState().setPersistedCurrentConversationId(currentConversationId);
    }
  );
};

// Store utilities
export const getMessageStoreState = () => useMessageStore.getState();
export const subscribeToMessageStore = useMessageStore.subscribe;

export default useMessageStore;