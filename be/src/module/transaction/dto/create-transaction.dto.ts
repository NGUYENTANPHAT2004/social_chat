// modules/transaction/dto/create-transaction.dto.ts
import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, Min, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionType, CurrencyType } from '../schemas/transaction.schema';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType, description: 'Loại giao dịch' })
  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ description: 'ID người nhận (nếu là chuyển tiền)' })
  @IsOptional()
  @IsString()
  recipientId?: string;

  @ApiProperty({ description: 'Số tiền' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: CurrencyType, description: 'Loại tiền tệ', default: CurrencyType.KC })
  @IsOptional()
  @IsEnum(CurrencyType)
  currency?: CurrencyType;

  @ApiProperty({ description: 'Mô tả giao dịch' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID nội dung liên quan' })
  @IsOptional()
  @IsString()
  relatedItemId?: string;

  @ApiProperty({ description: 'Loại nội dung liên quan' })
  @IsOptional()
  @IsString()
  relatedItemType?: string;

  @ApiProperty({ description: 'Metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}