// modules/room/guards/room-access.guard.ts
import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { RoomService } from '../services/room.service';

@Injectable()
export class RoomAccessGuard implements CanActivate {
  constructor(private readonly roomService: RoomService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const roomId = request.params.id;
    const userId = request.user.id;

    if (!roomId || !userId) {
      return false;
    }

    // Kiểm tra xem người dùng có phải chủ phòng không
    const isOwner = await this.roomService.isRoomOwner(roomId, userId);

    return isOwner;
  }
}