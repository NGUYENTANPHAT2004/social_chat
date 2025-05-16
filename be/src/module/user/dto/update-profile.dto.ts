// modules/user/dto/update-profile.dto.ts
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ description: 'Tên hiển thị', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ description: 'Tiểu sử', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'Địa điểm', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Ngày sinh', required: false })
  @IsOptional()
  @IsDateString()
  birthdate?: string;
}