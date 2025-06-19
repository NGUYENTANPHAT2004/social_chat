'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Mail, Lock, User, CheckCircle, XCircle } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';

interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { register, loginWithGoogle, loginWithFacebook, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = localStorage.getItem('oauth_redirect') || '/';
      localStorage.removeItem('oauth_redirect');
      router.push(redirect);
    }
  }, [isAuthenticated, router]);

  // Validation rules based on backend RegisterDto
  const validateField = useCallback((name: string, value: string, currentFormData: typeof formData): string | null => {
    switch (name) {
      case 'username':
        if (!value) return 'Username is required';
        if (value.length < 3) return 'Username must be at least 3 characters';
        if (value.length > 20) return 'Username must be no more than 20 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers and underscore';
        return null;
        
      case 'email':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return null;
        
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(value)) {
          return 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character';
        }
        return null;
        
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== currentFormData.password) return 'Passwords do not match';
        return null;
        
      default:
        return null;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Validate all fields
    const errors: ValidationErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value, formData);
      if (error) errors[key as keyof ValidationErrors] = error;
    });
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      // Redirect sẽ được handle bởi useEffect trên
    } catch (error) {
      // Error đã được handle trong AuthContext
      console.error('Registration error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(newFormData);
    
    // Clear validation error when user starts typing
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
    
    // Real-time validation for better UX
    if (value) {
      const error = validateField(name, value, newFormData);
      if (error) {
        setValidationErrors(prev => ({
          ...prev,
          [name]: error,
        }));
      }
    }
  };

  const getFieldStatus = (fieldName: string) => {
    const value = formData[fieldName as keyof typeof formData];
    const error = validationErrors[fieldName as keyof ValidationErrors];
    
    if (!value) return null;
    if (error) return 'error';
    return 'success';
  };

  const renderFieldIcon = (fieldName: string) => {
    const status = getFieldStatus(fieldName);
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (status === 'error') return <XCircle className="w-5 h-5 text-red-500" />;
    return null;
  };

  const handleGoogleLogin = () => {
    clearError();
    loginWithGoogle();
  };

  const handleFacebookLogin = () => {
    clearError();
    loginWithFacebook();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="font-bold text-white text-2xl">LM</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join LiveMate</h1>
          <p className="text-gray-300">Create your account to get started</p>
        </div>

        {/* Register Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Username Field */}
            <div>
              <Input
                type="text"
                name="username"
                label="Username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                leftIcon={<User className="w-5 h-5" />}
                rightIcon={renderFieldIcon('username')}
                error={validationErrors.username}
                required
                className="bg-white/5 border-white/20 text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                3-20 characters, letters, numbers and underscore only
              </p>
            </div>

            {/* Email Field */}
            <div>
              <Input
                type="email"
                name="email"
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                leftIcon={<Mail className="w-5 h-5" />}
                rightIcon={renderFieldIcon('email')}
                error={validationErrors.email}
                required
                className="bg-white/5 border-white/20 text-white placeholder-gray-400"
              />
            </div>

            {/* Password Field */}
            <div>
              <Input
                type="password"
                name="password"
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={renderFieldIcon('password')}
                showPasswordToggle
                error={validationErrors.password}
                required
                className="bg-white/5 border-white/20 text-white placeholder-gray-400"
              />
              <p className="text-xs text-gray-400 mt-1">
                At least 8 characters with uppercase, lowercase, number and special character
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <Input
                type="password"
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={renderFieldIcon('confirmPassword')}
                showPasswordToggle
                error={validationErrors.confirmPassword}
                required
                className="bg-white/5 border-white/20 text-white placeholder-gray-400"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-300">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleFacebookLogin}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </Button>
            </div>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-gray-300">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-purple-300 hover:text-purple-200 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;