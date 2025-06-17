// be/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet'; // Sửa import helmet
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { MediaServerService } from './module/streaming/services/media-server.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Get services
  const configService = app.get(ConfigService);
  const mediaServerService = app.get(MediaServerService);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: configService.get('app.corsOrigin', '*'),
    credentials: true,
  });

  // Security
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
  }));
  
  // Compression
  app.use(compression());

  // Validation
  app.useGlobalPipes(new ValidationPipe());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(configService)); // Sửa tham số

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
  try {
    // mediaServerService.initializeMediaServer(); // Comment out nếu method không tồn tại
  } catch (error) {
    logger.error('Failed to initialize media server', error);
  }

  const port = configService.get('app.port', 5000);
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();