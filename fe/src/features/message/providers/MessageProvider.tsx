// src/features/message/providers/MessageProvider.tsx

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '../../auth/hooks';
import { 
  useSocketConnection, 
  useUnreadCount,
  setupMessageStoreSubscriptions,
  useMessageActions,
} from '../index';

interface MessageContextValue {
  isConnected: boolean;
  unreadCount: number;
  connect: () => void;
  disconnect: () => void;
}

const MessageContext = createContext<MessageContextValue | undefined>(undefined);

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { connect, disconnect, isConnected } = useSocketConnection();
  const unreadCountQuery = useUnreadCount();
  const messageActions = useMessageActions();

  // Setup store subscriptions
  useEffect(() => {
    setupMessageStoreSubscriptions();
  }, []);

  // Auto connect/disconnect based on auth status
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
      messageActions.reset();
    }
  }, [isAuthenticated, user, connect, disconnect]);

  // Update unread count in store
  useEffect(() => {
    if (unreadCountQuery !== undefined) {
      messageActions.setUnreadCount(unreadCountQuery);
    }
  }, [unreadCountQuery]);

  const contextValue: MessageContextValue = {
    isConnected,
    unreadCount: unreadCountQuery || 0,
    connect,
    disconnect,
  };

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageContext = (): MessageContextValue => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
};

export default MessageProvider;