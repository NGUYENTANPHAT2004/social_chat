// modules/notification/services/notification.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationDocument, NotificationType, NotificationStatus } from '../schemas/notification.schema';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationSettingsDto } from '../dto/notification-settings.dto';
import { EmailService } from './email.service';
import { PushService } from './push.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private configService: ConfigService,
    private emailService: EmailService,
    private pushService: PushService,
  ) {}

  async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const {
      recipientId,
      senderId,
      type,
      title,
      content,
      link,
      image,
      data,
      sendEmail,
      sendPush,
    } = createNotificationDto;

    // Tạo thông báo
    const notification = new this.notificationModel({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      content,
      link: link || '',
      image: image || '',
      data: data || {},
      status: NotificationStatus.UNREAD,
    });

    // Lưu thông báo
    const savedNotification = await notification.save();

    // Gửi thông báo qua email nếu được yêu cầu
    if (sendEmail) {
      try {
        await this.emailService.sendNotificationEmail(savedNotification);
        savedNotification.emailSent = true;
        await savedNotification.save();
      } catch (error) {
        console.error('Lỗi khi gửi email thông báo:', error);
      }
    }

    // Gửi thông báo đẩy nếu được yêu cầu
    if (sendPush) {
      try {
        await this.pushService.sendNotificationToUser(recipientId, savedNotification);
        savedNotification.pushSent = true;
        await savedNotification.save();
      } catch (error) {
        console.error('Lỗi khi gửi push notification:', error);
      }
    }

    return savedNotification;
  }

  async broadcastNotification(
    userIds: string[],
    notification: Omit<CreateNotificationDto, 'recipientId'>,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // Gửi thông báo cho từng người dùng
    for (const userId of userIds) {
      try {
        await this.createNotification({
          ...notification,
          recipientId: userId,
        });
        success++;
      } catch (error) {
        console.error(`Lỗi khi gửi thông báo cho người dùng ${userId}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  async getUserNotifications(
    userId: string,
    filters: any = {},
    options = { page: 1, limit: 10 },
  ): Promise<{ notifications: Notification[]; total: number; page: number; limit: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    
    const query = { recipient: userId, ...filters };
    
    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'username avatar'),
      this.notificationModel.countDocuments(query),
    ]);
    
    return {
      notifications,
      total,
      page,
      limit,
    };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationModel.countDocuments({
      recipient: userId,
      status: NotificationStatus.UNREAD,
    });
    
    return { count };
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    
    // Kiểm tra quyền
    if (notification.recipient.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền với thông báo này');
    }
    
    notification.status = NotificationStatus.READ;
    return notification.save();
  }

  async markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; count: number }> {
    const result = await this.notificationModel.updateMany(
      {
        recipient: userId,
        status: NotificationStatus.UNREAD,
      },
      {
        status: NotificationStatus.READ,
      },
    );
    
    return {
      success: true,
      count: result.modifiedCount,
    };
  }

  async deleteNotification(notificationId: string, userId: string): Promise<{ success: boolean }> {
    const notification = await this.notificationModel.findById(notificationId);
    
    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    
    // Kiểm tra quyền
    if (notification.recipient.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền với thông báo này');
    }
    
    await this.notificationModel.findByIdAndDelete(notificationId);
    
    return { success: true };
  }

  async deleteAllNotifications(userId: string): Promise<{ success: boolean; count: number }> {
    const result = await this.notificationModel.deleteMany({
      recipient: userId,
    });
    
    return {
      success: true,
      count: result.deletedCount,
    };
  }

  async getNotificationSettings(userId: string): Promise<any> {
    // Trong trường hợp thực tế, bạn có thể lấy cài đặt từ collection User
    // Đây là một mẫu tạm thời
    return {
      messages: true,
      followers: true,
      gifts: true,
      comments: true,
      mentions: true,
      roomEvents: true,
      adminMessages: true,
      emailNotifications: true,
      pushNotifications: true,
    };
  }

  async updateNotificationSettings(
    userId: string,
    settings: NotificationSettingsDto,
  ): Promise<NotificationSettingsDto> {
    // Trong trường hợp thực tế, bạn sẽ cập nhật cài đặt vào collection User
    // Đây là một mẫu tạm thời
    return settings;
  }
}