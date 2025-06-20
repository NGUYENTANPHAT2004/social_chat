import userService, { UserService } from './services';
import { UpdateProfileDto, UpdateSettingsDto, User } from './type';
import { calculateUserAge, canViewUserProfile, formatKCBalance, formatUserJoinDate, getUserAvatarUrl, getUserDisplayName, getUserProfileUrl, getUserRoleColor, getUserStatusColor, isUserOnline, isUserProfilePublic, USER_CONSTANTS, USER_VALIDATION_RULES, validateAvatarFile, validateEmail, validateUpdateProfile, validateUsername } from './utils';

export type {
  User,
  UserProfile,
  UserSettings,
  PushSettings,
  UserStats,
  UserStatus,
  UserRole,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateSettingsDto,
  UpdatePushSettingsDto,
  DeviceTokenData,
  ApiResponse,
  PaginatedResponse,
  UserSearchParams,
  UserListParams,
  FollowersParams,
  FollowingParams,
  UpdateProfileFormData,
  UpdateSettingsFormData,
  UserError,
  UserState,
  UserActions,
  ValidationResult,
  UserValidationRules,
  UseUserResult,
  UseUsersResult,
  UseUserSearchResult,
  UseFollowersResult,
  UseFollowingResult,
  UseUserStatsResult,
  FollowMutationResult,
  UpdateProfileMutationResult,
  UpdateAvatarMutationResult,
  UpdateSettingsMutationResult,
  UserCardProps,
  UserListProps,
  UserSearchProps,
  UserProfileProps,
  EditProfileProps,
  UserSettingsProps,
  FollowButtonProps,
} from './type';

// Services
export {
  userService,
  PublicUserService,
  UserService,
  AdminUserService,
  USER_ENDPOINTS,
} from './services';

// Hooks
export {
  useUser,
  useUserByUsername,
  useCurrentProfile,
  useUserSearch,
  useUserFollowers,
  useUserFollowing,
  useUserStats,
  useUserList,
  useUpdateProfile,
  useUpdateAvatar,
  useUpdateSettings,
  useFollowUser,
  useUnfollowUser,
  useFollowToggle,
  useAddDeviceToken,
  useRemoveDeviceToken,
  useUpdatePushSettings,
  useUpdateUser,
  useBanUser,
  useUnbanUser,
  useDeleteUser,
  useIsFollowing,
  useUserManagement,
  USER_QUERY_KEYS,
} from './hooks';

// Store
export {
  useUserStore,
  useCurrentUser,
  useUsers,
  useUserById,
  useSearchResults,
  useFollowers,
  useFollowing,
  useUserStats as useUserStatsFromStore,
  useUserLoading,
  useUserError,
  useUserActions,
  useIsCurrentUserFollowing,
  useFollowerCount,
  useFollowingCount,
  useCanPerformAdminActions,
  useUsersByStatus,
  useUsersByRole,
  useUserOperations,
  useUserStoreInitialization,
} from './store';

// Utils
export {
  validateUsername,
  validateEmail,
  validateDisplayName,
  validateBio,
  validateLocation,
  validateUpdateProfile,
  validateAvatarFile,
  getUserDisplayName,
  getUserAvatarUrl,
  formatUserJoinDate,
  calculateUserAge,
  isUserOnline,
  getUserStatusColor,
  getUserRoleColor,
  formatKCBalance,
  debounce,
  filterUsersBySearch,
  sortUsers,
  isUserProfilePublic,
  canViewUserProfile,
  parseUserError,
  transformUserData,
  createDefaultUserProfile,
  createDefaultUserSettings,
  getUserProfileUrl,
  getUserAvatarUploadUrl,
  USER_VALIDATION_RULES,
  USER_CONSTANTS,
} from './utils';


// Common query keys for external use
export const userQueryKeys = {
  all: ['users'] as const,
  user: (id: string) => ['users', 'user', id] as const,
  userByUsername: (username: string) => ['users', 'username', username] as const,
  currentProfile: () => ['users', 'profile'] as const,
  search: (query: string) => ['users', 'search', query] as const,
  followers: (id: string) => ['users', 'followers', id] as const,
  following: (id: string) => ['users', 'following', id] as const,
  stats: (id: string) => ['users', 'stats', id] as const,
  list: (params: any) => ['users', 'list', params] as const,
};

