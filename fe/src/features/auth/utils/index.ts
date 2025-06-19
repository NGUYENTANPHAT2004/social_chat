// src/features/auth/utils/index.ts

import { ValidationError, LoginFormData, RegisterFormData } from '../types';

// Password validation regex - must match backend requirements
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!username.trim()) {
    errors.push({ field: 'username', message: 'Tên người dùng là bắt buộc' });
  } else if (username.length < 3) {
    errors.push({ field: 'username', message: 'Tên người dùng phải có ít nhất 3 ký tự' });
  } else if (username.length > 20) {
    errors.push({ field: 'username', message: 'Tên người dùng không được quá 20 ký tự' });
  } else if (!USERNAME_REGEX.test(username)) {
    errors.push({ 
      field: 'username', 
      message: 'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới' 
    });
  }
  
  return errors;
};

export const validatePassword = (password: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!password) {
    errors.push({ field: 'password', message: 'Mật khẩu là bắt buộc' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: 'Mật khẩu phải có ít nhất 8 ký tự' });
  } else if (!PASSWORD_REGEX.test(password)) {
    errors.push({ 
      field: 'password', 
      message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt' 
    });
  }
  
  return errors;
};

export const validateLoginForm = (data: LoginFormData): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!data.identifier.trim()) {
    errors.push({ field: 'identifier', message: 'Email hoặc tên người dùng là bắt buộc' });
  }
  
  if (!data.password) {
    errors.push({ field: 'password', message: 'Mật khẩu là bắt buộc' });
  }
  
  return errors;
};

export const validateRegisterForm = (data: RegisterFormData): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validate username
  errors.push(...validateUsername(data.username));
  
  // Validate email
  if (!data.email.trim()) {
    errors.push({ field: 'email', message: 'Email là bắt buộc' });
  } else if (!validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Email không hợp lệ' });
  }
  
  // Validate password
  errors.push(...validatePassword(data.password));
  
  // Validate confirm password
  if (!data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Xác nhận mật khẩu là bắt buộc' });
  } else if (data.password !== data.confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Mật khẩu xác nhận không khớp' });
  }
  
  // Validate terms agreement
  if (!data.agreeToTerms) {
    errors.push({ field: 'agreeToTerms', message: 'Bạn phải đồng ý với điều khoản sử dụng' });
  }
  
  return errors;
};

// Token utilities
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

export const getTokenPayload = (token: string): any | null => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

// Storage utilities
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
} as const;

export const clearAuthStorage = (): void => {
  if (typeof window !== 'undefined') {
    Object.values(AUTH_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

export const getStoredTokens = (): { accessToken: string | null; refreshToken: string | null } => {
  if (typeof window === 'undefined') {
    return { accessToken: null, refreshToken: null };
  }
  
  return {
    accessToken: localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN),
    refreshToken: localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN),
  };
};

export const setStoredTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
};

export const getStoredUser = (): any | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: any): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
  }
};

// API error parsing
export const parseAuthError = (error: any): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Đã xảy ra lỗi không xác định';
};

// Social auth utilities
export const openSocialAuthWindow = (url: string, name: string = 'socialAuth'): Window | null => {
  if (typeof window === 'undefined') return null;
  
  const width = 500;
  const height = 600;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;
  
  return window.open(
    url,
    name,
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );
};