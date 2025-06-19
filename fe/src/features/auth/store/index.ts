// src/features/auth/store/index.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { AuthState, User, AuthTokens } from '../types';
import { getStoredTokens, setStoredTokens, clearAuthStorage, isTokenExpired } from '../utils';

interface AuthActions {
  // Auth actions
  setAuth: (auth: { user: User; tokens: AuthTokens }) => void;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
  
  // Loading states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utility actions
  initializeAuth: () => void;
  checkAuthStatus: () => boolean;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Set complete auth data (user + tokens)
      setAuth: (auth) => {
        set((state) => {
          state.user = auth.user;
          state.accessToken = auth.tokens.accessToken;
          state.refreshToken = auth.tokens.refreshToken;
          state.isAuthenticated = true;
          state.error = null;
        });
        
        // Also update localStorage
        setStoredTokens(auth.tokens.accessToken, auth.tokens.refreshToken);
      },

      // Set user data only
      setUser: (user) => {
        set((state) => {
          state.user = user;
          state.isAuthenticated = !!user;
        });
      },

      // Update user data partially
      updateUser: (updates) => {
        set((state) => {
          if (state.user) {
            state.user = { ...state.user, ...updates };
          }
        });
      },

      // Set tokens only
      setTokens: (tokens) => {
        set((state) => {
          state.accessToken = tokens.accessToken;
          state.refreshToken = tokens.refreshToken;
          state.isAuthenticated = !!tokens.accessToken && !!state.user;
        });
        
        // Also update localStorage
        setStoredTokens(tokens.accessToken, tokens.refreshToken);
      },

      // Clear all auth data
      clearAuth: () => {
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.error = null;
          state.isLoading = false;
        });
        
        // Also clear localStorage
        clearAuthStorage();
      },

      // Set loading state
      setLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      // Set error state
      setError: (error) => {
        set((state) => {
          state.error = error;
          if (error) {
            state.isLoading = false;
          }
        });
      },

      // Initialize auth from stored data
      initializeAuth: () => {
        const { accessToken, refreshToken } = getStoredTokens();
        
        if (accessToken && refreshToken) {
          // Check if token is expired
          if (isTokenExpired(accessToken)) {
            // Token expired, clear auth
            get().clearAuth();
            return;
          }
          
          set((state) => {
            state.accessToken = accessToken;
            state.refreshToken = refreshToken;
            // Note: user will be fetched by useUser hook
          });
        }
      },

      // Check current auth status
      checkAuthStatus: () => {
        const state = get();
        const { accessToken } = getStoredTokens();
        
        if (!accessToken || !state.user) {
          return false;
        }
        
        if (isTokenExpired(accessToken)) {
          get().clearAuth();
          return false;
        }
        
        return true;
      },
    })),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user data, tokens are handled separately for security
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors for better performance
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useAuthTokens = () => useAuthStore((state) => ({
  accessToken: state.accessToken,
  refreshToken: state.refreshToken,
}));

// Auth actions selectors
export const useAuthActions = () => useAuthStore((state) => ({
  setAuth: state.setAuth,
  setUser: state.setUser,
  updateUser: state.updateUser,
  setTokens: state.setTokens,
  clearAuth: state.clearAuth,
  setLoading: state.setLoading,
  setError: state.setError,
  initializeAuth: state.initializeAuth,
  checkAuthStatus: state.checkAuthStatus,
}));

// Combined hook for common auth operations
export const useAuthOperations = () => {
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const actions = useAuthActions();

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    ...actions,
    
    // Computed values
    isLoggedIn: isAuthenticated && !!user,
    userDisplayName: user?.profile?.displayName || user?.username || 'User',
    userAvatar: user?.profile?.avatar,
    userId: user?.id,
  };
};

// Hook for auth initialization (use in app layout)
export const useAuthInitialization = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const checkAuthStatus = useAuthStore((state) => state.checkAuthStatus);
  
  return {
    initializeAuth,
    checkAuthStatus,
  };
};