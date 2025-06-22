

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  useInfiniteQuery,
  UseQueryOptions,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

import { messageService, socketService } from '../services';
import { 
  useMessageStore, 
  useMessageActions, 
  useIsConnected,
} from '../store';
import { useAuth } from '../../auth/hooks';
import type {
  SendMessageDto,
  GetConversationsParams,
  GetMessagesParams,
  ConversationsResponse,
  MessagesResponse,
  Message,
  MessageError,
  UseConversationsOptions,
  UseMessagesOptions,
  UseSendMessageOptions,
  SocketEventHandlers,
} from '../type';

// Query keys
export const MESSAGE_QUERY_KEYS = {
  all: ['messages'] as const,
  conversations: () => [...MESSAGE_QUERY_KEYS.all, 'conversations'] as const,
  conversationsList: (params: GetConversationsParams) => 
    [...MESSAGE_QUERY_KEYS.conversations(), 'list', params] as const,
  messages: (conversationId: string) => 
    [...MESSAGE_QUERY_KEYS.all, 'messages', conversationId] as const,
  messagesList: (conversationId: string, params: GetMessagesParams) =>
    [...MESSAGE_QUERY_KEYS.messages(conversationId), 'list', params] as const,
  unreadCount: () => [...MESSAGE_QUERY_KEYS.all, 'unread-count'] as const,
} as const;

/**
 * Hook lấy danh sách cuộc trò chuyện
 */
export const useConversations = (
  options: UseConversationsOptions = {},
  queryOptions?: Omit<UseQueryOptions<ConversationsResponse, MessageError>, 'queryKey' | 'queryFn'>
) => {
  const { page = 1, limit = 10, enabled = true } = options;
  const actions = useMessageActions();

  const query = useQuery({
    queryKey: MESSAGE_QUERY_KEYS.conversationsList({ page, limit }),
    queryFn: () => messageService.getConversations({ page, limit }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
    ...queryOptions,
  });

  // Handle success/error with useEffect instead of onSuccess/onError
  useEffect(() => {
    if (query.data) {
      actions.setConversations(query.data.conversations);
    }
  }, [query.data, actions]);

  useEffect(() => {
    if (query.error) {
      actions.setConversationsError(query.error.message);
    }
  }, [query.error, actions]);

  return {
    ...query,
    conversations: query.data?.conversations || [],
    totalConversations: query.data?.total || 0,
  };
};

/**
 * Hook lấy tin nhắn của cuộc trò chuyện với infinite scroll
 */
export const useMessages = (
  conversationId: string,
  options: UseMessagesOptions = {}
) => {
  const { limit = 20, enabled = true } = options;
  const actions = useMessageActions();

  const query = useInfiniteQuery({
    queryKey: MESSAGE_QUERY_KEYS.messages(conversationId),
    queryFn: ({ pageParam }: { pageParam: number }) =>
      messageService.getConversationMessages(conversationId, {
        page: pageParam,
        limit,
      }),
    getNextPageParam: (lastPage: MessagesResponse) => {
      const { page, total, limit } = lastPage;
      const totalPages = Math.ceil(total / limit);
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: enabled && !!conversationId,
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: false,
  });

  // Handle success/error with useEffect
  useEffect(() => {
    if (query.data) {
      // Flatten and reverse messages (oldest first)
      const allMessages = query.data.pages.flatMap(page => page.messages).reverse();
      actions.setMessages(allMessages);
      
      // Update hasMore status
      const lastPage = query.data.pages[query.data.pages.length - 1];
      const hasMore = lastPage.page < Math.ceil(lastPage.total / lastPage.limit);
      actions.setHasMoreMessages(hasMore);
    }
  }, [query.data, actions]);

  useEffect(() => {
    if (query.error) {
      actions.setMessagesError(query.error.message);
      toast.error('Failed to load messages');
    }
  }, [query.error, actions]);

  const loadMoreMessages = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  return {
    ...query,
    messages: query.data?.pages.flatMap(page => page.messages) || [],
    loadMoreMessages,
    hasMoreMessages: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
  };
};

/**
 * Hook gửi tin nhắn
 */
export const useSendMessage = (
  options: UseSendMessageOptions = {}
) => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();
  const isConnected = useIsConnected();

  return useMutation({
    mutationFn: async (data: SendMessageDto): Promise<Message> => {
      // Ưu tiên sử dụng socket nếu đã kết nối
      if (isConnected) {
        const result = await socketService.sendMessage(data);
        return result.message!;
      } else {
        // Fallback to HTTP API
        return messageService.sendMessage(data);
      }
    },
    onSuccess: (message) => {
      // Add message to store
      actions.addMessage(message);
      
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ 
        queryKey: MESSAGE_QUERY_KEYS.conversations() 
      });
      
      options.onSuccess?.(message);
      
      console.log('Message sent successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message');
      options.onError?.(error);
    },
  });
};

