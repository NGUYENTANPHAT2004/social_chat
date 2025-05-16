// modules/post/schemas/post.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type PostDocument = Post & Document;

export enum PostStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  HIDDEN = 'hidden',
  PENDING_REVIEW = 'pending_review',
}

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  POLL = 'poll',
  SHARED = 'shared',
}

@Schema({ timestamps: true })
export class Post {
  @ApiProperty({ description: 'Người đăng bài' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  author: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Nội dung bài viết' })
  @Prop({ required: true })
  content: string;

  @ApiProperty({ enum: PostType, description: 'Loại bài viết' })
  @Prop({ enum: PostType, default: PostType.TEXT })
  type: PostType;

  @ApiProperty({ enum: PostStatus, description: 'Trạng thái bài viết' })
  @Prop({ enum: PostStatus, default: PostStatus.ACTIVE })
  status: PostStatus;

  @ApiProperty({ description: 'Hình ảnh đính kèm' })
  @Prop([String])
  images: string[];

  @ApiProperty({ description: 'Video đính kèm' })
  @Prop({ default: '' })
  video: string;

  @ApiProperty({ description: 'Bài viết gốc (nếu là bài chia sẻ)' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Post' })
  originalPost: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Số lượt thích' })
  @Prop({ default: 0 })
  likes: number;

  @ApiProperty({ description: 'Số lượt bình luận' })
  @Prop({ default: 0 })
  comments: number;

  @ApiProperty({ description: 'Số lượt chia sẻ' })
  @Prop({ default: 0 })
  shares: number;

  @ApiProperty({ description: 'Số lượt xem' })
  @Prop({ default: 0 })
  views: number;

  @ApiProperty({ description: 'Bình chọn (nếu là poll)' })
  @Prop({
    type: [{
      option: { type: String },
      votes: { type: Number, default: 0 },
    }],
  })
  polls: Array<{ option: string; votes: number }>;

  @ApiProperty({ description: 'Hashtags' })
  @Prop([String])
  hashtags: string[];

  @ApiProperty({ description: 'Người dùng được tag' })
  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'User' }])
  mentions: MongooseSchema.Types.ObjectId[];

  @ApiProperty({ description: 'Phòng liên quan (nếu đăng trong phòng)' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Room' })
  room: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Vị trí đăng bài' })
  @Prop({
    type: {
      name: { type: String, default: '' },
      lat: { type: Number },
      lng: { type: Number },
    },
  })
  location: {
    name: string;
    lat: number;
    lng: number;
  };

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);