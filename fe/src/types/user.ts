// fe/src/types/user.ts - Optimized and Simplified
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

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalEarnings: number;
  followersCount: number;
  followingCount: number;
}

export interface User {
  id: string; // Mapped from _id
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
  refreshTokens: Array<{ token: string; expires: Date }>;
  createdAt: Date;
  updatedAt: Date;
  isOnline?: boolean;
  lastSeen?: Date;
  stats?: UserStats;
}

export interface UserBasic {
  id: string;
  username: string;
  avatar: string;
  displayName?: string;
  isOnline?: boolean;
}

// API DTOs
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
export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface FollowResponse {
  users: UserBasic[];
  total: number;
  page: number;
  limit: number;
}

// User State for Redux
export interface UserState {
  currentUser: User | null;
  users: { [id: string]: User };
  followers: { [userId: string]: UserBasic[] };
  following: { [userId: string]: UserBasic[] };
  loading: boolean;
  error: string | null;
}

// API Filters
export interface UserListParams {
  page?: number;
  limit?: number;
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}