/**
 * Hook đánh dấu tin nhắn đã đọc
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();
  const isConnected = useIsConnected();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (isConnected) {
        return socketService.markAsRead(conversationId);
      } else {
        return messageService.markConversationAsRead(conversationId);
      }
    },
    onSuccess: (_, conversationId) => {
      // Update conversation unread count
      actions.updateConversation(conversationId, { unreadCount: 0 });
      
      // Invalidate queries
      queryClient.invalidateQueries({ 
        queryKey: MESSAGE_QUERY_KEYS.conversations() 
      });
      queryClient.invalidateQueries({ 
        queryKey: MESSAGE_QUERY_KEYS.unreadCount() 
      });
    },
    onError: (error) => {
      console.error('Failed to mark messages as read:', error);
    },
  });
};

/**
 * Hook xóa cuộc trò chuyện
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();

  return useMutation({
    mutationFn: messageService.deleteConversation,
    onSuccess: (_, conversationId) => {
      // Remove conversation from store
      const conversations = useMessageStore.getState().conversations;
      const filteredConversations = conversations.filter(c => c.id !== conversationId);
      actions.setConversations(filteredConversations);
      
      // Reset current conversation if it was deleted
      if (useMessageStore.getState().currentConversationId === conversationId) {
        actions.resetCurrentConversation();
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ 
        queryKey: MESSAGE_QUERY_KEYS.conversations() 
      });
      
      toast.success('Conversation deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete conversation');
    },
  });
};

/**
 * Hook xóa tin nhắn
 */
export const useDeleteMessage = () => {
  const actions = useMessageActions();

  return useMutation({
    mutationFn: messageService.deleteMessage,
    onSuccess: (_, messageId) => {
      // Update message status in store
      actions.updateMessage(messageId, { 
        status: 'deleted' as any,
        content: 'Message deleted'
      });
      
      toast.success('Message deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete message');
    },
  });
};

/**
 * Hook lấy số tin nhắn chưa đọc
 */
export const useUnreadCount = () => {
  const actions = useMessageActions();

  const query = useQuery({
    queryKey: MESSAGE_QUERY_KEYS.unreadCount(),
    queryFn: messageService.getUnreadCount,
    refetchInterval: 60 * 1000, // Refetch every minute
    staleTime: 30 * 1000,
  });

  // Handle success with useEffect
  useEffect(() => {
    if (query.data) {
      actions.setUnreadCount(query.data.count);
    }
  }, [query.data, actions]);

  return query.data?.count || 0;
};

/**
 * Hook tạo hoặc lấy cuộc trò chuyện với user
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();

  return useMutation({
    mutationFn: messageService.getOrCreateConversation,
    onSuccess: (conversation) => {
      // Add conversation to store
      actions.addConversation(conversation);
      
      // Set as current conversation
      actions.setCurrentConversation(conversation.id);
      
      // Invalidate conversations
      queryClient.invalidateQueries({ 
        queryKey: MESSAGE_QUERY_KEYS.conversations() 
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create conversation');
    },
  });
};

/**
 * Hook upload ảnh cho tin nhắn
 */
export const useUploadMessageImage = () => {
  return useMutation({
    mutationFn: messageService.uploadMessageImage,
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
};

/**
 * Hook quản lý kết nối Socket - Improved version
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

    // Get fresh token from localStorage
    const getTokens = () => {
      try {
        const stored = localStorage.getItem('auth-tokens');
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    };

    const tokens = getTokens();
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

  // Handle token refresh
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-tokens' && e.newValue) {
        try {
          const newTokens = JSON.parse(e.newValue);
          const newToken = newTokens.accessToken;
          
          if (newToken && newToken !== lastTokenRef.current && connectionRef.current) {
            console.log('🔄 Token refreshed, reconnecting socket...');
            reconnect();
          }
        } catch (error) {
          console.error('Error parsing token change:', error);
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

/**
 * Hook quản lý typing indicator
 */
export const useTyping = (conversationId: string) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!conversationId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Only send if status changed
    if (isTypingRef.current !== isTyping) {
      socketService.sendTyping(conversationId, isTyping);
      isTypingRef.current = isTyping;
    }

    // Auto stop typing after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendTyping(conversationId, false);
        isTypingRef.current = false;
      }, 3000);
    }
  }, [conversationId]);

  const startTyping = useCallback(() => sendTyping(true), [sendTyping]);
  const stopTyping = useCallback(() => sendTyping(false), [sendTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        stopTyping();
      }
    };
  }, [stopTyping]);

  return {
    startTyping,
    stopTyping,
  };
};

/**
 * Hook tổng hợp cho conversation
 */
export const useConversation = (conversationId: string) => {
  const actions = useMessageActions();
  const conversationsQuery = useConversations();
  const messages = useMessages(conversationId);
  const markAsRead = useMarkAsRead();
  const sendMessage = useSendMessage();
  const typing = useTyping(conversationId);

  // Set current conversation
  useEffect(() => {
    if (conversationId) {
      actions.setCurrentConversation(conversationId);
      
      // Mark as read when entering conversation
      markAsRead.mutate(conversationId);
    }

    return () => {
      typing.stopTyping();
    };
  }, [conversationId, actions, markAsRead, typing]);

  const conversation = conversationsQuery.conversations.find(c => c.id === conversationId);

  return {
    conversation,
    messages: messages.messages,
    isLoading: messages.isLoading,
    isLoadingMore: messages.isLoadingMore,
    hasMoreMessages: messages.hasMoreMessages,
    loadMoreMessages: messages.loadMoreMessages,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
    typing,
  };
};

/**
 * Hook tổng hợp quản lý messages
 */
export const useMessageManagement = () => {
  const queryClient = useQueryClient();

  // Invalidate all message queries
  const invalidateAllQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: MESSAGE_QUERY_KEYS.all });
  }, [queryClient]);

  // Prefetch conversation messages
  const prefetchMessages = useCallback((conversationId: string) => {
    queryClient.prefetchQuery({
      queryKey: MESSAGE_QUERY_KEYS.messages(conversationId),
      queryFn: () => messageService.getConversationMessages(conversationId, { page: 1, limit: 20 }),
      staleTime: 10 * 1000,
    });
  }, [queryClient]);

  return {
    invalidateAllQueries,
    prefetchMessages,
  };
};