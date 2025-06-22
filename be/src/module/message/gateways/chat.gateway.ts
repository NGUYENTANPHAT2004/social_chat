// modules/message/gateways/chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard';
import { MessageService } from '../services/message.service';
import { SendMessageDto } from '../dto/send-message.dto';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`New connection attempt: ${client.id}`);
      
      // Get token from different possible locations
      const token = client.handshake.auth.token || 
                   client.handshake.headers.authorization?.replace('Bearer ', '') ||
                   client.request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`No token provided for client ${client.id}`);
        client.emit('error', { message: 'No authentication token provided' });
        client.disconnect(true);
        return;
      }

      // Verify token
      let payload;
      try {
        payload = this.jwtService.verify(token);
      } catch (error) {
        this.logger.warn(`Invalid token for client ${client.id}: ${error.message}`);
        client.emit('error', { message: 'Invalid authentication token' });
        client.disconnect(true);
        return;
      }

      const userId = payload.sub || payload.id;
      if (!userId) {
        this.logger.warn(`No user ID in token for client ${client.id}`);
        client.emit('error', { message: 'Invalid token payload' });
        client.disconnect(true);
        return;
      }

      // Store connection info
      this.connectedUsers.set(userId, client.id);
      client.data.userId = userId;
      client.data.user = payload;

      // Join user room
      await client.join(`user:${userId}`);

      // Emit successful connection
      client.emit('connected', { 
        userId, 
        message: 'Connected successfully',
        timestamp: new Date().toISOString()
      });

      this.logger.log(`Client connected successfully: ${client.id} (User: ${userId})`);
      
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.emit('error', { 
        message: 'Connection failed', 
        error: error.message 
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    try {
      if (client.data.userId) {
        this.connectedUsers.delete(client.data.userId);
        this.logger.log(`Client disconnected: ${client.id} (User: ${client.data.userId})`);
      } else {
        this.logger.log(`Client disconnected: ${client.id} (No user data)`);
      }
    } catch (error) {
      this.logger.error(`Disconnect error for client ${client.id}:`, error);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      this.logger.log(`Sending message from user ${userId} to ${payload.recipientId}`);
      
      // Save message to database
      const message = await this.messageService.sendMessage(payload, userId);
      
      // Send message to recipient if online
      const recipientSocketId = this.connectedUsers.get(payload.recipientId);
      if (recipientSocketId) {
        this.server.to(`user:${payload.recipientId}`).emit('newMessage', { message });
        this.logger.log(`Message delivered to online recipient: ${payload.recipientId}`);
      } else {
        this.logger.log(`Recipient ${payload.recipientId} is offline`);
      }
      
      // Send confirmation to sender
      client.emit('messageDelivered', { message });
      
      return { success: true, message };
      
    } catch (error) {
      this.logger.error(`Error sending message from ${client.data.userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string }
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { conversationId } = data;
      
      // Mark messages as read in database
      const result = await this.messageService.markConversationAsRead(conversationId, userId);
      
      // Get conversation to notify other participants
      const conversation = await this.messageService.getConversationById(conversationId);
      const otherParticipants = conversation.participants
        .filter(p => p.toString() !== userId);
      
      // Notify other participants
      for (const participantId of otherParticipants) {
        this.server.to(`user:${participantId}`).emit('messagesRead', {
          conversationId,
          readBy: userId,
          timestamp: new Date().toISOString(),
        });
      }
      
      return { success: true, result };
      
    } catch (error) {
      this.logger.error(`Error marking messages as read:`, error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean }
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      const { conversationId, isTyping } = data;
      
      // Get conversation participants
      const conversation = await this.messageService.getConversationById(conversationId);
      const otherParticipants = conversation.participants
        .filter(p => p.toString() !== userId);
      
      // Send typing indicator to other participants
      for (const participantId of otherParticipants) {
        this.server.to(`user:${participantId}`).emit('userTyping', {
          conversationId,
          userId,
          isTyping,
          timestamp: new Date().toISOString(),
        });
      }
      
      return { success: true };
      
    } catch (error) {
      this.logger.error(`Error in typing event:`, error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      await client.join(data.roomId);
      this.logger.log(`User ${userId} joined room ${data.roomId}`);
      
      return { success: true, roomId: data.roomId };
      
    } catch (error) {
      this.logger.error(`Error joining room:`, error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leave')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      await client.leave(data.roomId);
      this.logger.log(`User ${userId} left room ${data.roomId}`);
      
      return { success: true, roomId: data.roomId };
      
    } catch (error) {
      this.logger.error(`Error leaving room:`, error);
      return { success: false, error: error.message };
    }
  }

  // Health check endpoint
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { 
      timestamp: new Date().toISOString(),
      userId: client.data.userId 
    });
    return { success: true, message: 'pong' };
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get online users
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Send message to specific user
  sendToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(`user:${userId}`).emit(event, data);
      return true;
    }
    return false;
  }

  // Broadcast to all connected users
  broadcast(event: string, data: any): void {
    this.server.emit(event, data);
  }
}