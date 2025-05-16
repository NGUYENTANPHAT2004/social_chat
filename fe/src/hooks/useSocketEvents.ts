// src/hooks/useSocketEvents.ts
import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from './redux';
import { addMessage } from '@/store/slices/chatSlice';
import { updateViewerCount, addViewer, removeViewer } from '@/store/slices/roomSlice';
import { incrementActivePlayerCount, decrementActivePlayerCount, addGameResult } from '@/store/slices/gameSlice';
import { addNotification, updateUserStatus, updateBalance } from '@/store/slices/userSlice';
import { SOCKET_EVENTS } from '@/constants';

export const useSocketEvents = (socket: Socket | null) => {
  const dispatch = useAppDispatch();
  const currentRoom = useAppSelector((state) => state.room.currentRoom);
  const currentGame = useAppSelector((state) => state.game.currentGame);

  useEffect(() => {
    if (!socket) return;

    // Chat events
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (message) => {
      dispatch(addMessage(message));
    });

    // Room events
    socket.on(SOCKET_EVENTS.VIEWER_JOINED, (data) => {
      dispatch(addViewer(data));
      if (currentRoom) {
        dispatch(updateViewerCount({ roomId: currentRoom.id, count: data.viewerCount }));
      }
    });

    socket.on(SOCKET_EVENTS.VIEWER_LEFT, (data) => {
      dispatch(removeViewer(data.userId));
      if (currentRoom) {
        dispatch(updateViewerCount({ roomId: currentRoom.id, count: data.viewerCount }));
      }
    });

    socket.on(SOCKET_EVENTS.STREAM_STARTED, (data) => {
      // Handle stream started event
      console.log('Stream started:', data);
    });

    socket.on(SOCKET_EVENTS.STREAM_ENDED, (data) => {
      // Handle stream ended event
      console.log('Stream ended:', data);
    });

    // Game events
    socket.on(SOCKET_EVENTS.GAME_STARTED, (data) => {
      if (currentGame) {
        dispatch(incrementActivePlayerCount(currentGame.id));
      }
    });

    socket.on(SOCKET_EVENTS.GAME_RESULT, (data) => {
      dispatch(addGameResult(data));
      if (data.winAmount) {
        dispatch(updateBalance(data.newBalance));
      }
    });

    socket.on(SOCKET_EVENTS.GAME_ENDED, (data) => {
      if (currentGame) {
        dispatch(decrementActivePlayerCount(currentGame.id));
      }
    });

    // Gift events
    socket.on(SOCKET_EVENTS.GIFT_RECEIVED, (data) => {
      dispatch(updateBalance(data.newBalance));
      dispatch(addNotification({
        id: data.id,
        userId: data.receiverId,
        type: 'gift',
        content: `${data.sender.username} sent you a ${data.gift.name} gift!`,
        isRead: false,
        relatedId: data.senderId,
        createdAt: new Date().toISOString(),
      }));
    });

    // User events
    socket.on('userOnline', (data) => {
      dispatch(updateUserStatus({ userId: data.userId, isOnline: true }));
    });

    socket.on('userOffline', (data) => {
      dispatch(updateUserStatus({ userId: data.userId, isOnline: false }));
    });

    // Clean up
    return () => {
      socket.off(SOCKET_EVENTS.NEW_MESSAGE);
      socket.off(SOCKET_EVENTS.VIEWER_JOINED);
      socket.off(SOCKET_EVENTS.VIEWER_LEFT);
      socket.off(SOCKET_EVENTS.STREAM_STARTED);
      socket.off(SOCKET_EVENTS.STREAM_ENDED);
      socket.off(SOCKET_EVENTS.GAME_STARTED);
      socket.off(SOCKET_EVENTS.GAME_RESULT);
      socket.off(SOCKET_EVENTS.GAME_ENDED);
      socket.off(SOCKET_EVENTS.GIFT_RECEIVED);
      socket.off('userOnline');
      socket.off('userOffline');
    };
  }, [socket, dispatch, currentRoom, currentGame]);

  return null;
};