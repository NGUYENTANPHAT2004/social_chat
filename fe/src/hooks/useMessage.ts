// src/hooks/useMessage.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { RootState } from '@/store';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markConversationAsRead,
  deleteConversation,
  deleteMessage,
  getOrCreateConversationWithUser,
  searchMessages,
  setCurrentConversation,
  setFilters,
  clearFilters,
  clearError,
  archiveConversation,
  unarchiveConversation,
  muteConversation,
  unmuteConversation,
} from '@/store/slices/messageSlice';
import { 
  SendMessageDto, 
  ConversationQueryParams, 
  MessageQueryParams, 
  MessageService 
} from '@/services/message.service';
import { useAuth } from '@/features/auth/context/AuthContext';

// Hook for general message operations
export const useMessage = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const messageState = useSelector((state: RootState) => state.message);

  const {
    conversations,
    currentConversation,
    messages,
    loading,
    sending,
    error,
    totalUnreadCount,
    pagination,
    typingUsers,
    searchResults,
    searchLoading,
    searchQuery,
    filters,
  } = messageState;

  // Actions
  const getConversations = useCallback((params?: ConversationQueryParams) => {
    return dispatch(fetchConversations(params));
  }, [dispatch]);

  const getMessages = useCallback((conversationId: string, params?: MessageQueryParams) => {
    return dispatch(fetchMessages(conversationId));
  }, [dispatch]);

  const sendNewMessage = useCallback(async (data: SendMessageDto) => {
    try {
      const result = await dispatch(sendMessage(data)).unwrap();
      return result;
    } catch (error: any) {
      toast.error(error || 'Failed to send message');
      throw error;
    }
  }, [dispatch]);

  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await dispatch(markConversationAsRead(conversationId)).unwrap();
    } catch (error: any) {
      console.error('Failed to mark as read:', error);
    }
  }, [dispatch]);

  const removeConversation = useCallback(async (conversationId: string) => {
    try {
      await dispatch(deleteConversation(conversationId)).unwrap();
      toast.success('Conversation deleted!');
    } catch (error: any) {
      toast.error(error || 'Failed to delete conversation');
      throw error;
    }
  }, [dispatch]);

  const removeMessage = useCallback(async (messageId: string, conversationId: string) => {
    try {
      await dispatch(deleteMessage({ messageId, conversationId })).unwrap();
      toast.success('Message deleted!');
    } catch (error: any) {
      toast.error(error || 'Failed to delete message');
      throw error;
    }
  }, [dispatch]);

  const createConversationWithUser = useCallback(async (userId: string) => {
    try {
      const result = await dispatch(getOrCreateConversationWithUser(userId)).unwrap();
      return result;
    } catch (error: any) {
      toast.error(error || 'Failed to create conversation');
      throw error;
    }
  }, [dispatch]);

  const searchForMessages = useCallback((query: string, conversationId?: string) => {
    return dispatch(searchMessages({ query, conversationId }));
  }, [dispatch]);

  const selectConversation = useCallback((conversation: any) => {
    dispatch(setCurrentConversation(conversation));
    if (conversation) {
      dispatch(fetchMessages(conversation._id));
      if (conversation.unreadCount > 0) {
        dispatch(markConversationAsRead(conversation._id));
      }
    }
  }, [dispatch]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    dispatch(setFilters(newFilters));
  }, [dispatch, filters]);

  const resetFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const clearMessageError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Conversation management
  const archiveConversationById = useCallback(async (conversationId: string) => {
    try {
      await MessageService.archiveConversation(conversationId);
      dispatch(archiveConversation(conversationId));
      toast.success('Conversation archived!');
    } catch (error: any) {
      toast.error(error || 'Failed to archive conversation');
    }
  }, [dispatch]);

  const unarchiveConversationById = useCallback(async (conversationId: string) => {
    try {
      await MessageService.unarchiveConversation(conversationId);
      dispatch(unarchiveConversation(conversationId));
      toast.success('Conversation unarchived!');
    } catch (error: any) {
      toast.error(error || 'Failed to unarchive conversation');
    }
  }, [dispatch]);

  const muteConversationById = useCallback(async (conversationId: string) => {
    try {
      await MessageService.muteConversation(conversationId);
      dispatch(muteConversation(conversationId));
      toast.success('Conversation muted!');
    } catch (error: any) {
      toast.error(error || 'Failed to mute conversation');
    }
  }, [dispatch]);

  const unmuteConversationById = useCallback(async (conversationId: string) => {
    try {
      await MessageService.unmuteConversation(conversationId);
      dispatch(unmuteConversation(conversationId));
      toast.success('Conversation unmuted!');
    } catch (error: any) {
      toast.error(error || 'Failed to unmute conversation');
    }
  }, [dispatch]);

  // Computed values
  const hasUnreadMessages = useMemo(() => {
    return totalUnreadCount > 0;
  }, [totalUnreadCount]);

  const currentMessages = useMemo(() => {
    return currentConversation ? messages[currentConversation._id] || [] : [];
  }, [currentConversation, messages]);

  const currentTypingUsers = useMemo(() => {
    return currentConversation ? typingUsers[currentConversation._id] || [] : [];
  }, [currentConversation, typingUsers]);

  const isTyping = useMemo(() => {
    return currentTypingUsers.length > 0;
  }, [currentTypingUsers]);

  return {
    // State
    conversations,
    currentConversation,
    messages,
    currentMessages,
    loading,
    sending,
    error,
    totalUnreadCount,
    pagination,
    typingUsers: currentTypingUsers,
    searchResults,
    searchLoading,
    searchQuery,
    filters,
    
    // Actions
    getConversations,
    getMessages,
    sendNewMessage,
    markAsRead,
    removeConversation,
    removeMessage,
    createConversationWithUser,
    searchForMessages,
    selectConversation,
    updateFilters,
    resetFilters,
    clearMessageError,
    archiveConversationById,
    unarchiveConversationById,
    muteConversationById,
    unmuteConversationById,
    
    // Computed
    hasUnreadMessages,
    isTyping,
  };
};

