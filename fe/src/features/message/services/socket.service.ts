// src/features/message/services/socket.service.ts - COMPLETE FIXED

import { io, Socket } from 'socket.io-client';
import type {
  SocketConfig,
  SocketEventHandlers,
  SocketMessage,
  SocketTypingEvent,
  SocketReadEvent,
} from '../type';

interface ConnectionState {
  isManuallyDisconnected: boolean;
  reconnectAttempts: number;
  lastConnectTime: number;
  lastConfig: SocketConfig | null;
}

interface Timers {
  connectionTimeout: NodeJS.Timeout | null;
  reconnectTimeout: NodeJS.Timeout | null;
  heartbeatInterval: NodeJS.Timeout | null;
}

export class SocketService {
  private socket: Socket | null = null;
  private config: SocketConfig | null = null;
  private handlers: SocketEventHandlers = {};
  
  // ✅ Improved connection state management
  private connectionState: ConnectionState = {
    isManuallyDisconnected: false,
    reconnectAttempts: 0,
    lastConnectTime: 0,
    lastConfig: null,
  };
  
  // ✅ Connection throttling
  private readonly maxReconnectAttempts = 3;
  private readonly baseReconnectDelay = 3000;
  private readonly connectThrottleMs = 2000;
  private readonly connectionTimeoutMs = 15000;
  
  // ✅ Timers management
  private timers: Timers = {
    connectionTimeout: null,
    reconnectTimeout: null,
    heartbeatInterval: null,
  };

