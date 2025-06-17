// modules/post/dto/create-post.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, IsNumber, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PostType } from '../schemas/post.schema';

class PollOptionDto {
  @ApiProperty({ description: 'Tùy chọn bình chọn' })
  @IsNotEmpty()
  @IsString()
  option: string;
}

class LocationDto {
  @ApiProperty({ description: 'Tên địa điểm' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Vĩ độ' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiProperty({ description: 'Kinh độ' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;
}

export class CreatePostDto {
  @ApiProperty({ description: 'Nội dung bài viết', example: 'Hôm nay tôi rất vui!' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ enum: PostType, description: 'Loại bài viết', default: PostType.TEXT })
  @IsOptional()
  @IsEnum(PostType)
  type?: PostType;

  @ApiProperty({ description: 'Hình ảnh đính kèm', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Video đính kèm', required: false })
  @IsOptional()
  @IsString()
  video?: string;

  @ApiProperty({ description: 'ID bài viết gốc (nếu là bài chia sẻ)', required: false })
  @IsOptional()
  @IsString()
  originalPostId?: string;

  @ApiProperty({ description: 'Các tùy chọn bình chọn (nếu là poll)', required: false, type: [PollOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PollOptionDto)
  pollOptions?: PollOptionDto[];

  @ApiProperty({ description: 'Hashtags', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiProperty({ description: 'ID người dùng được tag', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionIds?: string[];

  @ApiProperty({ description: 'ID phòng (nếu đăng trong phòng)', required: false })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiProperty({ description: 'Vị trí đăng bài', required: false, type: LocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}