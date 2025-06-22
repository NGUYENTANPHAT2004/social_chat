// be/src/module/auth/guards/ws-jwt.guard.ts
import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client: Socket = context.switchToWs().getClient();
      
      // Get token from multiple sources
      const token = this.extractToken(client);
      
      if (!token) {
        this.logger.warn('No token found in WebSocket request');
        throw new WsException('No authentication token provided');
      }

      // Verify the token
      const payload = this.jwtService.verify(token);
      
      if (!payload) {
        this.logger.warn('Invalid token payload');
        throw new WsException('Invalid token');
      }

      // Store user data in client
      client.data.user = payload;
      client.data.userId = payload.sub || payload.id;
      
      this.logger.log(`WebSocket authentication successful for user: ${client.data.userId}`);
      return true;
      
    } catch (err) {
      this.logger.error('WebSocket authentication failed:', err.message);
      
      if (err instanceof WsException) {
        throw err;
      }
      
      // Handle JWT specific errors
      if (err.name === 'JsonWebTokenError') {
        throw new WsException('Invalid token format');
      } else if (err.name === 'TokenExpiredError') {
        throw new WsException('Token expired');
      } else if (err.name === 'NotBeforeError') {
        throw new WsException('Token not active');
      }
      
      throw new WsException('Authentication failed');
    }
  }

  private extractToken(client: Socket): string | null {
    // Try multiple ways to get the token
    
    // 1. From auth object (socket.io specific)
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }
    
    // 2. From authorization header in handshake
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return authHeader;
    }
    
    // 3. From query parameters
    if (client.handshake.query?.token) {
      return Array.isArray(client.handshake.query.token) 
        ? client.handshake.query.token[0] 
        : client.handshake.query.token;
    }
    
    // 4. From request headers (fallback)
    const reqAuthHeader = client.request?.headers?.authorization;
    if (reqAuthHeader) {
      if (reqAuthHeader.startsWith('Bearer ')) {
        return reqAuthHeader.substring(7);
      }
      return reqAuthHeader;
    }
    
    return null;
  }
}