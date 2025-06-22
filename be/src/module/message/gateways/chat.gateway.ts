// be/src/module/message/gateways/chat.gateway.ts - FIXED

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard';
import { MessageService } from '../services/message.service';
import { SendMessageDto } from '../dto/send-message.dto';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId

  constructor(
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client attempting connection: ${client.id}`);
      
      // Extract and verify token
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`No token provided for client: ${client.id}`);
        client.emit('error', { message: 'No authentication token provided' });
        client.disconnect();
        return;
      }

      // Verify JWT token
      let payload: any;
      try {
        payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });
      } catch (jwtError) {
        this.logger.warn(`Invalid token for client ${client.id}: ${jwtError.message}`);
        client.emit('error', { message: 'Invalid authentication token' });
        client.disconnect();
        return;
      }

      const userId = payload.sub || payload.id;
      if (!userId) {
        this.logger.warn(`No user ID in token for client: ${client.id}`);
        client.emit('error', { message: 'Invalid token payload' });
        client.disconnect();
        return;
      }

      // Store connection info
      client.data.userId = userId;
      client.data.user = payload;
      
      // Add to user connections
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(client.id);
      this.socketToUser.set(client.id, userId);

      // Join user's personal room
      await client.join(`user:${userId}`);

      // Send connection confirmation
      client.emit('connected', { 
        userId, 
        socketId: client.id,
        timestamp: new Date().toISOString()
      });

      this.logger.log(`Client connected successfully: ${client.id} (User: ${userId})`);
      
      // Optional: Broadcast user online status
      this.broadcastUserStatus(userId, true);

    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error.stack);
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const userId = this.socketToUser.get(client.id);
      
      if (userId) {
        // Remove from user connections
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(client.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userId);
            // User is completely offline
            this.broadcastUserStatus(userId, false);
          }
        }
        
        this.socketToUser.delete(client.id);
        this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
      } else {
        this.logger.log(`Client disconnected: ${client.id} (No user associated)`);
      }
    } catch (error) {
      this.logger.error(`Disconnect error for client ${client.id}:`, error.stack);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto
  ) {
    try {
      const userId = client.data.userId;
      this.logger.log(`Handling message from user ${userId}:`, {
        recipientId: payload.recipientId,
        contentLength: payload.content?.length || 0,
        type: payload.type
      });

      // Validate payload
      if (!payload.recipientId || !payload.content?.trim()) {
        client.emit('sendMessage', {
          success: false,
          error: 'Invalid message data'
        });
        return;
      }

      // Save message to database
      const message = await this.messageService.sendMessage(payload, userId);
      
      // Emit to sender (confirmation)
      client.emit('sendMessage', {
        success: true,
        message: this.sanitizeMessage(message)
      });

      // Send to recipient if online
      const recipientSockets = this.connectedUsers.get(payload.recipientId);
      if (recipientSockets && recipientSockets.size > 0) {
        this.server.to(`user:${payload.recipientId}`).emit('newMessage', {
          message: this.sanitizeMessage(message)
        });
        this.logger.log(`Message delivered to online recipient: ${payload.recipientId}`);
      } else {
        this.logger.log(`Recipient offline, message saved: ${payload.recipientId}`);
      }

    } catch (error) {
      this.logger.error(`Error sending message from user ${client.data.userId}:`, error.stack);
      client.emit('sendMessage', {
        success: false,
        error: error.message || 'Failed to send message'
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string }
  ) {
    try {
      const userId = client.data.userId;
      
      if (!payload.conversationId) {
        client.emit('markAsRead', {
          success: false,
          error: 'Conversation ID required'
        });
        return;
      }

      // Mark messages as read in database
      const result = await this.messageService.markConversationAsRead(
        payload.conversationId,
        userId
      );

      // Confirm to sender
      client.emit('markAsRead', {
        success: true,
        result
      });

      // Get conversation to find other participants
      const conversation = await this.messageService.getConversationById(payload.conversationId);
      const otherParticipants = conversation.participants
        .filter(p => p.toString() !== userId);

      // Notify other participants that messages were read
      for (const participantId of otherParticipants) {
        this.server.to(`user:${participantId}`).emit('messagesRead', {
          conversationId: payload.conversationId,
          readBy: userId,
          timestamp: new Date().toISOString()
        });
      }

      this.logger.log(`Messages marked as read by user ${userId} in conversation ${payload.conversationId}`);

    } catch (error) {
      this.logger.error(`Error marking messages as read for user ${client.data.userId}:`, error.stack);
      client.emit('markAsRead', {
        success: false,
        error: error.message || 'Failed to mark messages as read'
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; isTyping: boolean }
  ) {
    try {
      const userId = client.data.userId;
      
      if (!payload.conversationId) {
        return;
      }

      // Get conversation participants
      const conversation = await this.messageService.getConversationById(payload.conversationId);
      const otherParticipants = conversation.participants
        .filter(p => p.toString() !== userId);

      // Send typing indicator to other participants
      for (const participantId of otherParticipants) {
        this.server.to(`user:${participantId}`).emit('userTyping', {
          conversationId: payload.conversationId,
          userId,
          isTyping: payload.isTyping,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      this.logger.error(`Error handling typing indicator for user ${client.data.userId}:`, error.stack);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    client.emit('pong', { 
      timestamp: new Date().toISOString(),
      received: data?.timestamp 
    });
  }

  // Helper method to extract token from client
  private extractToken(client: Socket): string | null {
    // Try auth object first
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }
    
    // Try authorization header
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return authHeader;
    }
    
    // Try query parameters
    if (client.handshake.query?.token) {
      const token = client.handshake.query.token;
      return Array.isArray(token) ? token[0] : token;
    }
    
    return null;
  }

  // Helper method to sanitize message before sending
  private sanitizeMessage(message: any) {
    return {
      id: message._id || message.id,
      sender: {
        id: message.sender._id || message.sender.id || message.sender,
        username: message.sender.username,
        avatar: message.sender.avatar
      },
      recipient: {
        id: message.recipient._id || message.recipient.id || message.recipient,
        username: message.recipient.username,
        avatar: message.recipient.avatar
      },
      conversation: message.conversation._id || message.conversation.id || message.conversation,
      content: message.content,
      type: message.type,
      status: message.status,
      image: message.image,
      metadata: message.metadata,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    };
  }

  // Helper method to broadcast user status
  private broadcastUserStatus(userId: string, isOnline: boolean) {
    try {
      // This could be expanded to notify friends/contacts
      this.server.emit('userStatus', {
        userId,
        isOnline,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error(`Error broadcasting user status:`, error.stack);
    }
  }

  // Method to get connected users (for admin/debugging)
  getConnectedUsers(): Array<{ userId: string; socketCount: number }> {
    const result: Array<{ userId: string; socketCount: number }> = [];
    for (const [userId, sockets] of this.connectedUsers.entries()) {
      result.push({ userId, socketCount: sockets.size });
    }
    return result;
  }

  // Method to send message to specific user (programmatically)
  async sendToUser(userId: string, event: string, data: any): Promise<boolean> {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets && userSockets.size > 0) {
      this.server.to(`user:${userId}`).emit(event, data);
      return true;
    }
    return false;
  }
}