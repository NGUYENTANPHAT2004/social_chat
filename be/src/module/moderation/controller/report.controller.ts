// modules/moderation/controllers/report.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    UseGuards,
    Request,
    Query,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../../auth/guards/roles.guard';
  import { Roles } from '../../auth/decorators/roles.decorator';
  import { UserRole } from '../../user/schemas/user.schema';
  import { ModerationService } from '../services/moderation.service';
  import { CreateReportDto } from '../dto/create-report.dto';
  import { ReportStatus } from '../schemas/report.schema';
  
  @ApiTags('reports')
  @Controller('reports')
  export class ReportController {
    constructor(private readonly moderationService: ModerationService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo báo cáo mới' })
    @ApiResponse({ status: 201, description: 'Báo cáo đã được tạo' })
    async createReport(@Body() createReportDto: CreateReportDto, @Request() req) {
      return this.moderationService.createReport(createReportDto, req.user.id);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách báo cáo' })
    @ApiResponse({ status: 200, description: 'Danh sách báo cáo' })
    async getReports(
      @Query('status') status?: ReportStatus,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.moderationService.getReports({ status }, { page, limit });
    }
  
    @Get('pending')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách báo cáo đang chờ' })
    @ApiResponse({ status: 200, description: 'Danh sách báo cáo đang chờ' })
    async getPendingReports(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.moderationService.getReports(
        { status: ReportStatus.PENDING },
        { page, limit },
      );
    }
  
    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thông tin báo cáo theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin báo cáo' })
    async getReport(@Param('id') id: string) {
      return this.moderationService.getReportById(id);
    }
  
    @Patch(':id/resolve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Giải quyết báo cáo' })
    @ApiResponse({ status: 200, description: 'Báo cáo đã được giải quyết' })
    async resolveReport(
      @Param('id') id: string,
      @Body('actionTaken') actionTaken: string,
      @Body('moderationNotes') moderationNotes: string,
      @Request() req,
    ) {
      return this.moderationService.updateReportStatus(
        id,
        ReportStatus.RESOLVED,
        req.user.id,
        actionTaken,
        moderationNotes,
      );
    }
  
    @Patch(':id/reject')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Từ chối báo cáo' })
    @ApiResponse({ status: 200, description: 'Báo cáo đã bị từ chối' })
    async rejectReport(
      @Param('id') id: string,
      @Body('moderationNotes') moderationNotes: string,
      @Request() req,
    ) {
      return this.moderationService.updateReportStatus(
        id,
        ReportStatus.REJECTED,
        req.user.id,
        'No action needed',
        moderationNotes,
      );
    }
  
    @Get('stats/overview')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thống kê tổng quan báo cáo' })
    @ApiResponse({ status: 200, description: 'Thống kê báo cáo' })
    async getReportStats() {
      return this.moderationService.getReportStats();
    }
  }