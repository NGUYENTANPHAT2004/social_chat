import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useAppDispatch } from './useAppSelector';
import { addMessage, updateUserOnlineStatus } from '@/store/slices/chatSlice';
import { updateViewerCount, updateRoomStatus } from '@/store/slices/roomSlice';
import { updateBalance, addTransaction } from '@/store/slices/userSlice';

export const useRealTimeUpdates = () => {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Chat events
    socket.on('newMessage', (data) => {
      dispatch(addMessage({
        roomId: data.roomId,
        message: data.message,
      }));
    });

    socket.on('userOnlineStatus', (data) => {
      dispatch(updateUserOnlineStatus({
        userId: data.userId,
        isOnline: data.isOnline,
      }));
    });

    // Room events
    socket.on('viewerCountUpdate', (data) => {
      dispatch(updateViewerCount({
        roomId: data.roomId,
        count: data.count,
      }));
    });

    socket.on('roomStatusUpdate', (data) => {
      dispatch(updateRoomStatus({
        roomId: data.roomId,
        isLive: data.isLive,
      }));
    });

    // User events
    socket.on('balanceUpdate', (data) => {
      dispatch(updateBalance(data.balance));
    });

    socket.on('newTransaction', (data) => {
      dispatch(addTransaction(data.transaction));
    });

    // Game events would be handled in specific game components

    return () => {
      socket.off('newMessage');
      socket.off('userOnlineStatus');
      socket.off('viewerCountUpdate');
      socket.off('roomStatusUpdate');
      socket.off('balanceUpdate');
      socket.off('newTransaction');
    };
  }, [socket, dispatch]);
};