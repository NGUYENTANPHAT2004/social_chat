// modules/room/schemas/room.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type RoomDocument = Room & Document;

export enum RoomType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  VIP = 'vip',
}

export enum RoomStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

@Schema({ timestamps: true })
export class Room {
  @ApiProperty({ description: 'Tên phòng' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Mô tả phòng' })
  @Prop({ default: '' })
  description: string;

  @ApiProperty({ description: 'Người tạo phòng' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner: MongooseSchema.Types.ObjectId;

  @ApiProperty({ enum: RoomType, description: 'Loại phòng' })
  @Prop({ enum: RoomType, default: RoomType.PUBLIC })
  type: RoomType;

  @ApiProperty({ enum: RoomStatus, description: 'Trạng thái phòng' })
  @Prop({ enum: RoomStatus, default: RoomStatus.ACTIVE })
  status: RoomStatus;

  @ApiProperty({ description: 'Ảnh bìa phòng' })
  @Prop({ default: '' })
  coverImage: string;

  @ApiProperty({ description: 'Ảnh nền phòng' })
  @Prop({ default: '' })
  backgroundImage: string;

  @ApiProperty({ description: 'Các thành viên của phòng' })
  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User' }])
  members: MongooseSchema.Types.ObjectId[];

  @ApiProperty({ description: 'Số lượng người xem hiện tại' })
  @Prop({ default: 0 })
  currentViewers: number;

  @ApiProperty({ description: 'Số lượng người theo dõi' })
  @Prop({ default: 0 })
  followers: number;

  @ApiProperty({ description: 'Mật khẩu phòng (chỉ cho phòng riêng tư)' })
  @Prop()
  password: string;

  @ApiProperty({ description: 'Phòng có đang streaming không' })
  @Prop({ default: false })
  isLive: boolean;

  @ApiProperty({ description: 'Tổng số KC nhận được' })
  @Prop({ default: 0 })
  totalKC: number;

  @ApiProperty({ description: 'Tags của phòng' })
  @Prop([String])
  tags: string[];

  @ApiProperty({ description: 'Cài đặt phòng' })
  @Prop({
    type: {
      allowChat: { type: Boolean, default: true },
      allowGifts: { type: Boolean, default: true },
      minKCToJoin: { type: Number, default: 0 },
      slowMode: { type: Boolean, default: false },
      slowModeInterval: { type: Number, default: 5 }, // seconds
      followersOnly: { type: Boolean, default: false },
      minAgeRequired: { type: Number, default: 0 },
    },
  })
  settings: {
    allowChat: boolean;
    allowGifts: boolean;
    minKCToJoin: number;
    slowMode: boolean;
    slowModeInterval: number;
    followersOnly: boolean;
    minAgeRequired: number;
  };

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;

  @ApiProperty({ description: 'Thời gian bắt đầu stream gần nhất' })
  @Prop()
  lastStreamStartTime: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);