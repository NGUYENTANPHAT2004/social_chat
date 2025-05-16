// modules/report/controllers/report.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ForbiddenException,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../../auth/guards/roles.guard';
  import { Roles } from '../../auth/decorators/roles.decorator';
  import { UserRole } from '../../user/schemas/user.schema';
  import { ReportService } from '../services/report.service';
  import { CreateReportDto } from '../dto/create-report.dto';
  import { ReportStatus } from '../schemas/report.schema';
  
  @ApiTags('reports')
  @Controller('reports')
  export class ReportController {
    constructor(private readonly reportService: ReportService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo báo cáo mới' })
    @ApiResponse({ status: 201, description: 'Báo cáo đã được tạo thành công' })
    async createReport(@Body() createReportDto: CreateReportDto, @Request() req) {
      return this.reportService.createReport(createReportDto, req.user.id);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách báo cáo (chỉ Admin/Mod)' })
    @ApiResponse({ status: 200, description: 'Danh sách báo cáo' })
    async getReports(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('status') status?: ReportStatus,
    ) {
      const filter: any = {};
      
      if (status) {
        filter.status = status;
      }
      
      return this.reportService.getReports(filter, { page, limit });
    }
  
    @Get('my')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách báo cáo của bản thân' })
    @ApiResponse({ status: 200, description: 'Danh sách báo cáo của bản thân' })
    async getMyReports(
      @Request() req,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.reportService.getUserReports(req.user.id, { page, limit });
    }
  
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thông tin báo cáo theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin báo cáo' })
    async getReportById(@Param('id') id: string, @Request() req) {
      const report = await this.reportService.getReportById(id);
      
      // Kiểm tra quyền truy cập
      const isAdmin = req.user.role === UserRole.ADMIN;
      const isModerator = req.user.role === UserRole.MODERATOR;
      const isReporter = report.reporter.toString() === req.user.id;
      
      if (!isAdmin && !isModerator && !isReporter) {
        throw new ForbiddenException('Bạn không có quyền xem báo cáo này');
      }
      
      return report;
    }
  
    @Patch(':id/assign')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Gán người xử lý báo cáo (chỉ Admin/Mod)' })
    @ApiResponse({ status: 200, description: 'Báo cáo đã được gán' })
    async assignReport(@Param('id') id: string, @Request() req) {
      return this.reportService.assignReport(id, req.user.id);
    }
  
    @Patch(':id/investigate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Đánh dấu báo cáo đang điều tra (chỉ Admin/Mod)' })
    @ApiResponse({ status: 200, description: 'Báo cáo đã được đánh dấu đang điều tra' })
    async investigateReport(@Param('id') id: string, @Request() req) {
      return this.reportService.updateReportStatus(
        id,
        ReportStatus.INVESTIGATING,
        req.user.id,
      );
    }
  
    @Patch(':id/resolve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Giải quyết báo cáo (chỉ Admin/Mod)' })
    @ApiResponse({ status: 200, description: 'Báo cáo đã được giải quyết' })
    async resolveReport(
      @Param('id') id: string,
      @Body('notes') notes: string,
      @Request() req,
    ) {
      return this.reportService.resolveReport(id, notes, req.user.id);
    }
  
    @Patch(':id/reject')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Từ chối báo cáo (chỉ Admin/Mod)' })
    @ApiResponse({ status: 200, description: 'Báo cáo đã bị từ chối' })
    async rejectReport(
      @Param('id') id: string,
      @Body('notes') notes: string,
      @Request() req,
    ) {
      return this.reportService.updateReportStatus(
        id,
        ReportStatus.REJECTED,
        req.user.id,
        notes,
      );
    }
  
    @Get('statistics/overview')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thống kê báo cáo (chỉ Admin/Mod)' })
    @ApiResponse({ status: 200, description: 'Thống kê báo cáo' })
    async getReportStatistics() {
      return this.reportService.getReportStatistics();
    }
  }