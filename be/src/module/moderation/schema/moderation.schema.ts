// modules/moderation/schemas/moderation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ModerationLogDocument = ModerationLog & Document;

export enum ModerationAction {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

export enum ModerationStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  AUTO_MODERATED = 'auto_moderated',
}

export enum ContentType {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text',
  STREAM = 'stream',
  USER = 'user',
}

@Schema({ timestamps: true })
export class ModerationLog {
  @ApiProperty({ description: 'Loại nội dung' })
  @Prop({ required: true, enum: ContentType })
  contentType: ContentType;

  @ApiProperty({ description: 'ID nội dung' })
  @Prop({ required: true })
  contentId: string;

  @ApiProperty({ description: 'Hành động kiểm duyệt' })
  @Prop({ enum: ModerationAction, default: ModerationAction.FLAGGED })
  action: ModerationAction;

  @ApiProperty({ description: 'Trạng thái kiểm duyệt' })
  @Prop({ enum: ModerationStatus, default: ModerationStatus.PENDING })
  status: ModerationStatus;

  @ApiProperty({ description: 'Người dùng sở hữu nội dung' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  contentOwner: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Người kiểm duyệt' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  moderator: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Lý do kiểm duyệt' })
  @Prop({ default: '' })
  reason: string;

  @ApiProperty({ description: 'Kết quả kiểm tra tự động' })
  @Prop({
    type: {
      adult: { type: Number, default: 0 },
      violence: { type: Number, default: 0 },
      hate: { type: Number, default: 0 },
      selfHarm: { type: Number, default: 0 },
      score: { type: Number, default: 0 },
    },
  })
  autoModerationResults: {
    adult: number;
    violence: number;
    hate: number;
    selfHarm: number;
    score: number;
  };

  @ApiProperty({ description: 'Metadata' })
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const ModerationLogSchema = SchemaFactory.createForClass(ModerationLog);