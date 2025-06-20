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
// import { useUserStore } from '../store';
import type {
  User,
  UserStats,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateSettingsDto,
  
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
    queryFn: () => userService.getUserById(id),
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
    queryFn: () => userService.getUserByUsername(username),
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
    queryFn: userService.getCurrentProfile,
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
    queryFn: () => userService.searchUsers(params),
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
    queryFn: ({ pageParam = 1 }) =>
      userService.getUserFollowers(userId, { page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1, // ✅ Bắt buộc khai báo
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
    queryFn: ({ pageParam = 1 }) =>
      userService.getUserFollowing(userId, { page: pageParam, limit: 20 }),
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
    queryFn: () => userService.getUserStats(userId),
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
    queryFn: () => userService.getAllUsers(params),
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
    mutationFn: userService.updateProfile,
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
    mutationFn: userService.updateAvatar,
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
    mutationFn: userService.updateSettings,
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
    mutationFn: userService.followUser,
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
    mutationFn: userService.unfollowUser,
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
    mutationFn: userService.addDeviceToken,
    onSuccess: () => {
      toast.success('Device registered for notifications');
    },
    onError: (error) => {
      console.error('Failed to add device token:', error);
    },
  });
};

/**
 * Hook xóa device token
 */
export const useRemoveDeviceToken = () => {
  return useMutation({
    mutationFn: userService.removeDeviceToken,
    onSuccess: () => {
      toast.success('Device unregistered from notifications');
    },
    onError: (error) => {
      console.error('Failed to remove device token:', error);
    },
  });
};

/**
 * Hook cập nhật push settings
 */
export const useUpdatePushSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updatePushSettings,
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
    mutationFn: ({ id, data }: { id: string; data: UpdateUserDto }) =>
      userService.updateUser(id, data),
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
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      userService.banUser(id, reason),
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
    mutationFn: userService.unbanUser,
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
    mutationFn: userService.deleteUser,
    onSuccess: (_, userId) => {
      // Remove user from cache
      queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.user(userId) });
      
      // Invalidate user list
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all });
      
      toast.success('User deleted successfully');
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
      queryFn: () => userService.getUserById(userId),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  return {
    invalidateAllUserQueries,
    prefetchUser,
  };
};
