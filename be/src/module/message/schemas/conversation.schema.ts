 // modules/message/schemas/conversation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ConversationDocument = Conversation & Document;

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
}

@Schema({ timestamps: true })
export class Conversation {
  @ApiProperty({ description: 'Người tham gia cuộc trò chuyện' })
  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User' }])
  participants: MongooseSchema.Types.ObjectId[];

  @ApiProperty({ description: 'Tin nhắn cuối cùng' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Message' })
  lastMessage: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Nội dung tin nhắn cuối cùng' })
  @Prop({ default: '' })
  lastMessageContent: string;

  @ApiProperty({ description: 'Người gửi tin nhắn cuối cùng' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  lastMessageSender: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Thời gian tin nhắn cuối cùng' })
  @Prop()
  lastMessageTime: Date;

  @ApiProperty({ enum: ConversationStatus, description: 'Trạng thái cuộc trò chuyện' })
  @Prop({ enum: ConversationStatus, default: ConversationStatus.ACTIVE })
  status: ConversationStatus;

  @ApiProperty({ description: 'Số tin nhắn chưa đọc của từng người dùng' })
  @Prop({
    type: Map,
    of: Number,
    default: {},
  })
  unreadCount: Map<string, number>;

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);