// modules/post/schemas/comment.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CommentDocument = Comment & Document;

export enum CommentStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  HIDDEN = 'hidden',
}

@Schema({ timestamps: true })
export class Comment {
  @ApiProperty({ description: 'Bài viết được bình luận' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Post', required: true })
  post: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Người bình luận' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  author: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Nội dung bình luận' })
  @Prop({ required: true })
  content: string;

  @ApiProperty({ description: 'Bình luận cha (nếu là bình luận phản hồi)' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Comment' })
  parent: MongooseSchema.Types.ObjectId;

  @ApiProperty({ enum: CommentStatus, description: 'Trạng thái bình luận' })
  @Prop({ enum: CommentStatus, default: CommentStatus.ACTIVE })
  status: CommentStatus;

  @ApiProperty({ description: 'Số lượt thích' })
  @Prop({ default: 0 })
  likes: number;

  @ApiProperty({ description: 'Số lượt phản hồi' })
  @Prop({ default: 0 })
  replies: number;

  @ApiProperty({ description: 'Hình ảnh đính kèm' })
  @Prop({ default: '' })
  image: string;

  @ApiProperty({ description: 'Người dùng được tag' })
  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User' }])
  mentions: MongooseSchema.Types.ObjectId[];

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);