// be/src/main.ts - FIXED

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ServerOptions } from 'socket.io';

// Enhanced Socket.IO adapter with better CORS and error handling
class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const corsOptions = {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['authorization', 'Authorization', 'x-auth-token'],
    };

    const serverOptions: Partial<ServerOptions> = {
      ...options,
      cors: corsOptions,
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e6, // 1MB
      allowRequest: (req, callback) => {
        // Additional origin validation if needed
        const origin = req.headers.origin;
        console.log('WebSocket connection request from origin:', origin);
        callback(null, true);
      },
    };

    console.log('🔌 Creating Socket.IO server with options:', {
      port,
      cors: corsOptions,
      transports: serverOptions.transports,
    });

    const server = super.createIOServer(port, serverOptions);
    
    // Add global error handling for socket server
    server.on('connection_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });

    server.on('error', (error) => {
      console.error('❌ Socket.IO server error:', error);
    });

    // Add connection logging
    server.on('connection', (socket) => {
      console.log(`✅ New socket connection: ${socket.id}`);
      
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
      });

      socket.on('disconnect', (reason) => {
        console.log(`❌ Socket disconnected: ${socket.id}, reason: ${reason}`);
      });
    });

    return server;
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    // Create app
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });
    
    // Get services
    const configService = app.get(ConfigService);
    
    // Add Socket.IO adapter with enhanced configuration
    app.useWebSocketAdapter(new SocketIoAdapter(app));

    // Global prefix for REST API
    app.setGlobalPrefix('api');

    // Enhanced CORS configuration
    const corsOptions = {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Request-ID',
        'x-auth-token',
        'Cache-Control',
        'Pragma',
      ],
      exposedHeaders: ['X-Request-ID'],
      maxAge: 86400, // 24 hours
    };

    app.enableCors(corsOptions);
    logger.log('✅ CORS enabled with origins:', corsOptions.origin);

    // Security middleware with adjusted settings for development
    app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false, // Disable for development
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    
    // Compression
    app.use(compression());

    // Global validation pipe with enhanced error handling
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => {
          return {
            property: error.property,
            value: error.value,
            constraints: error.constraints,
          };
        });
        logger.error('Validation errors:', messages);
        return new Error(`Validation failed: ${JSON.stringify(messages)}`);
      },
    }));

    // Global exception filter - with better error handling
    try {
      const { AllExceptionsFilter } = await import('./common/filters/all-exceptions.filter');
      app.useGlobalFilters(new AllExceptionsFilter(configService));
      logger.log('✅ Global exception filter enabled');
    } catch (error) {
      logger.warn('⚠️ AllExceptionsFilter not found, using default error handling');
    }

    // Request logging middleware (development only)
    if (configService.get('app.env') !== 'production') {
      app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
          const duration = Date.now() - start;
          const { method, url } = req;
          const { statusCode } = res;
          
          if (method !== 'OPTIONS' && !url.includes('/health')) {
            logger.debug(`${method} ${url} ${statusCode} - ${duration}ms`);
          }
        });
        next();
      });
    }

    // Health check endpoint
    app.use('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: configService.get('app.env'),
      });
    });

    // Swagger documentation
    const env = configService.get('app.env', 'development');
    if (env !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Entertainment Platform API')
        .setDescription('API documentation for entertainment platform with real-time messaging')
        .setVersion('1.0')
        .addBearerAuth({
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        })
        .addTag('auth', 'Authentication endpoints')
        .addTag('users', 'User management')
        .addTag('messages', 'Real-time messaging')
        .addServer(`http://localhost:${configService.get('app.port', 5000)}`, 'Development server')
        .build();
        
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
      });
      
      logger.log(`📚 Swagger docs available at: http://localhost:${configService.get('app.port', 5000)}/api/docs`);
    }

    // Get port from config
    const port = configService.get('app.port', 5000);

    // Start server
    await app.listen(port, '0.0.0.0');

    // Success logging
    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`🔌 WebSocket server ready for connections`);
    logger.log(`📡 API endpoints available at: http://localhost:${port}/api`);
    logger.log(`💾 Environment: ${env}`);

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.log('🛑 SIGTERM received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.log('🛑 SIGINT received, shutting down gracefully...');
      await app.close();
      process.exit(0);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});