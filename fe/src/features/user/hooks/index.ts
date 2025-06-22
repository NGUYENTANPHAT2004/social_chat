// src/features/user/hooks/index.ts

import { 
  useQuery, 
  useMutation, 
  useQueryClient, 
  useInfiniteQuery,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { userService } from '../services';
import type {
  User,
  UserStats,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateSettingsDto,
  UpdatePushSettingsDto,
  UserSearchParams,
  UserListParams,
  PaginatedResponse,
  UserError,
} from '../type';

// Query keys
export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  user: (id: string) => [...USER_QUERY_KEYS.all, 'user', id] as const,
  userByUsername: (username: string) => [...USER_QUERY_KEYS.all, 'username', username] as const,
  currentProfile: () => [...USER_QUERY_KEYS.all, 'profile'] as const,
  search: (query: string) => [...USER_QUERY_KEYS.all, 'search', query] as const,
  followers: (id: string) => [...USER_QUERY_KEYS.all, 'followers', id] as const,
  following: (id: string) => [...USER_QUERY_KEYS.all, 'following', id] as const,
  stats: (id: string) => [...USER_QUERY_KEYS.all, 'stats', id] as const,
  list: (params: UserListParams) => [...USER_QUERY_KEYS.all, 'list', params] as const,
} as const;

/**
 * Hook lấy thông tin user theo ID
 */
export const useUser = (
  id: string,
  options?: UseQueryOptions<User, UserError>
) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.user(id),
    queryFn: async () => {
      const response = await userService.getUserById(id);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook lấy thông tin user theo username
 */
export const useUserByUsername = (
  username: string,
  options?: UseQueryOptions<User, UserError>
) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.userByUsername(username),
    queryFn: async () => {
      const response = await userService.getUserByUsername(username);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook lấy profile của user hiện tại
 */
export const useCurrentProfile = (
  options?: UseQueryOptions<User, UserError>
) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.currentProfile(),
    queryFn: async () => {
      const response = await userService.getCurrentProfile();
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Hook tìm kiếm users
 */
export const useUserSearch = (
  params: UserSearchParams,
  options?: UseQueryOptions<User[], UserError>
) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.search(params.q),
    queryFn: async () => {
      const response = await userService.searchUsers(params);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    enabled: !!params.q && params.q.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

/**
 * Hook lấy followers của user với infinite scroll
 */
export const useUserFollowers = (userId: string) => {
  return useInfiniteQuery({
    queryKey: USER_QUERY_KEYS.followers(userId),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await userService.getUserFollowers(userId, { page: pageParam, limit: 20 });
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook lấy following của user với infinite scroll
 */
export const useUserFollowing = (userId: string) => {
  return useInfiniteQuery({
    queryKey: USER_QUERY_KEYS.following(userId),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await userService.getUserFollowing(userId, { page: pageParam, limit: 20 });
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Hook lấy thống kê user
 */
export const useUserStats = (
  userId: string,
  options?: UseQueryOptions<UserStats, UserError>
) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.stats(userId),
    queryFn: async () => {
      const response = await userService.getUserStats(userId);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook lấy danh sách users (admin)
 */
export const useUserList = (
  params: UserListParams = {},
  options?: UseQueryOptions<PaginatedResponse<User>, UserError>
) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.list(params),
    queryFn: async () => {
      const response = await userService.getAllUsers(params);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

/**
 * Hook cập nhật profile
 */
export const useUpdateProfile = (
  options?: UseMutationOptions<User, UserError, UpdateProfileDto>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileDto) => {
      const response = await userService.updateProfile(data);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    onSuccess: (updatedUser) => {
      // Update current profile cache
      queryClient.setQueryData(USER_QUERY_KEYS.currentProfile(), updatedUser);
      
      // Update user cache
      queryClient.setQueryData(USER_QUERY_KEYS.user(updatedUser.id), updatedUser);
      
      // Show success message
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    },
    ...options,
  });
};

/**
 * Hook cập nhật avatar
 */
export const useUpdateAvatar = (
  options?: UseMutationOptions<User, UserError, File>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await userService.updateAvatar(file);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    onSuccess: (updatedUser) => {
      // Update current profile cache
      queryClient.setQueryData(USER_QUERY_KEYS.currentProfile(), updatedUser);
      
      // Update user cache
      queryClient.setQueryData(USER_QUERY_KEYS.user(updatedUser.id), updatedUser);
      
      toast.success('Avatar updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update avatar');
    },
    ...options,
  });
};

/**
 * Hook cập nhật settings
 */
export const useUpdateSettings = (
  options?: UseMutationOptions<User, UserError, UpdateSettingsDto>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: UpdateSettingsDto) => {
      const response = await userService.updateSettings(settings);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    onSuccess: (updatedUser) => {
      // Update current profile cache
      queryClient.setQueryData(USER_QUERY_KEYS.currentProfile(), updatedUser);
      
      // Update user cache
      queryClient.setQueryData(USER_QUERY_KEYS.user(updatedUser.id), updatedUser);
      
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update settings');
    },
    ...options,
  });
};

/**
 * Hook follow user
 */
export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await userService.followUser(userId);
      // followUser might return { success: boolean } directly or wrapped
      return response.data || response;
    },
    onSuccess: (_, userId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.followers(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.currentProfile() });
      
      toast.success('User followed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to follow user');
    },
  });
};

/**
 * Hook unfollow user
 */
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await userService.unfollowUser(userId);
      // unfollowUser might return { success: boolean } directly or wrapped
      return response.data || response;
    },
    onSuccess: (_, userId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.followers(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.currentProfile() });
      
      toast.success('User unfollowed successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to unfollow user');
    },
  });
};

