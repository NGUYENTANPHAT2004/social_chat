// be/src/module/user/controllers/user.controller.ts - Optimized
import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserRole, UserStatus } from '../schemas/user.schema';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Public endpoints
  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'User search results' })
  async searchUsers(
    @Query('q') query: string,
    @Query('limit') limit: number = 10,
  ) {
    return this.userService.searchUsers(query, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User information' })
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get user by username' })
  @ApiResponse({ status: 200, description: 'User information' })
  async getUserByUsername(@Param('username') username: string) {
    return this.userService.getUserByUsername(username);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get user followers' })
  @ApiResponse({ status: 200, description: 'List of followers' })
  async getUserFollowers(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.userService.getUserFollowers(id, { page, limit });
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get users being followed' })
  @ApiResponse({ status: 200, description: 'List of following users' })
  async getUserFollowing(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.userService.getUserFollowing(id, { page, limit });
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  async getUserStats(@Param('id') id: string) {
    return this.userService.getUserStats(id);
  }

  // Protected endpoints - Profile management
  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getMyProfile(@Request() req) {
    return this.userService.getUserById(req.user.id);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateMyProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Request() req,
  ) {
    return this.userService.updateProfile(req.user.id, updateProfileDto);
  }

  @Patch('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
  async updateMyAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    // In production, upload to S3 or other storage service
    const avatarUrl = `https://example.com/avatars/${Date.now()}-${file.originalname}`;
    return this.userService.updateAvatar(req.user.id, avatarUrl);
  }

  @Patch('me/settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateMySettings(
    @Body() settings: Record<string, any>,
    @Request() req,
  ) {
    return this.userService.updateSettings(req.user.id, settings);
  }

  // Follow/Unfollow
  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow a user' })
  @ApiResponse({ status: 200, description: 'Successfully followed user' })
  async followUser(@Param('id') id: string, @Request() req) {
    if (id === req.user.id) {
      throw new ForbiddenException('Cannot follow yourself');
    }
    return this.userService.followUser(id, req.user.id);
  }

  @Delete(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiResponse({ status: 200, description: 'Successfully unfollowed user' })
  async unfollowUser(@Param('id') id: string, @Request() req) {
    return this.userService.unfollowUser(id, req.user.id);
  }

  // Device Token Management
  @Post('me/device-tokens')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add device token for push notifications' })
  async addDeviceToken(
    @Body('deviceToken') deviceToken: string,
    @Request() req,
  ) {
    await this.userService.addDeviceToken(req.user.id, deviceToken);
    return { success: true, message: 'Device token added successfully' };
  }

  @Delete('me/device-tokens')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove device token' })
  async removeDeviceToken(
    @Body('deviceToken') deviceToken: string,
    @Request() req,
  ) {
    await this.userService.removeDeviceToken(req.user.id, deviceToken);
    return { success: true, message: 'Device token removed successfully' };
  }

  @Patch('me/push-settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update push notification settings' })
  async updatePushSettings(
    @Body() settings: any,
    @Request() req,
  ) {
    return this.userService.updatePushSettings(req.user.id, settings);
  }

  // Admin endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin/Moderator only)' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('status') status?: UserStatus,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    const filter: any = {};
    
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { 'profile.displayName': { $regex: search, $options: 'i' } },
      ];
    }
    
    return this.userService.getUsers(filter, { page, limit });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Post(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ban user (Admin/Moderator only)' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  async banUser(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.userService.banUser(id, reason);
  }

  @Post(':id/unban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unban user (Admin/Moderator only)' })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  async unbanUser(@Param('id') id: string) {
    return this.userService.unbanUser(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}