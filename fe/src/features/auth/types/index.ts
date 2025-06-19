// src/features/auth/types/index.ts

export interface User {
  id: string;
  username: string;
  email: string;
  profile: {
    displayName: string;
    avatar?: string;
    bio?: string;
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  identifier: string; // email or username
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SocialAuthUser {
  email: string;
  displayName: string;
  picture?: string;
  provider: 'google' | 'facebook';
}

// Error types
export interface AuthError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Form validation types
export interface LoginFormData {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export type AuthStatus = 'idle' | 'loading' | 'success' | 'error';