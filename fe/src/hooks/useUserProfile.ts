// fe/src/hooks/useUser.ts - Simplified User Hook
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchCurrentUser,
  fetchUserById,
  updateProfile,
  updateSettings,
  uploadAvatar,
  followUser,
  unfollowUser,
  fetchFollowers,
  fetchFollowing,
  searchUsers,
  selectCurrentUser,
  selectUserById,
  selectUserLoading,
  selectUserError,
  selectFollowers,
  selectFollowing,
  clearError,
} from '@/store/slices/userSlice';
import { UpdateProfileDto, UpdateSettingsDto } from '@/types/user';

export const useUser = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const currentUser = useAppSelector(selectCurrentUser);
  const loading = useAppSelector(selectUserLoading);
  const error = useAppSelector(selectUserError);

  // Actions
  const getCurrentUser = useCallback(() => {
    return dispatch(fetchCurrentUser());
  }, [dispatch]);

  const getUserById = useCallback((id: string) => {
    return dispatch(fetchUserById(id));
  }, [dispatch]);

  const updateUserProfile = useCallback((data: UpdateProfileDto) => {
    return dispatch(updateProfile(data));
  }, [dispatch]);

  const updateUserSettings = useCallback((data: UpdateSettingsDto) => {
    return dispatch(updateSettings(data));
  }, [dispatch]);

  const updateAvatar = useCallback((file: File) => {
    return dispatch(uploadAvatar(file));
  }, [dispatch]);

  const follow = useCallback((userId: string) => {
    return dispatch(followUser(userId));
  }, [dispatch]);

  const unfollow = useCallback((userId: string) => {
    return dispatch(unfollowUser(userId));
  }, [dispatch]);

  const getFollowers = useCallback((userId: string, page?: number, limit?: number) => {
    return dispatch(fetchFollowers({ userId, page, limit }));
  }, [dispatch]);

  const getFollowing = useCallback((userId: string, page?: number, limit?: number) => {
    return dispatch(fetchFollowing({ userId, page, limit }));
  }, [dispatch]);

  const search = useCallback((query: string, limit?: number) => {
    return dispatch(searchUsers({ query, limit }));
  }, [dispatch]);

  const clearUserError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // State
    currentUser,
    loading,
    error,
    
    // Actions
    getCurrentUser,
    getUserById,
    updateUserProfile,
    updateUserSettings,
    updateAvatar,
    follow,
    unfollow,
    getFollowers,
    getFollowing,
    search,
    clearUserError,
    
    // Helper functions
    isCurrentUser: (userId: string) => currentUser?.id === userId,
    isFollowing: (userId: string) => currentUser?.following.includes(userId) || false,
  };
};

// Hook to get specific user data
export const useUserData = (userId: string) => {
  const user = useAppSelector(selectUserById(userId));
  const followers = useAppSelector(selectFollowers(userId));
  const following = useAppSelector(selectFollowing(userId));
  
  return {
    user,
    followers,
    following,
  };
};

// Hook for user validation
export const useUserValidation = () => {
  const validateUsername = useCallback((username: string): string | null => {
    if (username.length < 3 || username.length > 20) {
      return 'Username must be 3-20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  }, []);

  const validateDisplayName = useCallback((displayName: string): string | null => {
    if (displayName.length > 50) {
      return 'Display name must be less than 50 characters';
    }
    if (displayName.length < 1) {
      return 'Display name is required';
    }
    return null;
  }, []);

  const validateBio = useCallback((bio: string): string | null => {
    if (bio.length > 500) {
      return 'Bio must be less than 500 characters';
    }
    return null;
  }, []);

  const validateEmail = useCallback((email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  }, []);

  const validateAvatarFile = useCallback((file: File): string | null => {
    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return 'File size must be less than 5MB';
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, WebP, or GIF)';
    }
    
    return null;
  }, []);

  return {
    validateUsername,
    validateDisplayName,
    validateBio,
    validateEmail,
    validateAvatarFile,
  };
};