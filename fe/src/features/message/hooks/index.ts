// src/features/message/hooks/index.ts - FIXED

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
} from '../type';
export { useSocketConnection } from './useSocketConnection';

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
 * Helper function to safely extract API response data - NEW
 */
const extractResponseData = <T>(response: any): T => {
  // Handle different response structures from backend
  if (response?.data?.data) {
    return response.data.data;
  }
  if (response?.data) {
    return response.data;
  }
  return response;
};

/**
 * Helper function to safely handle API errors - NEW
 */
const handleApiError = (error: any): MessageError => {
  console.error('API Error:', error);
  
  if (error?.response?.data?.message) {
    return { message: error.response.data.message };
  }
  if (error?.message) {
    return { message: error.message };
  }
  return { message: 'An unexpected error occurred' };
};

/**
 * Hook lấy danh sách cuộc trò chuyện - FIXED
 */
export const useConversations = (
  options: UseConversationsOptions = {},
  queryOptions?: Omit<UseQueryOptions<ConversationsResponse, MessageError>, 'queryKey' | 'queryFn'>
) => {
  const { page = 1, limit = 10, enabled = true } = options;
  const actions = useMessageActions();

  const query = useQuery({
    queryKey: MESSAGE_QUERY_KEYS.conversationsList({ page, limit }),
    queryFn: async () => {
      try {
        const response = await messageService.getConversations({ page, limit });
        return extractResponseData<ConversationsResponse>(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on client errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    ...queryOptions,
  });

  // Handle success/error with useEffect instead of deprecated callbacks
  useEffect(() => {
    if (query.data?.conversations) {
      actions.setConversations(query.data.conversations);
      actions.setConversationsError(null);
    }
  }, [query.data, actions]);

  useEffect(() => {
    if (query.error) {
      const errorMsg = handleApiError(query.error).message;
      actions.setConversationsError(errorMsg);
      console.error('Conversations query error:', errorMsg);
    }
  }, [query.error, actions]);

  useEffect(() => {
    actions.setConversationsLoading(query.isLoading);
  }, [query.isLoading, actions]);

  return {
    ...query,
    conversations: query.data?.conversations || [],
    totalConversations: query.data?.total || 0,
  };
};

/**
 * Hook lấy tin nhắn của cuộc trò chuyện với infinite scroll - FIXED
 */
export const useMessages = (
  conversationId: string,
  options: UseMessagesOptions = {}
) => {
  const { limit = 20, enabled = true } = options;
  const actions = useMessageActions();

  const query = useInfiniteQuery({
    queryKey: MESSAGE_QUERY_KEYS.messages(conversationId),
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      try {
        const response = await messageService.getConversationMessages(conversationId, {
          page: pageParam,
          limit,
        });
        return extractResponseData<MessagesResponse>(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    getNextPageParam: (lastPage: MessagesResponse) => {
      const { page, total, limit } = lastPage;
      const totalPages = Math.ceil(total / limit);
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: enabled && !!conversationId,
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Handle success/error with useEffect
  useEffect(() => {
    if (query.data) {
      try {
        // Flatten and sort messages (oldest first for proper display)
        const allMessages = query.data.pages
          .flatMap(page => page.messages || [])
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        actions.setMessages(allMessages);
        
        // Update hasMore status
        const lastPage = query.data.pages[query.data.pages.length - 1];
        if (lastPage) {
          const hasMore = lastPage.page < Math.ceil(lastPage.total / lastPage.limit);
          actions.setHasMoreMessages(hasMore);
        }
        
        actions.setMessagesError(null);
      } catch (error) {
        console.error('Error processing messages data:', error);
        actions.setMessagesError('Failed to process messages');
      }
    }
  }, [query.data, actions]);

  useEffect(() => {
    if (query.error) {
      const errorMsg = handleApiError(query.error).message;
      actions.setMessagesError(errorMsg);
      console.error('Messages query error:', errorMsg);
    }
  }, [query.error, actions]);

  useEffect(() => {
    actions.setMessagesLoading(query.isLoading);
  }, [query.isLoading, actions]);

  const loadMoreMessages = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query]);

  return {
    ...query,
    messages: query.data?.pages.flatMap(page => page.messages || []) || [],
    loadMoreMessages,
    hasMoreMessages: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
  };
};

/**
 * Hook gửi tin nhắn - FIXED
 */
export const useSendMessage = (
  options: UseSendMessageOptions = {}
) => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();
  const isConnected = useIsConnected();

  return useMutation({
    mutationFn: async (data: SendMessageDto): Promise<Message> => {
      try {
        // Validate data before sending
        if (!data.recipientId || !data.content?.trim()) {
          throw new Error('Invalid message data');
        }

        // Prefer socket if connected, fallback to HTTP
        if (isConnected && socketService.isConnected()) {
          console.log('Sending via socket...');
          const result = await socketService.sendMessage(data);
          if (!result.message) {
            throw new Error('Invalid socket response');
          }
          return result.message;
        } else {
          console.log('Sending via HTTP...');
          const response = await messageService.sendMessage(data);
          return extractResponseData<Message>(response);
        }
      } catch (error) {
        console.error('Send message error:', error);
        throw handleApiError(error);
      }
    },
    onSuccess: (message) => {
      try {
        // Add message to store
        actions.addMessage(message);
        
        // Invalidate conversations to update last message
        queryClient.invalidateQueries({ 
          queryKey: MESSAGE_QUERY_KEYS.conversations() 
        });
        
        // Call success callback
        options.onSuccess?.(message);
        
        console.log('Message sent successfully:', message.id);
      } catch (error) {
        console.error('Error handling successful message send:', error);
      }
    },
    onError: (error) => {
      const errorMsg = handleApiError(error).message;
      toast.error(errorMsg);
      options.onError?.(error);
      console.error('Send message mutation error:', errorMsg);
    },
  });
};

/**
 * Hook đánh dấu tin nhắn đã đọc - FIXED
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();
  const isConnected = useIsConnected();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      try {
        if (!conversationId) {
          throw new Error('Conversation ID is required');
        }

        if (isConnected && socketService.isConnected()) {
          return await socketService.markAsRead(conversationId);
        } else {
          const response = await messageService.markConversationAsRead(conversationId);
          return extractResponseData(response);
        }
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (_, conversationId) => {
      try {
        // Update conversation unread count
        actions.updateConversation(conversationId, { unreadCount: 0 });
        
        // Invalidate queries
        queryClient.invalidateQueries({ 
          queryKey: MESSAGE_QUERY_KEYS.conversations() 
        });
        queryClient.invalidateQueries({ 
          queryKey: MESSAGE_QUERY_KEYS.unreadCount() 
        });
        
        console.log('Messages marked as read:', conversationId);
      } catch (error) {
        console.error('Error handling mark as read success:', error);
      }
    },
    onError: (error) => {
      const errorMsg = handleApiError(error).message;
      console.error('Mark as read error:', errorMsg);
    },
  });
};

/**
 * Hook xóa cuộc trò chuyện - FIXED
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      try {
        if (!conversationId) {
          throw new Error('Conversation ID is required');
        }
        
        const response = await messageService.deleteConversation(conversationId);
        return extractResponseData(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (_, conversationId) => {
      try {
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
        console.log('Conversation deleted:', conversationId);
      } catch (error) {
        console.error('Error handling delete conversation success:', error);
      }
    },
    onError: (error) => {
      const errorMsg = handleApiError(error).message;
      toast.error(errorMsg);
      console.error('Delete conversation error:', errorMsg);
    },
  });
};

/**
 * Hook xóa tin nhắn - FIXED
 */
export const useDeleteMessage = () => {
  const actions = useMessageActions();

  return useMutation({
    mutationFn: async (messageId: string) => {
      try {
        if (!messageId) {
          throw new Error('Message ID is required');
        }
        
        const response = await messageService.deleteMessage(messageId);
        return extractResponseData(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (_, messageId) => {
      try {
        // Update message status in store
        actions.updateMessage(messageId, { 
          status: 'deleted' as any,
          content: 'Message deleted'
        });
        
        toast.success('Message deleted');
        console.log('Message deleted:', messageId);
      } catch (error) {
        console.error('Error handling delete message success:', error);
      }
    },
    onError: (error) => {
      const errorMsg = handleApiError(error).message;
      toast.error(errorMsg);
      console.error('Delete message error:', errorMsg);
    },
  });
};

/**
 * Hook lấy số tin nhắn chưa đọc - FIXED
 */
export const useUnreadCount = () => {
  const actions = useMessageActions();

  const query = useQuery({
    queryKey: MESSAGE_QUERY_KEYS.unreadCount(),
    queryFn: async () => {
      try {
        const response = await messageService.getUnreadCount();
        return extractResponseData(response);
      } catch (error) {
        console.error('Unread count error:', error);
        // Return 0 on error to not break UI
        return { count: 0 };
      }
    },
    refetchInterval: 60 * 1000, // Refetch every minute
    staleTime: 30 * 1000,
    retry: 1, // Only retry once for unread count
  });

  // Handle success with useEffect
  useEffect(() => {
    if (query.data?.count !== undefined) {
      actions.setUnreadCount(query.data.count);
    }
  }, [query.data, actions]);

  return query.data?.count || 0;
};

/**
 * Hook tạo hoặc lấy cuộc trò chuyện với user - FIXED
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();

  return useMutation({
    mutationFn: async (userId: string) => {
      try {
        if (!userId) {
          throw new Error('User ID is required');
        }
        
        const response = await messageService.getOrCreateConversation(userId);
        return extractResponseData(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (conversation) => {
      try {
        // Add conversation to store
        actions.addConversation(conversation);
        
        // Set as current conversation
        actions.setCurrentConversation(conversation.id);
        
        // Invalidate conversations
        queryClient.invalidateQueries({ 
          queryKey: MESSAGE_QUERY_KEYS.conversations() 
        });
        
        console.log('Conversation created/retrieved:', conversation.id);
      } catch (error) {
        console.error('Error handling create conversation success:', error);
      }
    },
    onError: (error) => {
      const errorMsg = handleApiError(error).message;
      toast.error(errorMsg);
      console.error('Create conversation error:', errorMsg);
    },
  });
};

/**
 * Hook upload ảnh cho tin nhắn - FIXED
 */
export const useUploadMessageImage = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      try {
        if (!file) {
          throw new Error('File is required');
        }
        
        const response = await messageService.uploadMessageImage(file);
        return extractResponseData(response);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onError: (error) => {
      const errorMsg = handleApiError(error).message;
      toast.error(`Upload failed: ${errorMsg}`);
      console.error('Upload image error:', errorMsg);
    },
  });
};

/**
 * Hook quản lý typing indicator - FIXED
 */
export const useTyping = (conversationId: string) => {
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const isTypingRef = useRef(false);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!conversationId) return;

    try {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Only send if status changed and socket is connected
      if (isTypingRef.current !== isTyping && socketService.isConnected()) {
        socketService.sendTyping(conversationId, isTyping);
        isTypingRef.current = isTyping;
        
        console.log('Typing status sent:', { conversationId, isTyping });
      }

      // Auto stop typing after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          if (socketService.isConnected()) {
            socketService.sendTyping(conversationId, false);
            isTypingRef.current = false;
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending typing indicator:', error);
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
        try {
          stopTyping();
        } catch (error) {
          console.error('Error stopping typing on cleanup:', error);
        }
      }
    };
  }, [stopTyping]);

  return {
    startTyping,
    stopTyping,
  };
};

/**
 * Hook tổng hợp cho conversation - FIXED
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
      
      // Mark as read when entering conversation (with delay to ensure messages are loaded)
      const timer = setTimeout(() => {
        if (!markAsRead.isPending) {
          markAsRead.mutate(conversationId);
        }
      }, 1000);

      return () => {
        clearTimeout(timer);
        typing.stopTyping();
      };
    }
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
 * Hook tổng hợp quản lý messages - FIXED
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
      queryFn: async () => {
        try {
          const response = await messageService.getConversationMessages(conversationId, { page: 1, limit: 20 });
          return extractResponseData(response);
        } catch (error) {
          throw handleApiError(error);
        }
      },
      staleTime: 10 * 1000,
    });
  }, [queryClient]);

  return {
    invalidateAllQueries,
    prefetchMessages,
  };
};