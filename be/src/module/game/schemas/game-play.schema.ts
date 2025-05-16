// modules/game/schemas/game-play.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type GamePlayDocument = GamePlay & Document;

export enum GameResult {
  WIN = 'win',
  LOSE = 'lose',
}

@Schema({ timestamps: true })
export class GamePlay {
  @ApiProperty({ description: 'Người chơi' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  player: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Game đã chơi' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Game', required: true })
  game: MongooseSchema.Types.ObjectId;

  @ApiProperty({ description: 'Số KC đặt cược' })
  @Prop({ required: true })
  betAmount: number;

  @ApiProperty({ enum: GameResult, description: 'Kết quả' })
  @Prop({ enum: GameResult, required: true })
  result: GameResult;

  @ApiProperty({ description: 'Số KC thắng/thua' })
  @Prop({ required: true })
  kcAmount: number;

  @ApiProperty({ description: 'Số dư trước khi chơi' })
  @Prop({ required: true })
  balanceBefore: number;

  @ApiProperty({ description: 'Số dư sau khi chơi' })
  @Prop({ required: true })
  balanceAfter: number;

  @ApiProperty({ description: 'Dữ liệu chi tiết' })
  @Prop({ type: Object, default: {} })
  gameData: Record<string, any>;

  @ApiProperty({ description: 'Thời gian tạo' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật' })
  @Prop()
  updatedAt: Date;
}

export const GamePlaySchema = SchemaFactory.createForClass(GamePlay);