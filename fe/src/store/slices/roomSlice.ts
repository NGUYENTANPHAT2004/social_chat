// src/store/slices/roomSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RoomService, Room, CreateRoomDto, UpdateRoomDto, RoomMember, RoomQueryParams } from '@/services/room.service';
import { PaginatedResponse } from '@/types';

export interface RoomState {
  // Room lists
  rooms: Room[];
  trendingRooms: Room[];
  myRooms: Room[];
  
  // Current room details
  currentRoom: Room | null;
  roomMembers: RoomMember[];
  
  // UI state
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    rooms: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
    trending: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
    members: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
  
  // Filters
  filters: {
    search: string;
    type: 'all' | 'public' | 'private' | 'password';
    status: 'all' | 'live' | 'inactive';
    tags: string[];
  };
  
  // Streaming state
  streaming: {
    isStreaming: boolean;
    streamUrl: string | null;
    streamKey: string | null;
    viewerCount: number;
  };
}

const initialState: RoomState = {
  rooms: [],
  trendingRooms: [],
  myRooms: [],
  currentRoom: null,
  roomMembers: [],
  loading: false,
  error: null,
  pagination: {
    rooms: { page: 1, limit: 20, total: 0, hasMore: true },
    trending: { page: 1, limit: 20, total: 0, hasMore: true },
    members: { page: 1, limit: 20, total: 0, hasMore: true },
  },
  filters: {
    search: '',
    type: 'all',
    status: 'all',
    tags: [],
  },
  streaming: {
    isStreaming: false,
    streamUrl: null,
    streamKey: null,
    viewerCount: 0,
  },
};

// Async thunks
export const fetchRooms = createAsyncThunk(
  'room/fetchRooms',
  async (params?: RoomQueryParams, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { room: RoomState };
      const { filters, pagination } = state.room;
      
      const queryParams: RoomQueryParams = {
        page: pagination.rooms.page,
        limit: pagination.rooms.limit,
        search: filters.search || undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        ...params,
      };
      
      const response = await RoomService.getRooms(queryParams);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rooms');
    }
  }
);

export const fetchTrendingRooms = createAsyncThunk(
  'room/fetchTrendingRooms',
  async (params?: RoomQueryParams, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { room: RoomState };
      const { pagination } = state.room;
      
      const queryParams: RoomQueryParams = {
        page: pagination.trending.page,
        limit: pagination.trending.limit,
        ...params,
      };
      
      const response = await RoomService.getTrendingRooms(queryParams);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trending rooms');
    }
  }
);

export const fetchRoomById = createAsyncThunk(
  'room/fetchRoomById',
  async (id: string, { rejectWithValue }) => {
    try {
      const room = await RoomService.getRoomById(id);
      return room;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch room');
    }
  }
);

export const createRoom = createAsyncThunk(
  'room/createRoom',
  async (data: CreateRoomDto, { rejectWithValue }) => {
    try {
      const room = await RoomService.createRoom(data);
      return room;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create room');
    }
  }
);

export const updateRoom = createAsyncThunk(
  'room/updateRoom',
  async ({ id, data }: { id: string; data: UpdateRoomDto }, { rejectWithValue }) => {
    try {
      const room = await RoomService.updateRoom(id, data);
      return room;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update room');
    }
  }
);

