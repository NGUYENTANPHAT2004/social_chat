// be/src/module/auth/services/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../shared/services/redis.service';

import { User, UserDocument, UserStatus } from '../../user/schemas/user.schema';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(registerDto: RegisterDto): Promise<any> {
    // Kiểm tra username hoặc email đã tồn tại chưa
    const existingUser = await this.userModel.findOne({
      $or: [
        { username: registerDto.username },
        { email: registerDto.email },
      ],
    });

    if (existingUser) {
      if (existingUser.username === registerDto.username) {
        throw new ConflictException('Tên người dùng đã tồn tại');
      }
      throw new ConflictException('Email đã tồn tại');
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(this.configService.get<number>('auth.password.saltRounds'));
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // Tạo người dùng mới
    const newUser = new this.userModel({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      profile: {
        displayName: registerDto.username,
      },
    });

    const savedUser = await newUser.save();
    
    // Tạo tokens
    const tokens = await this.generateTokens(savedUser);
    
    // Lưu refresh token vào Redis và MongoDB
    await this.saveRefreshToken(savedUser.id, tokens.refreshToken);
    
    return {
      user: this.sanitizeUser(savedUser),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto): Promise<any> {
    // Tìm người dùng theo email hoặc username
    const user = await this.userModel.findOne({
      $or: [
        { email: loginDto.identifier },
        { username: loginDto.identifier },
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    // Kiểm tra tài khoản có đang hoạt động không
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    // Xác thực mật khẩu
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    // Tạo tokens
    const tokens = await this.generateTokens(user);
    
    // Lưu refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      // Xác thực refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('auth.jwt.secret'),
      });

      // Kiểm tra token có trong Redis không
      const isValidToken = await this.redisService.get(`refresh_token:${payload.sub}:${refreshToken}`);
      
      if (!isValidToken) {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      // Tìm người dùng
      const user = await this.userModel.findById(payload.sub);
      
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Người dùng không tồn tại hoặc đã bị khóa');
      }

      // Tạo tokens mới
      const tokens = await this.generateTokens(user);
      
      // Xóa refresh token cũ
      await this.removeRefreshToken(user.id, refreshToken);
      
      // Lưu refresh token mới
      await this.saveRefreshToken(user.id, tokens.refreshToken);
      
      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }

  async getProfile(user: any): Promise<any> {
    const userDoc = await this.userModel.findById(user.id);
    if (!userDoc) {
      throw new UnauthorizedException('Không tìm thấy người dùng');
    }
    
    return this.sanitizeUser(userDoc);
  }

  async socialLogin(userDetails: any): Promise<any> {
    try {
      let user = await this.userModel.findOne({ email: userDetails.email });
      
      if (!user) {
        // Tạo người dùng mới từ đăng nhập mạng xã hội
        user = new this.userModel({
          email: userDetails.email,
          username: this.generateUsername(userDetails.email),
          password: await bcrypt.hash(uuidv4(), 10), // Tạo mật khẩu ngẫu nhiên
          profile: {
            displayName: userDetails.displayName || userDetails.email.split('@')[0],
          },
          avatar: userDetails.picture || '',
        });
        
        await user.save();
      }

      // Tạo tokens
      const tokens = await this.generateTokens(user);
      
      // Lưu refresh token
      await this.saveRefreshToken(user.id, tokens.refreshToken);
      
      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      throw new BadRequestException('Đăng nhập mạng xã hội thất bại');
    }
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({
      $or: [
        { email: username },
        { username: username },
      ],
    });
    
    if (!user) {
      return null;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    
    return this.sanitizeUser(user);
  }

  async logout(userId: string, refreshToken: string): Promise<any> {
    await this.removeRefreshToken(userId, refreshToken);
    return { success: true, message: 'Đăng xuất thành công' };
  }

  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { 
      sub: user.id || user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(
        payload,
        {
          expiresIn: this.configService.get('auth.jwt.refreshExpiresIn'),
        },
      ),
    };
  }

  private async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    // Tính thời gian hết hạn (30 ngày)
    const expiresIn = 30 * 24 * 60 * 60; // 30 ngày tính bằng giây
    
    // Lưu vào Redis
    await this.redisService.set(
      `refresh_token:${userId}:${refreshToken}`,
      'valid',
      expiresIn,
    );
    
    // Lưu vào MongoDB để tham chiếu (có thể dùng để đăng xuất khỏi tất cả thiết bị)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    
    await this.userModel.updateOne(
      { _id: userId },
      {
        $push: {
          refreshTokens: {
            token: refreshToken,
            expires,
          },
        },
      },
    );
  }

  private async removeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    // Xóa khỏi Redis
    await this.redisService.del(`refresh_token:${userId}:${refreshToken}`);
    
    // Xóa khỏi MongoDB
    await this.userModel.updateOne(
      { _id: userId },
      {
        $pull: {
          refreshTokens: {
            token: refreshToken,
          },
        },
      },
    );
  }

  private sanitizeUser(user: any): any {
    const sanitized = user.toObject ? user.toObject() : user;
    delete sanitized.password;
    delete sanitized.refreshTokens;
    return sanitized;
  }

  private generateUsername(email: string): string {
    const base = email.split('@')[0];
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${base}${random}`;
  }
}