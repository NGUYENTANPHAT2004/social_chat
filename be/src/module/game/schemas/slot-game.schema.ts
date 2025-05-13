import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type SlotGameDocument = SlotGame & Document;

export interface SlotSymbol {
  id: string;
  value: number;
  probability: number;
}

export interface Payline {
  positions: number[];
  multiplier: number;
}

@Schema({ timestamps: true })
export class SlotGame {
  @ApiProperty({ description: 'Name of the slot game' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Description of the slot game' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'Number of reels in the slot game' })
  @Prop({ required: true, default: 5 })
  reels: number;

  @ApiProperty({ description: 'Number of rows in the slot game' })
  @Prop({ required: true, default: 3 })
  rows: number;

  @ApiProperty({ description: 'Minimum bet amount in KC' })
  @Prop({ required: true, default: 10 })
  minBet: number;

  @ApiProperty({ description: 'Maximum bet amount in KC' })
  @Prop({ required: true, default: 1000 })
  maxBet: number;

  @ApiProperty({ description: 'Return to Player percentage' })
  @Prop({ required: true, default: 0.96 })
  rtp: number;

  @ApiProperty({ description: 'Available symbols in the slot game' })
  @Prop({
    type: [{
      id: String,
      value: Number,
      probability: Number,
    }],
    required: true,
  })
  symbols: SlotSymbol[];

  @ApiProperty({ description: 'Winning paylines configuration' })
  @Prop({
    type: [{
      positions: [Number],
      multiplier: Number,
    }],
    required: true,
  })
  paylines: Payline[];

  @ApiProperty({ description: 'Additional features like wild symbols, free spins, etc.' })
  @Prop({
    type: {
      wilds: { type: Boolean, default: false },
      scatters: { type: Boolean, default: false },
      freeSpins: { type: Boolean, default: false },
      bonusGame: { type: Boolean, default: false },
    },
  })
  features: {
    wilds: boolean;
    scatters: boolean;
    freeSpins: boolean;
    bonusGame: boolean;
  };

  @ApiProperty({ description: 'Theme of the slot game' })
  @Prop({ required: true })
  theme: string;

  @ApiProperty({ description: 'Base URL for slot game assets' })
  @Prop({ required: true })
  assetsBaseUrl: string;

  @ApiProperty({ description: 'Status of the slot game' })
  @Prop({ required: true, enum: ['active', 'maintenance', 'disabled'], default: 'active' })
  status: string;

  @ApiProperty({ description: 'Creation date' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @Prop()
  updatedAt: Date;
}

export const SlotGameSchema = SchemaFactory.createForClass(SlotGame);