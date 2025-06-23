// fe/src/features/message/services/index.ts - FIXED

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
 * Message API Service - FIXED VERSION
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
   * ✅ Helper to validate userId before API calls
   */
  private validateUserId(userId: string | undefined | null): string {
    if (!userId || userId === 'undefined' || userId === 'null') {
      throw new Error('Invalid userId: userId is required and cannot be undefined');
    }
    return userId;
  }

  /**
   * Gửi tin nhắn mới
   */
  async sendMessage(data: SendMessageDto): Promise<Message> {
    try {
      // ✅ Validate recipientId before sending
      if (!data.recipientId || data.recipientId === 'undefined') {
        throw new Error('recipientId is required for sending message');
      }

      console.log('📤 Sending message:', {
        recipientId: data.recipientId,
        contentLength: data.content?.length || 0,
        type: data.type
      });

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
      console.log('📋 Getting conversations with params:', params);
      
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
      // ✅ Validate conversationId
      if (!conversationId || conversationId === 'undefined') {
        throw new Error('conversationId is required');
      }

      console.log('💬 Getting messages for conversation:', conversationId, 'params:', params);

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
      // ✅ Validate conversationId
      if (!conversationId || conversationId === 'undefined') {
        throw new Error('conversationId is required');
      }

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
      // ✅ Validate conversationId
      if (!conversationId || conversationId === 'undefined') {
        throw new Error('conversationId is required');
      }

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
      console.log('🔢 Getting unread count...');
      
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
   * ✅ Lấy/Tạo cuộc trò chuyện với người dùng cụ thể - FIXED
   */
  async getOrCreateConversation(userId: string): Promise<Conversation> {
    try {
      // ✅ CRITICAL FIX: Validate userId before making API call
      const validUserId = this.validateUserId(userId);
      
      console.log('🔍 Getting/creating conversation with user:', validUserId);

      const response = await apiClient.get<any>(
        `${this.baseUrl}/with/${validUserId}` // This will now be /api/messages/with/validUserId
      );
      
      const conversation = this.extractData<Conversation>(response);
      console.log('✅ Got conversation:', conversation.id);
      
      return conversation;
    } catch (error: any) {
      console.error('Get or create conversation error:', {
        userId,
        validatedUserId: this.validateUserId(userId),
        error: error.message,
        fullError: error
      });
      throw error;
    }
  }

  /**
   * ✅ Xóa tin nhắn cụ thể
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    try {
      // ✅ Validate messageId
      if (!messageId || messageId === 'undefined') {
        throw new Error('messageId is required');
      }

      const response = await apiClient.delete<any>(
        `${this.baseUrl}/${messageId}`
      );
      return this.extractData<{ success: boolean }>(response);
    } catch (error: any) {
      console.error('Delete message error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const messageService = new MessageService();

// Re-export socket service
export { SocketService } from './socket.service';
import { SocketService } from './socket.service';
export const socketService = new SocketService();