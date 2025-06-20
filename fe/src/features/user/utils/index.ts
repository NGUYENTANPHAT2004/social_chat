import type {
  User,
  UserProfile,
  UserSettings,
  UpdateProfileDto,
  UserError,
  ValidationResult,
  UserValidationRules,
} from '../type';

/**
 * Validation rules cho user data
 */
export const USER_VALIDATION_RULES: UserValidationRules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  displayName: {
    maxLength: 50,
  },
  bio: {
    maxLength: 500,
  },
  location: {
    maxLength: 100,
  },
};

/**
 * Constants
 */
export const USER_CONSTANTS = {
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  AVATAR_ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  DEFAULT_AVATAR: '/images/default-avatar.png',
  SEARCH_MIN_LENGTH: 2,
  SEARCH_DEBOUNCE_MS: 300,
  PAGINATION_LIMIT: 20,
} as const;

/**
 * User validation functions
 */

/**
 * Validate username
 */
export const validateUsername = (username: string): ValidationResult => {
  const errors: UserError[] = [];
  const rules = USER_VALIDATION_RULES.username;

  if (!username) {
    errors.push({ message: 'Username is required', field: 'username' });
    return { isValid: false, errors };
  }

  if (username.length < rules.minLength) {
    errors.push({ 
      message: `Username must be at least ${rules.minLength} characters`, 
      field: 'username' 
    });
  }

  if (username.length > rules.maxLength) {
    errors.push({ 
      message: `Username must be no more than ${rules.maxLength} characters`, 
      field: 'username' 
    });
  }

  if (!rules.pattern.test(username)) {
    errors.push({ 
      message: 'Username can only contain letters, numbers, and underscores', 
      field: 'username' 
    });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate email
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: UserError[] = [];
  const rules = USER_VALIDATION_RULES.email;

  if (!email) {
    errors.push({ message: 'Email is required', field: 'email' });
    return { isValid: false, errors };
  }

  if (!rules.pattern.test(email)) {
    errors.push({ message: 'Invalid email format', field: 'email' });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate display name
 */
export const validateDisplayName = (displayName: string): ValidationResult => {
  const errors: UserError[] = [];
  const rules = USER_VALIDATION_RULES.displayName;

  if (displayName && displayName.length > rules.maxLength) {
    errors.push({ 
      message: `Display name must be no more than ${rules.maxLength} characters`, 
      field: 'displayName' 
    });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate bio
 */
export const validateBio = (bio: string): ValidationResult => {
  const errors: UserError[] = [];
  const rules = USER_VALIDATION_RULES.bio;

  if (bio && bio.length > rules.maxLength) {
    errors.push({ 
      message: `Bio must be no more than ${rules.maxLength} characters`, 
      field: 'bio' 
    });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate location
 */
export const validateLocation = (location: string): ValidationResult => {
  const errors: UserError[] = [];
  const rules = USER_VALIDATION_RULES.location;

  if (location && location.length > rules.maxLength) {
    errors.push({ 
      message: `Location must be no more than ${rules.maxLength} characters`, 
      field: 'location' 
    });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate update profile form
 */
export const validateUpdateProfile = (data: UpdateProfileDto): ValidationResult => {
  const errors: UserError[] = [];

  if (data.displayName) {
    const displayNameValidation = validateDisplayName(data.displayName);
    errors.push(...displayNameValidation.errors);
  }

  if (data.bio) {
    const bioValidation = validateBio(data.bio);
    errors.push(...bioValidation.errors);
  }

  if (data.location) {
    const locationValidation = validateLocation(data.location);
    errors.push(...locationValidation.errors);
  }

  if (data.birthdate) {
    const birthDate = new Date(data.birthdate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 13) {
      errors.push({ 
        message: 'You must be at least 13 years old', 
        field: 'birthdate' 
      });
    }

    if (birthDate > today) {
      errors.push({ 
        message: 'Birth date cannot be in the future', 
        field: 'birthdate' 
      });
    }
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Avatar validation functions
 */

/**
 * Validate avatar file
 */
export const validateAvatarFile = (file: File): ValidationResult => {
  const errors: UserError[] = [];

  if (!file) {
    errors.push({ message: 'No file selected', field: 'avatar' });
    return { isValid: false, errors };
  }

  if (file.size > USER_CONSTANTS.AVATAR_MAX_SIZE) {
    errors.push({ 
      message: `File size must be less than ${USER_CONSTANTS.AVATAR_MAX_SIZE / (1024 * 1024)}MB`, 
      field: 'avatar' 
    });
  }

  if (!USER_CONSTANTS.AVATAR_ALLOWED_TYPES.includes(file.type)) {
    errors.push({ 
      message: 'Only JPEG, PNG, and GIF files are allowed', 
      field: 'avatar' 
    });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * User utility functions
 */

/**
 * Get user display name (fallback to username)
 */
export const getUserDisplayName = (user: User): string => {
  return user.profile.displayName || user.username;
};

/**
 * Get user avatar URL (fallback to default)
 */
export const getUserAvatarUrl = (user: User): string => {
  return user.avatar || USER_CONSTANTS.DEFAULT_AVATAR;
};

/**
 * Format user creation date
 */
export const formatUserJoinDate = (createdAt: string): string => {
  const date = new Date(createdAt);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
  });
};

/**
 * Calculate user age from birthdate
 */
export const calculateUserAge = (birthdate: Date | null): number | null => {
  if (!birthdate) return null;
  
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Check if user is online (based on last activity)
 */
export const isUserOnline = (user: User, thresholdMinutes = 5): boolean => {
  // This would typically check lastActivity field
  // For now, return random for demo
  return Math.random() > 0.5;
};

/**
 * Get user status color
 */
export const getUserStatusColor = (user: User): string => {
  switch (user.status) {
    case 'active':
      return 'green';
    case 'inactive':
      return 'yellow';
    case 'banned':
      return 'red';
    default:
      return 'gray';
  }
};

/**
 * Get user role color
 */
export const getUserRoleColor = (user: User): string => {
  switch (user.role) {
    case 'admin':
      return 'purple';
    case 'moderator':
      return 'blue';
    case 'user':
      return 'gray';
    default:
      return 'gray';
  }
};

/**
 * Format KC balance
 */
export const formatKCBalance = (balance: number): string => {
  if (balance >= 1000000) {
    return `${(balance / 1000000).toFixed(1)}M KC`;
  } else if (balance >= 1000) {
    return `${(balance / 1000).toFixed(1)}K KC`;
  }
  return `${balance} KC`;
};

/**
 * Search utilities
 */

/**
 * Debounce search function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Filter users by search term
 */
export const filterUsersBySearch = (users: User[], searchTerm: string): User[] => {
  if (!searchTerm || searchTerm.length < USER_CONSTANTS.SEARCH_MIN_LENGTH) {
    return [];
  }

  const term = searchTerm.toLowerCase();
  
  return users.filter(user => 
    user.username.toLowerCase().includes(term) ||
    user.profile.displayName.toLowerCase().includes(term) ||
    user.email.toLowerCase().includes(term)
  );
};

/**
 * Sort users by various criteria
 */
export const sortUsers = (users: User[], sortBy: 'username' | 'displayName' | 'createdAt' | 'kcBalance', direction: 'asc' | 'desc' = 'asc'): User[] => {
  return [...users].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch (sortBy) {
      case 'username':
        valueA = a.username.toLowerCase();
        valueB = b.username.toLowerCase();
        break;
      case 'displayName':
        valueA = getUserDisplayName(a).toLowerCase();
        valueB = getUserDisplayName(b).toLowerCase();
        break;
      case 'createdAt':
        valueA = new Date(a.createdAt);
        valueB = new Date(b.createdAt);
        break;
      case 'kcBalance':
        valueA = a.kcBalance;
        valueB = b.kcBalance;
        break;
      default:
        return 0;
    }

    if (valueA < valueB) {
      return direction === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Privacy utilities
 */

/**
 * Check if user profile is public
 */
export const isUserProfilePublic = (user: User): boolean => {
  return user.settings.privacy === 'public';
};

/**
 * Check if current user can view target user's profile
 */
export const canViewUserProfile = (
  targetUser: User, 
  currentUser: User | null,
  isFollowing = false
): boolean => {
  if (!currentUser) {
    return isUserProfilePublic(targetUser);
  }

  // Own profile is always viewable
  if (targetUser.id === currentUser.id) {
    return true;
  }

  // Admin can view all profiles
  if (currentUser.role === 'admin') {
    return true;
  }

  switch (targetUser.settings.privacy) {
    case 'public':
      return true;
    case 'friends':
      return isFollowing;
    case 'private':
      return false;
    default:
      return false;
  }
};

/**
 * Error parsing utilities
 */

/**
 * Parse API error to user-friendly message
 */
export const parseUserError = (error: any): UserError => {
  if (typeof error === 'string') {
    return { message: error };
  }

  if (error?.response?.data?.message) {
    return { message: error.response.data.message };
  }

  if (error?.message) {
    return { message: error.message };
  }

  return { message: 'An unexpected error occurred' };
};

/**
 * Data transformation utilities
 */

/**
 * Transform API user data to frontend format
 */
export const transformUserData = (apiUser: any): User => {
  return {
    id: apiUser._id || apiUser.id,
    username: apiUser.username,
    email: apiUser.email,
    avatar: apiUser.avatar || USER_CONSTANTS.DEFAULT_AVATAR,
    kcBalance: apiUser.kcBalance || 0,
    status: apiUser.status,
    role: apiUser.role,
    profile: {
      displayName: apiUser.profile?.displayName || '',
      bio: apiUser.profile?.bio || '',
      location: apiUser.profile?.location || '',
      birthdate: apiUser.profile?.birthdate ? new Date(apiUser.profile.birthdate) : null,
    },
    settings: {
      notifications: apiUser.settings?.notifications ?? true,
      privacy: apiUser.settings?.privacy || 'public',
      language: apiUser.settings?.language || 'vi',
      theme: apiUser.settings?.theme || 'light',
    },
    deviceTokens: apiUser.deviceTokens || [],
    pushSettings: {
      enabled: apiUser.pushSettings?.enabled ?? true,
      sound: apiUser.pushSettings?.sound ?? true,
      vibrate: apiUser.pushSettings?.vibrate ?? true,
      badge: apiUser.pushSettings?.badge ?? true,
    },
    trustScore: apiUser.trustScore || 100,
    following: apiUser.following || [],
    followers: apiUser.followers || [],
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt,
  };
};

/**
 * Create default user profile
 */
export const createDefaultUserProfile = (): Partial<UserProfile> => {
  return {
    displayName: '',
    bio: '',
    location: '',
    birthdate: null,
  };
};

/**
 * Create default user settings
 */
export const createDefaultUserSettings = (): UserSettings => {
  return {
    notifications: true,
    privacy: 'public',
    language: 'vi',
    theme: 'light',
  };
};

/**
 * URL utilities
 */

/**
 * Generate user profile URL
 */
export const getUserProfileUrl = (user: User): string => {
  return `/users/${user.username}`;
};

/**
 * Generate user avatar upload URL
 */
export const getUserAvatarUploadUrl = (): string => {
  return '/api/users/me/avatar';
};