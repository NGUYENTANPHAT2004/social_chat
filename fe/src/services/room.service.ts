// src/services/room.service.ts
import { apiService } from './api';
import { ROOM_ENDPOINTS } from '@/constants/api';
import { ApiResponse, PaginatedResponse } from '@/types';

export interface Room {
  _id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'password';
  password?: string;
  owner: {
    _id: string;
    username: string;
    avatar: string;
  };
  tags: string[];
  coverImage?: string;
  backgroundImage?: string;
  viewers: number;
  maxViewers: number;
  status: 'live' | 'inactive';
  streamKey?: string;
  streamUrl?: string;
  settings: {
    allowChat: boolean;
    allowGifts: boolean;
    minKCToJoin: number;
    slowMode: boolean;
    slowModeInterval: number;
    followersOnly: boolean;
    minAgeRequired: number;
  };
  followers: string[];
  members: string[];
  createdAt: string;
  updatedAt: string;
  lastStreamStartTime?: string;
}

export interface CreateRoomDto {
  name: string;
  description?: string;
  type?: 'public' | 'private' | 'password';
  password?: string;
  tags?: string[];
  coverImage?: string;
  backgroundImage?: string;
  settings?: {
    allowChat?: boolean;
    allowGifts?: boolean;
    minKCToJoin?: number;
    slowMode?: boolean;
    slowModeInterval?: number;
    followersOnly?: boolean;
    minAgeRequired?: number;
  };
}

export interface UpdateRoomDto {
  name?: string;
  description?: string;
  type?: 'public' | 'private' | 'password';
  password?: string;
  tags?: string[];
  coverImage?: string;
  backgroundImage?: string;
  settings?: {
    allowChat?: boolean;
    allowGifts?: boolean;
    minKCToJoin?: number;
    slowMode?: boolean;
    slowModeInterval?: number;
    followersOnly?: boolean;
    minAgeRequired?: number;
  };
}

export interface RoomMember {
  _id: string;
  username: string;
  avatar: string;
  role: 'owner' | 'moderator' | 'member';
  joinedAt: string;
}

export interface JoinRoomDto {
  password?: string;
}

export interface RoomQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'public' | 'private' | 'password';
  status?: 'live' | 'inactive';
  tags?: string[];
  sortBy?: 'createdAt' | 'viewers' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export class RoomService {
  // Get all rooms with pagination and filters
  static async getRooms(params?: RoomQueryParams): Promise<PaginatedResponse<Room>> {
    const response = await apiService.get<PaginatedResponse<Room>>(
      ROOM_ENDPOINTS.ROOMS,
      { params }
    );
    return response.data;
  }

  // Get trending rooms
  static async getTrendingRooms(params?: RoomQueryParams): Promise<PaginatedResponse<Room>> {
    const response = await apiService.get<PaginatedResponse<Room>>(
      ROOM_ENDPOINTS.TRENDING_ROOMS,
      { params }
    );
    return response.data;
  }

  // Get room by ID
  static async getRoomById(id: string): Promise<Room> {
    const response = await apiService.get<Room>(ROOM_ENDPOINTS.ROOM_BY_ID(id));
    return response.data;
  }

  // Create new room
  static async createRoom(data: CreateRoomDto): Promise<Room> {
    const response = await apiService.post<Room>(ROOM_ENDPOINTS.CREATE_ROOM, data);
    return response.data;
  }

  // Update room
  static async updateRoom(id: string, data: UpdateRoomDto): Promise<Room> {
    const response = await apiService.patch<Room>(ROOM_ENDPOINTS.UPDATE_ROOM(id), data);
    return response.data;
  }

  // Delete room
  static async deleteRoom(id: string): Promise<{ success: boolean }> {
    const response = await apiService.delete<{ success: boolean }>(
      ROOM_ENDPOINTS.DELETE_ROOM(id)
    );
    return response.data;
  }

  // Join room
  static async joinRoom(id: string, password?: string): Promise<{ success: boolean; room: Room }> {
    const data: JoinRoomDto = password ? { password } : {};
    const response = await apiService.post<{ success: boolean; room: Room }>(
      ROOM_ENDPOINTS.JOIN_ROOM(id),
      data
    );
    return response.data;
  }

  // Leave room
  static async leaveRoom(id: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>(
      ROOM_ENDPOINTS.LEAVE_ROOM(id)
    );
    return response.data;
  }

  // Follow room
  static async followRoom(id: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>(
      ROOM_ENDPOINTS.FOLLOW_ROOM(id)
    );
    return response.data;
  }

  // Unfollow room
  static async unfollowRoom(id: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>(
      ROOM_ENDPOINTS.UNFOLLOW_ROOM(id)
    );
    return response.data;
  }

  // Get room members
  static async getRoomMembers(
    id: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<RoomMember>> {
    const response = await apiService.get<PaginatedResponse<RoomMember>>(
      ROOM_ENDPOINTS.ROOM_MEMBERS(id),
      { params }
    );
    return response.data;
  }

  // Start stream
  static async startStream(id: string): Promise<{ 
    success: boolean; 
    streamUrl: string; 
    streamKey: string; 
  }> {
    const response = await apiService.post<{
      success: boolean;
      streamUrl: string;
      streamKey: string;
    }>(ROOM_ENDPOINTS.START_STREAM(id));
    return response.data;
  }

  // End stream
  static async endStream(id: string): Promise<{ success: boolean }> {
    const response = await apiService.post<{ success: boolean }>(
      ROOM_ENDPOINTS.END_STREAM(id)
    );
    return response.data;
  }

  // Utility methods for room management
  static isRoomOwner(room: Room, userId: string): boolean {
    return room.owner._id === userId;
  }

  static isRoomMember(room: Room, userId: string): boolean {
    return room.members.includes(userId);
  }

  static isRoomFollower(room: Room, userId: string): boolean {
    return room.followers.includes(userId);
  }

  static canJoinRoom(room: Room, userKC: number): boolean {
    return userKC >= room.settings.minKCToJoin;
  }

  static getRoomStatusColor(status: Room['status']): string {
    switch (status) {
      case 'live':
        return 'bg-red-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  }

  static getRoomTypeLabel(type: Room['type']): string {
    switch (type) {
      case 'public':
        return 'Công khai';
      case 'private':
        return 'Riêng tư';
      case 'password':
        return 'Có mật khẩu';
      default:
        return 'Không xác định';
    }
  }
}