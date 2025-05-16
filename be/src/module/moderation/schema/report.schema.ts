// modules/moderation/schemas/report.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ReportDocument = Report & Document;

export enum ReportType {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  IMPERSONATION = 'impersonation',
  COPYRIGHT = 'copyright',
  ILLEGAL_CONTENT = 'illegal_content',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  REJECTED = 'rejected',
  RESOLVED = 'resolved',
}

export enum ReportContentType {
  POST = 'post',
  COMMENT = 'comment',
  USER = 'user',
  STREAM = 'stream',
  MESSAGE = 'message',
}

@Schema({ timestamps: true })
export class Report {
  @ApiProperty({ description: 'Người báo cáo' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  reporter: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Loại nội dung bị báo cáo' })
  @Prop({ required: true, enum: ReportContentType })
  contentType: ReportContentType;

  @ApiProperty({ description: 'ID nội dung bị báo cáo' })
  @Prop({ required: true })
  contentId: string;

  @ApiProperty({ description: 'Chủ sở hữu nội dung bị báo cáo' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  contentOwner: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Loại báo cáo' })
  @Prop({ enum: ReportType, required: true })
  reportType: ReportType;

  @ApiProperty({ description: 'Mô tả chi tiết' })
  @Prop({ default: '' })
  description: string;

  @ApiProperty({ description: 'Trạng thái báo cáo' })
  @Prop({ enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @ApiProperty({ description: 'Người xử lý báo cáo' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  moderator: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Ghi chú xử lý' })
  @Prop({ default: '' })
  moderationNotes: string;

  @ApiProperty({ description: 'Hành động được thực hiện' })
  @Prop({ default: '' })
  actionTaken: string;

  @ApiProperty({ description: 'Minh chứng' })
  @Prop({ type: [String], default: [] })
  evidences: string[];

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);