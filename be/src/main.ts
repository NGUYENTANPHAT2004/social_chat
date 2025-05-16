import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import * as compression from 'compression';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { MediaServerService } from './module/streaming/services/media-server.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  // Configure Winston logger
  const logger = WinstonModule.createLogger({
    transports: [
      new transports.Console({
        format: format.combine(
          format.timestamp(),
          format.colorize(),
          format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
          }),
        ),
      }),
      new transports.File({
        filename: 'logs/app.log',
        format: format.combine(
          format.timestamp(),
          format.json(),
        ),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
    ],
  });

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Get config service
  const configService = app.get(ConfigService);

  // Initialize media server for streaming
  const mediaServerService = app.get(MediaServerService);
  mediaServerService.initializeMediaServer();

  // Apply global middlewares
  app.use(helmet());
  app.use(compression());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Configure CORS
  app.enableCors(configService.get('server.cors'));

  // Configure Swagger API documentation
  if (configService.get('environment') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Entertainment Platform API')
      .setDescription('API documentation for the Entertainment Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start server
  const port = configService.get('server.port');
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}
bootstrap();