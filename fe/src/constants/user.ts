export const USER_ENDPOINTS = {
  // Profile endpoints
  PROFILE: '/profile',
  UPDATE_PROFILE: '/profile',
  UPDATE_AVATAR: '/profile/avatar',
  UPDATE_SETTINGS: '/profile/settings',
  
  // User endpoints
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_BY_USERNAME: (username: string) => `/users/username/${username}`,
  UPDATE_USER: (id: string) => `/users/${id}`,
  DELETE_USER: (id: string) => `/users/${id}`,
  BAN_USER: (id: string) => `/users/${id}/ban`,
  UNBAN_USER: (id: string) => `/users/${id}/unban`,
  
  // Follow endpoints
  FOLLOW_USER: (id: string) => `/users/${id}/follow`,
  UNFOLLOW_USER: (id: string) => `/users/${id}/unfollow`,
  GET_FOLLOWERS: (id: string) => `/users/${id}/followers`,
  GET_FOLLOWING: (id: string) => `/users/${id}/following`,
  
  // Device token endpoints
  ADD_DEVICE_TOKEN: '/users/device-token',
  REMOVE_DEVICE_TOKEN: '/users/device-token',
  
  // Push notification settings
  GET_PUSH_SETTINGS: '/users/push-settings',
  UPDATE_PUSH_SETTINGS: '/users/push-settings',
};

// User Status Options
export const USER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'inactive', label: 'Inactive', color: 'gray' },
  { value: 'banned', label: 'Banned', color: 'red' },
] as const;

// User Role Options
export const USER_ROLE_OPTIONS = [
  { value: 'user', label: 'User', color: 'blue' },
  { value: 'moderator', label: 'Moderator', color: 'yellow' },
  { value: 'admin', label: 'Admin', color: 'purple' },
] as const;

// Privacy Options
export const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can see your profile' },
  { value: 'friends', label: 'Friends Only', description: 'Only your friends can see your profile' },
  { value: 'private', label: 'Private', description: 'Only you can see your profile' },
] as const;

// Theme Options
export const THEME_OPTIONS = [
  { value: 'light', label: 'Light Theme', icon: '☀️' },
  { value: 'dark', label: 'Dark Theme', icon: '🌙' },
] as const;

// Language Options
export const LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
] as const;

// Profile Validation Rules
export const PROFILE_VALIDATION = {
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
};

// Avatar Upload Constraints
export const AVATAR_CONSTRAINTS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MIN_DIMENSIONS: { width: 100, height: 100 },
  MAX_DIMENSIONS: { width: 2048, height: 2048 },
};

// Default User Settings
export const DEFAULT_USER_SETTINGS = {
  notifications: true,
  privacy: 'public' as const,
  language: 'vi',
  theme: 'light' as const,
};

// Default Push Settings
export const DEFAULT_PUSH_SETTINGS = {
  enabled: true,
  sound: true,
  vibrate: true,
  badge: true,
};

// User Error Messages
export const USER_ERRORS = {
  USER_NOT_FOUND: 'User not found',
  PROFILE_UPDATE_FAILED: 'Failed to update profile',
  AVATAR_UPLOAD_FAILED: 'Failed to upload avatar',
  SETTINGS_UPDATE_FAILED: 'Failed to update settings',
  FOLLOW_FAILED: 'Failed to follow user',
  UNFOLLOW_FAILED: 'Failed to unfollow user',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload an image file.',
  FILE_TOO_LARGE: 'File too large. Maximum size is 5MB.',
  INVALID_DISPLAY_NAME: 'Display name contains invalid characters.',
  BIO_TOO_LONG: 'Bio is too long. Maximum 500 characters.',
  LOCATION_TOO_LONG: 'Location is too long. Maximum 100 characters.',
};

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

// User List Filters
export const USER_LIST_FILTERS = {
  STATUS: {
    ALL: 'all',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BANNED: 'banned',
  },
  ROLE: {
    ALL: 'all',
    USER: 'user',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
  },
  SORT: {
    NEWEST: 'newest',
    OLDEST: 'oldest',
    USERNAME: 'username',
    BALANCE: 'balance',
  },
} as const;

// Pagination Defaults
export const USER_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  LIMITS: [10, 20, 50, 100],
} as const;