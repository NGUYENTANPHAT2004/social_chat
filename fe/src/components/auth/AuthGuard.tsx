// src/components/auth/AuthGuard.tsx - Enhanced with better redirect handling
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRole,
  fallback,
  redirectTo = '/login',
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;

    if (!isAuthenticated) {
      // Save current path for redirect after login
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      
      console.log('AuthGuard: User not authenticated, redirecting to:', loginUrl);
      router.push(loginUrl);
      return;
    }

    if (requiredRole && user && user.role !== requiredRole) {
      // Redirect to unauthorized page or dashboard
      console.log('AuthGuard: User role insufficient, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Yêu cầu đăng nhập
          </h2>
          <p className="text-gray-300 mb-4">
            Vui lòng đăng nhập để truy cập trang này.
          </p>
          <button
            onClick={() => router.push(redirectTo)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // Show fallback if role is required but user doesn't have it
  if (requiredRole && user && user.role !== requiredRole) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-300 mb-4">
            Bạn không có quyền truy cập vào trang này.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};