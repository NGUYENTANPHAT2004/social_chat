// src/hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { initializeSocket, getSocket, disconnectSocket } from '@/services/socket';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Khởi tạo socket nếu chưa có
      if (!getSocket()) {
        const newSocket = initializeSocket(token);
        setSocket(newSocket);
      } else {
        setSocket(getSocket());
      }
    }

    return () => {
      // Không cần disconnect khi unmount component
      // Socket sẽ được giữ cho đến khi đăng xuất
    };
  }, [isAuthenticated, token]);

  return socket;
};