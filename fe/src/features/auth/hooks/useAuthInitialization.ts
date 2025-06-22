// src/features/auth/hooks/useAuthInitialization.ts

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEYS } from './index';
import { getStoredTokens, getStoredUser, isTokenExpired } from '../utils';

/**
 * Hook để khởi tạo auth state từ localStorage - Compatible với auth system hiện có
 */
export const useAuthInitialization = () => {
  const queryClient = useQueryClient();

  const initializeAuth = useCallback(() => {
    try {
      console.log('🔧 Initializing auth from localStorage...');

      // Sử dụng auth utils có sẵn
      const tokens = getStoredTokens();
      const user = getStoredUser();

      console.log('Tokens found:', !!tokens?.accessToken);
      console.log('User found:', !!user);

      if (tokens?.accessToken && user) {
        // Check if token is expired
        if (isTokenExpired(tokens.accessToken)) {
          console.log('⚠️ Token expired, clearing auth data');
          // Don't set data if token is expired
          return false;
        }

        // Set user data in React Query cache
        queryClient.setQueryData(AUTH_QUERY_KEYS.user, user);
        console.log('✅ Auth initialized successfully');
        return true;
      } else {
        console.log('⚠️ No valid auth data found in localStorage');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize auth:', error);
      return false;
    }
  }, [queryClient]);

  return { initializeAuth };
};