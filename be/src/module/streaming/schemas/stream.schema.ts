// modules/streaming/schemas/stream.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type StreamDocument = Stream & Document;

export enum StreamStatus {
  OFFLINE = 'offline',
  LIVE = 'live',
  COMPLETED = 'completed',
  BANNED = 'banned',
}

@Schema({ timestamps: true })
export class Stream {
  @ApiProperty({ description: 'Người dùng sở hữu stream' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Tiêu đề stream' })
  @Prop({ required: true, default: 'Live Stream' })
  title: string;

  @ApiProperty({ description: 'Mô tả stream' })
  @Prop({ default: '' })
  description: string;

  @ApiProperty({ description: 'Khóa stream riêng tư' })
  @Prop({ required: true, unique: true })
  streamKey: string;

  @ApiProperty({ enum: StreamStatus, description: 'Trạng thái stream' })
  @Prop({ enum: StreamStatus, default: StreamStatus.OFFLINE })
  status: StreamStatus;

  @ApiProperty({ description: 'Ảnh thumbnail của stream' })
  @Prop({ default: '' })
  thumbnail: string;

  @ApiProperty({ description: 'Đường dẫn HLS stream' })
  @Prop({ default: '' })
  hlsUrl: string;

  @ApiProperty({ description: 'Các tag của stream' })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({ description: 'Số người xem hiện tại' })
  @Prop({ default: 0 })
  currentViewers: number;

  @ApiProperty({ description: 'Tổng số người xem' })
  @Prop({ default: 0 })
  totalViewers: number;

  @ApiProperty({ description: 'Số lượng like' })
  @Prop({ default: 0 })
  likes: number;

  @ApiProperty({ description: 'Thời gian bắt đầu stream' })
  @Prop()
  startedAt: Date;

  @ApiProperty({ description: 'Thời gian kết thúc stream' })
  @Prop()
  endedAt: Date;

  @ApiProperty({ description: 'Cài đặt stream' })
  @Prop({
    type: {
      isPrivate: { type: Boolean, default: false },
      allowComments: { type: Boolean, default: true },
      autoRecord: { type: Boolean, default: false },
      lowLatencyMode: { type: Boolean, default: false },
      maxQuality: { type: String, enum: ['360p', '480p', '720p', '1080p'], default: '720p' },
    },
  })
  settings: {
    isPrivate: boolean;
    allowComments: boolean;
    autoRecord: boolean;
    lowLatencyMode: boolean;
    maxQuality: string;
  };

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const StreamSchema = SchemaFactory.createForClass(Stream);