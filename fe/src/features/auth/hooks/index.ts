// src/features/auth/hooks/index.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { AuthService, PasswordService, EmailVerificationService } from '../services';
import type {
  AuthResponse,
  User,
  LoginFormData,
  RegisterFormData,
} from '../types';
import {
  setStoredTokens,
  setStoredUser,
  clearAuthStorage,
  getStoredTokens,
  getStoredUser,
  parseAuthError,
  validateLoginForm,
  validateRegisterForm,
} from '../utils';

// Query keys
export const AUTH_QUERY_KEYS = {
  user: ['auth', 'user'] as const,
  profile: ['auth', 'profile'] as const,
  sessions: ['auth', 'sessions'] as const,
} as const;

/**
 * Hook đăng nhập
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginFormData) => {
      // Validate form data
      const validationErrors = validateLoginForm(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0].message);
      }

      // Call API
      const response = await AuthService.login({
        identifier: data.identifier,
        password: data.password,
      });

      return response;
    },
    onSuccess: (data: AuthResponse) => {
      // Lưu tokens và user vào storage
      setStoredTokens(data.accessToken, data.refreshToken);
      setStoredUser(data.user);

      // Update cache
      queryClient.setQueryData(AUTH_QUERY_KEYS.user, data.user);
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile, data.user);

      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error : any) => {
      console.error('Login error:', parseAuthError(error));
    },
  });
};

/**
 * Hook đăng ký
 */
export const useRegister = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterFormData) => {
      // Validate form data
      const validationErrors = validateRegisterForm(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0].message);
      }

      // Call API
      const response = await AuthService.register({
        username: data.username,
        email: data.email,
        password: data.password,
      });

      return response;
    },
    onSuccess: (data: AuthResponse) => {
      // Lưu tokens và user vào storage
      setStoredTokens(data.accessToken, data.refreshToken);
      setStoredUser(data.user);

      // Update cache
      queryClient.setQueryData(AUTH_QUERY_KEYS.user, data.user);
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile, data.user);

      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error : any) => {
      console.error('Register error:', parseAuthError(error));
    },
  });
};

/**
 * Hook đăng xuất
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = getStoredTokens();
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
    },
    onSuccess: () => {
      // Clear storage
      clearAuthStorage();

      // Clear all queries
      queryClient.clear();

      // Redirect to login
      router.push('/login');
    },
    onError: (error : any) => {
      // Ngay cả khi logout API fail, vẫn clear local storage
      clearAuthStorage();
      queryClient.clear();
      router.push('/login');
      console.error('Logout error:', parseAuthError(error));
    },
  });
};

/**
 * Hook lấy thông tin user hiện tại
 */
export const useUser = () => {
  return useQuery({
    queryKey: AUTH_QUERY_KEYS.user,
    queryFn: async () => {
      const { accessToken } = getStoredTokens();
      if (!accessToken) {
        throw new Error('No access token found');
      }
      return AuthService.getProfile();
    },
    initialData: () => getStoredUser(),
    retry: (failureCount : number, error: any) => {
      // Không retry nếu là lỗi 401 (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook kiểm tra trạng thái đăng nhập
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  const userQuery = useUser();
  const { accessToken } = getStoredTokens();

  const isAuthenticated = !!accessToken && !!userQuery.data && !userQuery.error;

  const invalidateAuth = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
  }, [queryClient]);

  const updateUser = useCallback((user: Partial<User>) => {
    queryClient.setQueryData(AUTH_QUERY_KEYS.user, (oldData: User | undefined) => {
      if (!oldData) return oldData;
      const updatedUser = { ...oldData, ...user };
      setStoredUser(updatedUser);
      return updatedUser;
    });
  }, [queryClient]);

  return {
    user: userQuery.data,
    isAuthenticated,
    isLoading: userQuery.isLoading,
    error: userQuery.error ? parseAuthError(userQuery.error) : null,
    invalidateAuth,
    updateUser,
  };
};

/**
 * Hook refresh token
 */
export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { refreshToken } = getStoredTokens();
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }
      return AuthService.refreshToken(refreshToken);
    },
    onSuccess: (data : any) => {
      // Update stored tokens
      setStoredTokens(data.accessToken, data.refreshToken);
      
      // Invalidate user query to refetch with new token
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
    },
    onError: () => {
      // Clear storage and redirect to login on refresh failure
      clearAuthStorage();
      queryClient.clear();
      window.location.href = '/login';
    },
  });
};

/**
 * Hook gửi email reset password
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => PasswordService.sendResetEmail(email),
    onError: (error : any) => {
      console.error('Forgot password error:', parseAuthError(error));
    },
  });
};

/**
 * Hook reset password
 */
export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      PasswordService.resetPassword(token, password),
    onSuccess: () => {
      // Redirect to login after successful reset
      router.push('/login?message=password-reset-success');
    },
    onError: (error : any) => {
      console.error('Reset password error:', parseAuthError(error));
    },
  });
};

/**
 * Hook thay đổi password (khi đã đăng nhập)
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { 
      currentPassword: string; 
      newPassword: string;
    }) => PasswordService.changePassword(currentPassword, newPassword),
    onError: (error : any) => {
      console.error('Change password error:', parseAuthError(error));
    },
  });
};

/**
 * Hook gửi lại email xác thực
 */
export const useResendVerification = () => {
  return useMutation({
    mutationFn: () => EmailVerificationService.resendVerificationEmail(),
    onError: (error : any) => {
      console.error('Resend verification error:', parseAuthError(error));
    },
  });
};

/**
 * Hook xác thực email
 */
export const useVerifyEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => EmailVerificationService.verifyEmail(token),
    onSuccess: () => {
      // Invalidate user query to refetch updated verification status
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
    },
    onError: (error : any) => {
      console.error('Verify email error:', parseAuthError(error));
    },
  });
};

/**
 * Hook cho social authentication
 */
export const useSocialAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSocialAuth = useCallback((provider: 'google' | 'facebook') => {
    const authUrl = provider === 'google' 
      ? AuthService.getGoogleAuthUrl()
      : AuthService.getFacebookAuthUrl();
    
    window.location.href = authUrl;
  }, []);

  const handleSocialCallback = useMutation({
    mutationFn: ({ provider, code }: { provider: 'google' | 'facebook'; code: string }) =>
      AuthService.handleSocialCallback(provider, code),
    onSuccess: (data: AuthResponse) => {
      // Lưu tokens và user vào storage
      setStoredTokens(data.accessToken, data.refreshToken);
      setStoredUser(data.user);

      // Update cache
      queryClient.setQueryData(AUTH_QUERY_KEYS.user, data.user);

      // Redirect to dashboard
      router.push('/dashboard');
    },
    onError: (error : any) => {
      console.error('Social auth error:', parseAuthError(error));
      router.push('/login?error=social-auth-failed');
    },
  });

  return {
    loginWithGoogle: () => handleSocialAuth('google'),
    loginWithFacebook: () => handleSocialAuth('facebook'),
    handleCallback: handleSocialCallback.mutateAsync,
    isLoading: handleSocialCallback.isPending,
  };
};