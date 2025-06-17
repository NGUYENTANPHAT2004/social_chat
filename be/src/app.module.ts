// be/src/app.module.ts
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Configuration
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import storageConfig from './config/storage.config';
import mediaConfig from './config/media.config';
import streamingConfig from './config/streaming.config';
import paymentsConfig from './config/payments.config';
import notificationsConfig from './config/notifications.config';
import gamesConfig from './config/games.config';
import securityConfig from './config/security.config';
import contentConfig from './config/content.config';

// Modules
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { RoomModule } from './module/room/room.module';
import { PostModule } from './module/post/post.module';
import { TransactionModule } from './module/transaction/transaction.module';
import { GiftModule } from './module/gift/gift.module';
import { GameModule } from './module/game/game.module';
import { MessageModule } from './module/message/message.module';
import { ReportModule } from './module/report/report.module';
import { StreamingModule } from './module/streaming/streaming.module';
import { ModerationModule } from './module/moderation/moderation.module';
import { NotificationModule } from './module/notification/notification.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        storageConfig,
        mediaConfig,
        streamingConfig,
        paymentsConfig,
        contentConfig,
        notificationsConfig,
        gamesConfig,
        securityConfig,
      ],
    }),

    // Database
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.mongodb.uri'),
        ...configService.get('database.mongodb.options'),
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [{
          ttl: configService.get('server.rateLimits.windowMs', 60000) / 1000,
          limit: configService.get('server.rateLimits.max', 100),
        }],
      }),
    }),

    // Schedule tasks
    ScheduleModule.forRoot(),

    // Serve static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),

    // Shared module
    SharedModule,

    // Feature modules
    AuthModule,
    UserModule,
    RoomModule,
    PostModule,
    TransactionModule,
    GiftModule,
    GameModule,
    MessageModule,
    ReportModule,
    StreamingModule,
    ModerationModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'LoggerService',
      useClass: Logger,
    },
  ],
})
export class AppModule {}