export const deleteRoom = createAsyncThunk(
  'room/deleteRoom',
  async (id: string, { rejectWithValue }) => {
    try {
      await RoomService.deleteRoom(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete room');
    }
  }
);

export const joinRoom = createAsyncThunk(
  'room/joinRoom',
  async ({ id, password }: { id: string; password?: string }, { rejectWithValue }) => {
    try {
      const result = await RoomService.joinRoom(id, password);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to join room');
    }
  }
);

export const leaveRoom = createAsyncThunk(
  'room/leaveRoom',
  async (id: string, { rejectWithValue }) => {
    try {
      await RoomService.leaveRoom(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to leave room');
    }
  }
);

export const followRoom = createAsyncThunk(
  'room/followRoom',
  async (id: string, { rejectWithValue }) => {
    try {
      await RoomService.followRoom(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to follow room');
    }
  }
);

export const unfollowRoom = createAsyncThunk(
  'room/unfollowRoom',
  async (id: string, { rejectWithValue }) => {
    try {
      await RoomService.unfollowRoom(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unfollow room');
    }
  }
);

export const fetchRoomMembers = createAsyncThunk(
  'room/fetchRoomMembers',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { room: RoomState };
      const { pagination } = state.room;
      
      const response = await RoomService.getRoomMembers(id, {
        page: pagination.members.page,
        limit: pagination.members.limit,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch room members');
    }
  }
);

export const startStream = createAsyncThunk(
  'room/startStream',
  async (id: string, { rejectWithValue }) => {
    try {
      const result = await RoomService.startStream(id);
      return { roomId: id, ...result };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start stream');
    }
  }
);

export const endStream = createAsyncThunk(
  'room/endStream',
  async (id: string, { rejectWithValue }) => {
    try {
      await RoomService.endStream(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end stream');
    }
  }
);

// Room slice
const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    setFilters: (state, action: PayloadAction<Partial<RoomState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      // Reset pagination when filters change
      state.pagination.rooms.page = 1;
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.rooms.page = 1;
    },
    
    setCurrentRoom: (state, action: PayloadAction<Room | null>) => {
      state.currentRoom = action.payload;
      if (!action.payload) {
        state.roomMembers = [];
        state.streaming = initialState.streaming;
      }
    },
    
    updateRoomViewers: (state, action: PayloadAction<{ roomId: string; viewers: number }>) => {
      const { roomId, viewers } = action.payload;
      
      // Update in rooms list
      const roomIndex = state.rooms.findIndex(room => room._id === roomId);
      if (roomIndex !== -1) {
        state.rooms[roomIndex].viewers = viewers;
      }
      
      // Update in trending rooms
      const trendingIndex = state.trendingRooms.findIndex(room => room._id === roomId);
      if (trendingIndex !== -1) {
        state.trendingRooms[trendingIndex].viewers = viewers;
      }
      
      // Update current room
      if (state.currentRoom && state.currentRoom._id === roomId) {
        state.currentRoom.viewers = viewers;
        state.streaming.viewerCount = viewers;
      }
    },
    
    updateRoomStatus: (state, action: PayloadAction<{ roomId: string; status: Room['status'] }>) => {
      const { roomId, status } = action.payload;
      
      // Update in all relevant lists
      [state.rooms, state.trendingRooms, state.myRooms].forEach(roomList => {
        const roomIndex = roomList.findIndex(room => room._id === roomId);
        if (roomIndex !== -1) {
          roomList[roomIndex].status = status;
        }
      });
      
      // Update current room
      if (state.currentRoom && state.currentRoom._id === roomId) {
        state.currentRoom.status = status;
      }
    },
    
    addUserToRoom: (state, action: PayloadAction<{ roomId: string; userId: string }>) => {
      const { roomId, userId } = action.payload;
      
      if (state.currentRoom && state.currentRoom._id === roomId) {
        if (!state.currentRoom.members.includes(userId)) {
          state.currentRoom.members.push(userId);
        }
      }
    },
    
    removeUserFromRoom: (state, action: PayloadAction<{ roomId: string; userId: string }>) => {
      const { roomId, userId } = action.payload;
      
      if (state.currentRoom && state.currentRoom._id === roomId) {
        state.currentRoom.members = state.currentRoom.members.filter(id => id !== userId);
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch rooms
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        const { items, pagination } = action.payload;
        
        if (state.pagination.rooms.page === 1) {
          state.rooms = items;
        } else {
          state.rooms.push(...items);
        }
        
        state.pagination.rooms = {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          hasMore: pagination.page < pagination.totalPages,
        };
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch trending rooms
      .addCase(fetchTrendingRooms.fulfilled, (state, action) => {
        const { items, pagination } = action.payload;
        
        if (state.pagination.trending.page === 1) {
          state.trendingRooms = items;
        } else {
          state.trendingRooms.push(...items);
        }
        
        state.pagination.trending = {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          hasMore: pagination.page < pagination.totalPages,
        };
      })
      
      // Fetch room by ID
      .addCase(fetchRoomById.fulfilled, (state, action) => {
        state.currentRoom = action.payload;
        state.loading = false;
      })
      
      // Create room
      .addCase(createRoom.fulfilled, (state, action) => {
        state.rooms.unshift(action.payload);
        state.myRooms.unshift(action.payload);
      })
      
      // Update room
      .addCase(updateRoom.fulfilled, (state, action) => {
        const updatedRoom = action.payload;
        
        // Update in all lists
        [state.rooms, state.trendingRooms, state.myRooms].forEach(roomList => {
          const index = roomList.findIndex(room => room._id === updatedRoom._id);
          if (index !== -1) {
            roomList[index] = updatedRoom;
          }
        });
        
        // Update current room
        if (state.currentRoom && state.currentRoom._id === updatedRoom._id) {
          state.currentRoom = updatedRoom;
        }
      })
      
      // Delete room
      .addCase(deleteRoom.fulfilled, (state, action) => {
        const roomId = action.payload;
        
        state.rooms = state.rooms.filter(room => room._id !== roomId);
        state.trendingRooms = state.trendingRooms.filter(room => room._id !== roomId);
        state.myRooms = state.myRooms.filter(room => room._id !== roomId);
        
        if (state.currentRoom && state.currentRoom._id === roomId) {
          state.currentRoom = null;
          state.roomMembers = [];
          state.streaming = initialState.streaming;
        }
      })
      
      // Join room
      .addCase(joinRoom.fulfilled, (state, action) => {
        const { room } = action.payload;
        
        // Update current room
        state.currentRoom = room;
      })
      
      // Fetch room members
      .addCase(fetchRoomMembers.fulfilled, (state, action) => {
        const { items, pagination } = action.payload;
        
        if (state.pagination.members.page === 1) {
          state.roomMembers = items;
        } else {
          state.roomMembers.push(...items);
        }
        
        state.pagination.members = {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          hasMore: pagination.page < pagination.totalPages,
        };
      })
      
      // Start stream
      .addCase(startStream.fulfilled, (state, action) => {
        const { roomId, streamUrl, streamKey } = action.payload;
        
        state.streaming = {
          isStreaming: true,
          streamUrl,
          streamKey,
          viewerCount: 0,
        };
        
        // Update room status to live
        if (state.currentRoom && state.currentRoom._id === roomId) {
          state.currentRoom.status = 'live';
        }
      })
      
      // End stream
      .addCase(endStream.fulfilled, (state, action) => {
        const roomId = action.payload;
        
        state.streaming = initialState.streaming;
        
        // Update room status to inactive
        if (state.currentRoom && state.currentRoom._id === roomId) {
          state.currentRoom.status = 'inactive';
        }
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setCurrentRoom,
  updateRoomViewers,
  updateRoomStatus,
  addUserToRoom,
  removeUserFromRoom,
} = roomSlice.actions;

export default roomSlice.reducer;