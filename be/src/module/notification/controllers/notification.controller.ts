// modules/notification/controllers/notification.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    Query,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../../auth/guards/roles.guard';
  import { Roles } from '../../auth/decorators/roles.decorator';
  import { UserRole } from '../../user/schemas/user.schema';
  import { NotificationService } from '../services/notification.service';
  import { CreateNotificationDto } from '../dto/create-notification.dto';
  import { NotificationSettingsDto } from '../dto/notification-settings.dto';
  import { NotificationStatus } from '../schemas/notification.schema';
  
  @ApiTags('notifications')
  @Controller('notifications')
  export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}
  
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách thông báo của người dùng hiện tại' })
    @ApiResponse({ status: 200, description: 'Danh sách thông báo' })
    async getMyNotifications(
      @Request() req,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('status') status?: NotificationStatus,
    ) {
      return this.notificationService.getUserNotifications(
        req.user.id,
        { status },
        { page, limit },
      );
    }
  
    @Get('unread-count')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc' })
    @ApiResponse({ status: 200, description: 'Số lượng thông báo chưa đọc' })
    async getUnreadCount(@Request() req) {
      return this.notificationService.getUnreadCount(req.user.id);
    }
  
    @Patch(':id/read')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Đánh dấu đã đọc thông báo' })
    @ApiResponse({ status: 200, description: 'Thông báo đã được đánh dấu đã đọc' })
    async markAsRead(@Param('id') id: string, @Request() req) {
      return this.notificationService.markNotificationAsRead(id, req.user.id);
    }
  
    @Patch('read-all')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Đánh dấu tất cả thông báo là đã đọc' })
    @ApiResponse({ status: 200, description: 'Tất cả thông báo đã được đánh dấu đã đọc' })
    async markAllAsRead(@Request() req) {
      return this.notificationService.markAllNotificationsAsRead(req.user.id);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa thông báo' })
    @ApiResponse({ status: 200, description: 'Thông báo đã được xóa' })
    async deleteNotification(@Param('id') id: string, @Request() req) {
      return this.notificationService.deleteNotification(id, req.user.id);
    }
  
    @Delete('delete-all')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa tất cả thông báo' })
    @ApiResponse({ status: 200, description: 'Tất cả thông báo đã được xóa' })
    async deleteAllNotifications(@Request() req) {
      return this.notificationService.deleteAllNotifications(req.user.id);
    }
  
    @Get('settings')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy cài đặt thông báo' })
    @ApiResponse({ status: 200, description: 'Cài đặt thông báo' })
    async getNotificationSettings(@Request() req) {
      return this.notificationService.getNotificationSettings(req.user.id);
    }
  
    @Put('settings')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật cài đặt thông báo' })
    @ApiResponse({ status: 200, description: 'Cài đặt thông báo đã được cập nhật' })
    async updateNotificationSettings(
      @Body() settings: NotificationSettingsDto,
      @Request() req,
    ) {
      return this.notificationService.updateNotificationSettings(req.user.id, settings);
    }
  
    @Post('send')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Gửi thông báo (chỉ dành cho admin)' })
    @ApiResponse({ status: 201, description: 'Thông báo đã được gửi' })
    async sendNotification(@Body() createNotificationDto: CreateNotificationDto) {
      return this.notificationService.createNotification(createNotificationDto);
    }
  
    @Post('broadcast')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Gửi thông báo cho nhiều người dùng (chỉ dành cho admin)' })
    @ApiResponse({ status: 201, description: 'Thông báo đã được gửi' })
    async broadcastNotification(
      @Body('userIds') userIds: string[],
      @Body('notification') notification: Omit<CreateNotificationDto, 'recipientId'>,
    ) {
      return this.notificationService.broadcastNotification(userIds, notification);
    }
  }