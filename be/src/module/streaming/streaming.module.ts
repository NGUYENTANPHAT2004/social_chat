import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Room, RoomSchema } from '../room/schemas/room.schema';
import { User, UserSchema } from '../user/schemas/user.schema';

import { StreamingController } from './controllers/streaming.controller';
import { StreamingService } from './services/streaming.service';
import { MediaServerService } from './services/media-server.service';
import { StreamingGateway } from './gateways/streaming.gateway';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [StreamingController],
  providers: [StreamingService, MediaServerService, StreamingGateway],
  exports: [StreamingService, MediaServerService],
})
export class StreamingModule {}