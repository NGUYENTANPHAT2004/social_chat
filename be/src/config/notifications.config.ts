// be/src/config/notifications.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('notifications', () => ({
  email: {
    resend: {
      apiKey: process.env.RESEND_API_KEY || 'YOUR_RESEND_API_KEY',
      fromEmail: process.env.MAIL_FROM || 'noreply@yourdomain.com',
      fromName: process.env.MAIL_FROM_NAME || 'Entertainment Platform',
    },
    templates: {
      welcome: 'tmpl_welcome',
      passwordReset: 'tmpl_password_reset',
      emailVerification: 'tmpl_email_verification',
      newMessage: 'tmpl_new_message',
      giftReceived: 'tmpl_gift_received',
    },
  },
  push: {
    firebase: {
      serverKey: process.env.FIREBASE_SERVER_KEY || 'YOUR_FIREBASE_SERVER_KEY',
      senderId: process.env.FIREBASE_SENDER_ID || 'YOUR_FIREBASE_SENDER_ID',
    },
    defaults: {
      icon: '/static/images/notification-icon.png',
      clickAction: 'NOTIFICATION_CLICK',
    },
  },
  inApp: {
    maxPerUser: 100, // Maximum stored notifications per user
    batchSize: 20, // Notifications to retrieve per request
  },
  channels: {
    adminMessages: true,
    newFollowers: true,
    gifts: true,
    comments: true,
    mentions: true,
    roomEvents: true,
  },
}));