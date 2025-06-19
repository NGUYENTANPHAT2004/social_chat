// src/hooks/useSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { SOCKET_EVENTS } from '@/constants/api';
import { 
  addMessage, 
  updateMessage, 
  removeMessage,
  addTypingUser,
  removeTypingUser,
  updateConversationUnreadCount 
} from '@/store/slices/messageSlice';
import { 
  updateRoomViewers, 
  updateRoomStatus,
  addUserToRoom,
  removeUserFromRoom 
} from '@/store/slices/roomSlice';
import { RootState } from '@/store';
import { Message } from '@/services/message.service';
import { Room } from '@/services/room.service';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

interface SocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendMessage: (data: {
    conversationId: string;
    content: string;
    type?: string;
    replyToId?: string;
  }) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  sendGift: (data: {
    roomId: string;
    recipientId: string;
    giftId: string;
  }) => void;
}

export const useSocket = (): SocketHookReturn => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const isConnectedRef = useRef(false);
  const typingTimeoutRef = useRef<{ [conversationId: string]: NodeJS.Timeout }>({});
  
  // Get current states from Redux
  const { currentConversation } = useSelector((state: RootState) => state.message);
  const { currentRoom } = useSelector((state: RootState) => state.room);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (!isAuthenticated || !user || socketRef.current) return;

    console.log('Initializing socket connection...');
    
    const socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token'),
        userId: user._id,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected');
      isConnectedRef.current = true;
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason);
      isConnectedRef.current = false;
    });

    socket.on(SOCKET_EVENTS.ERROR, (error) => {
      console.error('Socket error:', error);
    });

    socket.on(SOCKET_EVENTS.AUTHENTICATION_ERROR, (error) => {
      console.error('Socket authentication error:', error);
      // Handle auth error (logout user, refresh token, etc.)
    });

    // Message events
    socket.on(SOCKET_EVENTS.NEW_MESSAGE, (message: Message) => {
      console.log('New message received:', message);
      dispatch(addMessage(message));
    });

    socket.on(SOCKET_EVENTS.MESSAGE_UPDATED, (message: Message) => {
      dispatch(updateMessage(message));
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, (data: { messageId: string; conversationId: string }) => {
      dispatch(removeMessage(data));
    });

    // Typing events
    socket.on(SOCKET_EVENTS.USER_TYPING, (data: { conversationId: string; userId: string; username: string }) => {
      if (data.userId !== user._id) {
        dispatch(addTypingUser({ conversationId: data.conversationId, userId: data.userId }));
      }
    });

    socket.on(SOCKET_EVENTS.USER_STOP_TYPING, (data: { conversationId: string; userId: string }) => {
      dispatch(removeTypingUser({ conversationId: data.conversationId, userId: data.userId }));
    });

    // Room events
    socket.on(SOCKET_EVENTS.ROOM_USER_JOINED, (data: { roomId: string; user: any }) => {
      dispatch(addUserToRoom({ roomId: data.roomId, userId: data.user._id }));
    });

    socket.on(SOCKET_EVENTS.ROOM_USER_LEFT, (data: { roomId: string; userId: string }) => {
      dispatch(removeUserFromRoom({ roomId: data.roomId, userId: data.userId }));
    });

    socket.on(SOCKET_EVENTS.VIEWER_COUNT_UPDATED, (data: { roomId: string; viewers: number }) => {
      dispatch(updateRoomViewers({ roomId: data.roomId, viewers: data.viewers }));
    });

    socket.on(SOCKET_EVENTS.STREAM_STARTED, (data: { roomId: string }) => {
      dispatch(updateRoomStatus({ roomId: data.roomId, status: 'live' }));
    });

    socket.on(SOCKET_EVENTS.STREAM_ENDED, (data: { roomId: string }) => {
      dispatch(updateRoomStatus({ roomId: data.roomId, status: 'inactive' }));
    });

    // Gift events
    socket.on(SOCKET_EVENTS.GIFT_RECEIVED, (data: {
      giftId: string;
      sender: any;
      recipient: any;
      roomId: string;
      value: number;
    }) => {
      // Handle gift received (show animation, update balances, etc.)
      console.log('Gift received:', data);
    });

    // Game events (for future implementation)
    socket.on(SOCKET_EVENTS.GAME_STARTED, (data: any) => {
      console.log('Game started:', data);
    });

    socket.on(SOCKET_EVENTS.GAME_RESULT, (data: any) => {
      console.log('Game result:', data);
    });

    // Notification events
    socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, (notification: any) => {
      // Handle new notification
      console.log('New notification:', notification);
    });

  }, [isAuthenticated, user, dispatch]);

  // Cleanup socket connection
  const cleanupSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('Cleaning up socket connection...');
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    }

    // Clear typing timeouts
    Object.values(typingTimeoutRef.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    typingTimeoutRef.current = {};
  }, []);

  // Socket action handlers
  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current && isConnectedRef.current) {
      console.log('Joining room:', roomId);
      socketRef.current.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });
    }
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (socketRef.current && isConnectedRef.current) {
      console.log('Leaving room:', roomId);
      socketRef.current.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
    }
  }, []);

  const sendMessage = useCallback((data: {
    conversationId: string;
    content: string;
    type?: string;
    replyToId?: string;
  }) => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.SEND_MESSAGE, data);
    }
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.USER_TYPING, { conversationId });
      
      // Auto stop typing after 3 seconds
      if (typingTimeoutRef.current[conversationId]) {
        clearTimeout(typingTimeoutRef.current[conversationId]);
      }
      
      typingTimeoutRef.current[conversationId] = setTimeout(() => {
        stopTyping(conversationId);
      }, 3000);
    }
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.USER_STOP_TYPING, { conversationId });
      
      if (typingTimeoutRef.current[conversationId]) {
        clearTimeout(typingTimeoutRef.current[conversationId]);
        delete typingTimeoutRef.current[conversationId];
      }
    }
  }, []);

  const sendGift = useCallback((data: {
    roomId: string;
    recipientId: string;
    giftId: string;
  }) => {
    if (socketRef.current && isConnectedRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.SEND_GIFT, data);
    }
  }, []);

  // Auto join/leave rooms based on current room
  useEffect(() => {
    if (currentRoom && socketRef.current && isConnectedRef.current) {
      joinRoom(currentRoom._id);
      
      return () => {
        if (currentRoom) {
          leaveRoom(currentRoom._id);
        }
      };
    }
  }, [currentRoom, joinRoom, leaveRoom]);

  // Initialize socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      initializeSocket();
    } else {
      cleanupSocket();
    }

    return cleanupSocket;
  }, [isAuthenticated, user, initializeSocket, cleanupSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupSocket;
  }, [cleanupSocket]);

  return {
    socket: socketRef.current,
    isConnected: isConnectedRef.current,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    sendGift,
  };
};

