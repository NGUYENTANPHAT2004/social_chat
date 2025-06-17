// modules/transaction/schemas/transaction.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type TransactionDocument = Transaction & Document;

export enum TransactionType {
  DEPOSIT = 'deposit',       // Nạp tiền
  WITHDRAW = 'withdraw',     // Rút tiền
  TRANSFER = 'transfer',     // Chuyển tiền
  GIFT = 'gift',             // Tặng quà
  SUBSCRIPTION = 'subscription', // Đăng ký VIP
  SYSTEM = 'system',         // Hệ thống
  REWARD = 'reward',         // Phần thưởng
  PURCHASE = 'purchase',     // Mua dịch vụ/hàng hóa
  REFUND = 'refund',         // Hoàn tiền
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum CurrencyType {
  VND = 'vnd',
  KC = 'kc',      // Kim Cương
}

@Schema({ timestamps: true })
export class Transaction {
  @ApiProperty({ description: 'Mã giao dịch' })
  @Prop({ required: true, unique: true })
  transactionCode: string;

  @ApiProperty({ enum: TransactionType, description: 'Loại giao dịch' })
  @Prop({ enum: TransactionType, required: true })
  type: TransactionType;

  @ApiProperty({ description: 'Người gửi' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sender: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Người nhận' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  recipient: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Số tiền' })
  @Prop({ required: true })
  amount: number;

  @ApiProperty({ enum: CurrencyType, description: 'Loại tiền tệ' })
  @Prop({ enum: CurrencyType, default: CurrencyType.KC })
  currency: CurrencyType;

  @ApiProperty({ description: 'Tỷ giá (nếu có)' })
  @Prop({ default: 1 })
  exchangeRate: number;

  @ApiProperty({ enum: TransactionStatus, description: 'Trạng thái giao dịch' })
  @Prop({ enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @ApiProperty({ description: 'Mô tả giao dịch' })
  @Prop({ default: '' })
  description: string;

  @ApiProperty({ description: 'Phí giao dịch' })
  @Prop({ default: 0 })
  fee: number;

  @ApiProperty({ description: 'Số dư trước giao dịch của người gửi' })
  @Prop()
  senderBalanceBefore: number;

  @ApiProperty({ description: 'Số dư sau giao dịch của người gửi' })
  @Prop()
  senderBalanceAfter: number;

  @ApiProperty({ description: 'Số dư trước giao dịch của người nhận' })
  @Prop()
  recipientBalanceBefore: number;

  @ApiProperty({ description: 'Số dư sau giao dịch của người nhận' })
  @Prop()
  recipientBalanceAfter: number;

  @ApiProperty({ description: 'Giao dịch nạp tiền liên quan (nếu có)' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Payment' })
  payment: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'ID nội dung liên quan (gift, subscription...)' })
  @Prop()
  relatedItemId: string;

  @ApiProperty({ description: 'Loại nội dung liên quan' })
  @Prop()
  relatedItemType: string;

  @ApiProperty({ description: 'Metadata' })
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Thời gian hoàn thành' })
  @Prop()
  completedAt: Date;

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);