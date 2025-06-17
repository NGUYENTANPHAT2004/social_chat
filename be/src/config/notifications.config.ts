// be/src/config/notifications.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('notifications', () => ({
  firebase: {
    enabled: !!process.env.FIREBASE_PROJECT_ID,
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    serviceAccountPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  email: {
    enabled: !!process.env.RESEND_API_KEY,
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'tttp1704@gmail.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Entertainment Platform',
  },
  push: {
    enabled: true,
    icon: '/static/images/notification-icon.png',
    badge: '/static/images/notification-badge.png',
    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
  },
  inApp: {
    maxPerUser: 100,
    batchSize: 20,
  },
}));