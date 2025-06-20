

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

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
      try {
        console.log('Login response:', data);

        // Check if response has required fields
        if (!data.accessToken || !data.user) {
          console.error('Invalid auth response structure:', data);
          throw new Error('Phản hồi không hợp lệ từ máy chủ');
        }

        // Lưu tokens và user vào storage
        setStoredTokens(data.accessToken, data.refreshToken);
        setStoredUser(data.user);

        // Update cache
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, data.user);
        queryClient.setQueryData(AUTH_QUERY_KEYS.profile, data.user);
        toast.success('Đăng nhập thành công!');
      } catch (error) {
        console.error('Login success handler error:', error);
        toast.error('Có lỗi xảy ra khi xử lý đăng nhập');
      }
    },
    onError: (error: any) => {
      const errorMessage = parseAuthError(error);
      console.error('Login error:', errorMessage);
      toast.error(errorMessage);
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
    onSuccess: (data: any) => {
      try {
        console.log('Register response:', data);

        // Check response structure and handle different scenarios
        if (data.accessToken && data.user) {
          // Complete auth response - user is logged in immediately
          setStoredTokens(data.accessToken, data.refreshToken);
          setStoredUser(data.user);

          // Update cache
          queryClient.setQueryData(AUTH_QUERY_KEYS.user, data.user);
          queryClient.setQueryData(AUTH_QUERY_KEYS.profile, data.user);

          toast.success('Đăng ký thành công!');
          router.push('/dashboard');
        } else if (data.user && !data.accessToken) {
          // Registration successful but user needs to verify email or login manually
          toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
          router.push('/login');
        } else {
          // Unexpected response structure - still redirect to login as fallback
          console.warn('Unexpected register response structure:', data);
          toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
          router.push('/login');
        }
      } catch (error) {
        console.error('Register success handler error:', error);
        toast.error('Có lỗi xảy ra khi xử lý đăng ký');
      }
    },
    onError: (error: any) => {
      const errorMessage = parseAuthError(error);
      console.error('Register error:', errorMessage);
      toast.error(errorMessage);
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

      toast.success('Đăng xuất thành công!');
      
      // Redirect to login
      router.push('/login');
    },
    onError: (error: any) => {
      // Ngay cả khi logout API fail, vẫn clear local storage
      clearAuthStorage();
      queryClient.clear();
      
      const errorMessage = parseAuthError(error);
      console.error('Logout error:', errorMessage);
      toast.error('Đăng xuất thành công!'); // Still show success as local cleanup worked
      
      router.push('/login');
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
    retry: (failureCount: number, error: any) => {
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
    onSuccess: (data: any) => {
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
    onSuccess: () => {
      toast.success('Email reset đã được gửi!');
    },
    onError: (error: any) => {
      const errorMessage = parseAuthError(error);
      console.error('Forgot password error:', errorMessage);
      toast.error(errorMessage);
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
      toast.success('Đặt lại mật khẩu thành công!');
      // Redirect to login after successful reset
      router.push('/login?message=password-reset-success');
    },
    onError: (error: any) => {
      const errorMessage = parseAuthError(error);
      console.error('Reset password error:', errorMessage);
      toast.error(errorMessage);
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
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
    },
    onError: (error: any) => {
      const errorMessage = parseAuthError(error);
      console.error('Change password error:', errorMessage);
      toast.error(errorMessage);
    },
  });
};

/**
 * Hook gửi lại email xác thực
 */
export const useResendVerification = () => {
  return useMutation({
    mutationFn: () => EmailVerificationService.resendVerificationEmail(),
    onSuccess: () => {
      toast.success('Email xác thực đã được gửi lại!');
    },
    onError: (error: any) => {
      const errorMessage = parseAuthError(error);
      console.error('Resend verification error:', errorMessage);
      toast.error(errorMessage);
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
      toast.success('Email đã được xác thực thành công!');
      // Invalidate user query to refetch updated verification status
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.user });
    },
    onError: (error: any) => {
      const errorMessage = parseAuthError(error);
      console.error('Verify email error:', errorMessage);
      toast.error(errorMessage);
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
      try {
        console.log('Social auth response:', data);

        // Check if response has required fields
        if (!data.accessToken || !data.user) {
          console.error('Invalid social auth response:', data);
          throw new Error('Phản hồi không hợp lệ từ máy chủ');
        }

        // Lưu tokens và user vào storage
        setStoredTokens(data.accessToken, data.refreshToken);
        setStoredUser(data.user);

        // Update cache
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, data.user);

        toast.success('Đăng nhập thành công!');
        
        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Social auth success handler error:', error);
        toast.error('Có lỗi xảy ra khi xử lý đăng nhập');
      }
    },
    onError: (error: any) => {
      const errorMessage = parseAuthError(error);
      console.error('Social auth error:', errorMessage);
      toast.error(errorMessage);
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