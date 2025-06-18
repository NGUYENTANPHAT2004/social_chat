import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AUTH_STORAGE_KEYS, SESSION_CONFIG, PROTECTED_ROUTES } from '@/constants/auth';

export const useAuthUtils = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Check if current route requires authentication
  const requiresAuth = useCallback((pathname: string): boolean => {
    return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  }, []);

  // Redirect to login with return URL
  const redirectToLogin = useCallback((returnUrl?: string) => {
    const redirect = returnUrl || window.location.pathname;
    if (redirect !== '/auth/login') {
      localStorage.setItem(AUTH_STORAGE_KEYS.OAUTH_REDIRECT, redirect);
    }
    router.push('/auth/login');
  }, [router]);

  // Handle authentication redirect after login
  const handleAuthRedirect = useCallback(() => {
    const redirect = localStorage.getItem(AUTH_STORAGE_KEYS.OAUTH_REDIRECT);
    localStorage.removeItem(AUTH_STORAGE_KEYS.OAUTH_REDIRECT);
    router.push(redirect || '/dashboard');
  }, [router]);

  // Check if user has specific role
  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role;
  }, [user]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  }, [user]);

  // Auto logout on idle
  useEffect(() => {
    if (!isAuthenticated) return;

    let idleTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);

      // Show warning before auto logout
      warningTimer = setTimeout(() => {
        const shouldLogout = window.confirm(
          'You will be logged out due to inactivity. Do you want to stay logged in?'
        );
        if (!shouldLogout) {
          logout();
        }
      }, SESSION_CONFIG.IDLE_TIMEOUT - SESSION_CONFIG.AUTO_LOGOUT_WARNING);

      // Auto logout
      idleTimer = setTimeout(() => {
        logout();
      }, SESSION_CONFIG.IDLE_TIMEOUT);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer(); // Start the timer

    return () => {
      clearTimeout(idleTimer);
      clearTimeout(warningTimer);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isAuthenticated, logout]);

  return {
    requiresAuth,
    redirectToLogin,
    handleAuthRedirect,
    hasRole,
    hasAnyRole,
  };
};