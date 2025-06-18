// src/constants/auth.ts

// Auth API Endpoints
export const AUTH_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  
  // OAuth
  GOOGLE_LOGIN: '/auth/google',
  GOOGLE_CALLBACK: '/auth/google/callback',
  FACEBOOK_LOGIN: '/auth/facebook',
  FACEBOOK_CALLBACK: '/auth/facebook/callback',
  
  // Password Reset (for future implementation)
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  RESEND_VERIFICATION: '/auth/resend-verification',
};

// Auth Routes (Frontend)
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  GOOGLE_CALLBACK: '/auth/google/callback',
  FACEBOOK_CALLBACK: '/auth/facebook/callback',
};

// Protected Routes that require authentication
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/chat',
  '/rooms',
  '/games',
  '/payment',
  '/transactions',
];

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/help',
];

// Auth Storage Keys
export const AUTH_STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  OAUTH_REDIRECT: 'oauth_redirect',
  REMEMBER_ME: 'remember_me',
};

// Auth Error Messages
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email/username or password',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USERNAME_ALREADY_EXISTS: 'Username already exists',
  WEAK_PASSWORD: 'Password is too weak',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_USERNAME: 'Invalid username format',
  TOKEN_EXPIRED: 'Session expired, please login again',
  REFRESH_TOKEN_EXPIRED: 'Session expired, please login again',
  NETWORK_ERROR: 'Network error, please try again',
  SERVER_ERROR: 'Server error, please try again later',
  OAUTH_ERROR: 'Social login failed, please try again',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',
  ACCOUNT_DISABLED: 'Your account has been disabled',
  TOO_MANY_ATTEMPTS: 'Too many login attempts, please try again later',
};

// Validation Rules
export const AUTH_VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_]+$/,
    ERROR_MESSAGE: 'Username can only contain letters, numbers and underscore',
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    ERROR_MESSAGE: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    ERROR_MESSAGE: 'Please enter a valid email address',
  },
};

// OAuth Providers Configuration
export const OAUTH_PROVIDERS = {
  GOOGLE: {
    name: 'Google',
    id: 'google',
    color: 'bg-red-500',
    icon: 'google',
  },
  FACEBOOK: {
    name: 'Facebook',
    id: 'facebook',
    color: 'bg-blue-600',
    icon: 'facebook',
  },
};

// Session Configuration
export const SESSION_CONFIG = {
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  AUTO_LOGOUT_WARNING: 5 * 60 * 1000, // Warn 5 minutes before auto logout
  IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes of inactivity
};