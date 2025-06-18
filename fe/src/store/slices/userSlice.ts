// store/slices/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserState, UserProfile, Transaction, Notification, ApiResponse, PaginatedResponse } from '@/types';
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
      const response = await api.get<ApiResponse<UserProfile>>(API_ENDPOINTS.USER_PROFILE);
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
      const response = await api.get<ApiResponse<UserProfile>>(API_ENDPOINTS.USER_BY_ID(userId));
      return { userId, user: response.data.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (profileData: Partial<UserProfile>, { rejectWithValue }) => {
    try {
      const response = await api.patch<ApiResponse<UserProfile>>(API_ENDPOINTS.USER_PROFILE, profileData);
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
      
      const response = await api.post<ApiResponse<{ avatar: string; url: string }>>(
        `${API_ENDPOINTS.USER_PROFILE}/avatar`,
        formData
      );
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload avatar');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'user/fetchTransactions',
  async (params: { page?: number; limit?: number; type?: string } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.type) queryParams.append('type', params.type);
      
      const response = await api.get<ApiResponse<PaginatedResponse<Transaction>>>(`${API_ENDPOINTS.USER_TRANSACTIONS}?${queryParams.toString()}`);
      return response.data.data.items || response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'user/fetchNotifications',
  async (params: { page?: number; limit?: number; read?: boolean } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.read !== undefined) queryParams.append('read', params.read.toString());
      
      const response = await api.get<ApiResponse<PaginatedResponse<Notification>>>(`/notifications?${queryParams.toString()}`);
      return response.data.data.items || response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'user/markNotificationAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'user/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.patch('/notifications/read-all');
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }
);

export const fetchFriends = createAsyncThunk(
  'user/fetchFriends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<UserProfile[]>>('/users/friends');
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch friends');
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  'user/sendFriendRequest',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<UserProfile>>(`/users/friends/request/${userId}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send friend request');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateBalance: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.balance = action.payload;
      }
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      // Keep only last 100 transactions
      if (state.transactions.length > 100) {
        state.transactions = state.transactions.slice(0, 100);
      }
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    updateUserPreferences: (state, action: PayloadAction<any>) => {
      if (state.profile) {
        state.profile.preferences = { ...state.profile.preferences, ...action.payload };
      }
    },
    incrementGameStats: (state, action: PayloadAction<{ played: boolean; won: boolean; earnings?: number }>) => {
      if (state.profile) {
        const { played, won, earnings = 0 } = action.payload;
        if (played) state.profile.stats.gamesPlayed += 1;
        if (won) state.profile.stats.gamesWon += 1;
        if (earnings) state.profile.stats.totalEarnings += earnings;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile
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
      
      // Fetch user by ID
      .addCase(fetchUserById.fulfilled, (state, action) => {
        const { userId, user } = action.payload;
        state.otherProfiles[userId] = user;
      })
      
      // Update user profile
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
      
      // Upload avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.avatar = action.payload.avatar || action.payload.url;
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch transactions
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.transactions = action.payload;
      })
      
      // Fetch notifications
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
      })
      
      // Mark notification as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notificationId = action.payload;
        const notification = state.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
        }
      })
      
      // Mark all notifications as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
        });
      })
      
      // Fetch friends
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.friends = action.payload;
      });
  },
});

export const {
  updateBalance,
  addTransaction,
  addNotification,
  removeNotification,
  updateUserPreferences,
  incrementGameStats,
  clearError,
  clearNotifications,
} = userSlice.actions;

export default userSlice.reducer;