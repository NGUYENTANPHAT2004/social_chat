// be/src/module/notification/services/push.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Notification, NotificationDocument } from '../schemas/notification.schema';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeFirebase();
  }

  private async initializeFirebase() {
    try {
      const firebaseConfig = this.configService.get('notifications.firebase');
      
      if (!firebaseConfig?.enabled) {
        this.logger.warn('🔥 Firebase is disabled. Push notifications will not be sent.');
        return;
      }

      // Check if Firebase app already initialized
      if (admin.apps.length > 0) {
        this.logger.log('🔥 Firebase already initialized');
        this.isInitialized = true;
        return;
      }

      // Method 1: Using service account file (Recommended)
      if (firebaseConfig.serviceAccountPath) {
        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig.serviceAccountPath),
          projectId: firebaseConfig.projectId,
        });
        
        this.logger.log('🔥 Firebase initialized with service account file');
      }
      // Method 2: Using individual environment variables
      else if (firebaseConfig.projectId && firebaseConfig.privateKey && firebaseConfig.clientEmail) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: firebaseConfig.projectId,
            privateKey: firebaseConfig.privateKey,
            clientEmail: firebaseConfig.clientEmail,
          }),
          projectId: firebaseConfig.projectId,
        });
        
        this.logger.log('🔥 Firebase initialized with environment credentials');
      }
      else {
        throw new Error('No valid Firebase credentials found');
      }

      // Test Firebase connection
      await this.testFirebaseConnection();
      this.isInitialized = true;
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize Firebase:', error.message);
      this.isInitialized = false;
    }
  }

  private async testFirebaseConnection() {
    try {
      const messaging = admin.messaging();
      
      // Test with dry run
      const testMessage = {
        notification: {
          title: 'Test',
          body: 'Firebase connection test',
        },
        token: 'test-token',
      };

      // Dry run to test credentials without sending actual notification
      try {
        await messaging.send(testMessage, true); // dryRun = true
      } catch (error) {
        // Dry run will fail with invalid token, but credentials are valid if we get this far
        if (error.code === 'messaging/invalid-argument' || error.code === 'messaging/registration-token-not-registered') {
          this.logger.log('✅ Firebase FCM v1 API credentials are valid');
          return;
        }
        throw error;
      }
      
    } catch (error) {
      this.logger.error('❌ Firebase FCM test failed:', error.message);
      throw error;
    }
  }

  async sendPushNotification(
    deviceTokens: string[],
    notification: {
      title: string;
      body: string;
      imageUrl?: string;
    },
    data: Record<string, string> = {},
    options: {
      clickAction?: string;
      tag?: string;
      requireInteraction?: boolean;
    } = {}
  ): Promise<{ successCount: number; failureCount: number; errors: any[] }> {
    
    if (!this.isInitialized) {
      this.logger.warn('🔥 Firebase not initialized. Cannot send push notification.');
      return { successCount: 0, failureCount: deviceTokens.length, errors: ['Firebase not initialized'] };
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      this.logger.warn('📱 No device tokens provided');
      return { successCount: 0, failureCount: 0, errors: ['No device tokens'] };
    }

    try {
      const messaging = admin.messaging();
      
      // Prepare message payload for FCM HTTP v1 API
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: {
          ...data,
          clickAction: options.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: this.configService.get('notifications.push.icon'),
            badge: this.configService.get('notifications.push.badge'),
            tag: options.tag,
            requireInteraction: options.requireInteraction || false,
          },
          fcmOptions: {
            link: options.clickAction,
          },
        },
        android: {
          notification: {
            title: notification.title,
            body: notification.body,
            imageUrl: notification.imageUrl,
            clickAction: options.clickAction,
            channelId: 'default',
          },
          priority: 'high',
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
        tokens: deviceTokens,
      };

      // Send notification using FCM HTTP v1 API
      const response = await messaging.sendEachForMulticast(message);

      this.logger.log(`📱 Push notification sent: ${response.successCount} success, ${response.failureCount} failures`);

      // Log individual failures for debugging
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.error(`Failed to send to token ${deviceTokens[idx]}: ${resp.error?.message}`);
          }
        });
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.responses
          .filter(resp => !resp.success)
          .map(resp => resp.error?.message)
      };

    } catch (error) {
      this.logger.error('❌ Error sending push notification:', error.message);
      return {
        successCount: 0,
        failureCount: deviceTokens.length,
        errors: [error.message]
      };
    }
  }

  // Convenience method for sending to single user
  async sendNotificationToUser(
    userId: string,
    notification: NotificationDocument
  ): Promise<boolean> {
    try {
      // Get user's device tokens from database
      const deviceTokens = await this.getUserDeviceTokens(userId);
      
      if (!deviceTokens || deviceTokens.length === 0) {
        this.logger.warn(`📱 No device tokens found for user: ${userId}`);
        return false;
      }

      const result = await this.sendPushNotification(
        deviceTokens,
        {
          title: notification.title,
          body: notification.content,
          imageUrl: notification.image,
        },
        {
          notificationId: notification._id?.toString() || '',
          type: notification.type,
          userId: userId,
          ...notification.data,
        },
        {
          clickAction: notification.link || '/notifications',
          tag: `notification-${notification._id}`,
        }
      );

      return result.successCount > 0;
    } catch (error) {
      this.logger.error(`❌ Error sending notification to user ${userId}:`, error.message);
      return false;
    }
  }

  // TODO: Implement device token management
  private async getUserDeviceTokens(userId: string): Promise<string[]> {
    // This needs to be implemented based on your user model
    // For now, return empty array
    this.logger.warn('📱 getUserDeviceTokens not implemented. Add device token management to User model.');
    return [];
  }

  // Health check method
  isFirebaseReady(): boolean {
    return this.isInitialized;
  }

  // Method to validate device token
  async validateDeviceToken(token: string): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      await admin.messaging().send({
        token,
        data: { test: 'validation' },
      }, true); // dryRun = true
      return true;
    } catch (error) {
      this.logger.warn(`📱 Invalid device token: ${error.message}`);
      return false;
    }
  }
}