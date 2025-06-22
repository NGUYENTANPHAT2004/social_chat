// be/src/module/auth/guards/ws-jwt.guard.ts - FIXED

import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client: Socket = context.switchToWs().getClient();
      
      // If user is already authenticated in this session, allow
      if (client.data?.userId && client.data?.user) {
        return true;
      }
      
      // Extract token from multiple sources
      const token = this.extractToken(client);
      
      if (!token) {
        this.logger.warn(`No token found for client: ${client.id}`);
        throw new WsException('No authentication token provided');
      }

      // Verify the token
      const jwtSecret = this.configService.get<string>('JWT_SECRET') || 
                       this.configService.get<string>('auth.jwt.secret');
      
      if (!jwtSecret) {
        this.logger.error('JWT secret not configured');
        throw new WsException('Authentication configuration error');
      }

      let payload: any;
      try {
        payload = this.jwtService.verify(token, { secret: jwtSecret });
      } catch (jwtError) {
        this.logger.warn(`Token verification failed for client ${client.id}: ${jwtError.message}`);
        
        // More specific error messages
        if (jwtError.name === 'TokenExpiredError') {
          throw new WsException('Token expired');
        } else if (jwtError.name === 'JsonWebTokenError') {
          throw new WsException('Invalid token format');
        } else if (jwtError.name === 'NotBeforeError') {
          throw new WsException('Token not active yet');
        } else {
          throw new WsException('Token verification failed');
        }
      }

      // Extract user ID from payload
      const userId = payload.sub || payload.id || payload.userId;
      if (!userId) {
        this.logger.warn(`No user ID found in token payload for client: ${client.id}`);
        throw new WsException('Invalid token payload - no user ID');
      }

      // Validate payload structure
      if (!payload.username && !payload.email) {
        this.logger.warn(`Incomplete user data in token for client: ${client.id}`);
        throw new WsException('Invalid token payload - incomplete user data');
      }

      // Store user data in client
      client.data.user = {
        id: userId,
        username: payload.username,
        email: payload.email,
        role: payload.role || 'user',
        ...payload
      };
      client.data.userId = userId;
      client.data.authenticated = true;
      client.data.authTime = new Date();
      
      this.logger.log(`WebSocket authentication successful for user: ${userId} (${payload.username})`);
      return true;
      
    } catch (err) {
      this.logger.error(`WebSocket authentication failed for client ${context.switchToWs().getClient().id}:`, err.message);
      
      // Clean up client data on auth failure
      const client = context.switchToWs().getClient();
      client.data = {};
      
      if (err instanceof WsException) {
        throw err;
      }
      
      // Handle other types of errors
      throw new WsException('Authentication failed');
    }
  }

  private extractToken(client: Socket): string | null {
    // Try multiple ways to get the token with better error handling
    
    try {
      // 1. From auth object (socket.io specific) - Most common
      if (client.handshake?.auth?.token) {
        const token = client.handshake.auth.token;
        if (typeof token === 'string' && token.trim()) {
          this.logger.debug(`Token extracted from auth object for client: ${client.id}`);
          return token.trim();
        }
      }
      
      // 2. From authorization header in handshake
      const authHeader = client.handshake?.headers?.authorization;
      if (authHeader && typeof authHeader === 'string') {
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7).trim();
          if (token) {
            this.logger.debug(`Token extracted from Authorization header for client: ${client.id}`);
            return token;
          }
        } else if (authHeader.trim()) {
          // Direct token without Bearer prefix
          this.logger.debug(`Token extracted from Authorization header (no Bearer) for client: ${client.id}`);
          return authHeader.trim();
        }
      }
      
      // 3. From query parameters
      const queryToken = client.handshake?.query?.token;
      if (queryToken) {
        const token = Array.isArray(queryToken) ? queryToken[0] : queryToken;
        if (typeof token === 'string' && token.trim()) {
          this.logger.debug(`Token extracted from query params for client: ${client.id}`);
          return token.trim();
        }
      }
      
      // 4. From extra headers (fallback)
      const extraAuthHeader = client.handshake?.headers?.['x-auth-token'];
      if (extraAuthHeader && typeof extraAuthHeader === 'string') {
        const token = Array.isArray(extraAuthHeader) ? extraAuthHeader[0] : extraAuthHeader;
        if (token && token.trim()) {
          this.logger.debug(`Token extracted from x-auth-token header for client: ${client.id}`);
          return token.trim();
        }
      }
      
    } catch (error) {
      this.logger.error(`Error extracting token for client ${client.id}:`, error.message);
    }
    
    this.logger.warn(`No valid token found for client: ${client.id}`);
    this.logTokenSources(client);
    return null;
  }

  private logTokenSources(client: Socket) {
    // Debug helper to log all possible token sources
    try {
      this.logger.debug(`Token sources for client ${client.id}:`, {
        auth: !!client.handshake?.auth?.token,
        authHeader: !!client.handshake?.headers?.authorization,
        queryToken: !!client.handshake?.query?.token,
        extraHeader: !!client.handshake?.headers?.['x-auth-token'],
        handshakeKeys: Object.keys(client.handshake || {}),
        authKeys: Object.keys(client.handshake?.auth || {}),
        queryKeys: Object.keys(client.handshake?.query || {}),
        headerKeys: Object.keys(client.handshake?.headers || {}).filter(k => k.toLowerCase().includes('auth')),
      });
    } catch (error) {
      this.logger.error('Error logging token sources:', error.message);
    }
  }

  /**
   * Helper method to validate if client is authenticated
   */
  static isAuthenticated(client: Socket): boolean {
    return !!(
      client.data?.authenticated &&
      client.data?.userId &&
      client.data?.user
    );
  }

  /**
   * Helper method to get authenticated user from client
   */
  static getAuthenticatedUser(client: Socket): any | null {
    if (this.isAuthenticated(client)) {
      return client.data.user;
    }
    return null;
  }

  /**
   * Helper method to get user ID from client
   */
  static getUserId(client: Socket): string | null {
    return client.data?.userId || null;
  }
}