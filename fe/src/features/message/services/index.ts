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

// Re-export utility functions from utils (remove duplicates)
export {
  formatMessageTime,
  formatLastMessageTime,
  getConversationTitle,
  getConversationAvatar,
  getOtherUser,
  validateMessageContent,
  validateImageFile,
  truncateMessage,
  canDeleteMessage,
} from '../utils';

// Error handling helper - unique to services
export const handleMessageError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};