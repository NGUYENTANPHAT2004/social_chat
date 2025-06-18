import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, MessageWithSender, ChatRoom, SendMessageDto, ApiResponse, PaginatedResponse } from '@/types';
import { API_ENDPOINTS, SOCKET_EVENTS } from '@/constants';
import api from '@/services/api';

const initialState: ChatState = {
  activeChat: null,
  messages: {},
  chatRooms: [],
  loading: false,
  error: null,
  inputText: '',
};

// Async thunks
export const fetchChatRooms = createAsyncThunk(
  'chat/fetchChatRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<PaginatedResponse<ChatRoom>>>(API_ENDPOINTS.CHAT_ROOMS);
      return response.data.data.items || response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chat rooms');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<PaginatedResponse<MessageWithSender>>>(API_ENDPOINTS.CHAT_MESSAGES(roomId));
      return { roomId, messages: response.data.data.items || response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ roomId, content, type = 'text' }: { roomId: string; content: string; type?: string }, { rejectWithValue }) => {
    try {
      const messageData: SendMessageDto = { content, type: type as any };
      const response = await api.post<ApiResponse<MessageWithSender>>(API_ENDPOINTS.CHAT_MESSAGES(roomId), messageData);
      return { roomId, message: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const createChatRoom = createAsyncThunk(
  'chat/createChatRoom',
  async (roomData: { name: string; type: 'private' | 'group'; participants: string[] }, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<ChatRoom>>(API_ENDPOINTS.CHAT_ROOMS, roomData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create chat room');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<string>) => {
      state.activeChat = action.payload;
      
      // Reset unread count for this chat
      const chatRoom = state.chatRooms.find(room => room.id === action.payload);
      if (chatRoom) {
        chatRoom.unreadCount = 0;
      }
    },
    resetActiveChat: (state) => {
      state.activeChat = null;
    },
    addMessage: (state, action: PayloadAction<{ roomId: string; message: MessageWithSender }>) => {
      const { roomId, message } = action.payload;
      
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      
      state.messages[roomId].push(message);
      
      // Update last message in room list
      const room = state.chatRooms.find(r => r.id === roomId);
      if (room) {
        room.lastMessage = message.content;
        room.lastMessageTime = new Date().toISOString();
        
        // Increment unread count if not active chat
        if (state.activeChat !== roomId) {
          room.unreadCount += 1;
        }
      }
    },
    setInputText: (state, action: PayloadAction<string>) => {
      state.inputText = action.payload;
    },
    clearInputText: (state) => {
      state.inputText = '';
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const room = state.chatRooms.find(r => r.id === action.payload);
      if (room) {
        room.unreadCount = 0;
      }
    },
    updateUserOnlineStatus: (state, action: PayloadAction<{ userId: string; isOnline: boolean }>) => {
      const { userId, isOnline } = action.payload;
      
      // Update in chat rooms
      state.chatRooms.forEach(room => {
        room.participants.forEach(participant => {
          if (participant.id === userId) {
            participant.isOnline = isOnline;
          }
        });
      });
      
      // Update in messages
      Object.values(state.messages).forEach(roomMessages => {
        roomMessages.forEach(message => {
          if (message.userId === userId) {
            message.user.isOnline = isOnline;
          }
        });
      });
    },
    removeMessage: (state, action: PayloadAction<{ roomId: string; messageId: string }>) => {
      const { roomId, messageId } = action.payload;
      if (state.messages[roomId]) {
        state.messages[roomId] = state.messages[roomId].filter(msg => msg.id !== messageId);
      }
    },
    updateTypingStatus: (state, action: PayloadAction<{ roomId: string; userId: string; isTyping: boolean }>) => {
      // This would be handled by Socket.IO events in real-time
      // Here for completeness
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch chat rooms cases
      .addCase(fetchChatRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.chatRooms = action.payload;
      })
      .addCase(fetchChatRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch messages cases
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages[action.payload.roomId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Send message cases
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        const { roomId, message } = action.payload;
        
        if (!state.messages[roomId]) {
          state.messages[roomId] = [];
        }
        
        state.messages[roomId].push(message);
        state.inputText = '';
        
        // Update room last message
        const room = state.chatRooms.find(r => r.id === roomId);
        if (room) {
          room.lastMessage = message.content;
          room.lastMessageTime = new Date().toISOString();
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create chat room cases
      .addCase(createChatRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChatRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.chatRooms.unshift(action.payload);
      })
      .addCase(createChatRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setActiveChat, 
  resetActiveChat, 
  addMessage,
  setInputText,
  clearInputText,
  markAsRead,
  updateUserOnlineStatus,
  removeMessage,
  updateTypingStatus,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;