// Hook for specific conversation operations
export const useConversation = (conversationId?: string) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useAuth();
  const messageHook = useMessage();

  const { currentConversation, currentMessages, loading, sending, error } = messageHook;

  // Load conversation data when conversationId changes
  useEffect(() => {
    if (conversationId) {
      const conversation = messageHook.conversations.find(c => c._id === conversationId);
      if (conversation) {
        messageHook.selectConversation(conversation);
      } else {
        // Try to fetch conversation if not in the list
        messageHook.getConversations();
      }
    }
  }, [conversationId, messageHook.conversations]);

  // Navigation helpers
  const navigateToConversation = useCallback((id: string) => {
    router.push(`/chat/${id}`);
  }, [router]);

  const navigateToChat = useCallback(() => {
    router.push('/chat');
  }, [router]);

  // Message actions
  const sendMessage = useCallback(async (content: string, type?: string, replyToId?: string, attachments?: File[]) => {
    if (!conversationId || !content.trim()) return;

    const messageData: SendMessageDto = {
      content: content.trim(),
      conversationId,
      type,
      replyToId,
      attachments,
    };

    try {
      const result = await messageHook.sendNewMessage(messageData);
      return result;
    } catch (error) {
      // Error already handled in useMessage hook
      throw error;
    }
  }, [conversationId, messageHook]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!conversationId) return;

    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await messageHook.removeMessage(messageId, conversationId);
    } catch (error) {
      // Error already handled in useMessage hook
    }
  }, [conversationId, messageHook]);

  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await messageHook.markAsRead(conversationId);
    } catch (error) {
      // Error already handled in useMessage hook
    }
  }, [conversationId, messageHook]);

  // Conversation management
  const deleteConversation = useCallback(async () => {
    if (!conversationId) return;

    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      await messageHook.removeConversation(conversationId);
      navigateToChat();
    } catch (error) {
      // Error already handled in useMessage hook
    }
  }, [conversationId, messageHook, navigateToChat]);

  const archiveConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      await messageHook.archiveConversationById(conversationId);
    } catch (error) {
      // Error already handled in useMessage hook
    }
  }, [conversationId, messageHook]);

  const unarchiveConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      await messageHook.unarchiveConversationById(conversationId);
    } catch (error) {
      // Error already handled in useMessage hook
    }
  }, [conversationId, messageHook]);

  const muteConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      await messageHook.muteConversationById(conversationId);
    } catch (error) {
      // Error already handled in useMessage hook
    }
  }, [conversationId, messageHook]);

  const unmuteConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      await messageHook.unmuteConversationById(conversationId);
    } catch (error) {
      // Error already handled in useMessage hook
    }
  }, [conversationId, messageHook]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (!conversationId) return;

    const messagePagination = messageHook.pagination.messages[conversationId];
    if (messagePagination && messagePagination.hasMore && !loading) {
      dispatch(fetchMessages(conversationId));
    }
  }, [conversationId, messageHook.pagination.messages, loading, dispatch]);

  // Computed values
  const isCurrentConversation = useMemo(() => {
    return currentConversation && currentConversation._id === conversationId;
  }, [currentConversation, conversationId]);

  const conversationExists = useMemo(() => {
    return !!currentConversation && isCurrentConversation;
  }, [currentConversation, isCurrentConversation]);

  const conversationName = useMemo(() => {
    if (!currentConversation || !user) return '';
    return MessageService.getConversationName(currentConversation, user._id);
  }, [currentConversation, user]);

  const conversationAvatar = useMemo(() => {
    if (!currentConversation || !user) return '';
    return MessageService.getConversationAvatar(currentConversation, user._id);
  }, [currentConversation, user]);

  const canDeleteMessages = useMemo(() => {
    return currentConversation && user && 
           (currentConversation.type === 'direct' || 
            currentConversation.owner?._id === user._id);
  }, [currentConversation, user]);

  const messagePagination = useMemo(() => {
    return conversationId ? messageHook.pagination.messages[conversationId] : null;
  }, [conversationId, messageHook.pagination.messages]);

  return {
    // State
    conversation: currentConversation,
    messages: currentMessages,
    loading,
    sending,
    error,
    pagination: messagePagination,
    
    // Computed
    isCurrentConversation,
    conversationExists,
    conversationName,
    conversationAvatar,
    canDeleteMessages,
    isTyping: messageHook.isTyping,
    
    // Actions
    sendMessage,
    deleteMessage,
    markAsRead,
    deleteConversation,
    archiveConversation,
    unarchiveConversation,
    muteConversation,
    unmuteConversation,
    loadMoreMessages,
    
    // Navigation
    navigateToConversation,
    navigateToChat,
  };
};

