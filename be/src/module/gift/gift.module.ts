// modules/gift/gift.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

import { GiftController } from './controllers/gift.controller';
import { GiftService } from './services/gift.service';
import { Gift, GiftSchema } from './schemas/gift.schema';
import { GiftTransaction, GiftTransactionSchema } from './schemas/gift-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Gift.name, schema: GiftSchema },
      { name: GiftTransaction.name, schema: GiftTransactionSchema },
    ]),
    ConfigModule,
  ],
  controllers: [GiftController],
  providers: [GiftService],
  exports: [GiftService],
})
export class GiftModule {}