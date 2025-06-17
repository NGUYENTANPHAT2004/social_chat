// modules/user/controllers/user.controller.ts
import {
    Controller,
    Get,
    Patch,
    Delete,
    Post,
    Put,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
    ForbiddenException,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../../auth/guards/roles.guard';
  import { Roles } from '../../auth/decorators/roles.decorator';
  import { UserService } from '../services/user.service';
  import { DeviceTokenService } from '../services/device-token.service';
  import { UpdateUserDto } from '../dto/update-user.dto';
  import { UserRole, UserStatus } from '../schemas/user.schema';
  
  @ApiTags('users')
  @Controller('users')
  export class UserController {
    constructor(
      private readonly userService: UserService,
      private readonly deviceTokenService: DeviceTokenService,
    ) {}
  
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách người dùng (chỉ Admin/Mod)' })
    @ApiResponse({ status: 200, description: 'Danh sách người dùng' })
    async getUsers(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
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
  
    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin người dùng' })
    async getUserById(@Param('id') id: string) {
      return this.userService.getUserById(id);
    }
  
    @Get('username/:username')
    @ApiOperation({ summary: 'Lấy thông tin người dùng theo username' })
    @ApiResponse({ status: 200, description: 'Thông tin người dùng' })
    async getUserByUsername(@Param('username') username: string) {
      return this.userService.getUserByUsername(username);
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật thông tin người dùng (chỉ Admin)' })
    @ApiResponse({ status: 200, description: 'Người dùng đã được cập nhật' })
    async updateUser(
      @Param('id') id: string,
      @Body() updateUserDto: UpdateUserDto,
    ) {
      return this.userService.updateUser(id, updateUserDto);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa người dùng (chỉ Admin)' })
    @ApiResponse({ status: 200, description: 'Người dùng đã được xóa' })
    async deleteUser(@Param('id') id: string) {
      return this.userService.deleteUser(id);
    }
  
    @Patch(':id/ban')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Khóa tài khoản người dùng (chỉ Admin/Mod)' })
    @ApiResponse({ status: 200, description: 'Tài khoản đã bị khóa' })
    async banUser(
      @Param('id') id: string,
      @Body('reason') reason: string,
    ) {
      return this.userService.banUser(id, reason);
    }
  
    @Patch(':id/unban')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mở khóa tài khoản người dùng (chỉ Admin/Mod)' })
    @ApiResponse({ status: 200, description: 'Tài khoản đã được mở khóa' })
    async unbanUser(@Param('id') id: string) {
      return this.userService.unbanUser(id);
    }
  
    @Get(':id/followers')
    @ApiOperation({ summary: 'Lấy danh sách người theo dõi' })
    @ApiResponse({ status: 200, description: 'Danh sách người theo dõi' })
    async getUserFollowers(
      @Param('id') id: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.userService.getUserFollowers(id, { page, limit });
    }
  
    @Get(':id/following')
    @ApiOperation({ summary: 'Lấy danh sách đang theo dõi' })
    @ApiResponse({ status: 200, description: 'Danh sách đang theo dõi' })
    async getUserFollowing(
      @Param('id') id: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.userService.getUserFollowing(id, { page, limit });
    }
  
    @Post(':id/follow')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Theo dõi người dùng' })
    @ApiResponse({ status: 200, description: 'Đã theo dõi thành công' })
    async followUser(
      @Param('id') id: string,
      @Request() req,
    ) {
      if (id === req.user.id) {
        throw new ForbiddenException('Không thể tự theo dõi chính mình');
      }
      
      return this.userService.followUser(id, req.user.id);
    }
  
    @Post(':id/unfollow')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Hủy theo dõi người dùng' })
    @ApiResponse({ status: 200, description: 'Đã hủy theo dõi thành công' })
    async unfollowUser(
      @Param('id') id: string,
      @Request() req,
    ) {
      return this.userService.unfollowUser(id, req.user.id);
    }
  
    @Post('device-token')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add device token for push notifications' })
    async addDeviceToken(
      @Body('deviceToken') deviceToken: string,
      @Request() req
    ) {
      return this.deviceTokenService.addDeviceToken(req.user.userId, deviceToken);
    }
  
    @Delete('device-token')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove device token' })
    async removeDeviceToken(
      @Body('deviceToken') deviceToken: string,
      @Request() req
    ) {
      return this.deviceTokenService.removeDeviceToken(req.user.userId, deviceToken);
    }
  
    @Get('push-settings')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get push notification settings' })
    async getPushSettings(@Request() req) {
      return this.deviceTokenService.getPushSettings(req.user.userId);
    }
  
    @Put('push-settings')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update push notification settings' })
    async updatePushSettings(
      @Body() settings: any,
      @Request() req
    ) {
      return this.deviceTokenService.updatePushSettings(req.user.userId, settings);
    }
  }