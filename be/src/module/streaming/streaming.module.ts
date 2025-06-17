
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';

import { StreamingController } from './controller/streaming.controller';
import { StreamingService } from './services/streaming.service';
import { MediaServerService } from './services/media-server.service';
// Remove RtmpServerService to avoid duplicate
import { Stream, StreamSchema } from './schemas/stream.schema';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { StreamingGateway } from './gateways/streaming.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Stream.name, schema: StreamSchema }]),
    ConfigModule,
    AuthModule,
    UserModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('auth.jwt.secret') || 'fallback-secret',
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [StreamingController],
  providers: [
    StreamingService,
    // Only use MediaServerService (combines RTMP + HTTP)
    MediaServerService,
    StreamingGateway,
  ],
  exports: [StreamingService, MediaServerService],
})
export class StreamingModule {}