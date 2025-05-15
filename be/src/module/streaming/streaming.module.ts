import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { StreamingController } from './controllers/streaming.controller';
import { StreamingService } from './services/streaming.service';
import { RtmpServerService } from './services/rtmp-server.service';
import { Stream, StreamSchema } from './schemas/stream.schema';
import { AuthModule } from '../auth/auth.module';
import { StreamingGateway } from './gateways/streaming.gateway';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Stream.name, schema: StreamSchema }]),
    ConfigModule,
    AuthModule,
    UserModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [StreamingController],
  providers: [StreamingService, RtmpServerService,StreamingGateway],
  exports: [StreamingService],
})