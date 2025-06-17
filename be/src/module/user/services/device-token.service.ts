// be/src/module/user/services/device-token.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class DeviceTokenService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async addDeviceToken(userId: string, deviceToken: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $addToSet: { deviceTokens: deviceToken } }
    );
  }

  async removeDeviceToken(userId: string, deviceToken: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $pull: { deviceTokens: deviceToken } }
    );
  }

  async getUserDeviceTokens(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).select('deviceTokens');
    return user?.deviceTokens || [];
  }

  async updatePushSettings(userId: string, settings: any): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: { pushSettings: settings } }
    );
  }

  async getPushSettings(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('pushSettings');
    return user?.pushSettings || {
      enabled: true,
      sound: true,
      vibrate: true,
      badge: true,
    };
  }
}