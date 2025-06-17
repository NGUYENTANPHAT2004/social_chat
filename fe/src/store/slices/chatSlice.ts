import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ChatState, MessageWithSender, ChatRoom, SendMessageDto } from '@/types';
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
      const response = await api.get(API_ENDPOINTS.CHAT_ROOMS);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chat rooms');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.CHAT_MESSAGES(roomId));
      return { roomId, messages: response.data.data.items };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ roomId, content }: { roomId: string; content: string }, { rejectWithValue }) => {
    try {
      const messageData: SendMessageDto = { content };
      const response = await api.post(API_ENDPOINTS.CHAT_MESSAGES(roomId), messageData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
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
    
    addMessage: (state, action: PayloadAction<MessageWithSender>) => {
      const { roomId } = action.payload;
      
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      
      state.messages[roomId].push(action.payload);
      
      // Update last message in chat rooms
      const chatRoomIndex = state.chatRooms.findIndex(room => room.id === roomId);
      if (chatRoomIndex !== -1) {
        state.chatRooms[chatRoomIndex].lastMessage = action.payload.content;
        state.chatRooms[chatRoomIndex].lastMessageTime = action.payload.createdAt;
        
        // Increment unread count if this isn't the active chat
        if (state.activeChat !== roomId) {
          state.chatRooms[chatRoomIndex].unreadCount += 1;
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
      const chatRoom = state.chatRooms.find(room => room.id === action.payload);
      if (chatRoom) {
        chatRoom.unreadCount = 0;
      }
    },
    
    updateUserOnlineStatus: (state, action: PayloadAction<{ userId: string; isOnline: boolean }>) => {
      const { userId, isOnline } = action.payload;
      
      // Update online status in chat rooms
      state.chatRooms.forEach(room => {
        if (room.id === userId || (room.participants && room.participants.some(p => p.id === userId))) {
          room.isOnline = isOnline;
        }
      });
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
        
        const { roomId } = action.payload;
        
        if (!state.messages[roomId]) {
          state.messages[roomId] = [];
        }
        
        const messageWithSender: MessageWithSender = {
          ...action.payload,
          isMine: true,
          sender: {
            id: action.payload.userId,
            username: '',  // Will be filled by the app
            avatar: ''    // Will be filled by the app
          }
        };
        
        state.messages[roomId].push(messageWithSender);
        state.inputText = '';
      })
      .addCase(sendMessage.rejected, (state, action) => {
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
} = chatSlice.actions;

export default chatSlice.reducer;