// Common user utilities for easy access
export const userUtils = {
  // Quick checks
  isOnline: (user: User) => isUserOnline(user),
  canView: (targetUser: User, currentUser: User | null, isFollowing = false) =>
    canViewUserProfile(targetUser, currentUser, isFollowing),
  
  // Display helpers
  getDisplayName: (user: User) => getUserDisplayName(user),
  getAvatar: (user: User) => getUserAvatarUrl(user),
  getAge: (user: User) => calculateUserAge(user.profile.birthdate),
  
  // Formatting
  formatBalance: (balance: number) => formatKCBalance(balance),
  formatJoinDate: (createdAt: string) => formatUserJoinDate(createdAt),
  
  // Status helpers
  getStatusColor: (user: User) => getUserStatusColor(user),
  getRoleColor: (user: User) => getUserRoleColor(user),
  
  // Profile helpers
  getProfileUrl: (user: User) => getUserProfileUrl(user),
  isProfilePublic: (user: User) => isUserProfilePublic(user),
};

// User actions for common operations
export const userActions = {
  // Profile management
  updateProfile: (data: UpdateProfileDto) => {
    // This would typically be called through hooks
    return userService.updateProfile(data);
  },
  
  updateAvatar: (file: File) => {
    return userService.updateAvatar(file);
  },
  
  updateSettings: (settings: UpdateSettingsDto) => {
    return userService.updateSettings(settings);
  },
  
  // Social actions
  follow: (userId: string) => {
    return userService.followUser(userId);
  },
  
  unfollow: (userId: string) => {
    return userService.unfollowUser(userId);
  },
  
  // Search
  search: (query: string, limit?: number) => {
    return userService.searchUsers({ q: query, limit });
  },
  
  // Device tokens
  addDeviceToken: (token: string) => {
    return userService.addDeviceToken(token);
  },
  
  removeDeviceToken: (token: string) => {
    return UserService.removeDeviceToken(token);
  },
};

// Validation helpers
export const userValidation = {
  username: (username: string) => validateUsername(username),
  email: (email: string) => validateEmail(email),
  profile: (data: UpdateProfileDto) => validateUpdateProfile(data),
  avatar: (file: File) => validateAvatarFile(file),
  
  // Combined validation
  validateUser: (user: Partial<User>) => {
    const errors: any[] = [];
    
    if (user.username) {
      const usernameResult = validateUsername(user.username);
      errors.push(...usernameResult.errors);
    }
    
    if (user.email) {
      const emailResult = validateEmail(user.email);
      errors.push(...emailResult.errors);
    }
    
    return { isValid: errors.length === 0, errors };
  },
};

// Constants for external use
export const USER_ROUTES = {
  PROFILE: '/profile',
  USERS: '/users',
  USER_DETAIL: (id: string) => `/users/${id}`,
  USER_BY_USERNAME: (username: string) => `/users/username/${username}`,
  EDIT_PROFILE: '/profile/edit',
  SETTINGS: '/profile/settings',
  FOLLOWERS: (id: string) => `/users/${id}/followers`,
  FOLLOWING: (id: string) => `/users/${id}/following`,
} as const;

export const USER_PERMISSIONS = {
  VIEW_PROFILE: 'view_profile',
  EDIT_PROFILE: 'edit_profile',
  FOLLOW_USER: 'follow_user',
  VIEW_FOLLOWERS: 'view_followers',
  ADMIN_ACTIONS: 'admin_actions',
  MODERATE_USERS: 'moderate_users',
} as const;

// Error messages for consistency
export const USER_ERRORS = {
  USER_NOT_FOUND: 'User not found',
  PROFILE_PRIVATE: 'This profile is private',
  CANNOT_FOLLOW_SELF: 'You cannot follow yourself',
  ALREADY_FOLLOWING: 'You are already following this user',
  NOT_FOLLOWING: 'You are not following this user',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
  INVALID_FILE_TYPE: 'Invalid file type for avatar',
  FILE_TOO_LARGE: 'File size is too large',
  NETWORK_ERROR: 'Network error occurred',
  SERVER_ERROR: 'Server error occurred',
} as const;

// Default configurations
export const USER_CONFIG = {
  AVATAR: {
    MAX_SIZE: USER_CONSTANTS.AVATAR_MAX_SIZE,
    ALLOWED_TYPES: USER_CONSTANTS.AVATAR_ALLOWED_TYPES,
    DEFAULT_URL: USER_CONSTANTS.DEFAULT_AVATAR,
  },
  SEARCH: {
    MIN_LENGTH: USER_CONSTANTS.SEARCH_MIN_LENGTH,
    DEBOUNCE_MS: USER_CONSTANTS.SEARCH_DEBOUNCE_MS,
  },
  PAGINATION: {
    LIMIT: USER_CONSTANTS.PAGINATION_LIMIT,
  },
  VALIDATION: USER_VALIDATION_RULES,
} as const;