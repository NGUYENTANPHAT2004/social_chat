// fe/src/features/message/hooks/useSocketConnection.ts - COMPLETE FIXED

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
import type { SocketEventHandlers, Message } from '../type';

export const useSocketConnection = () => {
  const { user, isAuthenticated } = useAuth();
  const actions = useMessageActions();
  const isConnected = useIsConnected();
  
  // ✅ Use refs to avoid recreating functions
  const connectionStateRef = useRef({
    isInitialized: false,
    lastUserId: null as string | null,
    lastToken: null as string | null,
  });

  // ✅ Stable connect function
  const connect = useCallback(() => {
    if (!user?.id || !isAuthenticated) {
      console.log('❌ Cannot connect: user not authenticated');
      return;
    }

    const tokens = getStoredTokens();
    const currentToken = tokens.accessToken;

    if (!currentToken) {
      console.log('❌ Cannot connect: no access token');
      return;
    }

    // ✅ Prevent duplicate connections
    if (isConnected && 
        connectionStateRef.current.lastUserId === user.id &&
        connectionStateRef.current.lastToken === currentToken) {
      console.log('ℹ️ Already connected with current credentials');
      return;
    }

    console.log('🔌 Initiating socket connection for user:', user.id);
    
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
    const config = {
      url: baseUrl,
      token: currentToken,
      namespace: '/chat',
    };

    const handlers: SocketEventHandlers = {
      onConnect: () => {
        console.log('✅ Socket connected successfully');
        actions.setConnected(true);
        
        // ✅ Update connection state
        connectionStateRef.current = {
          isInitialized: true,
          lastUserId: user.id,
          lastToken: currentToken,
        };

        toast.success('Connected to chat server', { duration: 2000 });
      },
      
      onDisconnect: () => {
        console.log('❌ Socket disconnected');
        actions.setConnected(false);
      },
      
      onError: (error) => {
        console.error('❌ Socket connection error:', error);
        actions.setConnected(false);
        
        // ✅ Reset connection state on error
        connectionStateRef.current.isInitialized = false;
      },
      
      onNewMessage: (message: Message) => {
        try {
          console.log('📨 New message received:', {
            id: message.id,
            sender: message.sender?.username,
            conversation: message.conversation,
          });
          
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
          if (data?.conversationId && data?.userId !== undefined) {
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

    socketService.connect(config, handlers);
  }, [user?.id, isAuthenticated, isConnected, actions]);

  // ✅ Stable disconnect function
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting socket...');
    socketService.disconnect();
    actions.setConnected(false);
    
    // ✅ Reset connection state
    connectionStateRef.current = {
      isInitialized: false,
      lastUserId: null,
      lastToken: null,
    };
  }, [actions]);

  // ✅ Single effect with proper dependency management
  useEffect(() => {
    // ✅ Connect when user is authenticated and not already connected
    if (user?.id && isAuthenticated && !connectionStateRef.current.isInitialized) {
      connect();
    }
    
    // ✅ Disconnect when user logs out
    if ((!user?.id || !isAuthenticated) && connectionStateRef.current.isInitialized) {
      disconnect();
    }

    // ✅ Cleanup only on unmount or auth state change
    return () => {
      if (connectionStateRef.current.isInitialized && (!user?.id || !isAuthenticated)) {
        disconnect();
      }
    };
  }, [user?.id, isAuthenticated, connect, disconnect]); // ✅ Minimal dependencies

  return {
    connect,
    disconnect,
    isConnected,
  };
};