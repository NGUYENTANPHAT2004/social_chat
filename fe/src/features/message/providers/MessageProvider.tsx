// src/features/message/providers/MessageProvider.tsx - COMPLETE FIXED

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '../../auth/hooks';
import { 
  useSocketConnection, 
  useUnreadCount,
  setupMessageStoreSubscriptions,
  useMessageActions,
} from '../index';
import type { MessageContextValue, ChatSettings } from '../type';

const MessageContext = createContext<MessageContextValue | undefined>(undefined);

interface MessageProviderProps {
  children: ReactNode;
  className?: string;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ 
  children, 
  className 
}) => {
  const { user, isAuthenticated } = useAuth();
  const { connect, disconnect, isConnected } = useSocketConnection();
  const unreadCountQuery = useUnreadCount({
    enabled: isAuthenticated && !!user,
    refetchInterval: isAuthenticated ? 30000 : false, // Only poll when authenticated
  });
  const messageActions = useMessageActions();

  // ✅ Setup store subscriptions once
  useEffect(() => {
    const unsubscribe = setupMessageStoreSubscriptions();
    return unsubscribe;
  }, []);

  // ✅ Auto connect/disconnect based on auth status
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      console.log('🔗 MessageProvider: User authenticated, connecting socket...');
      connect();
    } else {
      console.log('🔌 MessageProvider: User not authenticated, disconnecting...');
      disconnect();
      messageActions.reset();
    }
  }, [isAuthenticated, user?.id, connect, disconnect, messageActions]);

  // ✅ Update unread count in store when query data changes
  useEffect(() => {
    if (unreadCountQuery.data?.count !== undefined) {
      messageActions.setUnreadCount(unreadCountQuery.data.count);
    }
  }, [unreadCountQuery.data?.count, messageActions]);

  // ✅ Default chat settings (could be loaded from user preferences)
  const defaultSettings: ChatSettings = {
    theme: 'light',
    soundEnabled: true,
    notificationsEnabled: true,
    showTypingIndicator: true,
    showReadReceipts: true,
    autoMarkAsRead: true,
    fontSize: 'medium',
    language: 'en',
  };

  // ✅ Settings management (could be enhanced with persistent storage)
  const [settings, setSettings] = React.useState<ChatSettings>(defaultSettings);

  const updateSettings = React.useCallback((newSettings: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Optionally save to localStorage or user preferences API
    try {
      localStorage.setItem('chat_settings', JSON.stringify({ ...settings, ...newSettings }));
    } catch (error) {
      console.warn('Failed to save chat settings:', error);
    }
  }, [settings]);

  // ✅ Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('chat_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.warn('Failed to load chat settings:', error);
    }
  }, []);

  const contextValue: MessageContextValue = {
    isConnected,
    unreadCount: unreadCountQuery.data?.count || 0,
    connect,
    disconnect,
    settings,
    updateSettings,
  };

  return (
    <MessageContext.Provider value={contextValue}>
      <div className={className}>
        {children}
        
        {/* ✅ Development debug panel */}
        {process.env.NODE_ENV === 'development' && (
          <DebugPanel contextValue={contextValue} />
        )}
      </div>
    </MessageContext.Provider>
  );
};

/**
 * ✅ Hook to use message context
 */
export const useMessageContext = (): MessageContextValue => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
};

/**
 * ✅ Development debug panel component
 */
interface DebugPanelProps {
  contextValue: MessageContextValue;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ contextValue }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuth();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Open Debug Panel"
      >
        🐛
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm w-full z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="text-xs space-y-1">
        <div>
          <span className="text-gray-400">Connection:</span>{' '}
          <span className={contextValue.isConnected ? 'text-green-400' : 'text-red-400'}>
            {contextValue.isConnected ? '✅ Connected' : '❌ Disconnected'}
          </span>
        </div>
        
        <div>
          <span className="text-gray-400">User:</span>{' '}
          <span className="text-blue-400">{user?.username || 'None'}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Unread:</span>{' '}
          <span className="text-yellow-400">{contextValue.unreadCount}</span>
        </div>
        
        <div>
          <span className="text-gray-400">Theme:</span>{' '}
          <span className="text-purple-400">{contextValue.settings.theme}</span>
        </div>
      </div>
      
      <div className="mt-3 space-y-1">
        <button
          onClick={() => {
            if (contextValue.isConnected) {
              contextValue.disconnect();
            } else {
              contextValue.connect();
            }
          }}
          className="w-full text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
        >
          {contextValue.isConnected ? 'Disconnect' : 'Connect'}
        </button>
        
        <button
          onClick={() => {
            console.log('MessageContext State:', contextValue);
            console.log('Socket Service Info:', (window as any).socketService?.getConnectionInfo?.());
          }}
          className="w-full text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
        >
          Log State
        </button>
        
        <button
          onClick={() => {
            contextValue.updateSettings({
              theme: contextValue.settings.theme === 'light' ? 'dark' : 'light'
            });
          }}
          className="w-full text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
        >
          Toggle Theme
        </button>
      </div>
    </div>
  );
};

export default MessageProvider;