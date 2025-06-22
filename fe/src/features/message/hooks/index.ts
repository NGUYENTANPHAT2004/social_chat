// src/features/message/hooks/index.ts

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