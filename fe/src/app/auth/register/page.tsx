// src/app/(auth)/register/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User, Mail, Lock, Check, X, Chrome, Facebook } from 'lucide-react';

import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import { useRegister, useSocialAuth, useAuth } from '@/features/auth/index';
import type { RegisterFormData, ValidationError } from '@/features/auth/index';
import { validateRegisterForm } from '@/features/auth/index';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<{
    hasLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  }>({
    hasLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
  });

  const register = useRegister();
  const { loginWithGoogle, loginWithFacebook, isLoading: socialLoading } = useSocialAuth();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors for this field
    setErrors(prev => prev.filter(error => error.field !== field));

    // Update password strength if password field changes
    if (field === 'password' && typeof value === 'string') {
      updatePasswordStrength(value);
    }
  };

  const updatePasswordStrength = (password: string) => {
    setPasswordStrength({
      hasLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors([]);
    
    // Validate form
    const validationErrors = validateRegisterForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await register.mutateAsync(formData);
    } catch (error) {
      console.error('Register failed:', error);
      // Error is handled by the mutation's onError callback
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

  const getPasswordStrengthScore = () => {
    const criteria = Object.values(passwordStrength);
    return criteria.filter(Boolean).length;
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score < 3) return 'bg-red-500';
    if (score < 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score < 3) return 'Yếu';
    if (score < 5) return 'Trung bình';
    return 'Mạnh';
  };

  // Safe error message rendering
  const renderErrorMessage = (error: any) => {
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return error.message;
    }
    return 'Đã xảy ra lỗi không xác định';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">
            Tạo tài khoản mới
          </h1>
          <p className="text-gray-300">
            Tham gia cộng đồng giải trí hàng đầu
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tên người dùng *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Nhập tên người dùng"
                  className={`pl-12 bg-white/10 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 ${
                    getFieldError('username') ? 'border-red-500' : ''
                  }`}
                  disabled={register.isPending}
                />
              </div>
              {getFieldError('username') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('username')}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                3-20 ký tự, chỉ chữ cái, số và dấu gạch dưới
              </p>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Nhập địa chỉ email"
                  className={`pl-12 bg-white/10 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 ${
                    getFieldError('email') ? 'border-red-500' : ''
                  }`}
                  disabled={register.isPending}
                />
              </div>
              {getFieldError('email') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('email')}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mật khẩu *
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
                  disabled={register.isPending}
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Độ mạnh mật khẩu:</span>
                    <span className={`text-xs font-medium ${
                      getPasswordStrengthScore() < 3 ? 'text-red-400' :
                      getPasswordStrengthScore() < 5 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {getPasswordStrengthText(getPasswordStrengthScore())}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        getPasswordStrengthColor(getPasswordStrengthScore())
                      }`}
                      style={{ width: `${(getPasswordStrengthScore() / 5) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className={`flex items-center ${passwordStrength.hasLength ? 'text-green-400' : 'text-gray-400'}`}>
                      {passwordStrength.hasLength ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                      Ít nhất 8 ký tự
                    </div>
                    <div className={`flex items-center ${passwordStrength.hasUpper ? 'text-green-400' : 'text-gray-400'}`}>
                      {passwordStrength.hasUpper ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                      Chứa chữ hoa
                    </div>
                    <div className={`flex items-center ${passwordStrength.hasLower ? 'text-green-400' : 'text-gray-400'}`}>
                      {passwordStrength.hasLower ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                      Chứa chữ thường
                    </div>
                    <div className={`flex items-center ${passwordStrength.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                      {passwordStrength.hasNumber ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                      Chứa số
                    </div>
                    <div className={`flex items-center ${passwordStrength.hasSpecial ? 'text-green-400' : 'text-gray-400'}`}>
                      {passwordStrength.hasSpecial ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                      Chứa ký tự đặc biệt
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Xác nhận mật khẩu *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className={`pl-12 pr-12 bg-white/10 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 ${
                    getFieldError('confirmPassword') ? 'border-red-500' : ''
                  }`}
                  disabled={register.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {getFieldError('confirmPassword') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('confirmPassword')}</p>
              )}
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="flex items-start">
            <input
              id="agree-terms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-white/10 mt-1"
              disabled={register.isPending}
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-300">
              Tôi đồng ý với{' '}
              <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                Điều khoản dịch vụ
              </Link>{' '}
              và{' '}
              <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
                Chính sách bảo mật
              </Link>
            </label>
          </div>
          {getFieldError('agreeToTerms') && (
            <p className="text-red-400 text-sm">{getFieldError('agreeToTerms')}</p>
          )}

          {/* Register Error - Safe rendering */}
          {register.error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
              {renderErrorMessage(register.error)}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={register.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {register.isPending ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Đang tạo tài khoản...
              </div>
            ) : (
              'Tạo tài khoản'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-gray-400">Hoặc đăng ký với</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={socialLoading || register.isPending}
            className="flex items-center justify-center px-4 py-3 border border-gray-600 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
          >
            <Chrome className="w-5 h-5 mr-2" />
            Google
          </Button>

          <Button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            disabled={socialLoading || register.isPending}
            className="flex items-center justify-center px-4 py-3 border border-gray-600 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
          >
            <Facebook className="w-5 h-5 mr-2" />
            Facebook
          </Button>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-300">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}