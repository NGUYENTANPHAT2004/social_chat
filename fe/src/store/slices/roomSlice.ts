import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RoomState, Room, UserBasic, CreateRoomDto, UpdateRoomDto, ApiResponse, PaginatedResponse } from '@/types';
import { API_ENDPOINTS } from '@/constants';
import api from '@/services/api';

// Define RoomViewer interface
interface RoomViewer extends UserBasic {
  roomId: string;
}

// Extend Room interface to include streaming properties
interface ExtendedRoom extends Room {
  status: 'live' | 'inactive';
  streamKey: string;
  viewers: number;
}

// Update RoomState interface
interface ExtendedRoomState extends Omit<RoomState, 'rooms' | 'myRooms' | 'liveRooms' | 'currentRoom'> {
  rooms: ExtendedRoom[];
  myRooms: ExtendedRoom[];
  liveRooms: ExtendedRoom[];
  currentRoom: ExtendedRoom | null;
}

const initialState: ExtendedRoomState = {
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
      const response = await api.get<ApiResponse<PaginatedResponse<ExtendedRoom>>>(API_ENDPOINTS.ROOMS);
      const rooms = response.data.data.items.map(room => ({
        ...room,
        status: room.status as 'live' | 'inactive'
      }));
      return rooms;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch rooms');
    }
  }
);

export const fetchLiveRooms = createAsyncThunk(
  'room/fetchLiveRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<PaginatedResponse<ExtendedRoom>>>(API_ENDPOINTS.LIVE_ROOMS);
      const rooms = response.data.data.items.map(room => ({
        ...room,
        status: room.status as 'live' | 'inactive'
      }));
      return rooms;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch live rooms');
    }
  }
);

export const fetchMyRooms = createAsyncThunk(
  'room/fetchMyRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<PaginatedResponse<ExtendedRoom>>>(API_ENDPOINTS.MY_ROOMS);
      const rooms = response.data.data.items.map(room => ({
        ...room,
        status: room.status as 'live' | 'inactive'
      }));
      return rooms;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your rooms');
    }
  }
);

export const fetchRoomById = createAsyncThunk(
  'room/fetchRoomById',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<ExtendedRoom>>(API_ENDPOINTS.ROOM_BY_ID(roomId));
      const room = {
        ...response.data.data,
        status: response.data.data.status as 'live' | 'inactive'
      };
      return room;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch room');
    }
  }
);

export const createRoom = createAsyncThunk(
  'room/createRoom',
  async (roomData: CreateRoomDto, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<ExtendedRoom>>(API_ENDPOINTS.ROOMS, roomData);
      const room = {
        ...response.data.data,
        status: response.data.data.status as 'live' | 'inactive'
      };
      return room;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create room');
    }
  }
);

export const updateRoom = createAsyncThunk(
  'room/updateRoom',
  async ({ roomId, roomData }: { roomId: string; roomData: UpdateRoomDto }, { rejectWithValue }) => {
    try {
      const response = await api.patch<ApiResponse<ExtendedRoom>>(API_ENDPOINTS.ROOM_BY_ID(roomId), roomData);
      const room = {
        ...response.data.data,
        status: response.data.data.status as 'live' | 'inactive'
      };
      return room;
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
      const response = await api.post<ApiResponse<ExtendedRoom>>(`${API_ENDPOINTS.ROOM_BY_ID(roomId)}/start-stream`);
      const room = {
        ...response.data.data,
        status: 'live' as const
      };
      return room;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start stream');
    }
  }
);

