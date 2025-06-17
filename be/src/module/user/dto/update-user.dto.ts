// modules/user/dto/update-user.dto.ts
import { IsOptional, IsString, IsEmail, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../schemas/user.schema';

export class UpdateUserDto {
  @ApiProperty({ description: 'Tên người dùng', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Avatar URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ enum: UserStatus, description: 'Trạng thái tài khoản', required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ description: 'Cài đặt người dùng', required: false })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}