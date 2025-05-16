// modules/moderation/dto/moderate-content.dto.ts
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUrl, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from '../schemas/moderation.schema';

export class ModerateContentDto {
  @ApiProperty({ enum: ContentType, description: 'Loại nội dung' })
  @IsNotEmpty()
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({ description: 'ID nội dung' })
  @IsNotEmpty()
  @IsString()
  contentId: string;

  @ApiProperty({ description: 'URL nội dung (cho hình ảnh/video)' })
  @IsOptional()
  @IsUrl()
  contentUrl?: string;

  @ApiProperty({ description: 'Nội dung văn bản (cho text)' })
  @IsOptional()
  @IsString()
  textContent?: string;

  @ApiProperty({ description: 'Metadata bổ sung' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}