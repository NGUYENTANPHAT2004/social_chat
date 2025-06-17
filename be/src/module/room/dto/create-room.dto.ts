// modules/room/dto/create-room.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from '../schemas/room.schema';

class RoomSettingsDto {
  @ApiProperty({ description: 'Cho phép chat', default: true })
  @IsOptional()
  @IsBoolean()
  allowChat?: boolean;

  @ApiProperty({ description: 'Cho phép tặng quà', default: true })
  @IsOptional()
  @IsBoolean()
  allowGifts?: boolean;

  @ApiProperty({ description: 'Số KC tối thiểu để tham gia', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minKCToJoin?: number;

  @ApiProperty({ description: 'Bật chế độ chậm', default: false })
  @IsOptional()
  @IsBoolean()
  slowMode?: boolean;

  @ApiProperty({ description: 'Thời gian chờ giữa các tin nhắn (giây)', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  slowModeInterval?: number;

  @ApiProperty({ description: 'Chỉ người theo dõi mới có thể chat', default: false })
  @IsOptional()
  @IsBoolean()
  followersOnly?: boolean;

  @ApiProperty({ description: 'Độ tuổi tối thiểu', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minAgeRequired?: number;
}

export class CreateRoomDto {
  @ApiProperty({ description: 'Tên phòng', example: 'Phòng gaming cùng Linh' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Mô tả phòng', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: RoomType, description: 'Loại phòng', default: RoomType.PUBLIC })
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

  @ApiProperty({ description: 'Mật khẩu phòng (cho phòng riêng tư)', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: 'Tags của phòng', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Ảnh bìa phòng', required: false })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({ description: 'Ảnh nền phòng', required: false })
  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @ApiProperty({ description: 'Cài đặt phòng', required: false, type: RoomSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RoomSettingsDto)
  settings?: RoomSettingsDto;
}