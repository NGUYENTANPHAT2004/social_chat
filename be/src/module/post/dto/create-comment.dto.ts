// modules/post/dto/create-comment.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Nội dung bình luận', example: 'Hay quá!' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: 'ID bình luận cha (nếu là phản hồi)', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ description: 'Hình ảnh đính kèm', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ description: 'ID người dùng được tag', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionIds?: string[];
}