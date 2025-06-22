// be/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    });
    return server;
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Get services
  const configService = app.get(ConfigService);
  
  // Add Socket.IO adapter with CORS
  app.useWebSocketAdapter(new SocketIoAdapter(app));

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS configuration
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // Security
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disable for development
  }));
  
  // Compression
  app.use(compression());

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global exception filter - only if exists
  try {
    const AllExceptionsFilter = require('./common/filters/all-exceptions.filter').AllExceptionsFilter;
    app.useGlobalFilters(new AllExceptionsFilter(configService));
  } catch (error) {
    logger.warn('AllExceptionsFilter not found, skipping');
  }

  // Swagger documentation
  if (configService.get('app.env') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Entertainment Platform API')
      .setDescription('API documentation for entertainment platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`📚 Swagger docs available at: http://localhost:${configService.get('app.port', 5000)}/api/docs`);
  }

  const port = configService.get('app.port', 5000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`🔌 WebSocket server ready for connections on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Error starting application:', error);
  process.exit(1);
});