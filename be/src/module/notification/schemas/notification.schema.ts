// modules/notification/schemas/notification.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  SYSTEM = 'system',
  FOLLOW = 'follow',
  LIKE = 'like',
  COMMENT = 'comment',
  MENTION = 'mention',
  MESSAGE = 'message',
  GIFT = 'gift',
  STREAM = 'stream',
  PAYMENT = 'payment',
  ADMIN = 'admin',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
}

@Schema({ timestamps: true })
export class Notification {
  @ApiProperty({ description: 'Người nhận thông báo' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  recipient: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Người gửi thông báo (nếu có)' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  sender: MongooseSchema.Types.ObjectId;

  @ApiProperty({ enum: NotificationType, description: 'Loại thông báo' })
  @Prop({ enum: NotificationType, required: true })
  type: NotificationType;

  @ApiProperty({ description: 'Tiêu đề thông báo' })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ description: 'Nội dung thông báo' })
  @Prop({ required: true })
  content: string;

  @ApiProperty({ description: 'Đường dẫn khi nhấp vào thông báo' })
  @Prop({ default: '' })
  link: string;

  @ApiProperty({ description: 'Hình ảnh thông báo' })
  @Prop({ default: '' })
  image: string;

  @ApiProperty({ enum: NotificationStatus, description: 'Trạng thái thông báo' })
  @Prop({ enum: NotificationStatus, default: NotificationStatus.UNREAD })
  status: NotificationStatus;

  @ApiProperty({ description: 'Dữ liệu bổ sung' })
  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @ApiProperty({ description: 'Đã gửi qua email' })
  @Prop({ default: false })
  emailSent: boolean;

  @ApiProperty({ description: 'Đã gửi qua push notification' })
  @Prop({ default: false })
  pushSent: boolean;

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);