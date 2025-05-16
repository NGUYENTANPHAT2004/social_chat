import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RoomState, Room, RoomViewer, CreateRoomDto, UpdateRoomDto } from '@/types';
import { API_ENDPOINTS } from '@/constants';
import api from '@/services/api';

const initialState: RoomState = {
  rooms: [],
  myRooms: [],
  liveRooms: [],
  currentRoom: null,
  viewers: [],
  loading: false,
  error: null,
  streamUrl: null,
};

// Async thunks
export const fetchAllRooms = createAsyncThunk(
  'room/fetchAllRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.ROOMS);
      return response.data.data.items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rooms');
    }
  }
);

export const fetchLiveRooms = createAsyncThunk(
  'room/fetchLiveRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.LIVE_ROOMS);
      return response.data.data.items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch live rooms');
    }
  }
);

export const fetchMyRooms = createAsyncThunk(
  'room/fetchMyRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.MY_ROOMS);
      return response.data.data.items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your rooms');
    }
  }
);

export const fetchRoomById = createAsyncThunk(
  'room/fetchRoomById',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.ROOM_BY_ID(roomId));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch room');
    }
  }
);

export const createRoom = createAsyncThunk(
  'room/createRoom',
  async (roomData: CreateRoomDto, { rejectWithValue }) => {
    try {
      const response = await api.post(API_ENDPOINTS.ROOMS, roomData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create room');
    }
  }
);

export const updateRoom = createAsyncThunk(
  'room/updateRoom',
  async ({ roomId, roomData }: { roomId: string; roomData: UpdateRoomDto }, { rejectWithValue }) => {
    try {
      const response = await api.patch(API_ENDPOINTS.ROOM_BY_ID(roomId), roomData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update room');
    }
  }
);

export const deleteRoom = createAsyncThunk(
  'room/deleteRoom',
  async (roomId: string, { rejectWithValue }) => {
    try {
      await api.delete(API_ENDPOINTS.ROOM_BY_ID(roomId));
      return roomId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete room');
    }
  }
);

export const startStream = createAsyncThunk(
  'room/startStream',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.ROOM_BY_ID(roomId)}/start-stream`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start stream');
    }
  }
);

export const endStream = createAsyncThunk(
  'room/endStream',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.ROOM_BY_ID(roomId)}/end-stream`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end stream');
    }
  }
);

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setCurrentRoom: (state, action: PayloadAction<Room>) => {
      state.currentRoom = action.payload;
      
      // Set HLS stream URL
      if (action.payload && action.payload.status === 'live') {
        const streamEndpoint = process.env.NEXT_PUBLIC_STREAMING_URL || 'http://localhost:5000/live';
        state.streamUrl = `${streamEndpoint}/${action.payload.streamKey}.m3u8`;
      } else {
        state.streamUrl = null;
      }
    },
    
    clearCurrentRoom: (state) => {
      state.currentRoom = null;
      state.viewers = [];
      state.streamUrl = null;
    },
    
    addViewer: (state, action: PayloadAction<RoomViewer>) => {
      if (!state.viewers.some(viewer => viewer.userId === action.payload.userId)) {
        state.viewers.push(action.payload);
      }
      
      // Update viewer count in current room
      if (state.currentRoom && state.currentRoom.id === action.payload.roomId) {
        state.currentRoom.viewers = state.viewers.length;
      }
    },
    
    removeViewer: (state, action: PayloadAction<string>) => {
      state.viewers = state.viewers.filter(viewer => viewer.userId !== action.payload);
      
      // Update viewer count in current room
      if (state.currentRoom) {
        state.currentRoom.viewers = state.viewers.length;
      }
    },
    
    updateViewerCount: (state, action: PayloadAction<{roomId: string; count: number}>) => {
      const { roomId, count } = action.payload;
      
      // Update in all room lists
      const roomIndex = state.rooms.findIndex(room => room.id === roomId);
      if (roomIndex !== -1) {
        state.rooms[roomIndex].viewers = count;
      }
      
      const liveRoomIndex = state.liveRooms.findIndex(room => room.id === roomId);
      if (liveRoomIndex !== -1) {
        state.liveRooms[liveRoomIndex].viewers = count;
      }
      
      const myRoomIndex = state.myRooms.findIndex(room => room.id === roomId);
      if (myRoomIndex !== -1) {
        state.myRooms[myRoomIndex].viewers = count;
      }
      
      // Update current room if it's the same
      if (state.currentRoom && state.currentRoom.id === roomId) {
        state.currentRoom.viewers = count;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all rooms cases
      .addCase(fetchAllRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchAllRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch live rooms cases
      .addCase(fetchLiveRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLiveRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.liveRooms = action.payload;
      })
      .addCase(fetchLiveRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch my rooms cases
      .addCase(fetchMyRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.myRooms = action.payload;
      })
      .addCase(fetchMyRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch room by id cases
      .addCase(fetchRoomById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoomById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRoom = action.payload;
        
        // Set HLS stream URL if room is live
        if (action.payload && action.payload.status === 'live') {
          const streamEndpoint = process.env.NEXT_PUBLIC_STREAMING_URL || 'http://localhost:5000/live';
          state.streamUrl = `${streamEndpoint}/${action.payload.streamKey}.m3u8`;
        } else {
          state.streamUrl = null;
        }
      })
      .addCase(fetchRoomById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create room cases
      .addCase(createRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.myRooms.push(action.payload);
        state.rooms.push(action.payload);
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update room cases
      .addCase(updateRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRoom.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update in all room lists
        const roomIndex = state.rooms.findIndex(room => room.id === action.payload.id);
        if (roomIndex !== -1) {
          state.rooms[roomIndex] = action.payload;
        }
        
        const liveRoomIndex = state.liveRooms.findIndex(room => room.id === action.payload.id);
        if (liveRoomIndex !== -1) {
          state.liveRooms[liveRoomIndex] = action.payload;
        }
        
        const myRoomIndex = state.myRooms.findIndex(room => room.id === action.payload.id);
        if (myRoomIndex !== -1) {
          state.myRooms[myRoomIndex] = action.payload;
        }
        
        // Update current room if it's the same
        if (state.currentRoom && state.currentRoom.id === action.payload.id) {
          state.currentRoom = action.payload;
        }
      })
      .addCase(updateRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete room cases
      .addCase(deleteRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRoom.fulfilled, (state, action) => {
        state.loading = false;
        
        // Remove from all room lists
        state.rooms = state.rooms.filter(room => room.id !== action.payload);
        state.liveRooms = state.liveRooms.filter(room => room.id !== action.payload);
        state.myRooms = state.myRooms.filter(room => room.id !== action.payload);
        
        // Clear current room if it's the same
        if (state.currentRoom && state.currentRoom.id === action.payload) {
          state.currentRoom = null;
          state.viewers = [];
          state.streamUrl = null;
        }
      })
      .addCase(deleteRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Start stream cases
      .addCase(startStream.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startStream.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update room status in all lists
        const updateRoomStatus = (room: Room) => {
          if (room.id === action.payload.id) {
            return { ...room, status: 'live' };
          }
          return room;
        };
        
        state.rooms = state.rooms.map(updateRoomStatus);
        state.myRooms = state.myRooms.map(updateRoomStatus);
        
        // Add to live rooms if not already there
        if (!state.liveRooms.some(room => room.id === action.payload.id)) {
          state.liveRooms.push(action.payload);
        }
        
        // Update current room if it's the same
        if (state.currentRoom && state.currentRoom.id === action.payload.id) {
          state.currentRoom = action.payload;
          
          // Set HLS stream URL
          const streamEndpoint = process.env.NEXT_PUBLIC_STREAMING_URL || 'http://localhost:5000/live';
          state.streamUrl = `${streamEndpoint}/${action.payload.streamKey}.m3u8`;
        }
      })
      .addCase(startStream.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // End stream cases
      .addCase(endStream.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(endStream.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update room status in all lists
        const updateRoomStatus = (room: Room) => {
          if (room.id === action.payload.id) {
            return { ...room, status: 'inactive' };
          }
          return room;
        };
        
        state.rooms = state.rooms.map(updateRoomStatus);
        state.myRooms = state.myRooms.map(updateRoomStatus);
        
        // Remove from live rooms
        state.liveRooms = state.liveRooms.filter(room => room.id !== action.payload.id);
        
        // Update current room if it's the same
        if (state.currentRoom && state.currentRoom.id === action.payload.id) {
          state.currentRoom = action.payload;
          state.streamUrl = null;
        }
      })
      .addCase(endStream.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setCurrentRoom, 
  clearCurrentRoom, 
  addViewer, 
  removeViewer, 
  updateViewerCount 
} = roomSlice.actions;

export default roomSlice.reducer;