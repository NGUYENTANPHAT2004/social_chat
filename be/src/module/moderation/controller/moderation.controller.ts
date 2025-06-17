// modules/moderation/controllers/moderation.controller.ts
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
  import { ModerateContentDto } from '../dto/moderate-content.dto';
  import { ModerationAction, ModerationStatus } from '../schemas/moderation.schema';
  
  @ApiTags('moderation')
  @Controller('moderation')
  export class ModerationController {
    constructor(private readonly moderationService: ModerationService) {}
  
    @Post()
    @ApiOperation({ summary: 'Kiểm duyệt nội dung' })
    @ApiResponse({ status: 201, description: 'Nội dung đã được kiểm duyệt' })
    async moderateContent(@Body() moderateContentDto: ModerateContentDto) {
      return this.moderationService.moderateContent(moderateContentDto);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách kiểm duyệt' })
    @ApiResponse({ status: 200, description: 'Danh sách kiểm duyệt' })
    async getModerationLogs(
      @Query('status') status?: ModerationStatus,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.moderationService.getModerationLogs({ status }, { page, limit });
    }
  
    @Get('pending')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách kiểm duyệt đang chờ' })
    @ApiResponse({ status: 200, description: 'Danh sách kiểm duyệt đang chờ' })
    async getPendingModerationLogs(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.moderationService.getModerationLogs(
        { status: ModerationStatus.PENDING },
        { page, limit },
      );
    }
  
    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thông tin kiểm duyệt theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin kiểm duyệt' })
    async getModerationLog(@Param('id') id: string) {
      return this.moderationService.getModerationLogById(id);
    }
  
    @Patch(':id/approve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Phê duyệt nội dung' })
    @ApiResponse({ status: 200, description: 'Nội dung đã được phê duyệt' })
    async approveContent(@Param('id') id: string, @Request() req) {
      return this.moderationService.updateModerationStatus(
        id,
        ModerationAction.APPROVED,
        req.user.id,
      );
    }
  
    @Patch(':id/reject')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Từ chối nội dung' })
    @ApiResponse({ status: 200, description: 'Nội dung đã bị từ chối' })
    async rejectContent(
      @Param('id') id: string,
      @Body('reason') reason: string,
      @Request() req,
    ) {
      return this.moderationService.updateModerationStatus(
        id,
        ModerationAction.REJECTED,
        req.user.id,
        reason,
      );
    }
  
    @Get('stats/overview')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thống kê tổng quan kiểm duyệt' })
    @ApiResponse({ status: 200, description: 'Thống kê kiểm duyệt' })
    async getModerationStats() {
      return this.moderationService.getModerationStats();
    }
  }