import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
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
import contentConfig from './config/content.config';
import notificationsConfig from './config/notifications.config';
import gamesConfig from './config/games.config';
import securityConfig from './config/security.config';

// Modules
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { RoomModule } from './modules/room/room.module';
import { PostModule } from './modules/post/post.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { GiftModule } from './modules/gift/gift.module';
import { GameModule } from './modules/game/game.module';
import { MessageModule } from './modules/message/message.module';
import { ReportModule } from './modules/report/report.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
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
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('server.rateLimits.windowMs') / 1000,
        limit: configService.get('server.rateLimits.max'),
      }),
    }),

    // Schedule tasks
    ScheduleModule.forRoot(),

    // Serve static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),

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
})
export class AppModule {}