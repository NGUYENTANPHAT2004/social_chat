// modules/message/gateways/chat.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
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
      origin: '*',
    },
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
        // Xác thực token
        const token = client.handshake.auth.token;
        if (!token) {
          client.disconnect();
          return;
        }
  
        const payload = this.jwtService.verify(token);
        const userId = payload.sub;
  
        // Lưu thông tin kết nối
        this.connectedUsers.set(userId, client.id);
        client.data.userId = userId;
  
        // Tham gia room của user
        client.join(`user:${userId}`);
  
        this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
      } catch (error) {
        this.logger.error(`Connection error: ${error.message}`);
        client.disconnect();
      }
    }
  
    handleDisconnect(client: Socket) {
      if (client.data.userId) {
        this.connectedUsers.delete(client.data.userId);
      }
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('sendMessage')
    async handleSendMessage(client: Socket, payload: SendMessageDto) {
      try {
        const userId = client.data.userId;
        
        // Lưu tin nhắn vào DB
        const message = await this.messageService.sendMessage(payload, userId);
        
        // Gửi tin nhắn đến người nhận (nếu online)
        this.server.to(`user:${payload.recipientId}`).emit('newMessage', message);
        
        return { success: true, message };
      } catch (error) {
        this.logger.error(`Error sending message: ${error.message}`);
        return { success: false, error: error.message };
      }
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(client: Socket, { conversationId }: { conversationId: string }) {
      try {
        const userId = client.data.userId;
        
        // Đánh dấu đã đọc trong DB
        const result = await this.messageService.markConversationAsRead(conversationId, userId);
        
        // Thông báo cho người gửi biết tin nhắn đã được đọc
        const conversation = await this.messageService.getConversationById(conversationId);
        const otherParticipants = conversation.participants
          .filter(p => p.toString() !== userId);
        
        for (const participantId of otherParticipants) {
          this.server.to(`user:${participantId}`).emit('messagesRead', {
            conversationId,
            readBy: userId,
          });
        }
        
        return { success: true, result };
      } catch (error) {
        this.logger.error(`Error marking as read: ${error.message}`);
        return { success: false, error: error.message };
      }
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('typing')
    async handleTyping(client: Socket, { conversationId, isTyping }: { conversationId: string; isTyping: boolean }) {
      try {
        const userId = client.data.userId;
        
        // Lấy thông tin cuộc trò chuyện
        const conversation = await this.messageService.getConversationById(conversationId);
        const otherParticipants = conversation.participants
          .filter(p => p.toString() !== userId);
        
        // Gửi thông báo đến các thành viên khác
        for (const participantId of otherParticipants) {
          this.server.to(`user:${participantId}`).emit('userTyping', {
            conversationId,
            userId,
            isTyping,
          });
        }
        
        return { success: true };
      } catch (error) {
        this.logger.error(`Error in typing event: ${error.message}`);
        return { success: false, error: error.message };
      }
    }
  }