// Custom hook for room-specific socket operations
export const useRoomSocket = (roomId?: string) => {
  const { socket, isConnected, joinRoom, leaveRoom, sendGift } = useSocket();

  useEffect(() => {
    if (roomId && isConnected) {
      joinRoom(roomId);
      
      return () => {
        leaveRoom(roomId);
      };
    }
  }, [roomId, isConnected, joinRoom, leaveRoom]);

  return {
    socket,
    isConnected,
    sendGift: useCallback((recipientId: string, giftId: string) => {
      if (roomId) {
        sendGift({ roomId, recipientId, giftId });
      }
    }, [roomId, sendGift]),
  };
};

// Custom hook for conversation-specific socket operations
export const useConversationSocket = (conversationId?: string) => {
  const { socket, isConnected, sendMessage, startTyping, stopTyping } = useSocket();

  return {
    socket,
    isConnected,
    sendMessage: useCallback((content: string, type?: string, replyToId?: string) => {
      if (conversationId) {
        sendMessage({ conversationId, content, type, replyToId });
      }
    }, [conversationId, sendMessage]),
    startTyping: useCallback(() => {
      if (conversationId) {
        startTyping(conversationId);
      }
    }, [conversationId, startTyping]),
    stopTyping: useCallback(() => {
      if (conversationId) {
        stopTyping(conversationId);
      }
    }, [conversationId, stopTyping]),
  };
};