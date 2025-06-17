// modules/game/schemas/game.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type GameDocument = Game & Document;

export enum GameType {
  LUCKY = 'lucky',
  LUCKY7 = 'lucky7',
  COINFLIP = 'coinflip',
  DAILY_SPIN = 'daily_spin',
}

export enum GameStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Schema({ timestamps: true })
export class Game {
  @ApiProperty({ description: 'Tên game' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Mô tả game' })
  @Prop({ default: '' })
  description: string;

  @ApiProperty({ enum: GameType, description: 'Loại game' })
  @Prop({ enum: GameType, required: true })
  type: GameType;

  @ApiProperty({ enum: GameStatus, description: 'Trạng thái game' })
  @Prop({ enum: GameStatus, default: GameStatus.ACTIVE })
  status: GameStatus;

  @ApiProperty({ description: 'Hình ảnh game' })
  @Prop({ default: '' })
  image: string;

  @ApiProperty({ description: 'Mức KC đặt cược tối thiểu' })
  @Prop({ default: 10 })
  minBet: number;

  @ApiProperty({ description: 'Mức KC đặt cược tối đa' })
  @Prop({ default: 1000 })
  maxBet: number;

  @ApiProperty({ description: 'Tỷ lệ thắng (percentage)' })
  @Prop({ default: 50 })
  winRate: number;

  @ApiProperty({ description: 'Hệ số nhân thưởng' })
  @Prop({ default: 1.95 })
  multiplier: number;

  @ApiProperty({ description: 'Cấu hình chi tiết game' })
  @Prop({ type: Object, default: {} })
  config: Record<string, any>;

  @ApiProperty({ description: 'Số lượt chơi' })
  @Prop({ default: 0 })
  playCount: number;

  @ApiProperty({ description: 'Tổng KC nhận được' })
  @Prop({ default: 0 })
  totalKCWon: number;

  @ApiProperty({ description: 'Tổng KC đã đặt cược' })
  @Prop({ default: 0 })
  totalKCBet: number;

  @ApiProperty({ description: 'Số người thắng' })
  @Prop({ default: 0 })
  totalWinners: number;

  @ApiProperty({ description: 'Số người thua' })
  @Prop({ default: 0 })
  totalLosers: number;

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);