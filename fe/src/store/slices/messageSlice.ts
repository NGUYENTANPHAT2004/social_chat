// src/store/slices/messageSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  MessageService, 
  Message, 
  Conversation, 
  SendMessageDto, 
  ConversationQueryParams,
  MessageQueryParams 
} from '@/services/message.service';
import { PaginatedResponse } from '@/types';

export interface MessageState {
  // Conversations
  conversations: Conversation[];
  currentConversation: Conversation | null;
  
  // Messages
  messages: { [conversationId: string]: Message[] };
  
  // UI state
  loading: boolean;
  sending: boolean;
  error: string | null;
  
  // Unread counts
  totalUnreadCount: number;
  
  // Pagination
  pagination: {
    conversations: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
    messages: { [conversationId: string]: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
      oldestMessageId?: string;
    }};
  };
  
  // Typing indicators
  typingUsers: { [conversationId: string]: string[] };
  
  // Search
  searchResults: Message[];
  searchLoading: boolean;
  searchQuery: string;
  
  // Filters
  filters: {
    type: 'all' | 'direct' | 'group' | 'room';
    unreadOnly: boolean;
    archived: boolean;
  };
}

const initialState: MessageState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  loading: false,
  sending: false,
  error: null,
  totalUnreadCount: 0,
  pagination: {
    conversations: { page: 1, limit: 20, total: 0, hasMore: true },
    messages: {},
  },
  typingUsers: {},
  searchResults: [],
  searchLoading: false,
  searchQuery: '',
  filters: {
    type: 'all',
    unreadOnly: false,
    archived: false,
  },
};