/**
 * Hook quản lý follow/unfollow
 */
export const useFollowToggle = () => {
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const toggleFollow = useCallback((userId: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  }, [followMutation, unfollowMutation]);

  return {
    toggleFollow,
    isLoading: followMutation.isPending || unfollowMutation.isPending,
    error: followMutation.error || unfollowMutation.error,
  };
};

/**
 * Hook thêm device token
 */
export const useAddDeviceToken = () => {
  return useMutation({
    mutationFn: async (deviceToken: string) => {
      const response = await userService.addDeviceToken(deviceToken);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    onSuccess: (result) => {
      const message = result?.message || 'Device registered for notifications';
      toast.success(message);
    },
    onError: (error) => {
      console.error('Failed to add device token:', error);
      toast.error(error.message || 'Failed to add device token');
    },
  });
};

/**
 * Hook xóa device token
 */
export const useRemoveDeviceToken = () => {
  return useMutation({
    mutationFn: async (deviceToken: string) => {
      const response = await userService.removeDeviceToken(deviceToken);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    onSuccess: (result) => {
      const message = result?.message || 'Device unregistered from notifications';
      toast.success(message);
    },
    onError: (error) => {
      console.error('Failed to remove device token:', error);
      toast.error(error.message || 'Failed to remove device token');
    },
  });
};

/**
 * Hook cập nhật push settings
 */
export const useUpdatePushSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: UpdatePushSettingsDto) => {
      const response = await userService.updatePushSettings(settings);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    onSuccess: (updatedUser) => {
      // Update current profile cache
      queryClient.setQueryData(USER_QUERY_KEYS.currentProfile(), updatedUser);
      
      toast.success('Push settings updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update push settings');
    },
  });
};

/**
 * Admin Hooks
 */

/**
 * Hook cập nhật user (admin)
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserDto }) => {
      const response = await userService.updateUser(id, data);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    onSuccess: (updatedUser) => {
      // Update user cache
      queryClient.setQueryData(USER_QUERY_KEYS.user(updatedUser.id), updatedUser);
      
      // Invalidate user list
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
};

/**
 * Hook ban user (admin)
 */
export const useBanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await userService.banUser(id, reason);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    onSuccess: (bannedUser) => {
      // Update user cache
      queryClient.setQueryData(USER_QUERY_KEYS.user(bannedUser.id), bannedUser);
      
      // Invalidate user list
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      
      toast.success('User banned successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to ban user');
    },
  });
};

/**
 * Hook unban user (admin)
 */
export const useUnbanUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await userService.unbanUser(id);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    onSuccess: (unbannedUser) => {
      // Update user cache
      queryClient.setQueryData(USER_QUERY_KEYS.user(unbannedUser.id), unbannedUser);
      
      // Invalidate user list
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      
      toast.success('User unbanned successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to unban user');
    },
  });
};

/**
 * Hook xóa user (admin)
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await userService.deleteUser(userId);
      // Check if response has nested data structure
      return response.data?.data || response.data || response;
    },
    onSuccess: (result, userId) => {
      // Remove user from cache
      queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.user(userId) });
      
      // Invalidate user list
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      
      const message = result?.message || 'User deleted successfully';
      toast.success(message);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
};

/**
 * Hook kiểm tra user có đang được follow hay không
 */
export const useIsFollowing = (userId: string) => {
  const { data: currentUser } = useCurrentProfile();
  
  return {
    isFollowing: currentUser?.following.includes(userId) || false,
    followersCount: 0, // Would need to get this from user data
    followingCount: currentUser?.following.length || 0,
  };
};

/**
 * Hook tổng hợp user management
 */
export const useUserManagement = () => {
  const queryClient = useQueryClient();

  // Helper để invalidate tất cả user queries
  const invalidateAllUserQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
  }, [queryClient]);

  // Helper để prefetch user data
  const prefetchUser = useCallback((userId: string) => {
    queryClient.prefetchQuery({
      queryKey: USER_QUERY_KEYS.user(userId),
      queryFn: async () => {
        const response = await userService.getUserById(userId);
        // Check if response has nested data structure
        return response.data?.data || response.data || response;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  return {
    invalidateAllUserQueries,
    prefetchUser,
  };
};