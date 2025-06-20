import { apiClient } from '../../../shared/api/client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  AuthTokens,
  ApiResponse,
} from '../types';

// API endpoints
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh-token',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  GOOGLE: '/auth/google',
  FACEBOOK: '/auth/facebook',
  GOOGLE_CALLBACK: '/auth/google/callback',
  FACEBOOK_CALLBACK: '/auth/facebook/callback',
} as const;

// Helper: unwrap API response
const unwrapResponse = <T extends object>(response: ApiResponse<T> | T): T => {
  if ('data' in response && response.data) return response.data;
  return response as T;
};

// Debug function to safely log responses
const debugResponse = (endpoint: string, response: any) => {
  console.group(`🔍 API Response Debug: ${endpoint}`);
  console.log('Status:', response.status);
  console.log('Headers:', response.headers);
  console.log('Raw Data:', response.data);
  if (response.data) {
    console.group('Auth Fields Check:');
    console.log('Has accessToken:', !!response.data.accessToken);
    console.log('Has user:', !!response.data.user);
    console.log('Has refreshToken:', !!response.data.refreshToken);
    if (response.data.data) {
      console.log('--- In nested data ---');
      console.log('Has data.accessToken:', !!response.data.data.accessToken);
      console.log('Has data.user:', !!response.data.data.user);
      console.log('Has data.refreshToken:', !!response.data.data.refreshToken);
    }
    console.groupEnd();
  }
  console.groupEnd();
};

export class AuthService {
  static async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        AUTH_ENDPOINTS.LOGIN,
        data
      );
      debugResponse('LOGIN', response);
      return unwrapResponse(response.data);
    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        AUTH_ENDPOINTS.REGISTER,
        data
      );
      debugResponse('REGISTER', response);
      return unwrapResponse(response.data);
    } catch (error) {
      console.error('Register service error:', error);
      throw error;
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await apiClient.post<ApiResponse<AuthTokens>>(
        AUTH_ENDPOINTS.REFRESH,
        { refreshToken }
      );
      debugResponse('REFRESH', response);
      return unwrapResponse(response.data);
    } catch (error) {
      console.error('Refresh token service error:', error);
      throw error;
    }
  }

  static async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(AUTH_ENDPOINTS.ME);
      debugResponse('GET_PROFILE', response);
      return unwrapResponse(response.data);
    } catch (error) {
      console.error('Get profile service error:', error);
      throw error;
    }
  }

  static async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post(AUTH_ENDPOINTS.LOGOUT, { refreshToken });
    } catch (error) {
      console.error('Logout service error:', error);
      throw error;
    }
  }

  static async verifyAuth(): Promise<User> {
    return this.getProfile();
  }

  static getGoogleAuthUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    return `${baseUrl}${AUTH_ENDPOINTS.GOOGLE}`;
  }

  static getFacebookAuthUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    return `${baseUrl}${AUTH_ENDPOINTS.FACEBOOK}`;
  }

  static async handleSocialCallback(
    provider: 'google' | 'facebook',
    code: string
  ): Promise<AuthResponse> {
    try {
      const endpoint =
        provider === 'google'
          ? AUTH_ENDPOINTS.GOOGLE_CALLBACK
          : AUTH_ENDPOINTS.FACEBOOK_CALLBACK;

      const response = await apiClient.get<ApiResponse<AuthResponse>>(
        `${endpoint}?code=${code}`
      );

      debugResponse(`SOCIAL_CALLBACK_${provider.toUpperCase()}`, response);
      return unwrapResponse(response.data);
    } catch (error) {
      console.error('Social auth callback service error:', error);
      throw error;
    }
  }
}

// Password Service
export class PasswordService {
  static async sendResetEmail(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error) {
      console.error('Send reset email service error:', error);
      throw error;
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: newPassword,
      });
    } catch (error) {
      console.error('Reset password service error:', error);
      throw error;
    }
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
    } catch (error) {
      console.error('Change password service error:', error);
      throw error;
    }
  }
}

// Email Verification
export class EmailVerificationService {
  static async resendVerificationEmail(): Promise<void> {
    try {
      await apiClient.post('/auth/resend-verification');
    } catch (error) {
      console.error('Resend verification service error:', error);
      throw error;
    }
  }

  static async verifyEmail(token: string): Promise<void> {
    try {
      await apiClient.post('/auth/verify-email', { token });
    } catch (error) {
      console.error('Verify email service error:', error);
      throw error;
    }
  }
}

// 2FA Service
export class TwoFactorService {
  static async enable2FA(): Promise<{ qrCode: string; secret: string }> {
    try {
      const response = await apiClient.post<ApiResponse<{ qrCode: string; secret: string }>>(
        '/auth/2fa/enable'
      );
      return unwrapResponse(response.data);
    } catch (error) {
      console.error('Enable 2FA service error:', error);
      throw error;
    }
  }

  static async disable2FA(code: string): Promise<void> {
    try {
      await apiClient.post('/auth/2fa/disable', { code });
    } catch (error) {
      console.error('Disable 2FA service error:', error);
      throw error;
    }
  }

  static async verify2FA(code: string): Promise<AuthTokens> {
    try {
      const response = await apiClient.post<ApiResponse<AuthTokens>>(
        '/auth/2fa/verify',
        { code }
      );
      return unwrapResponse(response.data);
    } catch (error) {
      console.error('Verify 2FA service error:', error);
      throw error;
    }
  }
}

// Session Service
export class SessionService {
  static async getActiveSessions(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/auth/sessions');
      return unwrapResponse(response.data);
    } catch (error) {
      console.error('Get sessions service error:', error);
      throw error;
    }
  }

  static async terminateSession(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
    } catch (error) {
      console.error('Terminate session service error:', error);
      throw error;
    }
  }

  static async terminateAllSessions(): Promise<void> {
    try {
      await apiClient.delete('/auth/sessions/all');
    } catch (error) {
      console.error('Terminate all sessions service error:', error);
      throw error;
    }
  }
}

export { AUTH_ENDPOINTS };
