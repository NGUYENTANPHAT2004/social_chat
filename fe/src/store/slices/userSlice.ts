// fe/src/store/slices/userSlice.ts - Simplified and Optimized
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserState, UpdateProfileDto, UpdateSettingsDto, FollowResponse } from '@/types/user';
import { apiService } from '@/services/api';

const initialState: UserState = {
  currentUser: null,
  users: {},
  followers: {},
  following: {},
  loading: false,
  error: null,
};

// Async thunks - Simplified
export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get<User>('/users/me/profile');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.get<User>(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: UpdateProfileDto, { rejectWithValue }) => {
    try {
      const response = await apiService.patch<User>('/users/me/profile', profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateSettings = createAsyncThunk(
  'user/updateSettings',
  async (settings: UpdateSettingsDto, { rejectWithValue }) => {
    try {
      const response = await apiService.patch<User>('/users/me/settings', settings);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update settings');
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'user/uploadAvatar',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await apiService.patch<User>('/users/me/avatar', formData);
      return response.data;

    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload avatar');
    }
  }
);


export const followUser = createAsyncThunk(
  'user/followUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await apiService.post(`/users/${userId}/follow`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to follow user');
    }
  }
);

export const unfollowUser = createAsyncThunk(
  'user/unfollowUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await apiService.delete(`/users/${userId}/follow`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unfollow user');
    }
  }
);

export const fetchFollowers = createAsyncThunk(
  'user/fetchFollowers',
  async ({ userId, page = 1, limit = 20 }: { userId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.get<FollowResponse>(`/users/${userId}/followers`, {
        params: { page, limit }
      });
      return { userId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch followers');
    }
  }
);

export const fetchFollowing = createAsyncThunk(
  'user/fetchFollowing',
  async ({ userId, page = 1, limit = 20 }: { userId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.get<FollowResponse>(`/users/${userId}/following`, {
        params: { page, limit }
      });
      return { userId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch following');
    }
  }
);

export const searchUsers = createAsyncThunk(
  'user/searchUsers',
  async ({ query, limit = 10 }: { query: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await apiService.get<User[]>('/users/search', {
        params: { q: query, limit }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search users');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Simple synchronous actions
    updateBalance: (state, action: PayloadAction<number>) => {
      if (state.currentUser) {
        state.currentUser.kcBalance = action.payload;
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    
    updateUserInCache: (state, action: PayloadAction<User>) => {
      const user = action.payload;
      state.users[user.id] = user;
      
      // Update current user if it's the same
      if (state.currentUser?.id === user.id) {
        state.currentUser = user;
      }
    },
    
    removeUserFromCache: (state, action: PayloadAction<string>) => {
      delete state.users[action.payload];
    },
    
    setOnlineStatus: (state, action: PayloadAction<{ userId: string; isOnline: boolean }>) => {
      const { userId, isOnline } = action.payload;
      
      if (state.users[userId]) {
        state.users[userId].isOnline = isOnline;
      }
      
      if (state.currentUser?.id === userId) {
        state.currentUser.isOnline = isOnline;
      }
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.users[action.payload.id] = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch user by ID
      .addCase(fetchUserById.fulfilled, (state, action) => {
        const user = action.payload;
        state.users[user.id] = user;
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.users[action.payload.id] = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update settings
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.users[action.payload.id] = action.payload;
      })
      
      // Upload avatar
      .addCase(uploadAvatar.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload;
        state.users[action.payload.id] = action.payload;
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Follow user
      .addCase(followUser.fulfilled, (state, action) => {
        const userId = action.payload;
        if (state.currentUser) {
          state.currentUser.following.push(userId);
        }
      })
      
      // Unfollow user
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const userId = action.payload;
        if (state.currentUser) {
          state.currentUser.following = state.currentUser.following.filter(id => id !== userId);
        }
      })
      
      // Fetch followers
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        const { userId, data } = action.payload;
        state.followers[userId] = data.users;
      })
      
      // Fetch following
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        const { userId, data } = action.payload;
        state.following[userId] = data.users;
      })
      
      // Search users
      .addCase(searchUsers.fulfilled, (state, action) => {
        // Cache searched users
        action.payload.forEach(user => {
          state.users[user.id] = user;
        });
      });
  },
});

export const {
  updateBalance,
  clearError,
  setCurrentUser,
  updateUserInCache,
  removeUserFromCache,
  setOnlineStatus,
} = userSlice.actions;

// Selectors
export const selectCurrentUser = (state: { user: UserState }) => state.user.currentUser;
export const selectUserById = (userId: string) => (state: { user: UserState }) => state.user.users[userId];
export const selectUserLoading = (state: { user: UserState }) => state.user.loading;
export const selectUserError = (state: { user: UserState }) => state.user.error;
export const selectFollowers = (userId: string) => (state: { user: UserState }) => state.user.followers[userId] || [];
export const selectFollowing = (userId: string) => (state: { user: UserState }) => state.user.following[userId] || [];

export default userSlice.reducer;