// modules/game/dto/play-game.dto.ts
import { IsNotEmpty, IsMongoId, IsNumber, IsObject, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlayGameDto {
  @ApiProperty({ description: 'ID game' })
  @IsNotEmpty()
  @IsMongoId()
  gameId: string;

  @ApiProperty({ description: 'Số KC đặt cược' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  betAmount: number;

  @ApiProperty({ description: 'Dữ liệu lựa chọn (tùy thuộc vào game)', required: false })
  @IsOptional()
  @IsObject()
  choices?: Record<string, any>;
}