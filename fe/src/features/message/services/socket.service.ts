// src/features/message/services/socket.service.ts - FIXED

import { io, Socket } from 'socket.io-client';
import type {
  SocketConfig,
  SocketEventHandlers,
  SocketMessage,
  SocketTypingEvent,
  SocketReadEvent,
} from '../type';

export class SocketService {
  private socket: Socket | null = null;
  private config: SocketConfig | null = null;
  private handlers: SocketEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Giảm xuống
  private reconnectDelay = 2000; // Tăng delay
  private isManuallyDisconnected = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Connect to socket server - IMPROVED
   */
  connect(config: SocketConfig, handlers: SocketEventHandlers = {}) {
    this.config = config;
    this.handlers = handlers;
    this.isManuallyDisconnected = false;

    try {
      // Clear any existing connection
      this.cleanup();

      const socketUrl = config.url.includes('/api') 
        ? config.url.replace('/api', '') 
        : config.url;
      
      // Chuẩn hóa namespace URL
      const namespace = config.namespace || '/chat';
      const fullUrl = `${socketUrl}${namespace}`;
      
      console.log('🔌 Connecting to socket:', fullUrl);
      console.log('🔑 Token available:', !!config.token);

      this.socket = io(fullUrl, {
        auth: {
          token: config.token,
        },
        extraHeaders: {
          Authorization: `Bearer ${config.token}`,
        },
        transports: ['websocket'], // Chỉ dùng websocket để ổn định hơn
        timeout: 10000, // Giảm timeout
        reconnection: false, // Tắt auto reconnect, tự quản lý
        forceNew: true,
        upgrade: true,
        rememberUpgrade: true,
      });

      this.setupEventListeners();
      
      // Connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          console.log('⏰ Connection timeout');
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }, 15000);
      
    } catch (error) {
      console.error('❌ Socket connection error:', error);
      this.handlers.onError?.(error);
    }
  }

  /**
   * Disconnect from socket server - IMPROVED
   */
  disconnect() {
    console.log('🔌 Manually disconnecting socket...');
    this.isManuallyDisconnected = true;
    this.reconnectAttempts = 0;
    this.cleanup();
  }

  /**
   * Clean up all connections and timers - NEW
   */
  private cleanup() {
    // Clear timers
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Disconnect socket
    if (this.socket) {
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
   * Send message through socket - IMPROVED ERROR HANDLING
   */
  async sendMessage(data: any): Promise<SocketMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('📤 Sending message:', { 
        recipientId: data.recipientId,
        contentLength: data.content?.length || 0,
        type: data.type 
      });

      const timeout = setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 10000);

      this.socket.emit('sendMessage', data, (response: SocketMessage) => {
        clearTimeout(timeout);
        console.log('📥 Message response:', response);
        
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });
    });
  }

  /**
   * Mark messages as read - IMPROVED
   */
  async markAsRead(conversationId: string): Promise<SocketMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Mark as read timeout'));
      }, 5000);

      this.socket.emit('markAsRead', { conversationId }, (response: SocketMessage) => {
        clearTimeout(timeout);
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to mark as read'));
        }
      });
    });
  }

  /**
   * Send typing indicator - DEBOUNCED
   */
  private typingTimeout: NodeJS.Timeout | null = null;
  sendTyping(conversationId: string, isTyping: boolean) {
    if (!this.socket || !this.socket.connected) return;

    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.socket.emit('typing', { conversationId, isTyping });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      this.typingTimeout = setTimeout(() => {
        if (this.socket && this.socket.connected) {
          this.socket.emit('typing', { conversationId, isTyping: false });
        }
      }, 3000);
    }
  }

  /**
   * Send ping to test connection
   */
  ping() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping', { timestamp: Date.now() });
    }
  }

  /**
   * Setup event listeners - IMPROVED
   */
  private setupEventListeners() {
    if (!this.socket) return;

    // Clear connection timeout on successful connect
    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      this.reconnectAttempts = 0;
      
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      // Setup heartbeat
      this.setupHeartbeat();
      
      this.handlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.stopHeartbeat();
      this.handlers.onDisconnect?.();
      
      // Auto-reconnect logic
      if (!this.isManuallyDisconnected) {
        this.attemptReconnect(reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.handleConnectionError(error);
    });

    // Message events với error handling tốt hơn
    this.socket.on('newMessage', (data: any) => {
      try {
        console.log('📨 New message received:', data);
        
        // Validate message data
        if (data?.message && typeof data.message === 'object') {
          this.handlers.onNewMessage?.(data.message);
        } else {
          console.error('Invalid message data:', data);
        }
      } catch (error) {
        console.error('Error handling new message:', error);
      }
    });

    this.socket.on('messagesRead', (data: SocketReadEvent) => {
      try {
        console.log('👁️ Messages read:', data);
        if (data?.conversationId) {
          this.handlers.onMessagesRead?.(data);
        }
      } catch (error) {
        console.error('Error handling messages read:', error);
      }
    });

    this.socket.on('userTyping', (data: SocketTypingEvent) => {
      try {
        console.log('⌨️ User typing:', data);
        if (data?.conversationId && data?.userId) {
          this.handlers.onUserTyping?.(data);
        }
      } catch (error) {
        console.error('Error handling user typing:', error);
      }
    });

    // Health check events
    this.socket.on('pong', () => {
      console.log('🏓 Pong received');
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.handlers.onError?.(error);
    });
  }

  /**
   * Setup heartbeat to maintain connection - NEW
   */
  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat - NEW
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle connection errors - NEW
   */
  private handleConnectionError(error: any) {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.handlers.onError?.(error);
    
    if (!this.isManuallyDisconnected) {
      this.attemptReconnect(error.message || 'Connection error');
    }
  }

  /**
   * Attempt reconnection with improved logic - IMPROVED
   */
  private attemptReconnect(reason: string) {
    if (this.isManuallyDisconnected || 
        this.reconnectAttempts >= this.maxReconnectAttempts ||
        !this.config) {
      console.log('❌ Reconnection stopped:', { 
        manual: this.isManuallyDisconnected,
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts 
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), 
      10000
    );
    
    console.log(`🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms (reason: ${reason})`);

    setTimeout(() => {
      if (!this.isManuallyDisconnected && this.config) {
        this.connect(this.config, this.handlers);
      }
    }, delay);
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Update event handlers
   */
  updateHandlers(handlers: Partial<SocketEventHandlers>) {
    this.handlers = { ...this.handlers, ...handlers };
  }
}

// Export singleton instance
export const socketService = new SocketService();