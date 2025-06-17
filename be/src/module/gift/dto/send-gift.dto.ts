// modules/gift/dto/send-gift.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsMongoId, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendGiftDto {
  @ApiProperty({ description: 'ID quà tặng' })
  @IsNotEmpty()
  @IsMongoId()
  giftId: string;

  @ApiProperty({ description: 'ID người nhận quà' })
  @IsNotEmpty()
  @IsMongoId()
  recipientId: string;

  @ApiProperty({ description: 'Số lượng quà tặng', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiProperty({ description: 'Lời nhắn kèm theo', required: false })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({ description: 'ID phòng gửi quà', required: false })
  @IsOptional()
  @IsMongoId()
  roomId?: string;
}