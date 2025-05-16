// modules/gift/schemas/gift.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type GiftDocument = Gift & Document;

export enum GiftType {
  STATIC = 'static',
  ANIMATED = 'animated',
  SPECIAL = 'special',
}

export enum GiftStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SEASONAL = 'seasonal',
}

@Schema({ timestamps: true })
export class Gift {
  @ApiProperty({ description: 'Tên quà tặng' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Mô tả quà tặng' })
  @Prop({ default: '' })
  description: string;

  @ApiProperty({ description: 'Giá KC' })
  @Prop({ required: true })
  price: number;

  @ApiProperty({ description: 'Hình ảnh quà tặng' })
  @Prop({ required: true })
  image: string;

  @ApiProperty({ description: 'Hình ảnh động của quà tặng' })
  @Prop({ default: '' })
  animation: string;

  @ApiProperty({ enum: GiftType, description: 'Loại quà tặng' })
  @Prop({ enum: GiftType, default: GiftType.STATIC })
  type: GiftType;

  @ApiProperty({ enum: GiftStatus, description: 'Trạng thái quà tặng' })
  @Prop({ enum: GiftStatus, default: GiftStatus.ACTIVE })
  status: GiftStatus;

  @ApiProperty({ description: 'Hiệu ứng đặc biệt' })
  @Prop({ default: '' })
  specialEffect: string;

  @ApiProperty({ description: 'Thứ tự hiển thị' })
  @Prop({ default: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Danh mục quà tặng' })
  @Prop({ default: 'general' })
  category: string;

  @ApiProperty({ description: 'Phần thưởng cho streamer' })
  @Prop({ default: 100 }) // 100% của giá
  streamerReward: number;

  @ApiProperty({ description: 'Thời gian bắt đầu mùa' })
  @Prop()
  seasonStart: Date;

  @ApiProperty({ description: 'Thời gian kết thúc mùa' })
  @Prop()
  seasonEnd: Date;

  @ApiProperty({ description: 'Số lượng đã gửi' })
  @Prop({ default: 0 })
  sentCount: number;

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const GiftSchema = SchemaFactory.createForClass(Gift);