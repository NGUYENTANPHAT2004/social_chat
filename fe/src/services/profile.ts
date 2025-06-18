import { apiService } from './api';
import { 
  User, 
  UpdateProfileDto, 
  UpdateSettingsDto, 
  UpdatePushSettingsDto,
  PushSettings 
} from '@/types/user';
import { ApiResponse } from '@/types';

export class ProfileService {
  // Get current user profile
  static async getProfile(): Promise<User> {
    const response = await apiService.get<User>('/profile');
    return response.data;
  }

  // Update user profile
  static async updateProfile(data: UpdateProfileDto): Promise<User> {
    const response = await apiService.patch<User>('/profile', data);
    return response.data;
  }

  // Update avatar
  static async updateAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiService.upload<User>('/profile/avatar', formData);
    return response.data;
  }

  // Update user settings
  static async updateSettings(settings: UpdateSettingsDto): Promise<User> {
    const response = await apiService.patch<User>('/profile/settings', settings);
    return response.data;
  }

  // Device token management
  static async addDeviceToken(deviceToken: string): Promise<void> {
    await apiService.post('/users/device-token', { deviceToken });
  }

  static async removeDeviceToken(deviceToken: string): Promise<void> {
    await apiService.delete('/users/device-token', { data: { deviceToken } });
  }

  // Push notification settings
  static async getPushSettings(): Promise<PushSettings> {
    const response = await apiService.get<PushSettings>('/users/push-settings');
    return response.data;
  }

  static async updatePushSettings(settings: UpdatePushSettingsDto): Promise<PushSettings> {
    const response = await apiService.put<PushSettings>('/users/push-settings', settings);
    return response.data;
  }
}

// User service for public user operations
export class UserService {
  // Get user by ID
  static async getUserById(id: string): Promise<User> {
    const response = await apiService.get<User>(`/users/${id}`);
    return response.data;
  }

  // Get user by username
  static async getUserByUsername(username: string): Promise<User> {
    const response = await apiService.get<User>(`/users/username/${username}`);
    return response.data;
  }

  // Follow/Unfollow
  static async followUser(userId: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>(`/users/${userId}/follow`);
    return response.data;
  }

  static async unfollowUser(userId: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>(`/users/${userId}/unfollow`);
    return response.data;
  }

  // Get followers/following
  static async getFollowers(userId: string, page = 1, limit = 10) {
    const response = await apiService.get(`/users/${userId}/followers`, {
      params: { page, limit }
    });
    return response.data;
  }

  static async getFollowing(userId: string, page = 1, limit = 10) {
    const response = await apiService.get(`/users/${userId}/following`, {
      params: { page, limit }
    });
    return response.data;
  }
}

export default ProfileService;