// modules/notification/services/push.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Notification } from '../schemas/notification.schema';
import * as admin from 'firebase-admin';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private firebaseInitialized = false;

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const serverKey = this.configService.get<string>('notifications.push.firebase.serverKey');
      const senderId = this.configService.get<string>('notifications.push.firebase.senderId');
      
      if (!serverKey || !senderId) {
        this.logger.warn('Firebase không được cấu hình. Push notifications sẽ không được gửi.');
        return;
      }

      // Kiểm tra xem Firebase đã được khởi tạo chưa
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: senderId,
            clientEmail: 'firebase-adminsdk@your-project.iam.gserviceaccount.com',
            privateKey: serverKey.replace(/\\n/g, '\n'),
          }),
        });
        
        this.firebaseInitialized = true;
        this.logger.log('Firebase đã được khởi tạo cho push notifications');
      } else {
        this.firebaseInitialized = true;
      }
    } catch (error) {
      this.logger.error(`Lỗi khi khởi tạo Firebase: ${error.message}`, error.stack);
    }
  }

  async sendPushNotification(notification: Notification): Promise<boolean> {
    try {
      if (!this.firebaseInitialized) {
        this.logger.warn('Không thể gửi push notification: Firebase không được khởi tạo');
        return false;
      }

      // Lấy token thiết bị của người nhận (giả định)
      const deviceTokens = await this.getRecipientDeviceTokens(notification.recipient);
      
      if (!deviceTokens || deviceTokens.length === 0) {
        this.logger.warn(`Không tìm thấy device token cho người nhận: ${notification.recipient}`);
        return false;
      }

      // Chuẩn bị thông báo
      const pushNotification = {
        notification: {
          title: notification.title,
          body: notification.content,
          clickAction: notification.link || 'NOTIFICATION_CLICK',
          icon: this.configService.get('notifications.push.defaults.icon', '/static/images/notification-icon.png'),
        },
        data: {
          notificationId: notification.id || '',
          type: notification.type,
          ...notification.data,
        },
        tokens: deviceTokens,
      };

      // Gửi thông báo
      const response = await admin.messaging().sendMulticast(pushNotification);

      this.logger.log(`Đã gửi push notification: ${response.successCount} thành công, ${response.failureCount} thất bại`);
      
      return response.successCount > 0;
    } catch (error) {
      this.logger.error(`Lỗi khi gửi push notification: ${error.message}`, error.stack);
      return false;
    }
  }

  // Phương thức phụ - trong thực tế, bạn sẽ truy vấn từ database
  private async getRecipientDeviceTokens(userId: any): Promise<string[]> {
    // Đây là mẫu - bạn sẽ truy vấn device tokens từ database
    return ['device_token_1', 'device_token_2'];
  }
}