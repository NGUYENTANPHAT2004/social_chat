// fe/src/features/message/hooks/useSocketConnection.ts - FIX

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
    
    // ✅ FIX: Remove /api from socket URL và fix port
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';


    const config = {
      url: baseUrl, 
      token: currentToken,
      namespace: '/chat',
    };

    console.log('🔧 Socket config:', config);

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

        toast.success('Connected to chat server', { duration: 2000 });
      },
      
      onDisconnect: () => {
        console.log('❌ Socket disconnected');
        actions.setConnected(false);
        connectionRef.current = false;
      },
      
      onError: (error) => {
        console.error('❌ Socket connection error:', error);
        actions.setConnected(false);
        connectionRef.current = false;
        
        // Retry connection with backoff
        if (!retryTimeoutRef.current && !isManuallyDisconnected) {
          retryTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Retrying socket connection...');
            connect();
          }, 3000);
        }
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
    };

    // ✅ Connect with fixed URL
    socketService.connect(config, handlers);
  }, [user, isAuthenticated, actions, isConnected]);

  // Auto disconnect when user logs out
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting socket...');
    socketService.disconnect();
    actions.setConnected(false);
    connectionRef.current = false;
    lastTokenRef.current = null;
    
    // Clear any retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, [actions]);

  // Auto connect/disconnect based on auth status
  useEffect(() => {
    if (user && isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, isAuthenticated, connect, disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
  };
};