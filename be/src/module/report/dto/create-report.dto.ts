// modules/report/dto/create-report.dto.ts
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReportType, ReportContentType } from '../schemas/report.schema';

export class CreateReportDto {
  @ApiProperty({ enum: ReportContentType, description: 'Loại nội dung bị báo cáo' })
  @IsNotEmpty()
  @IsEnum(ReportContentType)
  contentType: ReportContentType;

  @ApiProperty({ description: 'ID nội dung bị báo cáo' })
  @IsNotEmpty()
  @IsString()
  contentId: string;

  @ApiProperty({ enum: ReportType, description: 'Loại báo cáo' })
  @IsNotEmpty()
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ description: 'Mô tả chi tiết', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'URL bằng chứng', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidences?: string[];
}