import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
  } from '@nestjs/websockets';
  import { Logger, UseGuards } from '@nestjs/common';
  import { Server, Socket } from 'socket.io';
  import { ConfigService } from '@nestjs/config';
  import { JwtService } from '@nestjs/jwt';
  import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard';
  
  @WebSocketGateway({
    namespace: 'streaming',
    cors: {
      origin: '*',
    },
  })
  export class StreamingGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
  {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger(StreamingGateway.name);
  
    constructor(
      private configService: ConfigService,
      private jwtService: JwtService,
    ) {}
  
    afterInit(server: Server) {
      this.logger.log('Streaming WebSocket Gateway initialized');
    }
  
    handleConnection(client: Socket) {
      this.logger.log(`Client connected: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`Client disconnected: ${client.id}`);
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, roomId: string) {
      client.join(roomId);
      this.logger.log(`Client ${client.id} joined room: ${roomId}`);
      return { event: 'joinedRoom', data: { roomId } };
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(client: Socket, roomId: string) {
      client.leave(roomId);
      this.logger.log(`Client ${client.id} left room: ${roomId}`);
      return { event: 'leftRoom', data: { roomId } };
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('sendMessage')
    handleMessage(client: Socket, payload: { roomId: string; message: string }) {
      this.server.to(payload.roomId).emit('newMessage', {
        sender: client.data.user,
        message: payload.message,
        timestamp: new Date(),
      });
      return { event: 'messageSent', data: payload };
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('sendGift')
    handleGift(
      client: Socket,
      payload: { roomId: string; giftId: string; amount: number },
    ) {
      this.server.to(payload.roomId).emit('newGift', {
        sender: client.data.user,
        giftId: payload.giftId,
        amount: payload.amount,
        timestamp: new Date(),
      });
      return { event: 'giftSent', data: payload };
    }
  }
  