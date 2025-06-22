
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../auth/hooks';
import { getStoredTokens } from '../../auth/utils';
import { socketService } from '../services';
import { 
  useMessageActions, 
  useMessageStore,
  useIsConnected,
} from '../store';
import type { SocketEventHandlers } from '../type';

/**
 * Hook for managing Socket.IO connection - FIXED VERSION
 */
export const useSocketConnection = () => {
  const { user, isAuthenticated } = useAuth();
  const actions = useMessageActions();
  const isConnected = useIsConnected();
  const connectionRef = useRef<boolean>(false);
  const lastTokenRef = useRef<string | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!user || !isAuthenticated) {
      console.log('❌ Cannot connect: user not authenticated');
      return;
    }

    const tokens = getStoredTokens();
    const currentToken = tokens.accessToken;

    if (!currentToken) {
      console.log('❌ Cannot connect: no access token');
      return;
    }

    // Don't reconnect if already connected with same token
    if (connectionRef.current && isConnected && lastTokenRef.current === currentToken) {
      console.log('ℹ️ Already connected with current token');
      return;
    }

    console.log('🔌 Initiating socket connection...');
    
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
        
        // Clear any retry timeout
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }

        // Show success toast only on first connect or after error
        if (!isConnected) {
          toast.success('Connected to chat server', { duration: 2000 });
        }
      },
      
      onDisconnect: () => {
        console.log('❌ Socket disconnected');
        actions.setConnected(false);
        connectionRef.current = false;
        
        // Don't show error toast immediately, might be temporary
      },
      
      onNewMessage: (message) => {
        try {
          console.log('📨 New message received:', {
            id: message.id,
            sender: message.sender?.username,
            conversation: message.conversation,
            contentLength: message.content?.length || 0
          });
          
          // Validate message structure
          if (!message.id || !message.sender || !message.conversation) {
            console.error('Invalid message structure:', message);
            return;
          }

          actions.addMessage(message);
          
          // Show notification if not current conversation
          const currentConversationId = useMessageStore.getState().currentConversationId;
          if (message.conversation !== currentConversationId) {
            actions.incrementUnreadCount();
            
            // Show toast notification with proper data
            const senderName = message.sender?.username || 'Someone';
            toast.success(`New message from ${senderName}`, {
              duration: 3000,
              position: 'top-right',
            });
          }
        } catch (error) {
          console.error('Error handling new message:', error);
        }
      },
      
      onMessagesRead: (data) => {
        try {
          console.log('👁️ Messages read:', data);
          if (data?.conversationId) {
            actions.updateConversation(data.conversationId, { unreadCount: 0 });
          }
        } catch (error) {
          console.error('Error handling messages read:', error);
        }
      },
      
      onUserTyping: (data) => {
        try {
          console.log('⌨️ User typing:', data);
          if (data?.conversationId && data?.userId) {
            if (data.isTyping) {
              actions.addTypingUser(data.conversationId, data.userId);
              
              // Auto remove after 5 seconds
              setTimeout(() => {
                actions.removeTypingUser(data.conversationId, data.userId);
              }, 5000);
            } else {
              actions.removeTypingUser(data.conversationId, data.userId);
            }
          }
        } catch (error) {
          console.error('Error handling user typing:', error);
        }
      },
      
      onError: (error) => {
        console.error('❌ Socket error:', error);
        actions.setConnected(false);
        connectionRef.current = false;
        
        // Show error toast for non-auth errors
        const errorMessage = error?.message || 'Connection error';
        if (!errorMessage.includes('authentication') && 
            !errorMessage.includes('token') &&
            !errorMessage.includes('unauthorized')) {
          toast.error(`Connection error: ${errorMessage}`, { duration: 4000 });
        }
        
        // Try to reconnect after a delay
        if (!retryTimeoutRef.current && isAuthenticated) {
          retryTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Retrying connection after error...');
            retryTimeoutRef.current = null;
            connect();
          }, 5000);
        }
      },
    };

    try {
      socketService.connect(config, handlers);
    } catch (error) {
      console.error('❌ Failed to connect socket:', error);
      actions.setConnected(false);
      connectionRef.current = false;
      
      toast.error('Failed to connect to chat server', { duration: 4000 });
    }
  }, [user, isAuthenticated, actions, isConnected]);

  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting socket...');
    
    // Clear retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
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

  // Page visibility change handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user) {
        // Page became visible, check connection
        if (!socketService.isConnected()) {
          console.log('🔄 Page visible, checking connection...');
          setTimeout(connect, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, user, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
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