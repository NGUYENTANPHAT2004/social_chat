// modules/streaming/controllers/streaming.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpStatus,
    HttpCode,
    Query,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { StreamingService } from '../services/streaming.service';
  import { CreateStreamDto } from '../dto/create-stream.dto';
  import { StreamStatus } from '../schemas/stream.schema';
  
  @ApiTags('streaming')
  @Controller('streaming')
  export class StreamingController {
    constructor(private readonly streamingService: StreamingService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo stream mới' })
    @ApiResponse({ status: 201, description: 'Stream đã được tạo thành công' })
    async createStream(@Body() createStreamDto: CreateStreamDto, @Request() req) {
      return this.streamingService.createStream(req.user.id, createStreamDto);
    }
  
    @Get('key')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy khóa stream của người dùng' })
    @ApiResponse({ status: 200, description: 'Stream key được trả về' })
    async getStreamKey(@Request() req) {
      return this.streamingService.getStreamKey(req.user.id);
    }
  
    @Post('key/regenerate')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo lại khóa stream' })
    @ApiResponse({ status: 200, description: 'Stream key mới đã được tạo' })
    async regenerateStreamKey(@Request() req) {
      return this.streamingService.regenerateStreamKey(req.user.id);
    }
  
    @Get('active')
    @ApiOperation({ summary: 'Lấy danh sách stream đang phát trực tiếp' })
    @ApiResponse({ status: 200, description: 'Danh sách stream đang phát trực tiếp' })
    async getActiveStreams(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('tag') tag?: string,
    ) {
      return this.streamingService.getStreamsByStatus(
        StreamStatus.LIVE,
        { page, limit },
        tag,
      );
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin stream theo ID' })
    @ApiResponse({ status: 200, description: 'Stream được tìm thấy' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy stream' })
    async getStreamById(@Param('id') id: string) {
      return this.streamingService.getStreamById(id);
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật thông tin stream' })
    @ApiResponse({ status: 200, description: 'Stream đã được cập nhật' })
    async updateStream(
      @Param('id') id: string,
      @Body() updateStreamDto: CreateStreamDto,
      @Request() req,
    ) {
      return this.streamingService.updateStream(id, req.user.id, updateStreamDto);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Xóa stream' })
    @ApiResponse({ status: 204, description: 'Stream đã được xóa' })
    async deleteStream(@Param('id') id: string, @Request() req) {
      await this.streamingService.deleteStream(id, req.user.id);
    }
  
    @Get('user/:userId')
    @ApiOperation({ summary: 'Lấy danh sách stream của người dùng' })
    @ApiResponse({ status: 200, description: 'Danh sách stream' })
    async getUserStreams(
      @Param('userId') userId: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.streamingService.getUserStreams(userId, { page, limit });
    }
  
    @Post(':id/watch')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Đánh dấu người dùng đang xem stream' })
    @ApiResponse({ status: 200, description: 'Đã cập nhật số người xem' })
    async watchStream(@Param('id') id: string, @Request() req) {
      return this.streamingService.watchStream(id, req.user.id);
    }
  
    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thích stream' })
    @ApiResponse({ status: 200, description: 'Đã cập nhật số lượt thích' })
    async likeStream(@Param('id') id: string, @Request() req) {
      return this.streamingService.likeStream(id, req.user.id);
    }
  }