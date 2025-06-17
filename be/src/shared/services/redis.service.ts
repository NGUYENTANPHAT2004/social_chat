// be/src/shared/services/redis.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redisClient: Redis;

  constructor(private configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('database.redis.host'),
      port: this.configService.get<number>('database.redis.port'),
      username: this.configService.get<string>('database.redis.username') || undefined,
      password: this.configService.get<string>('database.redis.password') || undefined,
    });

    this.redisClient.on('error', (error) => {
      console.error('Lỗi kết nối Redis:', error);
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string, expireInSeconds?: number): Promise<void> {
    if (expireInSeconds) {
      await this.redisClient.set(key, value, 'EX', expireInSeconds);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.redisClient.keys(pattern);
  }

  async onModuleDestroy(): Promise<void> {
    await this.redisClient.quit();
  }
}