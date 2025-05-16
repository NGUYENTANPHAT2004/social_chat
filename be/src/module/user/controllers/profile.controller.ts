// modules/user/controllers/profile.controller.ts
import {
    Controller,
    Get,
    Patch,
    Body,
    UseGuards,
    Request,
    UploadedFile,
    UseInterceptors,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { UserService } from '../services/user.service';
  import { UpdateProfileDto } from '../dto/update-profile.dto';
  
  @ApiTags('profile')
  @Controller('profile')
  export class ProfileController {
    constructor(private readonly userService: UserService) {}
  
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thông tin cá nhân' })
    @ApiResponse({ status: 200, description: 'Thông tin cá nhân' })
    async getProfile(@Request() req) {
      return this.userService.getUserById(req.user.id);
    }
  
    @Patch()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật thông tin cá nhân' })
    @ApiResponse({ status: 200, description: 'Thông tin cá nhân đã được cập nhật' })
    async updateProfile(
      @Body() updateProfileDto: UpdateProfileDto,
      @Request() req,
    ) {
      return this.userService.updateProfile(req.user.id, updateProfileDto);
    }
  
    @Patch('avatar')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('avatar'))
    @ApiOperation({ summary: 'Cập nhật avatar' })
    @ApiResponse({ status: 200, description: 'Avatar đã được cập nhật' })
    async updateAvatar(
      @UploadedFile() file: Express.Multer.File,
      @Request() req,
    ) {
      // Trong thực tế, file sẽ được upload lên S3 hoặc storage khác
      // và URL sẽ được trả về
      const avatarUrl = `https://example.com/avatars/${Date.now()}-${file.originalname}`;
      
      return this.userService.updateAvatar(req.user.id, avatarUrl);
    }
  
    @Patch('settings')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật cài đặt người dùng' })
    @ApiResponse({ status: 200, description: 'Cài đặt đã được cập nhật' })
    async updateSettings(
      @Body() settings: Record<string, any>,
      @Request() req,
    ) {
      return this.userService.updateSettings(req.user.id, settings);
    }
  }