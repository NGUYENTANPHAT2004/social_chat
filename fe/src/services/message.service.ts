// src/services/message.service.ts
import { apiService } from './api';
import { MESSAGE_ENDPOINTS } from '@/constants/api';
import { ApiResponse, PaginatedResponse } from '@/types';

export interface User {
  _id: string;
  username: string;
  avatar: string;
  displayName?: string;
}

export interface Message {
  _id: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'gift' | 'system';
  sender: User;
  conversation: string;
  replyTo?: Message;
  attachments?: {
    url: string;
    type: string;
    name: string;
    size: number;
  }[];
  metadata?: {
    giftId?: string;
    giftName?: string;
    giftImage?: string;
    giftValue?: number;
  };
  isEdited: boolean;
  readBy: {
    user: string;
    readAt: Date;
  }[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Conversation {
  _id: string;
  type: 'direct' | 'group' | 'room';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
  
  // For group/room conversations
  name?: string;
  avatar?: string;
  description?: string;
  owner?: User;
  admins?: User[];
}

export interface SendMessageDto {
  content: string;
  type?: 'text' | 'image' | 'video' | 'audio' | 'file';
  conversationId?: string;
  recipientId?: string; // For direct messages
  replyToId?: string;
  attachments?: File[];
  metadata?: {
    giftId?: string;
    [key: string]: any;
  };
}

export interface ConversationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: 'direct' | 'group' | 'room';
  archived?: boolean;
  unreadOnly?: boolean;
}

export interface MessageQueryParams {
  page?: number;
  limit?: number;
  before?: string; // Message ID for pagination
  after?: string;
  type?: string;
  search?: string;
}

export class MessageService {
  // Send new message
  static async sendMessage(data: SendMessageDto): Promise<Message> {
    const formData = new FormData();
    
    // Add text data
    formData.append('content', data.content);
    if (data.type) formData.append('type', data.type);
    if (data.conversationId) formData.append('conversationId', data.conversationId);
    if (data.recipientId) formData.append('recipientId', data.recipientId);
    if (data.replyToId) formData.append('replyToId', data.replyToId);
    if (data.metadata) formData.append('metadata', JSON.stringify(data.metadata));
    
    // Add file attachments
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
    }
    
    const response = await apiService.upload<Message>(MESSAGE_ENDPOINTS.MESSAGES, formData);
    return response.data;
  }

  // Get conversations list
  static async getConversations(params?: ConversationQueryParams): Promise<PaginatedResponse<Conversation>> {
    const response = await apiService.get<PaginatedResponse<Conversation>>(
      MESSAGE_ENDPOINTS.CONVERSATIONS,
      { params }
    );
    return response.data;
  }

  // Get messages in a conversation
  static async getConversationMessages(
    conversationId: string,
    params?: MessageQueryParams
  ): Promise<PaginatedResponse<Message>> {
    const response = await apiService.get<PaginatedResponse<Message>>(
      MESSAGE_ENDPOINTS.CONVERSATION_BY_ID(conversationId),
      { params }
    );
    return response.data;
  }

  // Delete conversation
  static async deleteConversation(conversationId: string): Promise<{ success: boolean }> {
    const response = await apiService.delete<{ success: boolean }>(
      MESSAGE_ENDPOINTS.DELETE_CONVERSATION(conversationId)
    );
    return response.data;
  }

  // Mark conversation as read
  static async markConversationAsRead(conversationId: string): Promise<{ success: boolean }> {
    const response = await apiService.patch<{ success: boolean }>(
      MESSAGE_ENDPOINTS.MARK_READ(conversationId)
    );
    return response.data;
  }

  // Get unread message count
  static async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiService.get<{ count: number }>(MESSAGE_ENDPOINTS.UNREAD_COUNT);
    return response.data;
  }

  // Get or create conversation with specific user
  static async getOrCreateConversationWithUser(userId: string): Promise<Conversation> {
    const response = await apiService.get<Conversation>(
      MESSAGE_ENDPOINTS.MESSAGES_WITH_USER(userId)
    );
    return response.data;
  }

  // Delete specific message
  static async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    const response = await apiService.delete<{ success: boolean }>(
      MESSAGE_ENDPOINTS.DELETE_MESSAGE(messageId)
    );
    return response.data;
  }

  // Archive conversation
  static async archiveConversation(conversationId: string): Promise<{ success: boolean }> {
    const response = await apiService.patch<{ success: boolean }>(
      `/messages/conversations/${conversationId}/archive`
    );
    return response.data;
  }

  // Unarchive conversation
  static async unarchiveConversation(conversationId: string): Promise<{ success: boolean }> {
    const response = await apiService.patch<{ success: boolean }>(
      `/messages/conversations/${conversationId}/unarchive`
    );
    return response.data;
  }

  // Mute conversation
  static async muteConversation(conversationId: string): Promise<{ success: boolean }> {
    const response = await apiService.patch<{ success: boolean }>(
      `/messages/conversations/${conversationId}/mute`
    );
    return response.data;
  }

  // Unmute conversation
  static async unmuteConversation(conversationId: string): Promise<{ success: boolean }> {
    const response = await apiService.patch<{ success: boolean }>(
      `/messages/conversations/${conversationId}/unmute`
    );
    return response.data;
  }

  // Search messages
  static async searchMessages(
    query: string,
    conversationId?: string
  ): Promise<PaginatedResponse<Message>> {
    const params = { search: query, conversationId };
    const response = await apiService.get<PaginatedResponse<Message>>(
      '/messages/search',
      { params }
    );
    return response.data;
  }

  // Utility methods
  static formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  }

  static isMessageFromCurrentUser(message: Message, currentUserId: string): boolean {
    return message.sender._id === currentUserId;
  }

  static getConversationName(conversation: Conversation, currentUserId: string): string {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct') {
      const otherUser = conversation.participants.find(p => p._id !== currentUserId);
      return otherUser?.displayName || otherUser?.username || 'Unknown User';
    }
    
    return 'Group Chat';
  }

  static getConversationAvatar(conversation: Conversation, currentUserId: string): string {
    if (conversation.avatar) return conversation.avatar;
    
    if (conversation.type === 'direct') {
      const otherUser = conversation.participants.find(p => p._id !== currentUserId);
      return otherUser?.avatar || '/default-avatar.png';
    }
    
    return '/default-group-avatar.png';
  }

  static getLastMessagePreview(message: Message): string {
    switch (message.type) {
      case 'text':
        return message.content;
      case 'image':
        return '📷 Hình ảnh';
      case 'video':
        return '🎥 Video';
      case 'audio':
        return '🎵 Âm thanh';
      case 'file':
        return '📎 Tệp đính kèm';
      case 'gift':
        return '🎁 Quà tặng';
      case 'system':
        return message.content;
      default:
        return 'Tin nhắn';
    }
  }

  static canDeleteMessage(message: Message, currentUserId: string): boolean {
    return message.sender._id === currentUserId;
  }

  static isMessageRead(message: Message, userId: string): boolean {
    return message.readBy.some(read => read.user === userId);
  }
}