// be/src/config/storage.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  aws: {
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'YOUR_AWS_ACCESS_KEY_ID',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_AWS_SECRET_ACCESS_KEY',
      region: process.env.AWS_REGION || 'ap-southeast-1',
      bucket: process.env.AWS_S3_BUCKET || 'entertainment-platform-files',
    },
  },
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    avatarMaxSize: 5 * 1024 * 1024, // 5MB
    types: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg'],
    destinationPath: './uploads',
  },
  cdn: {
    baseUrl: process.env.CDN_BASE_URL || `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`,
  },
}));