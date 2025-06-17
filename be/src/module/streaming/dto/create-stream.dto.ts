// modules/streaming/dto/create-stream.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStreamDto {
  @ApiProperty({ description: 'Tiêu đề stream', example: 'Stream game PUBG' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Mô tả stream', example: 'Stream game cùng anh em' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Các tag của stream', example: ['game', 'pubg'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ description: 'Stream riêng tư', example: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiProperty({ 
    description: 'Chất lượng stream tối đa', 
    example: '720p',
    enum: ['360p', '480p', '720p', '1080p'] 
  })
  @IsOptional()
  @IsEnum(['360p', '480p', '720p', '1080p'])
  maxQuality?: string;
}