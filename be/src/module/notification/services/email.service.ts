// modules/notification/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationType } from '../schemas/notification.schema';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('notifications.email.apiKey');
    this.fromEmail = this.configService.get<string>('notifications.email.from', 'tttp1704@gmail.com');
    this.fromName = this.configService.get<string>('notifications.email.fromName', 'Entertainment Platform');
    
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('Resend API key không được cấu hình. Email sẽ không được gửi.');
    }
  }

  async sendNotificationEmail(notification: Notification): Promise<boolean> {
    try {
      if (!this.resend) {
        this.logger.warn('Không thể gửi email: Resend API không được cấu hình');
        return false;
      }

      // Lấy template ID dựa trên loại thông báo
      const templateId = this.getTemplateIdByType(notification.type);
      
      if (!templateId) {
        this.logger.warn(`Không có template email cho loại thông báo: ${notification.type}`);
        return false;
      }

      // Lấy email người nhận từ database (giả định)
      const recipientEmail = await this.getRecipientEmail(notification.recipient);
      
      if (!recipientEmail) {
        this.logger.warn(`Không tìm thấy email cho người nhận: ${notification.recipient}`);
        return false;
      }

      // Chuẩn bị dữ liệu cho template
      const templateData = {
        recipientName: await this.getRecipientName(notification.recipient),
        title: notification.title,
        content: notification.content,
        link: notification.link,
        senderName: notification.sender ? await this.getSenderName(notification.sender) : null,
        date: new Date().toLocaleString('vi-VN'),
        ...notification.data,
      };

      // Gửi email sử dụng template
      const response = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [recipientEmail],
        subject: notification.title,
        html: `<div>${notification.content}</div>`,
      });

      if (response.error) {
        this.logger.error(`Lỗi khi gửi email: ${response.error.message}`);
        return false;
      }

      this.logger.log(`Email thông báo đã được gửi đến ${recipientEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Lỗi khi gửi email thông báo: ${error.message}`, error.stack);
      return false;
    }
  }

  private getTemplateIdByType(notificationType: NotificationType): string {
    const templates = this.configService.get('notifications.email.templates', {});
    
    switch (notificationType) {
      case NotificationType.FOLLOW:
        return templates.newFollower || '';
      case NotificationType.LIKE:
        return templates.like || '';
      case NotificationType.COMMENT:
        return templates.comment || '';
      case NotificationType.MENTION:
        return templates.mention || '';
      case NotificationType.MESSAGE:
        return templates.newMessage || '';
      case NotificationType.GIFT:
        return templates.giftReceived || '';
      case NotificationType.STREAM:
        return templates.stream || '';
      case NotificationType.PAYMENT:
        return templates.payment || '';
      case NotificationType.ADMIN:
        return templates.admin || '';
      case NotificationType.SYSTEM:
      default:
        return templates.system || '';
    }
  }

  // Phương thức phụ - trong thực tế, bạn sẽ truy vấn từ database
  private async getRecipientEmail(userId: any): Promise<string> {
    // Đây là mẫu - bạn sẽ truy vấn email từ model User
    return 'recipient@example.com';
  }

  private async getRecipientName(userId: any): Promise<string> {
    // Đây là mẫu - bạn sẽ truy vấn username từ model User
    return 'Người dùng';
  }

  private async getSenderName(userId: any): Promise<string> {
    // Đây là mẫu - bạn sẽ truy vấn username từ model User
    return 'Người gửi';
  }
}