// modules/gift/controllers/gift.controller.ts
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { RolesGuard } from '../../auth/guards/roles.guard';
  import { Roles } from '../../auth/decorators/roles.decorator';
  import { UserRole } from '../../user/schemas/user.schema';
  import { GiftService } from '../services/gift.service';
  import { CreateGiftDto } from '../dto/create-gift.dto';
  import { SendGiftDto } from '../dto/send-gift.dto';
  import { GiftStatus, GiftType } from '../schemas/gift.schema';
  
  @ApiTags('gifts')
  @Controller('gifts')
  export class GiftController {
    constructor(private readonly giftService: GiftService) {}
  
    @Get()
    @ApiOperation({ summary: 'Lấy danh sách quà tặng' })
    @ApiResponse({ status: 200, description: 'Danh sách quà tặng' })
    async getGifts(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('status') status?: GiftStatus,
      @Query('type') type?: GiftType,
      @Query('category') category?: string,
    ) {
      const filter: any = {};
      
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (category) filter.category = category;
      
      return this.giftService.getGifts(filter, { page, limit });
    }
  
    @Get('categories')
    @ApiOperation({ summary: 'Lấy danh sách danh mục quà tặng' })
    @ApiResponse({ status: 200, description: 'Danh sách danh mục' })
    async getGiftCategories() {
      return this.giftService.getGiftCategories();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Lấy thông tin quà tặng theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin quà tặng' })
    async getGiftById(@Param('id') id: string) {
      return this.giftService.getGiftById(id);
    }
  
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo quà tặng mới (chỉ Admin)' })
    @ApiResponse({ status: 201, description: 'Quà tặng đã được tạo thành công' })
    async createGift(@Body() createGiftDto: CreateGiftDto) {
      return this.giftService.createGift(createGiftDto);
    }
  
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cập nhật quà tặng (chỉ Admin)' })
    @ApiResponse({ status: 200, description: 'Quà tặng đã được cập nhật' })
    async updateGift(
      @Param('id') id: string,
      @Body() updateGiftDto: CreateGiftDto,
    ) {
      return this.giftService.updateGift(id, updateGiftDto);
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Xóa quà tặng (chỉ Admin)' })
    @ApiResponse({ status: 200, description: 'Quà tặng đã được xóa' })
    async deleteGift(@Param('id') id: string) {
      return this.giftService.deleteGift(id);
    }
  
    @Post('send')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Gửi quà tặng' })
    @ApiResponse({ status: 201, description: 'Quà tặng đã được gửi thành công' })
    async sendGift(@Body() sendGiftDto: SendGiftDto, @Request() req) {
      return this.giftService.sendGift(sendGiftDto, req.user.id);
    }
  
    @Get('transactions/me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy lịch sử gửi/nhận quà của bản thân' })
    @ApiResponse({ status: 200, description: 'Lịch sử gửi/nhận quà' })
    async getMyGiftTransactions(
      @Request() req,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('type') type?: 'sent' | 'received',
    ) {
      if (type === 'sent') {
        return this.giftService.getUserSentGifts(req.user.id, { page, limit });
      } else if (type === 'received') {
        return this.giftService.getUserReceivedGifts(req.user.id, { page, limit });
      } else {
        return this.giftService.getUserGiftTransactions(req.user.id, { page, limit });
      }
    }
  
    @Get('transactions/room/:roomId')
    @ApiOperation({ summary: 'Lấy lịch sử quà tặng trong phòng' })
    @ApiResponse({ status: 200, description: 'Lịch sử quà tặng trong phòng' })
    async getRoomGiftTransactions(
      @Param('roomId') roomId: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
    ) {
      return this.giftService.getRoomGiftTransactions(roomId, { page, limit });
    }
  
    @Get('statistics/top-receivers')
    @ApiOperation({ summary: 'Lấy danh sách streamer nhận quà nhiều nhất' })
    @ApiResponse({ status: 200, description: 'Danh sách streamer top' })
    async getTopGiftReceivers(
      @Query('limit') limit: number = 10,
      @Query('period') period: 'day' | 'week' | 'month' | 'all' = 'all',
    ) {
      return this.giftService.getTopGiftReceivers(limit, period);
    }
  
    @Get('statistics/top-senders')
    @ApiOperation({ summary: 'Lấy danh sách người gửi quà nhiều nhất' })
    @ApiResponse({ status: 200, description: 'Danh sách người gửi quà top' })
    async getTopGiftSenders(
      @Query('limit') limit: number = 10,
      @Query('period') period: 'day' | 'week' | 'month' | 'all' = 'all',
    ) {
      return this.giftService.getTopGiftSenders(limit, period);
    }
  }