// src/types/user.ts
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export interface UserProfile {
  displayName: string;
  bio: string;
  location: string;
  birthdate: Date | null;
}

export interface UserSettings {
  notifications: boolean;
  privacy: 'public' | 'private' | 'friends';
  language: string;
  theme: 'light' | 'dark';
}

export interface PushSettings {
  enabled: boolean;
  sound: boolean;
  vibrate: boolean;
  badge: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  kcBalance: number;
  status: UserStatus;
  role: UserRole;
  profile: UserProfile;
  settings: UserSettings;
  pushSettings: PushSettings;
  deviceTokens: string[];
  following: string[];
  followers: string[];
  trustScore: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Computed properties
  isOnline?: boolean;
  lastSeen?: Date;
  
  // Stats (computed from other modules)
  stats?: {
    gamesPlayed: number;
    gamesWon: number;
    totalEarnings: number;
    followersCount: number;
    followingCount: number;
  };
}

export interface UserBasic {
  id: string;
  username: string;
  avatar: string;
  isOnline?: boolean;
  profile: {
    displayName: string;
  };
}

// DTOs for API requests
export interface UpdateProfileDto {
  displayName?: string;
  bio?: string;
  location?: string;
  birthdate?: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  avatar?: string;
  status?: UserStatus;
  settings?: Partial<UserSettings>;
}

export interface UpdateSettingsDto extends Partial<UserSettings> {}

export interface UpdatePushSettingsDto extends Partial<PushSettings> {}

// API Response types
export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface FollowersResponse {
  followers: UserBasic[];
  total: number;
  page: number;
  limit: number;
}

export interface FollowingResponse {
  following: UserBasic[];
  total: number;
  page: number;
  limit: number;
}

// Filter types for user list
export interface UserListFilter {
  page?: number;
  limit?: number;
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}