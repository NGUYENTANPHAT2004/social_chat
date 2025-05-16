// modules/gift/dto/create-gift.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GiftType, GiftStatus } from '../schemas/gift.schema';

export class CreateGiftDto {
  @ApiProperty({ description: 'Tên quà tặng', example: 'Hoa hồng' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Mô tả quà tặng', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Giá KC', example: 50 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({ description: 'Hình ảnh quà tặng' })
  @IsNotEmpty()
  @IsString()
  image: string;

  @ApiProperty({ description: 'Hình ảnh động của quà tặng', required: false })
  @IsOptional()
  @IsString()
  animation?: string;

  @ApiProperty({ enum: GiftType, description: 'Loại quà tặng', default: GiftType.STATIC })
  @IsOptional()
  @IsEnum(GiftType)
  type?: GiftType;

  @ApiProperty({ enum: GiftStatus, description: 'Trạng thái quà tặng', default: GiftStatus.ACTIVE })
  @IsOptional()
  @IsEnum(GiftStatus)
  status?: GiftStatus;

  @ApiProperty({ description: 'Hiệu ứng đặc biệt', required: false })
  @IsOptional()
  @IsString()
  specialEffect?: string;

  @ApiProperty({ description: 'Thứ tự hiển thị', default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiProperty({ description: 'Danh mục quà tặng', default: 'general' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Phần thưởng cho streamer', default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  streamerReward?: number;

  @ApiProperty({ description: 'Thời gian bắt đầu mùa', required: false })
  @IsOptional()
  @IsDateString()
  seasonStart?: string;

  @ApiProperty({ description: 'Thời gian kết thúc mùa', required: false })
  @IsOptional()
  @IsDateString()
  seasonEnd?: string;
}