// src/features/message/services/index.ts

import { apiClient } from '../../../shared/api/client';
import type {
  SendMessageDto,
  GetConversationsParams,
  GetMessagesParams,
  ConversationsResponse,
  MessagesResponse,
  UnreadCountResponse,
  Message,
  Conversation,
} from '../type';

/**
 * Message API Service
 */
export class MessageService {
  private baseUrl = '/messages';

  /**
   * Helper to extract data from API response
   */
  private extractData<T>(response: any): T {
    // Handle different response structures
    if (response.data) {
      // If wrapped in data property
      return response.data.data || response.data;
    }
    return response;
  }

  /**
   * Gửi tin nhắn mới
   */
  async sendMessage(data: SendMessageDto): Promise<Message> {
    try {
      const response = await apiClient.post<any>(`${this.baseUrl}`, data);
      return this.extractData<Message>(response);
    } catch (error: any) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách cuộc trò chuyện
   */
  async getConversations(params: GetConversationsParams = {}): Promise<ConversationsResponse> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/conversations`,
        { params }
      );
      return this.extractData<ConversationsResponse>(response);
    } catch (error: any) {
      console.error('Get conversations error:', error);
      throw error;
    }
  }

  /**
   * Lấy tin nhắn của cuộc trò chuyện
   */
  async getConversationMessages(
    conversationId: string,
    params: GetMessagesParams = {}
  ): Promise<MessagesResponse> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/conversations/${conversationId}`,
        { params }
      );
      return this.extractData<MessagesResponse>(response);
    } catch (error: any) {
      console.error('Get conversation messages error:', error);
      throw error;
    }
  }

  /**
   * Đánh dấu đã đọc tất cả tin nhắn trong cuộc trò chuyện
   */
  async markConversationAsRead(conversationId: string): Promise<{ success: boolean; count: number }> {
    try {
      const response = await apiClient.patch<any>(
        `${this.baseUrl}/conversations/${conversationId}/read`
      );
      return this.extractData<{ success: boolean; count: number }>(response);
    } catch (error: any) {
      console.error('Mark conversation as read error:', error);
      throw error;
    }
  }

  /**
   * Xóa cuộc trò chuyện
   */
  async deleteConversation(conversationId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<any>(
        `${this.baseUrl}/conversations/${conversationId}`
      );
      return this.extractData<{ success: boolean }>(response);
    } catch (error: any) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  }

  /**
   * Lấy số lượng tin nhắn chưa đọc
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/unread-count`
      );
      return this.extractData<UnreadCountResponse>(response);
    } catch (error: any) {
      console.error('Get unread count error:', error);
      throw error;
    }
  }

  /**
   * Lấy/Tạo cuộc trò chuyện với người dùng cụ thể
   */
  async getOrCreateConversation(userId: string): Promise<Conversation> {
    try {
      const response = await apiClient.get<any>(
        `${this.baseUrl}/with/${userId}`
      );
      return this.extractData<Conversation>(response);
    } catch (error: any) {
      console.error('Get or create conversation error:', error);
      throw error;
    }
  }

  /**
   * Xóa tin nhắn
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<any>(
        `${this.baseUrl}/${messageId}`
      );
      return this.extractData<{ success: boolean }>(response);
    } catch (error: any) {
      console.error('Delete message error:', error);
      throw error;
    }
  }

  /**
   * Upload ảnh cho tin nhắn
   */
  async uploadMessageImage(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post<any>(
        '/uploads/message-images',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return this.extractData<{ url: string }>(response);
    } catch (error: any) {
      console.error('Upload message image error:', error);
      throw error;
    }
  }
}

/**
 * Socket Service for real-time messaging - Import from separate file
 */
export { SocketService, socketService } from './socket.service';

// Export singleton instance
export const messageService = new MessageService();

// Helper functions - Updated and improved
export const formatMessageTime = (date: Date | string): string => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - messageDate.getTime();
  
  // Less than 1 minute
  if (diffInMs < 60 * 1000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diffInMs < 60 * 60 * 1000) {
    const minutes = Math.floor(diffInMs / (60 * 1000));
    return `${minutes}m ago`;
  }
  
  // Less than 24 hours
  if (diffInMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diffInMs / (60 * 60 * 1000));
    return `${hours}h ago`;
  }
  
  // More than 24 hours
  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatLastMessageTime = (date: Date | string): string => {
  const messageDate = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - messageDate.getTime();
  
  // Today
  if (diffInMs < 24 * 60 * 60 * 1000) {
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  
  // This week
  if (diffInMs < 7 * 24 * 60 * 60 * 1000) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  // Older
  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const truncateMessage = (content: string, maxLength: number = 50): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

export const getConversationTitle = (conversation: Conversation, currentUserId: string): string => {
  const otherUser = conversation.participants.find(p => p.id !== currentUserId);
  return otherUser?.username || 'Unknown User';
};

export const getConversationAvatar = (conversation: Conversation, currentUserId: string): string => {
  const otherUser = conversation.participants.find(p => p.id !== currentUserId);
  return otherUser?.avatar || '/images/default-avatar.png';
};

export const getOtherUser = (conversation: Conversation, currentUserId: string) => {
  return conversation.participants.find(p => p.id !== currentUserId);
};

export const isMessageFromCurrentUser = (message: Message, currentUserId: string): boolean => {
  return message.sender.id === currentUserId;
};

export const canDeleteMessage = (message: Message, currentUserId: string): boolean => {
  return message.sender.id === currentUserId && message.status !== 'deleted';
};

// Validation helpers
export const validateMessageContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content || !content.trim()) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 1000) {
    return { isValid: false, error: 'Message is too long (max 1000 characters)' };
  }
  
  return { isValid: true };
};

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
  }
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image size must be less than 5MB' };
  }
  
  return { isValid: true };
};

// Error handling helper
export const handleMessageError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};