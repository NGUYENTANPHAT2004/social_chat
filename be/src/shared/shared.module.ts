// be/src/shared/shared.module.ts
import { Module, Global } from '@nestjs/common';
import { RedisService } from './services/redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class SharedModule {}