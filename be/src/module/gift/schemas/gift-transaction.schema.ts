// modules/gift/schemas/gift-transaction.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type GiftTransactionDocument = GiftTransaction & Document;

@Schema({ timestamps: true })
export class GiftTransaction {
  @ApiProperty({ description: 'Quà tặng' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Gift', required: true })
  gift: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Người gửi quà' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sender: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Người nhận quà' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  recipient: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Số lượng quà tặng' })
  @Prop({ default: 1 })
  quantity: number;

  @ApiProperty({ description: 'Tổng giá trị KC' })
  @Prop({ required: true })
  totalPrice: number;

  @ApiProperty({ description: 'Lời nhắn kèm theo' })
  @Prop({ default: '' })
  message: string;

  @ApiProperty({ description: 'Phòng gửi quà' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Room' })
  room: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Giao dịch liên quan' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Transaction' })
  transaction: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const GiftTransactionSchema = SchemaFactory.createForClass(GiftTransaction);