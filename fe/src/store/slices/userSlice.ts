import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserState, UserProfile, UserBasic, Transaction, Notification } from '@/types';
import { API_ENDPOINTS } from '@/constants';
import api from '@/services/api';

const initialState: UserState = {
  profile: null,
  otherProfiles: {},
  friends: [],
  friendRequests: {
    incoming: [],
    outgoing: [],
  },
  transactions: [],
  notifications: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.USER_PROFILE);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.USER_BY_ID(userId));
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      const response = await api.patch(API_ENDPOINTS.USER_PROFILE, profileData);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post(`${API_ENDPOINTS.USER_PROFILE}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload avatar');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'user/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.USER_TRANSACTIONS);
      return response.data.data.items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const fetchFriends = createAsyncThunk(
  'user/fetchFriends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/friends');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch friends');
    }
  }
);

export const fetchFriendRequests = createAsyncThunk(
  'user/fetchFriendRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/friends/requests');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch friend requests');
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'user/sendFriendRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.post(`/users/friends/requests/${userId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send friend request');
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  'user/acceptFriendRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/users/friends/requests/${userId}/accept`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to accept friend request');
    }
  }
);

export const rejectFriendRequest = createAsyncThunk(
  'user/rejectFriendRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/users/friends/requests/${userId}/reject`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject friend request');
    }
  }
);

export const removeFriend = createAsyncThunk(
  'user/removeFriend',
  async (userId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/users/friends/${userId}`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove friend');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'user/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/notifications');
      return response.data.data.items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'user/markNotificationAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/users/notifications/${notificationId}/read`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
    
    updateBalance: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.kcBalance = action.payload;
      }
    },
    
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
    },
    
    updateUserStatus: (state, action: PayloadAction<{ userId: string; isOnline: boolean }>) => {
      const { userId, isOnline } = action.payload;
      
      // Update in friends list
      const friendIndex = state.friends.findIndex(friend => friend.id === userId);
      if (friendIndex !== -1) {
        state.friends[friendIndex].isOnline = isOnline;
      }
      
      // Update in other profiles
      if (state.otherProfiles[userId]) {
        state.otherProfiles[userId].status = isOnline ? 'active' : 'inactive';
      }
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile cases
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch user by id cases
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.otherProfiles[action.payload.id] = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update user profile cases
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Upload avatar cases
      .addCase(uploadAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.avatar = action.payload.avatar;
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch transactions cases
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch friends cases
      .addCase(fetchFriends.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch friend requests cases
      .addCase(fetchFriendRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.friendRequests = action.payload;
      })
      .addCase(fetchFriendRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Send friend request cases
      .addCase(sendFriendRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.friendRequests.outgoing.push(action.payload);
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Accept friend request cases
      .addCase(acceptFriendRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        state.loading = false;
        
        // Add to friends list
        state.friends.push(action.payload);
        
        // Remove from incoming requests
        state.friendRequests.incoming = state.friendRequests.incoming.filter(
          request => request.id !== action.payload.id
        );
      })
      .addCase(acceptFriendRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reject friend request cases
      .addCase(rejectFriendRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        state.loading = false;
        
        // Remove from incoming requests
        state.friendRequests.incoming = state.friendRequests.incoming.filter(
          request => request.id !== action.payload.id
        );
      })
      .addCase(rejectFriendRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Remove friend cases
      .addCase(removeFriend.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.loading = false;
        
        // Remove from friends list
        state.friends = state.friends.filter(friend => friend.id !== action.payload);
      })
      .addCase(removeFriend.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch notifications cases
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Mark notification as read cases
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update notification in list
        const notificationIndex = state.notifications.findIndex(
          notification => notification.id === action.payload.id
        );
        
        if (notificationIndex !== -1) {
          state.notifications[notificationIndex].isRead = true;
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setProfile, 
  updateBalance, 
  addNotification, 
  updateUserStatus,
  clearNotifications
} = userSlice.actions;

export default userSlice.reducer;