 // modules/message/dto/send-message.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsMongoId, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../schemas/message.schema';

export class SendMessageDto {
  @ApiProperty({ description: 'ID người nhận tin nhắn' })
  @IsNotEmpty()
  @IsMongoId()
  recipientId: string;

  @ApiProperty({ description: 'Nội dung tin nhắn' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ enum: MessageType, description: 'Loại tin nhắn', default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiProperty({ description: 'Hình ảnh đính kèm', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ description: 'Metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}