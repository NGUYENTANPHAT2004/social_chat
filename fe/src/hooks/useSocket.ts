import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { socketService } from '@/services/socket';

export const useSocket = () => {
  const { user, isAuthenticated } = useAuth();
  const isConnected = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && !isConnected.current) {
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);
        isConnected.current = true;
      }
    }

    return () => {
      if (isConnected.current) {
        socketService.disconnect();
        isConnected.current = false;
      }
    };
  }, [isAuthenticated, user]);

  return socketService;
};