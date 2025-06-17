// modules/moderation/moderation.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { ModerationController } from './controller/moderation.controller';
import { ReportController } from './controller/report.controller';
import { ModerationService } from './services/moderation.service';
import { GoogleVisionService } from './services/google-vision.service';
import { SightengineService } from './services/sightengine.service';
import { ModerationLog, ModerationLogSchema } from './schemas/moderation.schema';
import { Report, ReportSchema } from './schemas/report.schema';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModerationLog.name, schema: ModerationLogSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
    ConfigModule,
    AuthModule,
    UserModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [ModerationController, ReportController],
  providers: [ModerationService, GoogleVisionService, SightengineService],
  exports: [ModerationService],
})
export class ModerationModule {}