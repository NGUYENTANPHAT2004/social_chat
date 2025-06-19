// fe/src/services/user.ts - Simplified and Optimized
import { apiService } from './api';
import { 
  User, 
  UserBasic,
  UpdateProfileDto, 
  UpdateSettingsDto, 
  UpdatePushSettingsDto,
  PushSettings,
  UsersResponse,
  FollowResponse,
  UserListParams
} from '@/types/user';
import { USER_ENDPOINTS } from '@/constants/user';

export class UserService {
  // Current user operations
  static async getCurrentUser(): Promise<User> {
    const response = await apiService.get<User>(USER_ENDPOINTS.MY_PROFILE);
    return response.data;
  }

  static async updateProfile(data: UpdateProfileDto): Promise<User> {
    const response = await apiService.patch<User>(USER_ENDPOINTS.UPDATE_PROFILE, data);
    return response.data;
  }

  static async updateSettings(settings: UpdateSettingsDto): Promise<User> {
    const response = await apiService.patch<User>(USER_ENDPOINTS.UPDATE_SETTINGS, settings);
    return response.data;
  }

  static async updateAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiService.patch<User>(USER_ENDPOINTS.UPDATE_AVATAR, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Public user operations
  static async getUserById(id: string): Promise<User> {
    const response = await apiService.get<User>(USER_ENDPOINTS.GET_BY_ID(id));
    return response.data;
  }

  static async getUserByUsername(username: string): Promise<User> {
    const response = await apiService.get<User>(USER_ENDPOINTS.GET_BY_USERNAME(username));
    return response.data;
  }

  static async getUserStats(id: string): Promise<any> {
    const response = await apiService.get<any>(USER_ENDPOINTS.GET_STATS(id));
    return response.data;
  }

  static async searchUsers(query: string, limit = 10): Promise<User[]> {
    const response = await apiService.get<User[]>(USER_ENDPOINTS.SEARCH, {
      params: { q: query, limit }
    });
    return response.data;
  }

  // Follow operations
  static async followUser(userId: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>(USER_ENDPOINTS.FOLLOW(userId));
    return response.data;
  }

  static async unfollowUser(userId: string): Promise<{ success: boolean }> {
    const response = await apiService.delete<{ success: boolean }>(USER_ENDPOINTS.UNFOLLOW(userId));
    return response.data;
  }

  static async getFollowers(userId: string, page = 1, limit = 20): Promise<FollowResponse> {
    const response = await apiService.get<FollowResponse>(USER_ENDPOINTS.GET_FOLLOWERS(userId), {
      params: { page, limit }
    });
    return response.data;
  }

  static async getFollowing(userId: string, page = 1, limit = 20): Promise<FollowResponse> {
    const response = await apiService.get<FollowResponse>(USER_ENDPOINTS.GET_FOLLOWING(userId), {
      params: { page, limit }
    });
    return response.data;
  }

  // Device token management
  static async addDeviceToken(deviceToken: string): Promise<{ success: boolean; message: string }> {
    const response = await apiService.post<{ success: boolean; message: string }>(
      USER_ENDPOINTS.DEVICE_TOKENS, 
      { deviceToken }
    );
    return response.data;
  }

  static async removeDeviceToken(deviceToken: string): Promise<{ success: boolean; message: string }> {
    const response = await apiService.delete<{ success: boolean; message: string }>(
      USER_ENDPOINTS.DEVICE_TOKENS, 
      { data: { deviceToken } }
    );
    return response.data;
  }

  static async updatePushSettings(settings: UpdatePushSettingsDto): Promise<User> {
    const response = await apiService.patch<User>(USER_ENDPOINTS.PUSH_SETTINGS, settings);
    return response.data;
  }

  // Admin operations (for admin users only)
  static async getAllUsers(params: UserListParams = {}): Promise<UsersResponse> {
    const response = await apiService.get<UsersResponse>(USER_ENDPOINTS.ALL_USERS, { params });
    return response.data;
  }

  static async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await apiService.patch<User>(USER_ENDPOINTS.UPDATE_USER(id), data);
    return response.data;
  }

  static async banUser(id: string, reason?: string): Promise<User> {
    const response = await apiService.post<User>(USER_ENDPOINTS.BAN_USER(id), { reason });
    return response.data;
  }

  static async unbanUser(id: string): Promise<User> {
    const response = await apiService.post<User>(USER_ENDPOINTS.UNBAN_USER(id));
    return response.data;
  }

  static async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiService.delete<{ success: boolean; message: string }>(
      USER_ENDPOINTS.DELETE_USER(id)
    );
    return response.data;
  }
}

// Re-export for backward compatibility
export const ProfileService = {
  getProfile: UserService.getCurrentUser,
  updateProfile: UserService.updateProfile,
  updateAvatar: UserService.updateAvatar,
  updateSettings: UserService.updateSettings,
  addDeviceToken: UserService.addDeviceToken,
  removeDeviceToken: UserService.removeDeviceToken,
  updatePushSettings: UserService.updatePushSettings,
};

export default UserService;