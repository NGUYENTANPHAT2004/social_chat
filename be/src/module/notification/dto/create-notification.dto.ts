// modules/notification/dto/create-notification.dto.ts
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsUrl, IsObject, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @ApiProperty({ description: 'ID người nhận thông báo' })
  @IsNotEmpty()
  @IsMongoId()
  recipientId: string;

  @ApiProperty({ description: 'ID người gửi thông báo (nếu có)', required: false })
  @IsOptional()
  @IsMongoId()
  senderId?: string;

  @ApiProperty({ enum: NotificationType, description: 'Loại thông báo' })
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Tiêu đề thông báo' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Nội dung thông báo' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ description: 'Đường dẫn khi nhấp vào thông báo', required: false })
  @IsOptional()
  @IsUrl()
  link?: string;

  @ApiProperty({ description: 'Hình ảnh thông báo', required: false })
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiProperty({ description: 'Dữ liệu bổ sung', required: false })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiProperty({ description: 'Gửi qua email', required: false })
  @IsOptional()
  sendEmail?: boolean;

  @ApiProperty({ description: 'Gửi qua push notification', required: false })
  @IsOptional()
  sendPush?: boolean;
}