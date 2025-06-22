// be/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { MediaServerService } from './module/streaming/services/media-server.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Get services
  const configService = app.get(ConfigService);
  
  // Add Socket.IO adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS with WebSocket support
  app.enableCors({
    origin: configService.get('app.corsOrigin', ['http://localhost:3000', 'http://127.0.0.1:3000']),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // Security
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
  }));
  
  // Compression
  app.use(compression());

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(configService));

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
  }

  // Start media server
  // try {
  //   const mediaServerService = app.get(MediaServerService, { strict: false });
  //   if (mediaServerService && typeof mediaServerService.initializeMediaServer === 'function') {
  //     await mediaServerService.initializeMediaServer();
  //     logger.log('Media server initialized successfully');
  //   }
  // } catch (error) {
  //   logger.warn('Media server not available or failed to initialize:', error.message);
  // }

  const port = configService.get('app.port', 5000);
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
  logger.log(`🔌 WebSocket server ready for connections`);
}

bootstrap().catch((error) => {
  console.error('❌ Error starting application:', error);
  process.exit(1);
});