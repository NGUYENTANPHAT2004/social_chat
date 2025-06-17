// modules/transaction/controllers/transaction.controller.ts
import {
    Controller,
    Get,
    Post,
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
  import { TransactionService } from '../services/transaction.service';
  import { CreateTransactionDto } from '../dto/create-transaction.dto';
  import { TransactionStatus, TransactionType } from '../schemas/transaction.schema';
  
  @ApiTags('transactions')
  @Controller('transactions')
  export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Tạo giao dịch mới' })
    @ApiResponse({ status: 201, description: 'Giao dịch đã được tạo thành công' })
    async createTransaction(@Body() createTransactionDto: CreateTransactionDto, @Request() req) {
      return this.transactionService.createTransaction(createTransactionDto, req.user.id);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách giao dịch của người dùng hiện tại' })
    @ApiResponse({ status: 200, description: 'Danh sách giao dịch' })
    async getUserTransactions(
      @Request() req,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('type') type?: TransactionType,
      @Query('status') status?: TransactionStatus,
      @Query('startDate') startDate?: Date,
      @Query('endDate') endDate?: Date,
    ) {
      const filter: any = {
        $or: [
          { sender: req.user.id },
          { recipient: req.user.id },
        ],
      };
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      
      return this.transactionService.getTransactions(filter, { page, limit });
    }
  
    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy danh sách tất cả giao dịch (chỉ dành cho admin)' })
    @ApiResponse({ status: 200, description: 'Danh sách giao dịch' })
    async getAllTransactions(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('type') type?: TransactionType,
      @Query('status') status?: TransactionStatus,
      @Query('userId') userId?: string,
      @Query('startDate') startDate?: Date,
      @Query('endDate') endDate?: Date,
    ) {
      const filter: any = {};
      
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (userId) {
        filter.$or = [
          { sender: userId },
          { recipient: userId },
        ];
      }
      
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }
      
      return this.transactionService.getTransactions(filter, { page, limit });
    }
  
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thông tin giao dịch theo ID' })
    @ApiResponse({ status: 200, description: 'Thông tin giao dịch' })
    async getTransactionById(@Param('id') id: string, @Request() req) {
      const transaction = await this.transactionService.getTransactionById(id);
      
      // Kiểm tra quyền truy cập
      const userId = req.user.id;
      const isAdmin = req.user.role === UserRole.ADMIN;
      
      if (!isAdmin && 
          transaction.sender.toString() !== userId && 
          transaction.recipient?.toString() !== userId) {
        return {
          message: 'Bạn không có quyền xem giao dịch này',
          status: 403,
        };
      }
      
      return transaction;
    }
  
    @Post('gift')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Gửi KC như quà tặng' })
    @ApiResponse({ status: 201, description: 'Quà tặng đã được gửi thành công' })
    async sendGift(
      @Body() giftData: {
        recipientId: string;
        amount: number;
        relatedItemId?: string;
        relatedItemType?: string;
        message?: string;
      },
      @Request() req,
    ) {
      return this.transactionService.sendGift(
        giftData.recipientId,
        giftData.amount,
        req.user.id,
        giftData.relatedItemId,
        giftData.relatedItemType,
        giftData.message,
      );
    }
  
    @Get('balance')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy số dư KC hiện tại' })
    @ApiResponse({ status: 200, description: 'Số dư KC' })
    async getKCBalance(@Request() req) {
      return this.transactionService.getKCBalance(req.user.id);
    }
  
    @Get('statistics')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Thống kê giao dịch (chỉ dành cho admin)' })
    @ApiResponse({ status: 200, description: 'Thống kê giao dịch' })
    async getTransactionStatistics(
      @Query('startDate') startDate?: Date,
      @Query('endDate') endDate?: Date,
    ) {
      return this.transactionService.getTransactionStatistics(startDate, endDate);
    }
  }