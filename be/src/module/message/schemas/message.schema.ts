// modules/message/schemas/message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type MessageDocument = Message & Document;

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  DELETED = 'deleted',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  GIFT = 'gift',
  SYSTEM = 'system',
}

@Schema({ timestamps: true })
export class Message {
  @ApiProperty({ description: 'Người gửi tin nhắn' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sender: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Người nhận tin nhắn' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  recipient: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Cuộc trò chuyện' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Conversation', required: true })
  conversation: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Nội dung tin nhắn' })
  @Prop({ required: true })
  content: string;

  @ApiProperty({ enum: MessageType, description: 'Loại tin nhắn' })
  @Prop({ enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @ApiProperty({ enum: MessageStatus, description: 'Trạng thái tin nhắn' })
  @Prop({ enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  @ApiProperty({ description: 'Hình ảnh đính kèm' })
  @Prop({ default: '' })
  image: string;

  @ApiProperty({ description: 'Metadata' })
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Thời gian đã đọc' })
  @Prop()
  readAt: Date;

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);