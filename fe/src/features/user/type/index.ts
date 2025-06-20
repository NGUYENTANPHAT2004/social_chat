// src/features/user/types/index.ts

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
  deviceTokens: string[];
  pushSettings: PushSettings;
  trustScore: number;
  following: string[];
  followers: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalEarnings: number;
  followersCount: number;
  followingCount: number;
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
  settings?: Record<string, any>;
}

export interface UpdateSettingsDto extends Partial<UserSettings> {}

export interface UpdatePushSettingsDto extends Partial<PushSettings> {}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserSearchParams {
  q: string;
  limit?: number;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}

export interface FollowersParams {
  page?: number;
  limit?: number;
}

export interface FollowingParams {
  page?: number;
  limit?: number;
}

// Form data types
export interface UpdateProfileFormData {
  displayName: string;
  bio: string;
  location: string;
  birthdate: Date | null;
}

export interface UpdateSettingsFormData extends UserSettings {}

export interface DeviceTokenData {
  deviceToken: string;
}

// Error types
export interface UserError {
  message: string;
  field?: string;
  code?: string;
}

// State types
export interface UserState {
  currentUser: User | null;
  users: Record<string, User>;
  searchResults: User[];
  followers: Record<string, User[]>;
  following: Record<string, User[]>;
  stats: Record<string, UserStats>;
  isLoading: boolean;
  error: UserError | null;
}

// Action types for store
export interface UserActions {
  // User management
  setCurrentUser: (user: User | null) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  setUser: (user: User) => void;
  setUsers: (users: User[]) => void;
  removeUser: (userId: string) => void;
  
  // Search
  setSearchResults: (users: User[]) => void;
  clearSearchResults: () => void;
  
  // Follow/Following
  setFollowers: (userId: string, followers: User[]) => void;
  setFollowing: (userId: string, following: User[]) => void;
  addFollower: (userId: string, follower: User) => void;
  removeFollower: (userId: string, followerId: string) => void;
  addFollowing: (userId: string, following: User) => void;
  removeFollowing: (userId: string, followingId: string) => void;
  
  // Stats
  setUserStats: (userId: string, stats: UserStats) => void;
  
  // Loading & Error states
  setLoading: (loading: boolean) => void;
  setError: (error: UserError | null) => void;
  clearError: () => void;
  
  // Reset
  reset: () => void;
}

// Hook return types
export interface UseUserResult {
  user: User | null;
  isLoading: boolean;
  error: UserError | null;
  refetch: () => void;
}

export interface UseUsersResult {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  isLoading: boolean;
  error: UserError | null;
  refetch: () => void;
}

export interface UseUserSearchResult {
  results: User[];
  isLoading: boolean;
  error: UserError | null;
  search: (query: string) => void;
  clearResults: () => void;
}

export interface UseFollowersResult {
  followers: User[];
  total: number;
  isLoading: boolean;
  error: UserError | null;
  loadMore: () => void;
  refetch: () => void;
}

export interface UseFollowingResult {
  following: User[];
  total: number;
  isLoading: boolean;
  error: UserError | null;
  loadMore: () => void;
  refetch: () => void;
}

export interface UseUserStatsResult {
  stats: UserStats | null;
  isLoading: boolean;
  error: UserError | null;
  refetch: () => void;
}

// Mutation result types
export interface FollowMutationResult {
  mutate: (userId: string) => void;
  isLoading: boolean;
  error: UserError | null;
}

export interface UpdateProfileMutationResult {
  mutate: (data: UpdateProfileDto) => void;
  isLoading: boolean;
  error: UserError | null;
}

export interface UpdateAvatarMutationResult {
  mutate: (file: File) => void;
  isLoading: boolean;
  error: UserError | null;
}

export interface UpdateSettingsMutationResult {
  mutate: (settings: UpdateSettingsDto) => void;
  isLoading: boolean;
  error: UserError | null;
}

// Component props types
export interface UserCardProps {
  user: User;
  showFollowButton?: boolean;
  onUserClick?: (user: User) => void;
  onFollowClick?: (user: User) => void;
  className?: string;
}

export interface UserListProps {
  users: User[];
  isLoading?: boolean;
  showFollowButton?: boolean;
  onUserClick?: (user: User) => void;
  onFollowClick?: (user: User) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface UserSearchProps {
  onUserSelect?: (user: User) => void;
  placeholder?: string;
  className?: string;
}

export interface UserProfileProps {
  user: User;
  isCurrentUser?: boolean;
  onEdit?: () => void;
  onFollow?: () => void;
  onUnfollow?: () => void;
}

export interface EditProfileProps {
  user: User;
  onSave: (data: UpdateProfileDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface UserSettingsProps {
  user: User;
  onSave: (settings: UpdateSettingsDto) => void;
  isLoading?: boolean;
}

export interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  isLoading?: boolean;
  className?: string;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: UserError[];
}

export interface UserValidationRules {
  username: {
    required: boolean;
    minLength: number;
    maxLength: number;
    pattern: RegExp;
  };
  email: {
    required: boolean;
    pattern: RegExp;
  };
  displayName: {
    maxLength: number;
  };
  bio: {
    maxLength: number;
  };
  location: {
    maxLength: number;
  };
}