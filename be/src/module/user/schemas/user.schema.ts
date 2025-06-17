import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ description: 'User\'s unique username' })
  @Prop({ required: true, unique: true })
  username: string;

  @ApiProperty({ description: 'User\'s email address' })
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @ApiProperty({ description: 'User\'s avatar URL' })
  @Prop({ default: '' })
  avatar: string;

  @ApiProperty({ description: 'User\'s KC (Kim Cương) balance' })
  @Prop({ default: 0 })
  kcBalance: number;

  @ApiProperty({ enum: UserStatus, description: 'User account status' })
  @Prop({ enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @ApiProperty({ enum: UserRole, description: 'User role for permissions' })
  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @ApiProperty({ description: 'User profile information' })
  @Prop({
    type: {
      displayName: { type: String, default: '' },
      bio: { type: String, default: '' },
      location: { type: String, default: '' },
      birthdate: { type: Date, default: null },
    },
  })
  profile: {
    displayName: string;
    bio: string;
    location: string;
    birthdate: Date;
  };

  @ApiProperty({ description: 'User settings' })
  @Prop({
    type: {
      notifications: { type: Boolean, default: true },
      privacy: { type: String, enum: ['public', 'private', 'friends'], default: 'public' },
      language: { type: String, default: 'vi' },
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    },
  })
  settings: {
    notifications: boolean;
    privacy: string;
    language: string;
    theme: string;
  };
  @ApiProperty({ description: 'Device tokens for push notifications' })
  @Prop({ type: [String], default: [] })
  deviceTokens: string[];

  @ApiProperty({ description: 'Push notification settings' })
  @Prop({
    type: {
      enabled: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      vibrate: { type: Boolean, default: true },
      badge: { type: Boolean, default: true },
    },
    default: {
      enabled: true,
      sound: true,
      vibrate: true,
      badge: true,
    },
  })
  pushSettings: {
    enabled: boolean;
    sound: boolean;
    vibrate: boolean;
    badge: boolean;
  };
  @ApiProperty({ description: 'User\'s authentication tokens' })
  @Prop({
    type: [{
      token: { type: String },
      expires: { type: Date },
    }],
  })
  refreshTokens: Array<{ token: string; expires: Date }>;

  @ApiProperty({ description: 'Trust score for content moderation' })
  @Prop({ default: 100, min: 0, max: 100 })
  trustScore: number;

  @ApiProperty({ description: 'Following list' })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  following: MongooseSchema.Types.ObjectId[];

  @ApiProperty({ description: 'Followers list' })
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  followers: MongooseSchema.Types.ObjectId[];

  @ApiProperty({ description: 'Creation date' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
