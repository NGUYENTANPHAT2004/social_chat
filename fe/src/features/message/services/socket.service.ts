// src/features/message/services/socket.service.ts

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
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManuallyDisconnected = false;

  /**
   * Connect to socket server
   */
  connect(config: SocketConfig, handlers: SocketEventHandlers = {}) {
    this.config = config;
    this.handlers = handlers;
    this.isManuallyDisconnected = false;

    try {
      // Disconnect existing connection
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
      }

      const socketUrl = config.url.replace('/api', ''); // Remove /api prefix for socket
      const fullUrl = `${socketUrl}${config.namespace || '/chat'}`;
      
      console.log('🔌 Connecting to socket:', fullUrl);
      console.log('🔑 Using token:', config.token ? 'Present' : 'Missing');

      this.socket = io(fullUrl, {
        auth: {
          token: config.token,
        },
        extraHeaders: {
          Authorization: `Bearer ${config.token}`,
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        forceNew: true,
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('❌ Socket connection error:', error);
      this.handlers.onError?.(error);
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    this.isManuallyDisconnected = true;
    this.reconnectAttempts = 0;
    
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Send message through socket
   */
  async sendMessage(data: any): Promise<SocketMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('📤 Sending message:', data);

      this.socket.emit('sendMessage', data, (response: SocketMessage) => {
        console.log('📥 Message response:', response);
        
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });

      // Add timeout
      setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 10000);
    });
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string): Promise<SocketMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('markAsRead', { conversationId }, (response: SocketMessage) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to mark as read'));
        }
      });
    });
  }

  /**
   * Send typing indicator
   */
  sendTyping(conversationId: string, isTyping: boolean) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('typing', { conversationId, isTyping });
    }
  }

  /**
   * Join a room
   */
  joinRoom(roomId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join', { roomId });
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave', { roomId });
    }
  }

  /**
   * Send ping to test connection
   */
  ping() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Update event handlers
   */
  updateHandlers(handlers: Partial<SocketEventHandlers>) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      this.reconnectAttempts = 0;
      this.handlers.onConnect?.();
    });

    this.socket.on('connected', (data) => {
      console.log('✅ Server confirmed connection:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.handlers.onDisconnect?.();
      
      // Auto-reconnect if not manually disconnected
      if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.handlers.onError?.(error);
      
      // Try to reconnect with exponential backoff
      if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    });

    // Custom events
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.handlers.onError?.(error);
    });

    // Message events
    this.socket.on('newMessage', (data: NewMessageEvent) => {
      console.log('📨 New message received:', data);
      this.handlers.onNewMessage?.(data.message);
    });

    this.socket.on('messageDelivered', (data) => {
      console.log('✅ Message delivered:', data);
    });

    this.socket.on('messagesRead', (data: SocketReadEvent) => {
      console.log('👁️ Messages read:', data);
      this.handlers.onMessagesRead?.(data);
    });

    this.socket.on('userTyping', (data: SocketTypingEvent) => {
      console.log('⌨️ User typing:', data);
      this.handlers.onUserTyping?.(data);
    });

    // Health check events
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    // Reconnection events
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnect attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnect error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after maximum attempts');
      this.handlers.onError?.(new Error('Failed to reconnect'));
    });
  }

  /**
   * Attempt manual reconnection with exponential backoff
   */
  private attemptReconnect() {
    if (this.isManuallyDisconnected || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (!this.isManuallyDisconnected && this.config) {
        this.connect(this.config, this.handlers);
      }
    }, delay);
  }
}

// Export singleton instance
export const socketService = new SocketService();