// modules/notification/dto/notification-settings.dto.ts
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationSettingsDto {
  @ApiProperty({ description: 'Thông báo tin nhắn', default: true })
  @IsOptional()
  @IsBoolean()
  messages?: boolean;

  @ApiProperty({ description: 'Thông báo người theo dõi mới', default: true })
  @IsOptional()
  @IsBoolean()
  followers?: boolean;

  @ApiProperty({ description: 'Thông báo nhận quà', default: true })
  @IsOptional()
  @IsBoolean()
  gifts?: boolean;

  @ApiProperty({ description: 'Thông báo bình luận', default: true })
  @IsOptional()
  @IsBoolean()
  comments?: boolean;

  @ApiProperty({ description: 'Thông báo nhắc đến', default: true })
  @IsOptional()
  @IsBoolean()
  mentions?: boolean;

  @ApiProperty({ description: 'Thông báo sự kiện trong phòng', default: true })
  @IsOptional()
  @IsBoolean()
  roomEvents?: boolean;

  @ApiProperty({ description: 'Thông báo từ quản trị viên', default: true })
  @IsOptional()
  @IsBoolean()
  adminMessages?: boolean;

  @ApiProperty({ description: 'Gửi thông báo qua email', default: true })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({ description: 'Gửi thông báo qua push notification', default: true })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;
}