// src/hooks/useUserProfile.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ProfileService, UserService } from '@/services/profile';
import { 
  UpdateProfileDto, 
  UpdateSettingsDto, 
  User, 
  UserBasic,
  FollowersResponse,
  FollowingResponse 
} from '@/types/user';

export const useUserProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update current user profile
  const updateProfile = useCallback(async (data: UpdateProfileDto) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await ProfileService.updateProfile(data);
      updateUser(updatedUser);
      
      return updatedUser;
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  // Update user settings
  const updateSettings = useCallback(async (settings: UpdateSettingsDto) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await ProfileService.updateSettings(settings);
      updateUser(updatedUser);
      
      return updatedUser;
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || 'Failed to update settings';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  // Update avatar
  const updateAvatar = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await ProfileService.updateAvatar(file);
      updateUser(updatedUser);
      
      return updatedUser;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update avatar';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  return {
    user,
    loading,
    error,
    updateProfile,
    updateSettings,
    updateAvatar,
    clearError,
  };
};

// Hook for managing other users (public profiles)
export const useUser = (userId?: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [followers, setFollowers] = useState<UserBasic[]>([]);
  const [following, setFollowing] = useState<UserBasic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch user by ID
  const fetchUser = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await UserService.getUserById(id);
      setUser(userData);
      
      return userData;
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch user';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user by username
  const fetchUserByUsername = useCallback(async (username: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await UserService.getUserByUsername(username);
      setUser(userData);
      
      return userData;
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch user';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Follow user
  const followUser = useCallback(async (targetUserId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await UserService.followUser(targetUserId);
      setIsFollowing(true);
      
      // Update followers count if we have the user data
      if (user && user.id === targetUserId) {
        setUser(prev => prev ? {
          ...prev,
          stats: {
            ...prev.stats!,
            followersCount: (prev.stats?.followersCount || 0) + 1
          }
        } : null);
      }
      
      return true;
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || 'Failed to follow user';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Unfollow user
  const unfollowUser = useCallback(async (targetUserId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await UserService.unfollowUser(targetUserId);
      setIsFollowing(false);
      
      // Update followers count if we have the user data
      if (user && user.id === targetUserId) {
        setUser(prev => prev ? {
          ...prev,
          stats: {
            ...prev.stats!,
            followersCount: Math.max((prev.stats?.followersCount || 0) - 1, 0)
          }
        } : null);
      }
      
      return true;
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || 'Failed to unfollow user';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch followers
  const fetchFollowers = useCallback(async (targetUserId: string, page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: FollowersResponse = await UserService.getFollowers(targetUserId, page, limit);
      setFollowers(response.followers);
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch followers';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch following
  const fetchFollowing = useCallback(async (targetUserId: string, page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);
      
      const response: FollowingResponse = await UserService.getFollowing(targetUserId, page, limit);
      setFollowing(response.following);
      
      return response;
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch following';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    followers,
    following,
    loading,
    error,
    isFollowing,
    fetchUser,
    fetchUserByUsername,
    followUser,
    unfollowUser,
    fetchFollowers,
    fetchFollowing,
    clearError,
  };
};

// Hook for push notifications
export const usePushNotifications = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Register device token
  const registerDeviceToken = useCallback(async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await ProfileService.addDeviceToken(token);
      
      // Update user device tokens if needed
      if (user && !user.deviceTokens.includes(token)) {
        updateUser({
          ...user,
          deviceTokens: [...user.deviceTokens, token]
        });
      }
      
      return true;
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || 'Failed to register device token';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, updateUser]);

  // Unregister device token
  const unregisterDeviceToken = useCallback(async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await ProfileService.removeDeviceToken(token);
      
      // Update user device tokens
      if (user) {
        updateUser({
          ...user,
          deviceTokens: user.deviceTokens.filter(t => t !== token)
        });
      }
      
      return true;
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || 'Failed to unregister device token';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, updateUser]);

  // Update push settings
  const updatePushSettings = useCallback(async (settings: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedSettings = await ProfileService.updatePushSettings(settings);
      
      // Update user push settings
      if (user) {
        updateUser({
          ...user,
          pushSettings: updatedSettings
        });
      }
      
      return updatedSettings;
    } catch (err: unknown) {
      const errorMessage = err.response?.data?.message || 'Failed to update push settings';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, updateUser]);

  return {
    loading,
    error,
    registerDeviceToken,
    unregisterDeviceToken,
    updatePushSettings,
    clearError,
  };
};