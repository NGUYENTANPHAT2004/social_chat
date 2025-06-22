// src/features/message/hooks/useSocketConnection.ts

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../auth/hooks';
import { getStoredTokens } from '../../auth/utils'; // Import auth utils
import { socketService } from '../services';
import { 
  useMessageActions, 
  useMessageStore,
  useIsConnected,
} from '../store';
import type { SocketEventHandlers } from '../type';

/**
 * Hook for managing Socket.IO connection - Compatible với auth system hiện có
 */
export const useSocketConnection = () => {
  const { user, isAuthenticated } = useAuth();
  const actions = useMessageActions();
  const isConnected = useIsConnected();
  const connectionRef = useRef<boolean>(false);
  const lastTokenRef = useRef<string | null>(null);

  const connect = useCallback(() => {
    if (!user || !isAuthenticated) {
      console.log('❌ Cannot connect: user not authenticated');
      return;
    }

    // Sử dụng auth utils có sẵn
    const tokens = getStoredTokens();
    const currentToken = tokens.accessToken;

    if (!currentToken) {
      console.log('❌ Cannot connect: no access token');
      console.log('Available tokens:', {
        accessToken: !!tokens.accessToken,
        refreshToken: !!tokens.refreshToken,
      });
      console.log('localStorage keys:', Object.keys(localStorage));
      return;
    }

    // Don't reconnect if already connected with same token
    if (connectionRef.current && isConnected && lastTokenRef.current === currentToken) {
      console.log('ℹ️ Already connected with current token');
      return;
    }

    console.log('🔌 Initiating socket connection...');
    console.log('Using token:', currentToken.substring(0, 20) + '...');
    
    const config = {
      url: process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000',
      token: currentToken,
      namespace: '/chat',
    };

    const handlers: SocketEventHandlers = {
      onConnect: () => {
        console.log('✅ Socket connected successfully');
        actions.setConnected(true);
        connectionRef.current = true;
        lastTokenRef.current = currentToken;
        
        // Send a ping to verify connection
        setTimeout(() => {
          socketService.ping();
        }, 1000);
      },
      
      onDisconnect: () => {
        console.log('❌ Socket disconnected');
        actions.setConnected(false);
        connectionRef.current = false;
      },
      
      onNewMessage: (message) => {
        console.log('📨 New message received:', message);
        actions.addMessage(message);
        
        // Show notification if not current conversation
        const currentConversationId = useMessageStore.getState().currentConversationId;
        if (message.conversation !== currentConversationId) {
          actions.incrementUnreadCount();
          
          // Show toast notification
          toast.success(`New message from ${message.sender?.username || 'Someone'}`, {
            duration: 3000,
            position: 'top-right',
          });
        }
      },
      
      onMessagesRead: (data) => {
        console.log('👁️ Messages read:', data);
        const currentConversationId = useMessageStore.getState().currentConversationId;
        if (data.conversationId === currentConversationId) {
          actions.updateConversation(data.conversationId, { unreadCount: 0 });
        }
      },
      
      onUserTyping: (data) => {
        console.log('⌨️ User typing:', data);
        if (data.isTyping) {
          actions.addTypingUser(data.conversationId, data.userId);
          
          // Auto remove after 5 seconds
          setTimeout(() => {
            actions.removeTypingUser(data.conversationId, data.userId);
          }, 5000);
        } else {
          actions.removeTypingUser(data.conversationId, data.userId);
        }
      },
      
      onError: (error) => {
        console.error('❌ Socket error:', error);
        actions.setConnected(false);
        connectionRef.current = false;
        
        // Don't show error toast for authentication errors
        if (!error.message?.includes('authentication') && !error.message?.includes('token')) {
          toast.error('Connection error occurred');
        }
      },
    };

    try {
      socketService.connect(config, handlers);
    } catch (error) {
      console.error('❌ Failed to connect socket:', error);
      actions.setConnected(false);
      connectionRef.current = false;
    }
  }, [user, isAuthenticated, actions, isConnected]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting socket...');
    socketService.disconnect();
    actions.setConnected(false);
    connectionRef.current = false;
    lastTokenRef.current = null;
  }, [actions]);

  const reconnect = useCallback(() => {
    console.log('🔄 Reconnecting socket...');
    disconnect();
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  // Auto connect/disconnect based on authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      // Delay connection to ensure auth is fully set up
      const timer = setTimeout(connect, 500);
      return () => clearTimeout(timer);
    } else {
      disconnect();
      actions.reset();
    }
  }, [isAuthenticated, user, connect, disconnect, actions]);

  // Handle token refresh - Listen for auth storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_access_token' && e.newValue) {
        const newToken = e.newValue;
        
        if (newToken && newToken !== lastTokenRef.current && connectionRef.current) {
          console.log('🔄 Token refreshed, reconnecting socket...');
          reconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [reconnect]);

  // Periodic connection health check
  useEffect(() => {
    if (!isConnected) return;

    const healthCheck = setInterval(() => {
      if (socketService.isConnected()) {
        socketService.ping();
      } else if (connectionRef.current) {
        console.log('🔄 Connection lost, attempting reconnect...');
        reconnect();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheck);
  }, [isConnected, reconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    reconnect,
    isConnected,
    socketService,
  };
};