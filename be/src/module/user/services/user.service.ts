// modules/user/services/user.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus, UserRole } from '../schemas/user.schema';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    
    return this.sanitizeUser(user);
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username });
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    
    return this.sanitizeUser(user);
  }

  async getUsers(
    filter: any = {},
    options = { page: 1, limit: 10 },
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password -refreshTokens'),
      this.userModel.countDocuments(filter),
    ]);
    
    return {
      users,
      total,
      page,
      limit,
    };
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    
    // Cập nhật các trường được phép
    if (updateUserDto.username) {
      // Kiểm tra username đã tồn tại chưa
      const existingUser = await this.userModel.findOne({ 
        username: updateUserDto.username,
        _id: { $ne: id },
      });
      
      if (existingUser) {
        throw new BadRequestException('Tên người dùng đã tồn tại');
      }
      
      user.username = updateUserDto.username;
    }
    
    if (updateUserDto.email) {
      // Kiểm tra email đã tồn tại chưa
      const existingUser = await this.userModel.findOne({ 
        email: updateUserDto.email,
        _id: { $ne: id },
      });
      
      if (existingUser) {
        throw new BadRequestException('Email đã tồn tại');
      }
      
      user.email = updateUserDto.email;
    }
    
    if (updateUserDto.avatar) {
      user.avatar = updateUserDto.avatar;
    }
    
    if (updateUserDto.status) {
      user.status = updateUserDto.status;
    }
    
    if (updateUserDto.settings) {
      user.settings = {
        ...user.settings,
        ...updateUserDto.settings,
      };
    }
    
    await user.save();
    
    return this.sanitizeUser(user);
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    
    // Cập nhật các trường profile
    user.profile = {
      ...user.profile,
      displayName: updateProfileDto.displayName || user.profile.displayName,
      bio: updateProfileDto.bio || user.profile.bio,
      location: updateProfileDto.location || user.profile.location,
      birthdate: updateProfileDto.birthdate ? new Date(updateProfileDto.birthdate) : user.profile.birthdate,
    };
    
    await user.save();
    
    return this.sanitizeUser(user);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<User> {
    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    
    user.avatar = avatarUrl;
    await user.save();
    
    return this.sanitizeUser(user);
  }

  async updateSettings(id: string, settings: Record<string, any>): Promise<User> {
    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    
    user.settings = {
      ...user.settings,
      ...settings,
    };
    
    await user.save();
    
    return this.sanitizeUser(user);
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    
    // Thay vì xóa, chuyển trạng thái thành BANNED
    user.status = UserStatus.BANNED;
    await user.save();
    
    return { success: true, message: 'Người dùng đã bị vô hiệu hóa' };
  }

  async banUser(id: string, reason: string): Promise<User> {
    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Không thể khóa tài khoản Admin');
    }
    
    user.status = UserStatus.BANNED;
    await user.save();
    
    // Trong thực tế, nên lưu lại lý do khóa và quản trị viên thực hiện khóa
    
    return this.sanitizeUser(user);
  }

  async unbanUser(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    
    user.status = UserStatus.ACTIVE;
    await user.save();
    
    return this.sanitizeUser(user);
  }

  async getUserFollowers(
    userId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ followers: User[]; total: number; page: number; limit: number }> {
    // Trong thực tế, bạn sẽ cần một mô hình riêng cho Follow
    // Đây là mẫu giả định
    
    return {
      followers: [],
      total: 0,
      page: options.page,
      limit: options.limit,
    };
  }

  async getUserFollowing(
    userId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ following: User[]; total: number; page: number; limit: number }> {
    // Trong thực tế, bạn sẽ cần một mô hình riêng cho Follow
    // Đây là mẫu giả định
    
    return {
      following: [],
      total: 0,
      page: options.page,
      limit: options.limit,
    };
  }

  async followUser(targetId: string, followerId: string): Promise<{ success: boolean }> {
    // Trong thực tế, bạn sẽ cần một mô hình riêng cho Follow
    // Đây là mẫu giả định
    
    return { success: true };
  }

  async unfollowUser(targetId: string, followerId: string): Promise<{ success: boolean }> {
    // Trong thực tế, bạn sẽ cần một mô hình riêng cho Follow
    // Đây là mẫu giả định
    
    return { success: true };
  }

  private sanitizeUser(user: any): User {
    const sanitized = user.toObject ? user.toObject() : user;
    delete sanitized.password;
    delete sanitized.refreshTokens;
    return sanitized;
  }
}