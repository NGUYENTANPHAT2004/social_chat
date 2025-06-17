// modules/room/services/room.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Room, RoomDocument, RoomType, RoomStatus } from '../schemas/room.schema';
import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
  ) {}

  async createRoom(createRoomDto: CreateRoomDto, userId: string): Promise<Room> {
    // Mã hóa mật khẩu nếu có
    if (createRoomDto.type === RoomType.PRIVATE && createRoomDto.password) {
      const hashedPassword = await bcrypt.hash(createRoomDto.password, 10);
      createRoomDto.password = hashedPassword;
    }

    const newRoom = new this.roomModel({
      ...createRoomDto,
      owner: userId,
      members: [userId], // Tự động thêm người tạo là thành viên
      status: RoomStatus.ACTIVE,
      isLive: false,
    });

    return newRoom.save();
  }

  async getRooms(
    filter: any = {},
    options = { page: 1, limit: 10 },
  ): Promise<{ rooms: Room[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    // Mặc định chỉ hiển thị phòng active
    if (!filter.status) {
      filter.status = RoomStatus.ACTIVE;
    }
    
    const [rooms, total] = await Promise.all([
      this.roomModel
        .find(filter)
        .sort({ isLive: -1, currentViewers: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'username avatar'),
      this.roomModel.countDocuments(filter),
    ]);
    
    return {
      rooms,
      total,
      page,
      limit,
    };
  }

  async getTrendingRooms(limit: number = 10): Promise<Room[]> {
    // Lấy các phòng đang live và có nhiều người xem nhất
    return this.roomModel
      .find({ status: RoomStatus.ACTIVE, isLive: true })
      .sort({ currentViewers: -1, totalKC: -1 })
      .limit(limit)
      .populate('owner', 'username avatar');
  }

  async getRoomById(id: string): Promise<Room> {
    const room = await this.roomModel.findById(id)
      .populate('owner', 'username avatar');
    
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    
    return room;
  }

  async updateRoom(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    // Mã hóa mật khẩu nếu được cập nhật
    if (updateRoomDto.password) {
      updateRoomDto.password = await bcrypt.hash(updateRoomDto.password, 10);
    }

    const updatedRoom = await this.roomModel.findByIdAndUpdate(
      id,
      { $set: updateRoomDto },
      { new: true },
    );

    if (!updatedRoom) {
      throw new NotFoundException('Không tìm thấy phòng');
    }

    return updatedRoom;
  }

  async deleteRoom(id: string): Promise<{ success: boolean; message: string }> {
    const result = await this.roomModel.findByIdAndDelete(id);
    
    if (!result) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    
    return { success: true, message: 'Phòng đã được xóa thành công' };
  }

  async joinRoom(roomId: string, userId: string, password?: string): Promise<{ success: boolean; message: string }> {
    const room = await this.roomModel.findById(roomId);
    
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    
    if (room.status !== RoomStatus.ACTIVE) {
      throw new BadRequestException('Phòng đã bị khóa hoặc không hoạt động');
    }
    
    // Kiểm tra mật khẩu nếu là phòng riêng tư
    if (room.type === RoomType.PRIVATE) {
      if (!password) {
        throw new BadRequestException('Phòng này yêu cầu mật khẩu');
      }
      
      const isPasswordValid = await bcrypt.compare(password, room.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Mật khẩu không đúng');
      }
    }
    
    // Kiểm tra nếu đã là thành viên
    if (room.members.some(member => member.toString() === userId)) {
      return { success: true, message: 'Bạn đã là thành viên của phòng này' };
    }
    
    // Thêm vào danh sách thành viên
    await this.roomModel.findByIdAndUpdate(
      roomId,
      { $addToSet: { members: userId } },
    );
    
    return { success: true, message: 'Tham gia phòng thành công' };
  }

  async leaveRoom(roomId: string, userId: string): Promise<{ success: boolean; message: string }> {
    const room = await this.roomModel.findById(roomId);
    
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    
    // Kiểm tra nếu là chủ phòng
    if (room.owner.toString() === userId) {
      throw new BadRequestException('Bạn không thể rời phòng vì bạn là chủ phòng');
    }
    
    // Kiểm tra nếu là thành viên
    if (!room.members.some(member => member.toString() === userId)) {
      return { success: true, message: 'Bạn không phải là thành viên của phòng này' };
    }
    
    // Xóa khỏi danh sách thành viên
    await this.roomModel.findByIdAndUpdate(
      roomId,
      { $pull: { members: userId } },
    );
    
    return { success: true, message: 'Rời phòng thành công' };
  }

  async followRoom(roomId: string, userId: string): Promise<{ success: boolean; followers: number }> {
    const room = await this.roomModel.findById(roomId);
    
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    
    // Tăng số lượng người theo dõi
    const updatedRoom = await this.roomModel.findByIdAndUpdate(
      roomId,
      { $inc: { followers: 1 } },
      { new: true },
    );
    
    return { success: true, followers: updatedRoom.followers };
  }

  async unfollowRoom(roomId: string, userId: string): Promise<{ success: boolean; followers: number }> {
    const room = await this.roomModel.findById(roomId);
    
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    
    // Giảm số lượng người theo dõi, nhưng không để âm
    const updatedRoom = await this.roomModel.findByIdAndUpdate(
      roomId,
      { $inc: { followers: -1 } },
      { new: true },
    );
    
    if (updatedRoom.followers < 0) {
      updatedRoom.followers = 0;
      await updatedRoom.save();
    }
    
    return { success: true, followers: updatedRoom.followers };
  }

  async getRoomMembers(
    roomId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ members: any[]; total: number; page: number; limit: number }> {
    const room = await this.roomModel.findById(roomId);
    
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    // Lấy thông tin chi tiết của members từ collection User
    // Giả định rằng chúng ta có một populateMembers để lấy thông tin
    const total = room.members.length;
    const slicedMembers = room.members.slice(skip, skip + limit);
    
    // Trong thực tế, bạn sẽ thực hiện truy vấn từ User collection
    const members = await Promise.all(
      slicedMembers.map(async (memberId) => {
        // Giả định có một phương thức getUserById
        // const user = await this.userService.getUserById(memberId);
        // return user;
        
        // Giả lập kết quả
        return {
          id: memberId,
          username: `user_${memberId.toString().substr(-4)}`,
          avatar: '',
        };
      }),
    );
    
    return { members, total, page, limit };
  }

  async startStream(roomId: string): Promise<Room> {
    const room = await this.roomModel.findById(roomId);
    
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    
    if (room.isLive) {
      throw new BadRequestException('Phòng đã đang phát trực tiếp');
    }
    
    room.isLive = true;
    room.lastStreamStartTime = new Date();
    
    return room.save();
  }

  async endStream(roomId: string): Promise<Room> {
    const room = await this.roomModel.findById(roomId);
    
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    
    if (!room.isLive) {
      throw new BadRequestException('Phòng chưa đang phát trực tiếp');
    }
    
    room.isLive = false;
    room.currentViewers = 0;
    
    return room.save();
  }

  async isRoomOwner(roomId: string, userId: string): Promise<boolean> {
    const room = await this.roomModel.findById(roomId);
    
    if (!room) {
      throw new NotFoundException('Không tìm thấy phòng');
    }
    
    return room.owner.toString() === userId;
  }
}