// src/features/user/services/index.ts

import { apiClient } from '../../../shared/api/client';
import type {
  User,
  UserStats,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateSettingsDto,
  UpdatePushSettingsDto,
  ApiResponse,
  PaginatedResponse,
  UserSearchParams,
  UserListParams,
  FollowersParams,
  FollowingParams,
} from '../type';

// API Endpoints
export const USER_ENDPOINTS = {
  // Public endpoints
  SEARCH: '/users/search',
  GET_USER: (id: string) => `/users/${id}`,
  GET_USER_BY_USERNAME: (username: string) => `/users/username/${username}`,
  GET_FOLLOWERS: (id: string) => `/users/${id}/followers`,
  GET_FOLLOWING: (id: string) => `/users/${id}/following`,
  GET_STATS: (id: string) => `/users/${id}/stats`,
  
  // Protected endpoints
  GET_PROFILE: '/users/me/profile',
  UPDATE_PROFILE: '/users/me/profile',
  UPDATE_AVATAR: '/users/me/avatar',
  UPDATE_SETTINGS: '/users/me/settings',
  FOLLOW_USER: (id: string) => `/users/${id}/follow`,
  UNFOLLOW_USER: (id: string) => `/users/${id}/follow`,
  ADD_DEVICE_TOKEN: '/users/me/device-tokens',
  REMOVE_DEVICE_TOKEN: '/users/me/device-tokens',
  UPDATE_PUSH_SETTINGS: '/users/me/push-settings',
  
  // Admin endpoints
  GET_ALL_USERS: '/users',
  UPDATE_USER: (id: string) => `/users/${id}`,
  BAN_USER: (id: string) => `/users/${id}/ban`,
  UNBAN_USER: (id: string) => `/users/${id}/unban`,
  DELETE_USER: (id: string) => `/users/${id}`,
} as const;

/**
 * Public User Services - Không cần authentication
 */
export class PublicUserService {
  /**
   * Tìm kiếm người dùng
   */
  static async searchUsers(params: UserSearchParams): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[]>>(
      USER_ENDPOINTS.SEARCH,
      { params }
    );
    return response.data.data;
  }

  /**
   * Lấy thông tin người dùng theo ID
   */
  static async getUserById(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      USER_ENDPOINTS.GET_USER(id)
    );
    return response.data.data;
  }

  /**
   * Lấy thông tin người dùng theo username
   */
  static async getUserByUsername(username: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      USER_ENDPOINTS.GET_USER_BY_USERNAME(username)
    );
    return response.data.data;
  }

  /**
   * Lấy danh sách followers của người dùng
   */
  static async getUserFollowers(
    id: string, 
    params: FollowersParams = {}
  ): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
      USER_ENDPOINTS.GET_FOLLOWERS(id),
      { params }
    );
    return response.data.data;
  }

  /**
   * Lấy danh sách following của người dùng
   */
  static async getUserFollowing(
    id: string, 
    params: FollowingParams = {}
  ): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
      USER_ENDPOINTS.GET_FOLLOWING(id),
      { params }
    );
    return response.data.data;
  }

  /**
   * Lấy thống kê của người dùng
   */
  static async getUserStats(id: string): Promise<UserStats> {
    const response = await apiClient.get<ApiResponse<UserStats>>(
      USER_ENDPOINTS.GET_STATS(id)
    );
    return response.data.data;
  }
}

/**
 * Protected User Services - Cần authentication
 */
