// fe/src/features/message/hooks/index.ts - COMPLETE FIXED

import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

import { messageService } from '../services';
import { 
  useMessageStore, 
  useMessageActions, 
} from '../store';
import type {
  SendMessageDto,
  GetConversationsParams,
  GetMessagesParams,
  ConversationsResponse,
  MessagesResponse,
  MessageError,
  UseConversationsOptions,
  UseMessagesOptions,
  UseSendMessageOptions,
  Conversation,
  UnreadCountResponse,
  MessageFormData,
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
  withUser: (userId: string) => [...MESSAGE_QUERY_KEYS.all, 'with-user', userId] as const,
} as const;

/**
 * Helper function to safely extract API response data
 */
const extractResponseData = <T>(response: any): T => {
  if (response?.data?.data) {
    return response.data.data;
  }
  if (response?.data) {
    return response.data;
  }
  return response;
};

/**
 * Helper function to safely handle API errors
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
 * Helper to validate IDs
 */
const validateId = (id: string | undefined | null, fieldName: string): string => {
  if (!id || id === 'undefined' || id === 'null') {
    throw new Error(`${fieldName} is required and cannot be undefined`);
  }
  return id;
};

/**
 * ✅ Hook lấy danh sách cuộc trò chuyện - FIXED
 */
export const useConversations = (
  options: UseConversationsOptions = {},
  queryOptions?: UseQueryOptions<ConversationsResponse, MessageError>
) => {
  const actions = useMessageActions();

  return useQuery({
    queryKey: MESSAGE_QUERY_KEYS.conversationsList(options),
    queryFn: async () => {
      try {
        console.log('🔄 Fetching conversations...');
        const result = await messageService.getConversations(options);
        
        // Update store with conversations
        actions.setConversations(result.conversations || []);
        
        console.log('✅ Fetched conversations:', result.conversations?.length || 0);
        return result;
      } catch (error) {
        console.error('❌ Failed to fetch conversations:', error);
        throw handleApiError(error);
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
    ...queryOptions,
  });
};

/**
 * ✅ Hook lấy tin nhắn của cuộc trò chuyện - FIXED
 */
export const useMessages = (
  conversationId: string | undefined | null,
  options: UseMessagesOptions = {},
  queryOptions?: UseQueryOptions<MessagesResponse, MessageError>
) => {
  const actions = useMessageActions();

  return useQuery({
    queryKey: conversationId ? MESSAGE_QUERY_KEYS.messagesList(conversationId, options) : [],
    queryFn: async () => {
      try {
        // ✅ Validate conversationId
        const validConversationId = validateId(conversationId, 'conversationId');
        
        console.log('🔄 Fetching messages for conversation:', validConversationId);
        const result = await messageService.getConversationMessages(validConversationId, options);
        
        // Update store with messages
        actions.setCurrentConversation(validConversationId);
        actions.setMessages(result.messages || []);
        
        console.log('✅ Fetched messages:', result.messages?.length || 0);
        return result;
      } catch (error) {
        console.error('❌ Failed to fetch messages:', error);
        throw handleApiError(error);
      }
    },
    enabled: !!conversationId && conversationId !== 'undefined',
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
    ...queryOptions,
  });
};

/**
 * ✅ Hook gửi tin nhắn - FIXED
 */
export const useSendMessage = (
  options: UseSendMessageOptions = {}
) => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();

  return useMutation({
    mutationFn: async (data: SendMessageDto) => {
      try {
        // ✅ Validate recipientId before sending
        const validRecipientId = validateId(data.recipientId, 'recipientId');
        
        console.log('📤 Sending message to:', validRecipientId);
        
        const validatedData = {
          ...data,
          recipientId: validRecipientId,
        };
        
        const result = await messageService.sendMessage(validatedData);
        console.log('✅ Message sent successfully:', result.id);
        
        return result;
      } catch (error) {
        console.error('❌ Failed to send message:', error);
        throw handleApiError(error);
      }
    },
    onSuccess: (message) => {
      // Add message to store
      actions.addMessage(message);
      
      // Invalidate conversations to refresh last message
      queryClient.invalidateQueries({
        queryKey: MESSAGE_QUERY_KEYS.conversations(),
      });

      // Show success notification
      if (options.showSuccessToast !== false) {
        toast.success('Message sent successfully');
      }

      // Call onSuccess callback
      options.onSuccess?.(message);
    },
    onError: (error: MessageError) => {
      // Show error notification
      if (options.showErrorToast !== false) {
        toast.error(error.message || 'Failed to send message');
      }

      // Call onError callback
      options.onError?.(error);
    },
  });
};

/**
 * ✅ Hook lấy/tạo cuộc trò chuyện với user - FIXED
 */
export const useGetOrCreateConversation = (
  userId: string | undefined | null,
  queryOptions?: UseQueryOptions<Conversation, MessageError>
) => {
  return useQuery({
    queryKey: userId ? MESSAGE_QUERY_KEYS.withUser(userId) : [],
    queryFn: async () => {
      try {
        // ✅ CRITICAL FIX: Validate userId before API call
        const validUserId = validateId(userId, 'userId');
        
        console.log('🔄 Getting/creating conversation with user:', validUserId);
        const result = await messageService.getOrCreateConversation(validUserId);
        
        console.log('✅ Got conversation:', result.id);
        return result;
      } catch (error) {
        console.error('❌ Failed to get/create conversation:', error);
        throw handleApiError(error);
      }
    },
    enabled: !!userId && userId !== 'undefined' && userId !== 'null',
    staleTime: 300000, // 5 minutes
    ...queryOptions,
  });
};

/**
 * ✅ Hook tạo cuộc trò chuyện mới - NEW
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();

  return useMutation({
    mutationFn: async (userId: string) => {
      try {
        const validUserId = validateId(userId, 'userId');
        console.log('🔄 Creating conversation with user:', validUserId);
        
        const result = await messageService.getOrCreateConversation(validUserId);
        console.log('✅ Created conversation:', result.id);
        
        return result;
      } catch (error) {
        console.error('❌ Failed to create conversation:', error);
        throw handleApiError(error);
      }
    },
    onSuccess: (conversation) => {
      // Add conversation to store
      actions.addConversation(conversation);
      
      // Invalidate conversations list
      queryClient.invalidateQueries({
        queryKey: MESSAGE_QUERY_KEYS.conversations(),
      });

      toast.success('Conversation created successfully');
    },
    onError: (error: MessageError) => {
      toast.error(error.message || 'Failed to create conversation');
    },
  });
};

/**
 * ✅ Hook lấy số tin nhắn chưa đọc - FIXED
 */
export const useUnreadCount = (
  queryOptions?: UseQueryOptions<UnreadCountResponse, MessageError>
) => {
  const actions = useMessageActions();

  return useQuery({
    queryKey: MESSAGE_QUERY_KEYS.unreadCount(),
    queryFn: async () => {
      try {
        console.log('🔄 Fetching unread count...');
        const result = await messageService.getUnreadCount();
        
        // Update store
        actions.setUnreadCount(result.count || 0);
        
        console.log('✅ Unread count:', result.count);
        return result;
      } catch (error) {
        console.error('❌ Failed to fetch unread count:', error);
        throw handleApiError(error);
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 30000,
    ...queryOptions,
  });
};

/**
 * ✅ Hook đánh dấu đã đọc - FIXED
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      try {
        // ✅ Validate conversationId
        const validConversationId = validateId(conversationId, 'conversationId');
        
        console.log('👁️ Marking conversation as read:', validConversationId);
        const result = await messageService.markConversationAsRead(validConversationId);
        
        console.log('✅ Marked as read, count:', result.count);
        return result;
      } catch (error) {
        console.error('❌ Failed to mark as read:', error);
        throw handleApiError(error);
      }
    },
    onSuccess: (data, conversationId) => {
      // Update conversation in store
      actions.updateConversation(conversationId, { unreadCount: 0 });
      
      // Refresh unread count
      queryClient.invalidateQueries({
        queryKey: MESSAGE_QUERY_KEYS.unreadCount(),
      });

      // Refresh conversations
      queryClient.invalidateQueries({
        queryKey: MESSAGE_QUERY_KEYS.conversations(),
      });
    },
    onError: (error: MessageError) => {
      toast.error(error.message || 'Failed to mark messages as read');
    },
  });
};

/**
 * ✅ Hook xóa cuộc trò chuyện - FIXED
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  const actions = useMessageActions();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      try {
        // ✅ Validate conversationId
        const validConversationId = validateId(conversationId, 'conversationId');
        
        console.log('🗑️ Deleting conversation:', validConversationId);
        const result = await messageService.deleteConversation(validConversationId);
        
        console.log('✅ Conversation deleted');
        return result;
      } catch (error) {
        console.error('❌ Failed to delete conversation:', error);
        throw handleApiError(error);
      }
    },
    onSuccess: (data, conversationId) => {
      // Remove from store if it's current conversation
      const currentConversationId = useMessageStore.getState().currentConversationId;
      if (currentConversationId === conversationId) {
        actions.resetCurrentConversation();
      }

      // Refresh conversations list
      queryClient.invalidateQueries({
        queryKey: MESSAGE_QUERY_KEYS.conversations(),
      });

      toast.success('Conversation deleted successfully');
    },
    onError: (error: MessageError) => {
      toast.error(error.message || 'Failed to delete conversation');
    },
  });
};

/**
 * ✅ Hook xóa tin nhắn - NEW
 */
export const useDeleteMessage = () => {
  const actions = useMessageActions();

  return useMutation({
    mutationFn: async (messageId: string) => {
      try {
        const validMessageId = validateId(messageId, 'messageId');
        console.log('🗑️ Deleting message:', validMessageId);
        
        const result = await messageService.deleteMessage(validMessageId);
        console.log('✅ Message deleted');
        
        return result;
      } catch (error) {
        console.error('❌ Failed to delete message:', error);
        throw handleApiError(error);
      }
    },
    onSuccess: (data, messageId) => {
      // Mark message as deleted in store
      actions.updateMessage(messageId, { 
        status: 'deleted' as any,
        content: 'This message was deleted',
      });

      toast.success('Message deleted successfully');
    },
    onError: (error: MessageError) => {
      toast.error(error.message || 'Failed to delete message');
    },
  });
};

/**
 * ✅ Hook upload ảnh tin nhắn - NEW
 */
export const useUploadMessageImage = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      try {
        console.log('📸 Uploading image:', file.name);
        
        // Simulate upload - replace with actual upload logic
        const formData = new FormData();
        formData.append('image', file);
        
        // Replace with actual upload endpoint
        const response = await fetch('/api/upload/message-image', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload image');
        }
        
        const result = await response.json();
        console.log('✅ Image uploaded:', result.url);
        
        return result;
      } catch (error) {
        console.error('❌ Failed to upload image:', error);
        throw error;
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
};

/**
 * ✅ Hook typing indicator - NEW
 */
export const useTyping = (conversationId: string | null) => {
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(() => {
    if (!conversationId) return;
    
    if (!isTyping) {
      setIsTyping(true);
      // Send typing event via socket
      // socketService.sendTyping(conversationId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [conversationId, isTyping]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    
    if (isTyping) {
      setIsTyping(false);
      // Send typing stop event via socket
      // socketService.sendTyping(conversationId, false);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId, isTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isTyping,
    startTyping,
    stopTyping,
  };
};

/**
 * ✅ Hook quản lý conversation complete - NEW
 */
export const useConversation = (conversationId: string | null) => {
  const messagesQuery = useMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  const sendMessage = useCallback(async (data: MessageFormData & { recipientId: string }) => {
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: conversationId || undefined,
        recipientId: data.recipientId,
        content: data.content,
        type: data.type,
        image: data.image as string,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [conversationId, sendMessageMutation]);

  const markAsRead = useCallback(() => {
    if (conversationId) {
      markAsReadMutation.mutate(conversationId);
    }
  }, [conversationId, markAsReadMutation]);

  const loadMoreMessages = useCallback(() => {
    // Implement pagination logic here
    console.log('Loading more messages...');
  }, []);

  return {
    messages: messagesQuery.data?.messages || [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    sendMessage,
    isSending: sendMessageMutation.isPending,
    markAsRead,
    loadMoreMessages,
    hasMoreMessages: false, // Implement based on pagination
    conversation: null, // Get from conversations list
  };
};

/**
 * ✅ Hook quản lý message management - NEW
 */
export const useMessageManagement = () => {
  const deleteMessageMutation = useDeleteMessage();
  const deleteConversationMutation = useDeleteConversation();
  const markAsReadMutation = useMarkAsRead();

  return {
    deleteMessage: deleteMessageMutation.mutate,
    deleteConversation: deleteConversationMutation.mutate,
    markAsRead: markAsReadMutation.mutate,
    isDeleting: deleteMessageMutation.isPending || deleteConversationMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
};