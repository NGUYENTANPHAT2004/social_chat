// fe/src/constants/user.ts - Simplified and Organized
import { UserStatus, UserRole } from '@/types/user';

// API Endpoints - Matches backend routes
export const USER_ENDPOINTS = {
  // Public endpoints
  SEARCH: '/users/search',
  GET_BY_ID: (id: string) => `/users/${id}`,
  GET_BY_USERNAME: (username: string) => `/users/username/${username}`,
  GET_FOLLOWERS: (id: string) => `/users/${id}/followers`,
  GET_FOLLOWING: (id: string) => `/users/${id}/following`,
  GET_STATS: (id: string) => `/users/${id}/stats`,
  
  // Current user endpoints
  MY_PROFILE: '/users/me/profile',
  UPDATE_PROFILE: '/users/me/profile',
  UPDATE_AVATAR: '/users/me/avatar',
  UPDATE_SETTINGS: '/users/me/settings',
  
  // Follow endpoints
  FOLLOW: (id: string) => `/users/${id}/follow`,
  UNFOLLOW: (id: string) => `/users/${id}/follow`, // DELETE request
  
  // Device tokens
  DEVICE_TOKENS: '/users/me/device-tokens',
  PUSH_SETTINGS: '/users/me/push-settings',
  
  // Admin endpoints
  ALL_USERS: '/users',
  UPDATE_USER: (id: string) => `/users/${id}`,
  DELETE_USER: (id: string) => `/users/${id}`,
  BAN_USER: (id: string) => `/users/${id}/ban`,
  UNBAN_USER: (id: string) => `/users/${id}/unban`,
} as const;

// User Status Options
export const USER_STATUS_OPTIONS = [
  { value: UserStatus.ACTIVE, label: 'Active', color: 'green' },
  { value: UserStatus.INACTIVE, label: 'Inactive', color: 'gray' },
  { value: UserStatus.BANNED, label: 'Banned', color: 'red' },
] as const;

// User Role Options
export const USER_ROLE_OPTIONS = [
  { value: UserRole.USER, label: 'User', color: 'blue' },
  { value: UserRole.MODERATOR, label: 'Moderator', color: 'yellow' },
  { value: UserRole.ADMIN, label: 'Admin', color: 'purple' },
] as const;

// Settings Options
export const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can see your profile' },
  { value: 'friends', label: 'Friends Only', description: 'Only your friends can see your profile' },
  { value: 'private', label: 'Private', description: 'Only you can see your profile' },
] as const;

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light Theme', icon: '☀️' },
  { value: 'dark', label: 'Dark Theme', icon: '🌙' },
] as const;

export const LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
] as const;

// Validation Rules
export const USER_VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  DISPLAY_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9\s\u00C0-\u1EF9]+$/,
  },
  BIO: {
    MAX_LENGTH: 500,
  },
  LOCATION: {
    MAX_LENGTH: 100,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
} as const;

// File Upload Constraints
export const AVATAR_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MIN_DIMENSIONS: { width: 100, height: 100 },
  MAX_DIMENSIONS: { width: 2048, height: 2048 },
} as const;

// Default Values
export const DEFAULT_USER_SETTINGS = {
  notifications: true,
  privacy: 'public' as const,
  language: 'vi',
  theme: 'light' as const,
} as const;

export const DEFAULT_PUSH_SETTINGS = {
  enabled: true,
  sound: true,
  vibrate: true,
  badge: true,
} as const;

// Error Messages
export const USER_ERRORS = {
  // General
  USER_NOT_FOUND: 'User not found',
  ACCESS_DENIED: 'Access denied',
  
  // Profile
  PROFILE_UPDATE_FAILED: 'Failed to update profile',
  AVATAR_UPLOAD_FAILED: 'Failed to upload avatar',
  SETTINGS_UPDATE_FAILED: 'Failed to update settings',
  
  // Follow
  FOLLOW_FAILED: 'Failed to follow user',
  UNFOLLOW_FAILED: 'Failed to unfollow user',
  CANNOT_FOLLOW_SELF: 'Cannot follow yourself',
  ALREADY_FOLLOWING: 'Already following this user',
  
  // Validation
  INVALID_USERNAME: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_DISPLAY_NAME: 'Display name contains invalid characters',
  BIO_TOO_LONG: 'Bio is too long. Maximum 500 characters',
  LOCATION_TOO_LONG: 'Location is too long. Maximum 100 characters',
  
  // File upload
  INVALID_FILE_TYPE: 'Invalid file type. Please upload an image file',
  FILE_TOO_LARGE: 'File too large. Maximum size is 5MB',
  IMAGE_DIMENSIONS_INVALID: 'Image dimensions must be at least 100x100 pixels',
} as const;

// User Actions
export const USER_ACTIONS = {
  VIEW_PROFILE: 'view_profile',
  EDIT_PROFILE: 'edit_profile',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  SEND_MESSAGE: 'send_message',
  BLOCK: 'block',
  REPORT: 'report',
  BAN: 'ban',
  UNBAN: 'unban',
} as const;

// List Filters
export const USER_LIST_FILTERS = {
  STATUS: {
    ALL: 'all',
    ACTIVE: UserStatus.ACTIVE,
    INACTIVE: UserStatus.INACTIVE,
    BANNED: UserStatus.BANNED,
  },
  ROLE: {
    ALL: 'all',
    USER: UserRole.USER,
    MODERATOR: UserRole.MODERATOR,
    ADMIN: UserRole.ADMIN,
  },
  SORT: {
    NEWEST: 'newest',
    OLDEST: 'oldest',
    USERNAME: 'username',
    BALANCE: 'balance',
  },
} as const;

// Pagination
export const USER_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  LIMITS: [10, 20, 50, 100],
} as const;

// Cache Keys for React Query (if used)
export const USER_QUERY_KEYS = {
  ALL: ['users'] as const,
  CURRENT: ['users', 'current'] as const,
  BY_ID: (id: string) => ['users', id] as const,
  FOLLOWERS: (id: string) => ['users', id, 'followers'] as const,
  FOLLOWING: (id: string) => ['users', id, 'following'] as const,
  SEARCH: (query: string) => ['users', 'search', query] as const,
  STATS: (id: string) => ['users', id, 'stats'] as const,
} as const;

// Success Messages
export const USER_SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully',
  AVATAR_UPDATED: 'Avatar updated successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
  USER_FOLLOWED: 'User followed successfully',
  USER_UNFOLLOWED: 'User unfollowed successfully',
  USER_BANNED: 'User banned successfully',
  USER_UNBANNED: 'User unbanned successfully',
  DEVICE_TOKEN_ADDED: 'Device registered for notifications',
  DEVICE_TOKEN_REMOVED: 'Device unregistered from notifications',
} as const;

// UI Constants
export const AVATAR_SIZES = {
  XS: 'xs',
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  '2XL': '2xl',
} as const;

export const USER_CARD_VARIANTS = {
  COMPACT: 'compact',
  DEFAULT: 'default',
  DETAILED: 'detailed',
} as const;