  // ✅ Typing timeouts management
  private typingTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * ✅ Connect with improved state management
   */
  connect(config: SocketConfig, handlers: SocketEventHandlers = {}): void {
    try {
      // ✅ Throttle connection attempts
      const now = Date.now();
      if (now - this.connectionState.lastConnectTime < this.connectThrottleMs) {
        console.log('🚫 Connection throttled, please wait...');
        return;
      }

      // ✅ Check if already connected with same config
      if (this.socket?.connected && this.areConfigsEqual(config, this.connectionState.lastConfig)) {
        console.log('ℹ️ Already connected with same configuration');
        return;
      }

      this.config = config;
      this.handlers = handlers;
      this.connectionState.isManuallyDisconnected = false;
      this.connectionState.lastConnectTime = now;
      this.connectionState.lastConfig = { ...config };

      // ✅ Clean up any existing connection
      this.cleanup();

      // ✅ Prepare socket URL
      const socketUrl = config.url.includes('/api') 
        ? config.url.replace('/api', '') 
        : config.url;
      const namespace = config.namespace || '/chat';
      const fullUrl = `${socketUrl}${namespace}`;
      
      console.log('🔌 Connecting to socket:', fullUrl);

      // ✅ Create socket with optimized config
      this.socket = io(fullUrl, {
        auth: {
          token: config.token,
        },
        extraHeaders: {
          Authorization: `Bearer ${config.token}`,
        },
        transports: ['websocket', 'polling'], // ✅ Allow fallback to polling
        timeout: 10000,
        reconnection: false, // ✅ We handle reconnection manually
        forceNew: true,
        upgrade: true,
        rememberUpgrade: false, // ✅ Don't remember upgrade to avoid issues
      });

      this.setupEventListeners();
      this.setupConnectionTimeout();
      
    } catch (error) {
      console.error('❌ Socket connection error:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * ✅ Improved disconnect with proper cleanup
   */
  disconnect(): void {
    console.log('🔌 Manually disconnecting socket...');
    
    // ✅ Set flag BEFORE cleanup to prevent reconnection
    this.connectionState.isManuallyDisconnected = true;
    this.connectionState.reconnectAttempts = 0;
    
    this.clearAllTimers();
    this.cleanup();
  }

  /**
   * ✅ Complete cleanup of all resources
   */
  private cleanup(): void {
    this.clearAllTimers();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * ✅ Clear all timers
   */
  private clearAllTimers(): void {
    Object.values(this.timers).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    
    this.timers = {
      connectionTimeout: null,
      reconnectTimeout: null,
      heartbeatInterval: null,
    };

    // Clear typing timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  /**
   * ✅ Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * ✅ Compare configs to avoid unnecessary reconnections
   */
  private areConfigsEqual(config1: SocketConfig, config2: SocketConfig | null): boolean {
    if (!config2) return false;
    return config1.url === config2.url && 
           config1.token === config2.token && 
           config1.namespace === config2.namespace;
  }

  /**
   * ✅ Setup connection timeout
   */
  private setupConnectionTimeout(): void {
    this.timers.connectionTimeout = setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        console.log('⏰ Connection timeout');
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, this.connectionTimeoutMs);
  }

  /**
   * ✅ Setup event listeners with better error handling
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      this.connectionState.reconnectAttempts = 0;
      
      // ✅ Clear connection timeout
      if (this.timers.connectionTimeout) {
        clearTimeout(this.timers.connectionTimeout);
        this.timers.connectionTimeout = null;
      }

      this.setupHeartbeat();
      this.handlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
      this.stopHeartbeat();
      this.handlers.onDisconnect?.();
      
      // ✅ Only attempt reconnection if not manually disconnected
      if (!this.connectionState.isManuallyDisconnected) {
        this.attemptReconnect(reason);
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Socket connection error:', error.message);
      this.handleConnectionError(error);
    });

    // ✅ Message events with improved error handling
    this.socket.on('newMessage', (data: any) => {
      try {
        if (data?.message && typeof data.message === 'object') {
          this.handlers.onNewMessage?.(data.message);
        } else {
          console.error('Invalid message data received:', data);
        }
      } catch (error) {
        console.error('Error handling new message:', error);
      }
    });

    this.socket.on('messagesRead', (data: SocketReadEvent) => {
      try {
        if (data?.conversationId) {
          this.handlers.onMessagesRead?.(data);
        }
      } catch (error) {
        console.error('Error handling messages read:', error);
      }
    });

    this.socket.on('userTyping', (data: SocketTypingEvent) => {
      try {
        if (data?.conversationId && data?.userId !== undefined) {
          this.handlers.onUserTyping?.(data);
        }
      } catch (error) {
        console.error('Error handling user typing:', error);
      }
    });

    this.socket.on('error', (error: Error) => {
      console.error('❌ Socket error:', error);
      this.handlers.onError?.(error);
    });

    // ✅ Health check events
    this.socket.on('pong', () => {
      console.log('🏓 Pong received');
    });
  }

  /**
   * ✅ Improved heartbeat mechanism
   */
  private setupHeartbeat(): void {
    this.timers.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.timers.heartbeatInterval) {
      clearInterval(this.timers.heartbeatInterval);
      this.timers.heartbeatInterval = null;
    }
  }

  /**
   * ✅ Handle connection errors
   */
  private handleConnectionError(error: any): void {
    if (this.timers.connectionTimeout) {
      clearTimeout(this.timers.connectionTimeout);
      this.timers.connectionTimeout = null;
    }

    this.handlers.onError?.(error);
    
    if (!this.connectionState.isManuallyDisconnected) {
      this.attemptReconnect(error.message || 'Connection error');
    }
  }

  /**
   * ✅ Improved reconnection with exponential backoff
   */
  private attemptReconnect(reason: string): void {
    // ✅ Comprehensive checks
    if (this.connectionState.isManuallyDisconnected) {
      console.log('❌ Reconnection stopped: manually disconnected');
      return;
    }

    if (this.connectionState.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Reconnection stopped: max attempts reached');
      return;
    }

    if (!this.config) {
      console.log('❌ Reconnection stopped: no config available');
      return;
    }

    // ✅ Clear any existing reconnect timeout
    if (this.timers.reconnectTimeout) {
      clearTimeout(this.timers.reconnectTimeout);
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.connectionState.reconnectAttempts), 
      30000 // Max 30 seconds
    );
    
    this.connectionState.reconnectAttempts++;
    
    console.log(`🔄 Attempting reconnect ${this.connectionState.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms (reason: ${reason})`);

    this.timers.reconnectTimeout = setTimeout(() => {
      if (!this.connectionState.isManuallyDisconnected && this.config) {
        this.connect(this.config, this.handlers);
      }
    }, delay);
  }

  /**
   * ✅ Send message with timeout and error handling
   */
  async sendMessage(data: any): Promise<SocketMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 10000);

      this.socket.emit('sendMessage', data, (response: SocketMessage) => {
        clearTimeout(timeout);
        
        if (response?.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });
    });
  }

  /**
   * ✅ Mark messages as read
   */
  async markAsRead(conversationId: string): Promise<SocketMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
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
   * ✅ Send typing indicator with debouncing
   */
  sendTyping(conversationId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;

    // ✅ Clear existing timeout for this conversation
    const existingTimeout = this.typingTimeouts.get(conversationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    this.socket.emit('typing', { conversationId, isTyping });

    // ✅ Auto-stop typing after 3 seconds
    if (isTyping) {
      const timeout = setTimeout(() => {
        if (this.socket?.connected) {
          this.socket.emit('typing', { conversationId, isTyping: false });
        }
        this.typingTimeouts.delete(conversationId);
      }, 3000);
      
      this.typingTimeouts.set(conversationId, timeout);
    } else {
      this.typingTimeouts.delete(conversationId);
    }
  }

  /**
   * ✅ Send ping to test connection
   */
  ping(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping', { timestamp: Date.now() });
    }
  }

  /**
   * ✅ Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * ✅ Update event handlers
   */
  updateHandlers(handlers: Partial<SocketEventHandlers>): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * ✅ Get connection status and info
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected(),
      reconnectAttempts: this.connectionState.reconnectAttempts,
      isManuallyDisconnected: this.connectionState.isManuallyDisconnected,
      lastConnectTime: this.connectionState.lastConnectTime,
      hasActiveTimers: {
        connectionTimeout: !!this.timers.connectionTimeout,
        reconnectTimeout: !!this.timers.reconnectTimeout,
        heartbeatInterval: !!this.timers.heartbeatInterval,
      },
      typingTimeoutsCount: this.typingTimeouts.size,
    };
  }

  /**
   * ✅ Force reset connection state (for debugging)
   */
  resetConnectionState(): void {
    console.log('🔄 Resetting connection state...');
    this.connectionState = {
      isManuallyDisconnected: false,
      reconnectAttempts: 0,
      lastConnectTime: 0,
      lastConfig: null,
    };
    this.clearAllTimers();
  }
}

// ✅ Export singleton instance
export const socketService = new SocketService();

// ✅ Make available for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).socketService = socketService;
}