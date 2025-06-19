'use client';
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { apiService } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (identifier: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
  loginWithGoogle: () => void;
  loginWithFacebook: () => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        return;
      }

      const response = await apiService.get<User>('/auth/me');
      dispatch({ type: 'SET_USER', payload: response.data });
    } catch (error) {
      console.log(error)
      try {
        await refreshToken();
        const response = await apiService.get<User>('/auth/me');
        dispatch({ type: 'SET_USER', payload: response.data });
      } catch (refreshError) {
        handleLogout();
        console.error("Error while refreshing:", refreshError);
      }
    }
  }, []);

  const refreshToken = async (): Promise<void> => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      throw new Error('No refresh token');
    }

    const response = await apiService.post<{ accessToken: string; refreshToken: string }>('/auth/refresh-token', {
      refreshToken: refreshTokenValue
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
  };

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await apiService.post<AuthResponse>('/auth/login', { 
        identifier, 
        password 
      });

      const { accessToken, refreshToken, user } = response.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      dispatch({ type: 'SET_USER', payload: user });
    } 
    catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Login failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const response = await apiService.post<AuthResponse>('/auth/register', userData);

      const { accessToken, refreshToken, user } = response.data;
      
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      if (refreshTokenValue) {
        await apiService.post('/auth/logout', { refreshToken: refreshTokenValue });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      handleLogout();
    }
  }, [handleLogout]);

  const loginWithGoogle = useCallback(() => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  }, []);

  const loginWithFacebook = useCallback(() => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/facebook`;
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearError,
        updateUser,
        loginWithGoogle,
        loginWithFacebook,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};