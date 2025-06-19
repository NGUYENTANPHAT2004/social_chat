// src/features/auth/services/index.ts

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

export class AuthService {
  /**
   * Đăng nhập người dùng
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      AUTH_ENDPOINTS.LOGIN,
      data
    );
    return response.data.data;
  }

  /**
   * Đăng ký người dùng mới
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      AUTH_ENDPOINTS.REGISTER,
      data
    );
    return response.data.data;
  }

  /**
   * Làm mới access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await apiClient.post<ApiResponse<AuthTokens>>(
      AUTH_ENDPOINTS.REFRESH,
      { refreshToken }
    );
    return response.data.data;
  }

  /**
   * Lấy thông tin profile người dùng hiện tại
   */
  static async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(AUTH_ENDPOINTS.ME);
    return response.data.data;
  }

  /**
   * Đăng xuất người dùng
   */
  static async logout(refreshToken: string): Promise<void> {
    await apiClient.post(AUTH_ENDPOINTS.LOGOUT, { refreshToken });
  }

  /**
   * Kiểm tra trạng thái đăng nhập
   */
  static async verifyAuth(): Promise<User> {
    return this.getProfile();
  }

  /**
   * Đăng nhập bằng Google
   */
  static getGoogleAuthUrl(): string {
    // Trả về URL cho Google OAuth
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    return `${baseUrl}${AUTH_ENDPOINTS.GOOGLE}`;
  }

  /**
   * Đăng nhập bằng Facebook
   */
  static getFacebookAuthUrl(): string {
    // Trả về URL cho Facebook OAuth
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    return `${baseUrl}${AUTH_ENDPOINTS.FACEBOOK}`;
  }

  /**
   * Xử lý callback từ social auth
   */
  static async handleSocialCallback(
    provider: 'google' | 'facebook',
    code: string
  ): Promise<AuthResponse> {
    const endpoint = provider === 'google' 
      ? AUTH_ENDPOINTS.GOOGLE_CALLBACK 
      : AUTH_ENDPOINTS.FACEBOOK_CALLBACK;
    
    const response = await apiClient.get<ApiResponse<AuthResponse>>(
      `${endpoint}?code=${code}`
    );
    return response.data.data;
  }
}

// Password utilities service
export class PasswordService {
  /**
   * Gửi email reset password
   */
  static async sendResetEmail(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  /**
   * Reset password với token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
  }

  /**
   * Thay đổi password (khi đã đăng nhập)
   */
  static async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }
}

// Email verification service
export class EmailVerificationService {
  /**
   * Gửi lại email xác thực
   */
  static async resendVerificationEmail(): Promise<void> {
    await apiClient.post('/auth/resend-verification');
  }

  /**
   * Xác thực email với token
   */
  static async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  }
}

// Two-factor authentication service
export class TwoFactorService {
  /**
   * Bật 2FA
   */
  static async enable2FA(): Promise<{ qrCode: string; secret: string }> {
    const response = await apiClient.post<ApiResponse<{ qrCode: string; secret: string }>>(
      '/auth/2fa/enable'
    );
    return response.data.data;
  }

  /**
   * Tắt 2FA
   */
  static async disable2FA(code: string): Promise<void> {
    await apiClient.post('/auth/2fa/disable', { code });
  }

  /**
   * Xác thực 2FA code
   */
  static async verify2FA(code: string): Promise<AuthTokens> {
    const response = await apiClient.post<ApiResponse<AuthTokens>>(
      '/auth/2fa/verify',
      { code }
    );
    return response.data.data;
  }
}

// Session management service
export class SessionService {
  /**
   * Lấy danh sách sessions đang hoạt động
   */
  static async getActiveSessions(): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>('/auth/sessions');
    return response.data.data;
  }

  /**
   * Đăng xuất khỏi session cụ thể
   */
  static async terminateSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${sessionId}`);
  }

  /**
   * Đăng xuất khỏi tất cả sessions
   */
  static async terminateAllSessions(): Promise<void> {
    await apiClient.delete('/auth/sessions/all');
  }
}

export { AUTH_ENDPOINTS };