// Async thunks
export const fetchConversations = createAsyncThunk(
  'message/fetchConversations',
  async (params?: ConversationQueryParams, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { message: MessageState };
      const { filters, pagination } = state.message;
      
      const queryParams: ConversationQueryParams = {
        page: pagination.conversations.page,
        limit: pagination.conversations.limit,
        type: filters.type !== 'all' ? filters.type : undefined,
        unreadOnly: filters.unreadOnly || undefined,
        archived: filters.archived || undefined,
        ...params,
      };
      
      const response = await MessageService.getConversations(queryParams);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'message/fetchMessages',
  async (conversationId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { message: MessageState };
      const messagePagination = state.message.pagination.messages[conversationId] || {
        page: 1,
        limit: 50,
        total: 0,
        hasMore: true,
      };
      
      const queryParams: MessageQueryParams = {
        page: messagePagination.page,
        limit: messagePagination.limit,
        before: messagePagination.oldestMessageId,
      };
      
      const response = await MessageService.getConversationMessages(conversationId, queryParams);
      return { conversationId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'message/sendMessage',
  async (data: SendMessageDto, { rejectWithValue }) => {
    try {
      const message = await MessageService.sendMessage(data);
      return message;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'message/deleteConversation',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      await MessageService.deleteConversation(conversationId);
      return conversationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete conversation');
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  'message/markAsRead',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      await MessageService.markConversationAsRead(conversationId);
      return conversationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'message/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await MessageService.getUnreadCount();
      return response.count;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const getOrCreateConversationWithUser = createAsyncThunk(
  'message/getOrCreateConversationWithUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const conversation = await MessageService.getOrCreateConversationWithUser(userId);
      return conversation;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create conversation');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'message/deleteMessage',
  async ({ messageId, conversationId }: { messageId: string; conversationId: string }, { rejectWithValue }) => {
    try {
      await MessageService.deleteMessage(messageId);
      return { messageId, conversationId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete message');
    }
  }
);

export const searchMessages = createAsyncThunk(
  'message/searchMessages',
  async ({ query, conversationId }: { query: string; conversationId?: string }, { rejectWithValue }) => {
    try {
      const response = await MessageService.searchMessages(query, conversationId);
      return { query, results: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search messages');
    }
  }
);

// Message slice
const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    setCurrentConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.currentConversation = action.payload;
      
      // Mark conversation as read when opened
      if (action.payload && action.payload.unreadCount > 0) {
        const conversation = state.conversations.find(c => c._id === action.payload!._id);
        if (conversation) {
          conversation.unreadCount = 0;
        }
      }
    },
    
    setFilters: (state, action: PayloadAction<Partial<MessageState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset pagination when filters change
      state.pagination.conversations.page = 1;
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.conversations.page = 1;
    },
    
    // Real-time message handling
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const conversationId = message.conversation;
      
      // Add message to conversation
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      
      // Avoid duplicates
      const messageExists = state.messages[conversationId].some(m => m._id === message._id);
      if (!messageExists) {
        state.messages[conversationId].push(message);
      }
      
      // Update conversation last message
      const conversation = state.conversations.find(c => c._id === conversationId);
      if (conversation) {
        conversation.lastMessage = message;
        conversation.updatedAt = message.createdAt;
        
        // Move conversation to top
        state.conversations = [
          conversation,
          ...state.conversations.filter(c => c._id !== conversationId)
        ];
      }
    },
    
    updateMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const conversationId = message.conversation;
      
      if (state.messages[conversationId]) {
        const index = state.messages[conversationId].findIndex(m => m._id === message._id);
        if (index !== -1) {
          state.messages[conversationId][index] = message;
        }
      }
    },
    
    removeMessage: (state, action: PayloadAction<{ messageId: string; conversationId: string }>) => {
      const { messageId, conversationId } = action.payload;
      
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].filter(m => m._id !== messageId);
      }
    },
    
    // Typing indicators
    setTypingUsers: (state, action: PayloadAction<{ conversationId: string; users: string[] }>) => {
      const { conversationId, users } = action.payload;
      state.typingUsers[conversationId] = users;
    },
    
    addTypingUser: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload;
      
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = [];
      }
      
      if (!state.typingUsers[conversationId].includes(userId)) {
        state.typingUsers[conversationId].push(userId);
      }
    },
    
    removeTypingUser: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload;
      
      if (state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(id => id !== userId);
      }
    },
    
    // Search
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    // Conversation management
    updateConversationUnreadCount: (state, action: PayloadAction<{ conversationId: string; count: number }>) => {
      const { conversationId, count } = action.payload;
      const conversation = state.conversations.find(c => c._id === conversationId);
      
      if (conversation) {
        const oldCount = conversation.unreadCount;
        conversation.unreadCount = count;
        
        // Update total unread count
        state.totalUnreadCount = state.totalUnreadCount - oldCount + count;
      }
    },
    
    archiveConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const conversation = state.conversations.find(c => c._id === conversationId);
      
      if (conversation) {
        conversation.isArchived = true;
      }
    },
    
    unarchiveConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const conversation = state.conversations.find(c => c._id === conversationId);
      
      if (conversation) {
        conversation.isArchived = false;
      }
    },
    
    muteConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const conversation = state.conversations.find(c => c._id === conversationId);
      
      if (conversation) {
        conversation.isMuted = true;
      }
    },
    
    unmuteConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      const conversation = state.conversations.find(c => c._id === conversationId);
      
      if (conversation) {
        conversation.isMuted = false;
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        const { items, pagination } = action.payload;
        
        if (state.pagination.conversations.page === 1) {
          state.conversations = items;
        } else {
          state.conversations.push(...items);
        }
        
        state.pagination.conversations = {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          hasMore: pagination.page < pagination.totalPages,
        };
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { conversationId, items, pagination } = action.payload;
        
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        
        const currentPagination = state.pagination.messages[conversationId] || {
          page: 1,
          limit: 50,
          total: 0,
          hasMore: true,
        };
        
        if (currentPagination.page === 1) {
          state.messages[conversationId] = items;
        } else {
          // Prepend older messages
          state.messages[conversationId] = [...items, ...state.messages[conversationId]];
        }
        
        state.pagination.messages[conversationId] = {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          hasMore: pagination.page < pagination.totalPages,
          oldestMessageId: items.length > 0 ? items[0]._id : undefined,
        };
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        const message = action.payload;
        const conversationId = message.conversation;
        
        // Add message to conversation
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId].push(message);
        
        // Update conversation
        const conversation = state.conversations.find(c => c._id === conversationId);
        if (conversation) {
          conversation.lastMessage = message;
          conversation.updatedAt = message.createdAt;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload as string;
      })
      
      // Delete conversation
      .addCase(deleteConversation.fulfilled, (state, action) => {
        const conversationId = action.payload;
        
        state.conversations = state.conversations.filter(c => c._id !== conversationId);
        delete state.messages[conversationId];
        delete state.pagination.messages[conversationId];
        
        if (state.currentConversation && state.currentConversation._id === conversationId) {
          state.currentConversation = null;
        }
      })
      
      // Mark as read
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const conversationId = action.payload;
        const conversation = state.conversations.find(c => c._id === conversationId);
        
        if (conversation && conversation.unreadCount > 0) {
          state.totalUnreadCount -= conversation.unreadCount;
          conversation.unreadCount = 0;
        }
      })
      
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.totalUnreadCount = action.payload;
      })
      
      // Get or create conversation
      .addCase(getOrCreateConversationWithUser.fulfilled, (state, action) => {
        const conversation = action.payload;
        
        // Check if conversation already exists
        const existingIndex = state.conversations.findIndex(c => c._id === conversation._id);
        
        if (existingIndex !== -1) {
          state.conversations[existingIndex] = conversation;
        } else {
          state.conversations.unshift(conversation);
        }
        
        state.currentConversation = conversation;
      })
      
      // Delete message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { messageId, conversationId } = action.payload;
        
        if (state.messages[conversationId]) {
          state.messages[conversationId] = state.messages[conversationId].filter(m => m._id !== messageId);
        }
      })
      
      // Search messages
      .addCase(searchMessages.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchQuery = action.payload.query;
        state.searchResults = action.payload.results.items;
      })
      .addCase(searchMessages.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setCurrentConversation,
  setFilters,
  clearFilters,
  addMessage,
  updateMessage,
  removeMessage,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  clearSearchResults,
  setSearchQuery,
  updateConversationUnreadCount,
  archiveConversation,
  unarchiveConversation,
  muteConversation,
  unmuteConversation,
} = messageSlice.actions;

export default messageSlice.reducer;