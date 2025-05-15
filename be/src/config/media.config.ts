// be/src/config/media.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('media', () => ({
  image: {
    formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    thumbnails: {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 },
    },
    compression: {
      quality: 85,
      progressive: true,
    },
  },
  video: {
    formats: ['mp4', 'webm', 'mov'],
    maxSize: 100 * 1024 * 1024, // 100MB
    thumbnails: {
      generate: true,
      at: 5, // seconds
    },
    transcode: {
      enabled: true,
      formats: ['mp4'],
      resolutions: ['480p', '720p'],
    },
  },
  audio: {
    formats: ['mp3', 'wav', 'ogg'],
    maxSize: 20 * 1024 * 1024, // 20MB
    transcode: {
      enabled: true,
      formats: ['mp3'],
    },
  },
  processing: {
    queue: {
      concurrency: 3,
      retryAttempts: 3,
      retryDelay: 5000, // 5 seconds
    },
  },
}));