export const endStream = createAsyncThunk(
  'room/endStream',
  async (roomId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<ExtendedRoom>>(`${API_ENDPOINTS.ROOM_BY_ID(roomId)}/end-stream`);
      const room = {
        ...response.data.data,
        status: 'inactive' as const
      };
      return room;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end stream');
    }
  }
);

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setCurrentRoom: (state, action: PayloadAction<ExtendedRoom>) => {
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
      if (!state.viewers.some(viewer => viewer.id === action.payload.id)) {
        state.viewers.push(action.payload);
      }
      
      // Update viewer count in current room
      if (state.currentRoom && state.currentRoom.id === action.payload.roomId) {
        state.currentRoom.viewers = state.viewers.length;
      }
    },
    
    removeViewer: (state, action: PayloadAction<string>) => {
      state.viewers = state.viewers.filter(viewer => viewer.id !== action.payload);
      
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
      .addCase(fetchAllRooms.fulfilled, (state, action: PayloadAction<ExtendedRoom[]>) => {
        state.loading = false;
        state.rooms = action.payload.map(room => ({
          ...room,
          status: room.status as 'live' | 'inactive'
        }));
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
      .addCase(fetchLiveRooms.fulfilled, (state, action: PayloadAction<ExtendedRoom[]>) => {
        state.loading = false;
        state.liveRooms = action.payload.map(room => ({
          ...room,
          status: room.status as 'live' | 'inactive'
        }));
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
      .addCase(fetchMyRooms.fulfilled, (state, action: PayloadAction<ExtendedRoom[]>) => {
        state.loading = false;
        state.myRooms = action.payload.map(room => ({
          ...room,
          status: room.status as 'live' | 'inactive'
        }));
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
      .addCase(fetchRoomById.fulfilled, (state, action: PayloadAction<ExtendedRoom>) => {
        state.loading = false;
        state.currentRoom = {
          ...action.payload,
          status: action.payload.status as 'live' | 'inactive'
        };
        
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
      .addCase(createRoom.fulfilled, (state, action: PayloadAction<ExtendedRoom>) => {
        state.loading = false;
        const newRoom = {
          ...action.payload,
          status: action.payload.status as 'live' | 'inactive'
        };
        state.myRooms.push(newRoom);
        state.rooms.push(newRoom);
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
      .addCase(updateRoom.fulfilled, (state, action: PayloadAction<ExtendedRoom>) => {
        state.loading = false;
        const updatedRoom = {
          ...action.payload,
          status: action.payload.status as 'live' | 'inactive'
        };
        
        // Update in all room lists
        const roomIndex = state.rooms.findIndex(room => room.id === updatedRoom.id);
        if (roomIndex !== -1) {
          state.rooms[roomIndex] = updatedRoom;
        }
        
        const liveRoomIndex = state.liveRooms.findIndex(room => room.id === updatedRoom.id);
        if (liveRoomIndex !== -1) {
          state.liveRooms[liveRoomIndex] = updatedRoom;
        }
        
        const myRoomIndex = state.myRooms.findIndex(room => room.id === updatedRoom.id);
        if (myRoomIndex !== -1) {
          state.myRooms[myRoomIndex] = updatedRoom;
        }
        
        // Update current room if it's the same
        if (state.currentRoom && state.currentRoom.id === updatedRoom.id) {
          state.currentRoom = updatedRoom;
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
      .addCase(startStream.fulfilled, (state, action: PayloadAction<ExtendedRoom>) => {
        state.loading = false;
        
        // Update room status in all lists
        const updateRoomStatus = (room: ExtendedRoom) => {
          if (room.id === action.payload.id) {
            return { ...room, status: 'live' as const };
          }
          return room;
        };
        
        state.rooms = state.rooms.map(updateRoomStatus);
        state.myRooms = state.myRooms.map(updateRoomStatus);
        
        // Add to live rooms if not already there
        if (!state.liveRooms.some(room => room.id === action.payload.id)) {
          state.liveRooms.push({
            ...action.payload,
            status: 'live' as const
          });
        }
        
        // Update current room if it's the same
        if (state.currentRoom && state.currentRoom.id === action.payload.id) {
          state.currentRoom = {
            ...action.payload,
            status: 'live' as const
          };
          
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
      .addCase(endStream.fulfilled, (state, action: PayloadAction<ExtendedRoom>) => {
        state.loading = false;
        
        // Update room status in all lists
        const updateRoomStatus = (room: ExtendedRoom) => {
          if (room.id === action.payload.id) {
            return { ...room, status: 'inactive' as const };
          }
          return room;
        };
        
        state.rooms = state.rooms.map(updateRoomStatus);
        state.myRooms = state.myRooms.map(updateRoomStatus);
        
        // Remove from live rooms
        state.liveRooms = state.liveRooms.filter(room => room.id !== action.payload.id);
        
        // Update current room if it's the same
        if (state.currentRoom && state.currentRoom.id === action.payload.id) {
          state.currentRoom = {
            ...action.payload,
            status: 'inactive' as const
          };
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