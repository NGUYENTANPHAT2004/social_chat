// be/src/config/security.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  headers: {
    contentSecurityPolicy: {
      enabled: process.env.ENABLE_CSP === 'true',
    },
    xssProtection: true,
    noSniff: true,
    frameOptions: 'DENY',
  },
  rateLimit: {
    login: {
      points: 5, // 5 attempts
      duration: 60 * 60, // 1 hour
      blockDuration: 60 * 60, // 1 hour block after exceeding
    },
    register: {
      points: 3, // 3 attempts
      duration: 60 * 60, // 1 hour
      blockDuration: 60 * 60 * 24, // 24 hour block after exceeding
    },
    api: {
      points: 100, // 100 requests
      duration: 60, // 1 minute
      blockDuration: 60 * 5, // 5 minute block after exceeding
    },
  },
  verification: {
    email: {
      required: true,
      tokenExpiry: 24 * 60 * 60, // 24 hours
    },
    phone: {
      required: false,
      tokenExpiry: 10 * 60, // 10 minutes
    },
  },
  passwords: {
    minLength: 8,
    requireMixedCase: true,
    requireNumber: true,
    requireSpecialChar: true,
    maxAge: 90 * 24 * 60 * 60, // 90 days
    recentHistorySize: 5, // Cannot reuse last 5 passwords
  },
  sessions: {
    maxConcurrent: 5,
    inactivityTimeout: 30 * 24 * 60 * 60, // 30 days
  },
  twoFactorAuth: {
    enabled: process.env.ENABLE_2FA === 'true',
    issuer: 'EntertainmentPlatform',
  },
}));