// Hook for conversation list management
export const useConversationList = () => {
  const dispatch = useDispatch();
  const {
    conversations,
    loading,
    error,
    filters,
    pagination,
    getConversations,
    updateFilters,
    resetFilters,
  } = useMessage();

  // Load more conversations (pagination)
  const loadMore = useCallback(() => {
    if (pagination.conversations.hasMore && !loading) {
      getConversations({
        page: pagination.conversations.page + 1,
      });
    }
  }, [pagination.conversations, loading, getConversations]);

  // Refresh conversation list
  const refresh = useCallback(() => {
    getConversations({ page: 1 });
  }, [getConversations]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    if (filters.type !== 'all') {
      filtered = filtered.filter(conv => conv.type === filters.type);
    }

    if (filters.unreadOnly) {
      filtered = filtered.filter(conv => conv.unreadCount > 0);
    }

    if (filters.archived !== undefined) {
      filtered = filtered.filter(conv => conv.isArchived === filters.archived);
    }

    return filtered;
  }, [conversations, filters]);

  // Initialize
  useEffect(() => {
    getConversations();
  }, []); // Only run once on mount

  return {
    conversations: filteredConversations,
    allConversations: conversations,
    loading,
    error,
    filters,
    pagination: pagination.conversations,
    loadMore,
    refresh,
    updateFilters,
    resetFilters,
  };
};

// Hook for message search
export const useMessageSearch = () => {
  const {
    searchResults,
    searchLoading,
    searchQuery,
    searchForMessages,
  } = useMessage();

  const [localQuery, setLocalQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!localQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      searchForMessages(localQuery);
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localQuery, searchForMessages]);

  const search = useCallback((query: string, conversationId?: string) => {
    setLocalQuery(query);
    if (query.trim()) {
      searchForMessages(query, conversationId);
    }
  }, [searchForMessages]);

  const clearSearch = useCallback(() => {
    setLocalQuery('');
  }, []);

  return {
    searchResults,
    searchLoading: searchLoading || isSearching,
    searchQuery: localQuery || searchQuery,
    search,
    clearSearch,
  };
};

// Hook for direct message creation
export const useDirectMessage = () => {
  const { createConversationWithUser } = useMessage();
  const router = useRouter();

  const startDirectMessage = useCallback(async (userId: string) => {
    try {
      const conversation = await createConversationWithUser(userId);
      router.push(`/chat/${conversation._id}`);
      return conversation;
    } catch (error) {
      // Error already handled in useMessage hook
      throw error;
    }
  }, [createConversationWithUser, router]);

  return {
    startDirectMessage,
  };
};

// Hook for file/media handling in messages
export const useMessageMedia = () => {
  const [uploadProgress, setUploadProgress] = useState<{ [fileId: string]: number }>({});
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const fileId = `${file.name}_${Date.now()}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        // Simulate upload progress (replace with actual upload logic)
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Here you would implement actual file upload to your storage service
        const uploadedUrl = URL.createObjectURL(file); // Placeholder
        uploadedUrls.push(uploadedUrl);

        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }

      toast.success('Files uploaded successfully!');
      return uploadedUrls;
    } catch (error) {
      toast.error('Failed to upload files');
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const validateFiles = useCallback((files: File[]): { valid: File[]; invalid: File[] } => {
    const valid: File[] = [];
    const invalid: File[] = [];

    files.forEach(file => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        invalid.push(file);
        return;
      }

      // Check file type
      const supportedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/ogg',
        'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
        'application/pdf', 'text/plain'
      ];

      if (supportedTypes.includes(file.type)) {
        valid.push(file);
      } else {
        invalid.push(file);
      }
    });

    return { valid, invalid };
  }, []);

  return {
    uploadFiles,
    validateFiles,
    uploadProgress,
    isUploading,
  };
};