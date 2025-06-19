// src/app/(auth)/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Chrome, Facebook } from 'lucide-react';

import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import { useLogin, useSocialAuth, useAuth } from '@/features/auth/index';
import type { LoginFormData, ValidationError } from '@/features/auth/index';
import { validateLoginForm } from '@/features/auth/index';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    identifier: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const login = useLogin();
  const { loginWithGoogle, loginWithFacebook, isLoading: socialLoading } = useSocialAuth();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Handle URL messages
  const message = searchParams.get('message');
  const error = searchParams.get('error');

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors for this field
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateLoginForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await login.mutateAsync(formData);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const getFieldError = (field: string) => {
    return errors.find(error => error.field === field)?.message;
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    if (provider === 'google') {
      loginWithGoogle();
    } else {
      loginWithFacebook();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Chào mừng trở lại
          </h1>
          <p className="text-gray-300">
            Đăng nhập để tiếp tục trải nghiệm
          </p>
        </div>

        {/* Messages */}
        {message === 'password-reset-success' && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg">
            Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.
          </div>
        )}

        {error === 'social-auth-failed' && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
            Đăng nhập mạng xã hội thất bại. Vui lòng thử lại.
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email/Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email hoặc tên người dùng
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  value={formData.identifier}
                  onChange={(e) => handleInputChange('identifier', e.target.value)}
                  placeholder="Nhập email hoặc tên người dùng"
                  className={`pl-12 bg-white/10 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 ${
                    getFieldError('identifier') ? 'border-red-500' : ''
                  }`}
                  disabled={login.isPending}
                />
              </div>
              {getFieldError('identifier') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('identifier')}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className={`pl-12 pr-12 bg-white/10 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 ${
                    getFieldError('password') ? 'border-red-500' : ''
                  }`}
                  disabled={login.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {getFieldError('password') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('password')}</p>
              )}
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-white/10"
                disabled={login.isPending}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <Link
              href="/forgot-password"
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Login Error */}
          {login.error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
              {login.error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={login.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {login.isPending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Đang đăng nhập...
              </div>
            ) : (
              'Đăng nhập'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-gray-400">Hoặc đăng nhập với</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={socialLoading}
            className="flex items-center justify-center px-4 py-3 border border-gray-600 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Chrome className="w-5 h-5 mr-2" />
            Google
          </Button>

          <Button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            disabled={socialLoading}
            className="flex items-center justify-center px-4 py-3 border border-gray-600 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <Facebook className="w-5 h-5 mr-2" />
            Facebook
          </Button>
        </div>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-gray-300">
            Chưa có tài khoản?{' '}
            <Link
              href="/register"
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}