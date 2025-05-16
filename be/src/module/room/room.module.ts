// modules/room/room.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { RoomController } from './controllers/room.controller';
import { RoomService } from './services/room.service';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomAccessGuard } from './guards/room-access.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
    ConfigModule,
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomAccessGuard],
  exports: [RoomService],
})
export class RoomModule {}