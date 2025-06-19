// be/src/module/user/services/user.service.ts - Optimized
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserStatus, UserRole } from '../schemas/user.schema';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Basic CRUD operations
  async getUserById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
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
      users: users.map(user => this.sanitizeUser(user)),
      total,
      page,
      limit,
    };
  }

  // Update operations
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Check username uniqueness
    if (updateUserDto.username) {
      const existingUser = await this.userModel.findOne({ 
        username: updateUserDto.username,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new BadRequestException('Username already exists');
      }
      user.username = updateUserDto.username;
    }
    
    // Check email uniqueness
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({ 
        email: updateUserDto.email,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
      user.email = updateUserDto.email;
    }
    
    // Update other fields
    if (updateUserDto.avatar) user.avatar = updateUserDto.avatar;
    if (updateUserDto.status) user.status = updateUserDto.status;
    if (updateUserDto.settings) {
      user.settings = { ...user.settings, ...updateUserDto.settings };
    }
    
    await user.save();
    return this.sanitizeUser(user);
  }

  async updateProfile(id: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
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
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { avatar: avatarUrl },
      { new: true }
    );
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return this.sanitizeUser(user);
  }

  async updateSettings(id: string, settings: Record<string, any>): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { 'settings': settings } },
      { new: true }
    );
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return this.sanitizeUser(user);
  }

  async updateBalance(id: string, amount: number): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $inc: { kcBalance: amount } },
      { new: true }
    );
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return this.sanitizeUser(user);
  }

  // Device Token Management (Merged from DeviceTokenService)
  async addDeviceToken(userId: string, deviceToken: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $addToSet: { deviceTokens: deviceToken } }
    );
  }

  async removeDeviceToken(userId: string, deviceToken: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $pull: { deviceTokens: deviceToken } }
    );
  }

  async getUserDeviceTokens(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).select('deviceTokens');
    return user?.deviceTokens || [];
  }

  async updatePushSettings(userId: string, settings: any): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { pushSettings: settings } },
      { new: true }
    );
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return this.sanitizeUser(user);
  }

  // Follow/Unfollow operations
  async followUser(targetId: string, followerId: string): Promise<{ success: boolean }> {
    const [target, follower] = await Promise.all([
      this.userModel.findById(targetId),
      this.userModel.findById(followerId)
    ]);

    if (!target || !follower) {
      throw new NotFoundException('User not found');
    }

if (target.followers.some((id) => id.toString() === followerId.toString())) {
  throw new BadRequestException('Already following this user');
}
    await Promise.all([
      this.userModel.updateOne(
        { _id: targetId },
        { $addToSet: { followers: followerId } }
      ),
      this.userModel.updateOne(
        { _id: followerId },
        { $addToSet: { following: targetId } }
      )
    ]);

    return { success: true };
  }

  async unfollowUser(targetId: string, followerId: string): Promise<{ success: boolean }> {
    await Promise.all([
      this.userModel.updateOne(
        { _id: targetId },
        { $pull: { followers: followerId } }
      ),
      this.userModel.updateOne(
        { _id: followerId },
        { $pull: { following: targetId } }
      )
    ]);

    return { success: true };
  }

  async getUserFollowers(
    userId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ followers: any[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'followers',
        select: 'username avatar profile.displayName',
        options: { skip, limit }
      });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const total = user.followers.length;
    
    return {
      followers: user.followers,
      total,
      page,
      limit,
    };
  }

  async getUserFollowing(
    userId: string,
    options = { page: 1, limit: 10 },
  ): Promise<{ following: any[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'following',
        select: 'username avatar profile.displayName',
        options: { skip, limit }
      });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const total = user.following.length;
    
    return {
      following: user.following,
      total,
      page,
      limit,
    };
  }

  // Admin operations
  async banUser(id: string, reason?: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot ban admin user');
    }
    
    user.status = UserStatus.BANNED;
    await user.save();
    
    return this.sanitizeUser(user);
  }

  async unbanUser(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    user.status = UserStatus.ACTIVE;
    await user.save();
    
    return this.sanitizeUser(user);
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Soft delete by setting status to BANNED
    user.status = UserStatus.BANNED;
    await user.save();
    
    return { success: true, message: 'User has been deactivated' };
  }

  // Utility methods
  private sanitizeUser(user: any): User {
    const sanitized = user.toObject ? user.toObject() : user;
    delete sanitized.password;
    delete sanitized.refreshTokens;
    
    // Map _id to id for frontend compatibility
    if (sanitized._id) {
      sanitized.id = sanitized._id.toString();
      delete sanitized._id;
    }
    
    return sanitized;
  }

  async searchUsers(query: string, limit = 10): Promise<User[]> {
    const users = await this.userModel
      .find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { 'profile.displayName': { $regex: query, $options: 'i' } }
        ],
        status: UserStatus.ACTIVE
      })
      .limit(limit)
      .select('-password -refreshTokens');

    return users.map(user => this.sanitizeUser(user));
  }

  async getUserStats(userId: string): Promise<any> {
    // This would typically aggregate data from other collections
    // For now, return basic stats from user document
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      gamesPlayed: 0, // Would be calculated from GamePlay collection
      gamesWon: 0,    // Would be calculated from GamePlay collection
      totalEarnings: 0, // Would be calculated from Transaction collection
      followersCount: user.followers.length,
      followingCount: user.following.length,
    };
  }
}