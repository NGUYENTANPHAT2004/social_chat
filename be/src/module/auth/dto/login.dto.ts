// be/src/module/auth/dto/login.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'johndoe@example.com', description: 'Email or username' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'Password123!', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}