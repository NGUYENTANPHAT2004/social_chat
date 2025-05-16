// modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { UserController } from './controllers/user.controller';
import { ProfileController } from './controllers/profile.controller';
import { UserService } from './services/user.service';
import { User, UserSchema } from './schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ConfigModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [UserController, ProfileController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}