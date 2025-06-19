// src/features/auth/index.ts

import { User } from './types';
import { getStoredTokens, isTokenExpired } from './utils';



export type {
  User,
  AuthTokens,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  LogoutRequest,
  AuthState,
  SocialAuthUser,
  AuthError,
  ApiResponse,
  LoginFormData,
  RegisterFormData,
  ValidationError,
  AuthStatus,
} from './types';

// Services
export {
  AuthService,
  PasswordService,
  EmailVerificationService,
  TwoFactorService,
  SessionService,
  AUTH_ENDPOINTS,
} from './services';

// Hooks
export {
  useLogin,
  useRegister,
  useLogout,
  useUser,
  useAuth,
  useRefreshToken,
  useForgotPassword,
  useResetPassword,
  useChangePassword,
  useResendVerification,
  useVerifyEmail,
  useSocialAuth,
  AUTH_QUERY_KEYS,
} from './hooks';

// Store
export {
  useAuthStore,
  useAuthUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useAuthTokens,
  useAuthActions,
  useAuthOperations,
  useAuthInitialization,
} from './store';

// Utils
export {
  validateEmail,
  validateUsername,
  validatePassword,
  validateLoginForm,
  validateRegisterForm,
  isTokenExpired,
  getTokenPayload,
  AUTH_STORAGE_KEYS,
  clearAuthStorage,
  getStoredTokens,
  setStoredTokens,
  getStoredUser,
  setStoredUser,
  parseAuthError,
  openSocialAuthWindow,
} from './utils';

// Re-export common patterns for easy imports
export const authQueryKeys = {
  all: ['auth'] as const,
  user: () => [...authQueryKeys.all, 'user'] as const,
  profile: () => [...authQueryKeys.all, 'profile'] as const,
  sessions: () => [...authQueryKeys.all, 'sessions'] as const,
};

// Common auth utilities for easy access
export const authUtils = {
  isAuthenticated: () => {
    const { accessToken } = getStoredTokens();
    return !!accessToken && !isTokenExpired(accessToken);
  },
  
  getAuthHeaders: () => {
    const { accessToken } = getStoredTokens();
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  },
  
  redirectToLogin: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
  
  redirectToDashboard: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  },
};

// Constants for easy reference
export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
} as const;

// Auth status checks
export const authChecks = {
  requireAuth: (user: User | null) => {
    if (!user) {
      throw new Error('Authentication required');
    }
    return user;
  },
  
  requireEmailVerified: (user: User) => {
    // Assuming user has emailVerified field
    if (!(user as any).emailVerified) {
      throw new Error('Email verification required');
    }
    return user;
  },
  
  requireRole: (user: User, requiredRole: string) => {
    // Assuming user has role field
    if ((user as any).role !== requiredRole) {
      throw new Error(`Role ${requiredRole} required`);
    }
    return user;
  },
};

// Error messages for consistency
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác',
  EMAIL_EXISTS: 'Email đã tồn tại',
  USERNAME_EXISTS: 'Tên người dùng đã tồn tại',
  WEAK_PASSWORD: 'Mật khẩu không đủ mạnh',
  INVALID_EMAIL: 'Email không hợp lệ',
  REQUIRED_FIELD: 'Trường này là bắt buộc',
  PASSWORD_MISMATCH: 'Mật khẩu không khớp',
  NETWORK_ERROR: 'Lỗi kết nối mạng',
  SERVER_ERROR: 'Lỗi máy chủ',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn',
  UNAUTHORIZED: 'Không có quyền truy cập',
  EMAIL_NOT_VERIFIED: 'Email chưa được xác thực',
} as const;