export class UserService {
  /**
   * Lấy profile của user hiện tại
   */
  static async getCurrentProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      USER_ENDPOINTS.GET_PROFILE
    );
    return response.data.data;
  }

  /**
   * Cập nhật profile của user hiện tại
   */
  static async updateProfile(data: UpdateProfileDto): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      USER_ENDPOINTS.UPDATE_PROFILE,
      data
    );
    return response.data.data;
  }

  /**
   * Cập nhật avatar
   */
  static async updateAvatar(file: File): Promise<User> {
    const response = await apiClient.uploadFile<ApiResponse<User>>(
      USER_ENDPOINTS.UPDATE_AVATAR,
      file,
      'avatar'
    );
    return response.data.data;
  }

  /**
   * Cập nhật settings
   */
  static async updateSettings(settings: UpdateSettingsDto): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      USER_ENDPOINTS.UPDATE_SETTINGS,
      settings
    );
    return response.data.data;
  }

  /**
   * Follow một user
   */
  static async followUser(userId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean }>>(
      USER_ENDPOINTS.FOLLOW_USER(userId)
    );
    return response.data.data;
  }

  /**
   * Unfollow một user
   */
  static async unfollowUser(userId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean }>>(
      USER_ENDPOINTS.UNFOLLOW_USER(userId)
    );
    return response.data.data;
  }

  /**
   * Thêm device token cho push notifications
   */
  static async addDeviceToken(deviceToken: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      USER_ENDPOINTS.ADD_DEVICE_TOKEN,
      { deviceToken }
    );
    return response.data.data;
  }

  /**
   * Xóa device token
   */
 static async removeDeviceToken(deviceToken: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(
    USER_ENDPOINTS.REMOVE_DEVICE_TOKEN,
    {
      params: { deviceToken },
    }
  );
  return response.data.data;
}


  /**
   * Cập nhật push notification settings
   */
  static async updatePushSettings(settings: UpdatePushSettingsDto): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      USER_ENDPOINTS.UPDATE_PUSH_SETTINGS,
      settings
    );
    return response.data.data;
  }
}

/**
 * Admin User Services - Cần admin/moderator permissions
 */
export class AdminUserService {
  /**
   * Lấy tất cả users (Admin/Moderator only)
   */
  static async getAllUsers(params: UserListParams = {}): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
      USER_ENDPOINTS.GET_ALL_USERS,
      { params }
    );
    return response.data.data;
  }

  /**
   * Cập nhật user (Admin only)
   */
  static async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      USER_ENDPOINTS.UPDATE_USER(id),
      data
    );
    return response.data.data;
  }

  /**
   * Ban user (Admin/Moderator only)
   */
  static async banUser(id: string, reason?: string): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      USER_ENDPOINTS.BAN_USER(id),
      { reason }
    );
    return response.data.data;
  }

  /**
   * Unban user (Admin/Moderator only)
   */
  static async unbanUser(id: string): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      USER_ENDPOINTS.UNBAN_USER(id)
    );
    return response.data.data;
  }

  /**
   * Xóa user (Admin only)
   */
  static async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<ApiResponse<{ success: boolean; message: string }>>(
      USER_ENDPOINTS.DELETE_USER(id)
    );
    return response.data.data;
  }
}

/**
 * Combined User Service - Export tất cả methods
 */
export const userService = {
  // Public methods
  searchUsers: PublicUserService.searchUsers,
  getUserById: PublicUserService.getUserById,
  getUserByUsername: PublicUserService.getUserByUsername,
  getUserFollowers: PublicUserService.getUserFollowers,
  getUserFollowing: PublicUserService.getUserFollowing,
  getUserStats: PublicUserService.getUserStats,

  // Protected methods
  getCurrentProfile: UserService.getCurrentProfile,
  updateProfile: UserService.updateProfile,
  updateAvatar: UserService.updateAvatar,
  updateSettings: UserService.updateSettings,
  followUser: UserService.followUser,
  unfollowUser: UserService.unfollowUser,
  addDeviceToken: UserService.addDeviceToken,
  removeDeviceToken: UserService.removeDeviceToken,
  updatePushSettings: UserService.updatePushSettings,

  // Admin methods
  getAllUsers: AdminUserService.getAllUsers,
  updateUser: AdminUserService.updateUser,
  banUser: AdminUserService.banUser,
  unbanUser: AdminUserService.unbanUser,
  deleteUser: AdminUserService.deleteUser,
};
export default userService;