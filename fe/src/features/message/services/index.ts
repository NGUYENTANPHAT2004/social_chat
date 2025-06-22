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
   * Gửi tin nhắn mới
   */
  async sendMessage(data: SendMessageDto): Promise<Message> {
    const response = await apiClient.post<Message>(`${this.baseUrl}`, data);
    return response.data;
  }

  /**
   * Lấy danh sách cuộc trò chuyện
   */
  async getConversations(params: GetConversationsParams = {}): Promise<ConversationsResponse> {
    const response = await apiClient.get<ConversationsResponse>(
      `${this.baseUrl}/conversations`,
      { params }
    );
    return response.data;
  }

  /**
   * Lấy tin nhắn của cuộc trò chuyện
   */
  async getConversationMessages(
    conversationId: string,
    params: GetMessagesParams = {}
  ): Promise<MessagesResponse> {
    const response = await apiClient.get<MessagesResponse>(
      `${this.baseUrl}/conversations/${conversationId}`,
      { params }
    );
    return response.data;
  }

  /**
   * Đánh dấu đã đọc tất cả tin nhắn trong cuộc trò chuyện
   */
  async markConversationAsRead(conversationId: string): Promise<{ success: boolean; count: number }> {
    const response = await apiClient.patch<{ success: boolean; count: number }>(
      `${this.baseUrl}/conversations/${conversationId}/read`
    );
    return response.data;
  }

  /**
   * Xóa cuộc trò chuyện
   */
  async deleteConversation(conversationId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(
      `${this.baseUrl}/conversations/${conversationId}`
    );
    return response.data;
  }

  /**
   * Lấy số lượng tin nhắn chưa đọc
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>(
      `${this.baseUrl}/unread-count`
    );
    return response.data;
  }

  /**
   * Lấy/Tạo cuộc trò chuyện với người dùng cụ thể
   */
  async getOrCreateConversation(userId: string): Promise<Conversation> {
    const response = await apiClient.get<Conversation>(
      `${this.baseUrl}/with/${userId}`
    );
    return response.data;
  }

  /**
   * Xóa tin nhắn
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(
      `${this.baseUrl}/${messageId}`
    );
    return response.data;
  }

  /**
   * Upload ảnh cho tin nhắn
   */
  async uploadMessageImage(file: File): Promise<{ url: string }> {
    const response = await apiClient.uploadFile<{ url: string }>(
      '/uploads/message-images',
      file,
      'image'
    );
    return response.data;
  }
}

/**
 * Socket Service for real-time messaging
 */
import { io, Socket } from 'socket.io-client';
import type {
  SocketConfig,
  SocketEventHandlers,
  SocketMessage,
  SocketTypingEvent,
  SocketReadEvent,
  NewMessageEvent,
} from '../type';

export class SocketService {
  private socket: Socket | null = null;
  private config: SocketConfig | null = null;
  private handlers: SocketEventHandlers = {};

  /**
   * Khởi tạo kết nối socket
   */
  connect(config: SocketConfig, handlers: SocketEventHandlers = {}) {
    this.config = config;
    this.handlers = handlers;

    const socketUrl = `${config.url}${config.namespace || '/chat'}`;
    
    this.socket = io(socketUrl, {
      auth: {
        token: config.token,
      },
      transports: ['websocket'],
      autoConnect: true,
    });

    this.setupEventListeners();
  }

  /**
   * Ngắt kết nối
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Gửi tin nhắn qua socket
   */
  async sendMessage(data: SendMessageDto): Promise<SocketMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('sendMessage', data, (response: SocketMessage) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to send message'));
        }
      });
    });
  }

  /**
   * Đánh dấu đã đọc tin nhắn
   */
  async markAsRead(conversationId: string): Promise<SocketMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('markAsRead', { conversationId }, (response: SocketMessage) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to mark as read'));
        }
      });
    });
  }

  /**
   * Gửi sự kiện đang gõ
   */
  sendTyping(conversationId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  /**
   * Cập nhật handlers
   */
  updateHandlers(handlers: Partial<SocketEventHandlers>) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.handlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.handlers.onDisconnect?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.handlers.onError?.(error);
    });

    // Message events
    this.socket.on('newMessage', (data: NewMessageEvent) => {
      console.log('New message received:', data);
      this.handlers.onNewMessage?.(data.message);
    });

    this.socket.on('messagesRead', (data: SocketReadEvent) => {
      console.log('Messages read:', data);
      this.handlers.onMessagesRead?.(data);
    });

    this.socket.on('userTyping', (data: SocketTypingEvent) => {
      console.log('User typing:', data);
      this.handlers.onUserTyping?.(data);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handlers.onError?.(error);
    });
  }

  /**
   * Lấy socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Tham gia room
   */
  joinRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('join', roomId);
    }
  }

  /**
   * Rời khỏi room
   */
  leaveRoom(roomId: string) {
    if (this.socket) {
      this.socket.emit('leave', roomId);
    }
  }
}

// Tạo instances
export const messageService = new MessageService();
export const socketService = new SocketService();

// Helper functions
export const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInMs = now.getTime() - messageDate.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return messageDate.toLocaleDateString();
  }
};

export const formatLastMessageTime = (date: Date): string => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInMs = now.getTime() - messageDate.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  if (diffInDays < 1) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays < 7) {
    return messageDate.toLocaleDateString([], { weekday: 'short' });
  } else {
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
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
  return otherUser?.avatar || '/default-avatar.png';
};

export const isMessageFromCurrentUser = (message: Message, currentUserId: string): boolean => {
  return message.sender.id === currentUserId;
};

export const canDeleteMessage = (message: Message, currentUserId: string): boolean => {
  return message.sender.id === currentUserId && message.status !== 'deleted';
};
